-- Enable PostGIS extension for location tracking
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE agency_type AS ENUM ('ITI', 'Training', 'Service', 'Vendor');
CREATE TYPE agency_status AS ENUM ('pending_approval', 'active', 'suspended', 'inactive');
CREATE TYPE partnership_tier AS ENUM ('standard', 'premium', 'enterprise');
CREATE TYPE partnership_model AS ENUM ('job_placement', 'dedicated_resource', 'training_placement');
CREATE TYPE certification_type AS ENUM ('PMKVY', 'ITI', 'NSDC', 'Other');
CREATE TYPE availability_status AS ENUM ('available', 'on_job', 'offline', 'on_leave');
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'gig', 'apprentice');
CREATE TYPE job_type AS ENUM ('AMC', 'Repair', 'Installation', 'Emergency');
CREATE TYPE job_status AS ENUM ('pending', 'assigned', 'accepted', 'travelling', 'onsite', 'completed', 'cancelled');
CREATE TYPE urgency_level AS ENUM ('emergency', 'urgent', 'normal', 'scheduled');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'paid', 'failed');
CREATE TYPE payment_type AS ENUM ('job_payment', 'subscription', 'advance', 'refund');
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'viewer');

-- ============================================================================
-- AGENCIES TABLE
-- ============================================================================
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    type agency_type NOT NULL,
    registration_number VARCHAR(100) NOT NULL,
    gstn VARCHAR(15) NOT NULL UNIQUE,
    nsdc_code VARCHAR(50),
    
    -- Contact Information
    contact_person VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- Location
    primary_location JSONB NOT NULL,
    service_areas TEXT[] DEFAULT '{}',
    
    -- Partnership Details
    partnership_tier partnership_tier DEFAULT 'standard',
    partnership_model partnership_model NOT NULL,
    engineer_capacity INTEGER DEFAULT 0,
    
    -- Bank Details (will be encrypted at application level)
    bank_account_name VARCHAR(255),
    bank_account_number TEXT, -- Encrypted
    bank_ifsc VARCHAR(11),
    pan_number TEXT, -- Encrypted
    
    -- Status
    status agency_status DEFAULT 'pending_approval',
    onboarded_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_phone CHECK (phone ~ '^\d{10,15}$'),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_gstn CHECK (gstn ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$')
);

-- ============================================================================
-- ENGINEERS TABLE
-- ============================================================================
CREATE TABLE engineers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID, -- Link to Supabase Auth user
    
    -- Personal Information
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(255),
    photo_url TEXT,
    
    -- Certifications
    certifications JSONB DEFAULT '[]',
    skill_level INTEGER NOT NULL CHECK (skill_level BETWEEN 1 AND 5),
    specializations TEXT[] DEFAULT '{}',
    
    -- Work Status
    availability_status availability_status DEFAULT 'available',
    current_location GEOGRAPHY(POINT, 4326),
    last_location_update TIMESTAMPTZ,
    
    -- Performance Metrics
    total_jobs_completed INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (average_rating BETWEEN 0 AND 5),
    total_ratings INTEGER DEFAULT 0,
    success_rate DECIMAL(5, 2) DEFAULT 0.00 CHECK (success_rate BETWEEN 0 AND 100),
    
    -- Employment
    employment_type employment_type NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_phone_engineer CHECK (phone ~ '^\d{10,15}$'),
    CONSTRAINT valid_email_engineer CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ============================================================================
-- JOBS TABLE
-- ============================================================================
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- Client Information
    client_id UUID,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(15) NOT NULL,
    
    -- Job Details
    job_type job_type NOT NULL,
    equipment_type VARCHAR(255) NOT NULL,
    equipment_details JSONB,
    issue_description TEXT,
    
    -- Location
    site_location JSONB NOT NULL,
    site_coordinates GEOGRAPHY(POINT, 4326),
    
    -- Assignment
    assigned_agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
    assigned_engineer_id UUID REFERENCES engineers(id) ON DELETE SET NULL,
    required_skill_level INTEGER NOT NULL CHECK (required_skill_level BETWEEN 1 AND 5),
    
    -- Scheduling
    scheduled_time TIMESTAMPTZ,
    urgency urgency_level DEFAULT 'normal',
    response_deadline TIMESTAMPTZ,
    
    -- Status & Timeline
    status job_status DEFAULT 'pending',
    assigned_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Financial
    service_fee DECIMAL(10, 2),
    payment_status payment_status DEFAULT 'pending',
    
    -- Service Completion
    service_checklist JSONB,
    parts_used JSONB,
    photos_before TEXT[] DEFAULT '{}',
    photos_after TEXT[] DEFAULT '{}',
    engineer_notes TEXT,
    client_signature_url TEXT,
    
    -- Rating
    client_rating INTEGER CHECK (client_rating BETWEEN 1 AND 5),
    client_feedback TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_client_phone CHECK (client_phone ~ '^\d{10,15}$')
);

-- ============================================================================
-- JOB STATUS HISTORY TABLE
-- ============================================================================
CREATE TABLE job_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Status Change
    status job_status NOT NULL,
    changed_by UUID, -- Engineer or admin user
    location GEOGRAPHY(POINT, 4326),
    notes TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    
    -- Payment Details
    amount DECIMAL(10, 2) NOT NULL,
    payment_type payment_type NOT NULL,
    
    -- Status
    status payment_status DEFAULT 'pending',
    
    -- Payment Method
    payment_method VARCHAR(50),
    payment_gateway_id VARCHAR(255),
    
    -- Invoice
    invoice_number VARCHAR(50) UNIQUE,
    invoice_url TEXT,
    invoice_date DATE,
    due_date DATE,
    
    -- Timestamps
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AGENCY USERS TABLE (for role-based access control)
-- ============================================================================
CREATE TABLE agency_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- Supabase Auth user ID
    
    -- Role
    role user_role DEFAULT 'viewer',
    
    -- User Details
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(agency_id, user_id)
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Recipient
    user_id UUID NOT NULL,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    -- Notification Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    
    -- Related Entity
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- Delivery
    sent_via TEXT[] DEFAULT '{}', -- ['push', 'sms', 'email']
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FCM TOKENS TABLE (for push notifications)
-- ============================================================================
CREATE TABLE fcm_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Token
    token TEXT NOT NULL UNIQUE,
    device_type VARCHAR(20) NOT NULL, -- 'ios' or 'android'
    device_id VARCHAR(255),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Agencies indexes
CREATE INDEX idx_agencies_status ON agencies(status);
CREATE INDEX idx_agencies_gstn ON agencies(gstn);
CREATE INDEX idx_agencies_type ON agencies(type);

-- Engineers indexes
CREATE INDEX idx_engineers_agency ON engineers(agency_id);
CREATE INDEX idx_engineers_phone ON engineers(phone);
CREATE INDEX idx_engineers_availability ON engineers(availability_status) WHERE availability_status = 'available';
CREATE INDEX idx_engineers_location ON engineers USING GIST (current_location);
CREATE INDEX idx_engineers_user_id ON engineers(user_id);

-- Jobs indexes
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_agency ON jobs(assigned_agency_id) WHERE assigned_agency_id IS NOT NULL;
CREATE INDEX idx_jobs_engineer ON jobs(assigned_engineer_id) WHERE assigned_engineer_id IS NOT NULL;
CREATE INDEX idx_jobs_scheduled_time ON jobs(scheduled_time);
CREATE INDEX idx_jobs_urgency ON jobs(urgency);
CREATE INDEX idx_jobs_job_number ON jobs(job_number);
CREATE INDEX idx_jobs_location ON jobs USING GIST (site_coordinates);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);

-- Job status history indexes
CREATE INDEX idx_job_status_history_job ON job_status_history(job_id);
CREATE INDEX idx_job_status_history_created ON job_status_history(created_at);

-- Payments indexes
CREATE INDEX idx_payments_agency ON payments(agency_id);
CREATE INDEX idx_payments_job ON payments(job_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_invoice_number ON payments(invoice_number);

-- Agency users indexes
CREATE INDEX idx_agency_users_agency ON agency_users(agency_id);
CREATE INDEX idx_agency_users_user ON agency_users(user_id);
CREATE INDEX idx_agency_users_role ON agency_users(role);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_agency ON notifications(agency_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- FCM tokens indexes
CREATE INDEX idx_fcm_tokens_user ON fcm_tokens(user_id);
CREATE INDEX idx_fcm_tokens_token ON fcm_tokens(token);
CREATE INDEX idx_fcm_tokens_active ON fcm_tokens(is_active) WHERE is_active = true;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_engineers_updated_at BEFORE UPDATE ON engineers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agency_users_updated_at BEFORE UPDATE ON agency_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fcm_tokens_updated_at BEFORE UPDATE ON fcm_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create job status history
CREATE OR REPLACE FUNCTION create_job_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO job_status_history (job_id, status, changed_by)
        VALUES (NEW.id, NEW.status, NEW.assigned_engineer_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_status_change_trigger AFTER UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION create_job_status_history();

-- Function to update engineer performance metrics
CREATE OR REPLACE FUNCTION update_engineer_metrics()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' AND NEW.assigned_engineer_id IS NOT NULL) THEN
        UPDATE engineers
        SET 
            total_jobs_completed = total_jobs_completed + 1,
            average_rating = CASE 
                WHEN NEW.client_rating IS NOT NULL THEN
                    ((average_rating * total_ratings) + NEW.client_rating) / (total_ratings + 1)
                ELSE average_rating
            END,
            total_ratings = CASE 
                WHEN NEW.client_rating IS NOT NULL THEN total_ratings + 1
                ELSE total_ratings
            END
        WHERE id = NEW.assigned_engineer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_engineer_metrics_trigger AFTER UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_engineer_metrics();

-- Function to create payment record on job completion
CREATE OR REPLACE FUNCTION create_payment_on_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' AND NEW.service_fee IS NOT NULL) THEN
        INSERT INTO payments (agency_id, job_id, amount, payment_type, status)
        VALUES (NEW.assigned_agency_id, NEW.id, NEW.service_fee, 'job_payment', 'pending');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_payment_trigger AFTER UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION create_payment_on_completion();
