/**
 * Database Types
 * Auto-generated types matching the Supabase database schema
 */

// ============================================================================
// ENUMS
// ============================================================================

export type AgencyType = 'ITI' | 'Training' | 'Service' | 'Vendor';
export type AgencyStatus = 'pending_approval' | 'active' | 'suspended' | 'inactive';
export type PartnershipTier = 'standard' | 'premium' | 'enterprise';
export type PartnershipModel = 'job_placement' | 'dedicated_resource' | 'training_placement';
export type CertificationType = 'PMKVY' | 'ITI' | 'NSDC' | 'Other';
export type AvailabilityStatus = 'available' | 'on_job' | 'offline' | 'on_leave';
export type EmploymentType = 'full_time' | 'part_time' | 'gig' | 'apprentice';
export type JobType = 'AMC' | 'Repair' | 'Installation' | 'Emergency';
export type JobStatus = 'pending' | 'assigned' | 'accepted' | 'travelling' | 'onsite' | 'completed' | 'cancelled';
export type UrgencyLevel = 'emergency' | 'urgent' | 'normal' | 'scheduled';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed';
export type PaymentType = 'job_payment' | 'subscription' | 'advance' | 'refund';
export type UserRole = 'admin' | 'manager' | 'viewer';

// ============================================================================
// LOCATION TYPES
// ============================================================================

export interface Location {
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
}

export interface SiteLocation {
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// ============================================================================
// CERTIFICATION TYPES
// ============================================================================

export interface Certification {
  type: CertificationType;
  level: number;
  cert_number: string;
  verified: boolean;
  issued_date?: string;
}

// ============================================================================
// EQUIPMENT TYPES
// ============================================================================

export interface EquipmentDetails {
  brand?: string;
  model?: string;
  serial_number?: string;
  capacity?: string;
}

// ============================================================================
// SERVICE TYPES
// ============================================================================

export interface ChecklistItem {
  item: string;
  completed: boolean;
  notes?: string;
}

export interface PartUsed {
  name: string;
  quantity: number;
  cost: number;
}

// ============================================================================
// DATABASE TABLES
// ============================================================================

export interface Agency {
  id: string;
  
  // Basic Information
  name: string;
  type: AgencyType;
  registration_number: string;
  gstn: string;
  nsdc_code?: string;
  
  // Contact Information
  contact_person: string;
  phone: string;
  email: string;
  
  // Location
  primary_location: Location;
  service_areas: string[];
  
  // Partnership Details
  partnership_tier: PartnershipTier;
  partnership_model: PartnershipModel;
  engineer_capacity: number;
  
  // Bank Details (encrypted)
  bank_account_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  pan_number?: string;
  
  // Status
  status: AgencyStatus;
  onboarded_at?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Engineer {
  id: string;
  agency_id: string;
  user_id?: string;
  
  // Personal Information
  name: string;
  phone: string;
  email?: string;
  photo_url?: string;
  
  // Certifications
  certifications: Certification[];
  skill_level: 1 | 2 | 3 | 4 | 5;
  specializations: string[];
  
  // Work Status
  availability_status: AvailabilityStatus;
  current_location?: GeoPoint;
  last_location_update?: string;
  
  // Performance Metrics
  total_jobs_completed: number;
  average_rating: number;
  total_ratings: number;
  success_rate: number;
  
  // Employment
  employment_type: EmploymentType;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  job_number: string;
  
  // Client Information
  client_id?: string;
  client_name: string;
  client_phone: string;
  
  // Job Details
  job_type: JobType;
  equipment_type: string;
  equipment_details?: EquipmentDetails;
  issue_description?: string;
  
  // Location
  site_location: SiteLocation;
  site_coordinates?: GeoPoint;
  
  // Assignment
  assigned_agency_id?: string;
  assigned_engineer_id?: string;
  required_skill_level: 1 | 2 | 3 | 4 | 5;
  
  // Scheduling
  scheduled_time?: string;
  urgency: UrgencyLevel;
  response_deadline?: string;
  
  // Status & Timeline
  status: JobStatus;
  assigned_at?: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  
  // Financial
  service_fee?: number;
  payment_status: PaymentStatus;
  
  // Service Completion
  service_checklist?: ChecklistItem[];
  parts_used?: PartUsed[];
  photos_before: string[];
  photos_after: string[];
  engineer_notes?: string;
  client_signature_url?: string;
  
  // Rating
  client_rating?: 1 | 2 | 3 | 4 | 5;
  client_feedback?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface JobStatusHistory {
  id: string;
  job_id: string;
  
  // Status Change
  status: JobStatus;
  changed_by?: string;
  location?: GeoPoint;
  notes?: string;
  
  // Timestamp
  created_at: string;
}

export interface Payment {
  id: string;
  agency_id?: string;
  job_id?: string;
  
  // Payment Details
  amount: number;
  payment_type: PaymentType;
  
  // Status
  status: PaymentStatus;
  
  // Payment Method
  payment_method?: string;
  payment_gateway_id?: string;
  
  // Invoice
  invoice_number?: string;
  invoice_url?: string;
  invoice_date?: string;
  due_date?: string;
  
  // Timestamps
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AgencyUser {
  id: string;
  agency_id: string;
  user_id: string;
  
  // Role
  role: UserRole;
  
  // User Details
  name: string;
  email: string;
  phone?: string;
  
  // Status
  is_active: boolean;
  is_demo_user: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  
  // Recipient
  user_id: string;
  agency_id?: string;
  
  // Notification Content
  title: string;
  message: string;
  type: string;
  
  // Related Entity
  related_entity_type?: string;
  related_entity_id?: string;
  
  // Status
  is_read: boolean;
  read_at?: string;
  
  // Delivery
  sent_via: string[];
  
  // Timestamp
  created_at: string;
}

export interface FCMToken {
  id: string;
  user_id: string;
  
  // Token
  token: string;
  device_type: 'ios' | 'android';
  device_id?: string;
  
  // Status
  is_active: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ANALYTICS VIEWS
// ============================================================================

export interface AgencyMonthlyMetrics {
  agency_id: string;
  agency_name: string;
  month: string;
  
  // Job Metrics
  jobs_completed: number;
  engineers_utilized: number;
  
  // Revenue Metrics
  total_revenue: number;
  avg_job_value: number;
  
  // Performance Metrics
  avg_rating: number;
  positive_ratings: number;
  
  // Time Metrics
  avg_completion_hours: number;
  avg_response_hours: number;
  
  // Job Type Distribution
  amc_jobs: number;
  repair_jobs: number;
  installation_jobs: number;
  emergency_jobs: number;
  
  // Success Metrics
  successful_jobs: number;
  cancelled_jobs: number;
  
  last_refreshed: string;
}

export interface EngineerPerformanceMetrics {
  engineer_id: string;
  engineer_name: string;
  agency_id: string;
  
  // Job Metrics
  total_jobs: number;
  completed_jobs: number;
  cancelled_jobs: number;
  
  // Success Rate
  success_rate: number;
  
  // Rating Metrics
  avg_rating: number;
  total_ratings: number;
  positive_ratings: number;
  
  // Time Metrics
  avg_service_hours: number;
  avg_travel_hours: number;
  
  // Revenue Contribution
  total_revenue_generated: number;
  
  // Job Type Experience
  amc_experience: number;
  repair_experience: number;
  installation_experience: number;
  emergency_experience: number;
  
  // Current Status
  availability_status: AvailabilityStatus;
  skill_level: number;
  
  last_refreshed: string;
}

export interface DashboardRealtime {
  agency_id: string;
  agency_name: string;
  
  jobs_today: number;
  active_engineers: number;
  available_engineers: number;
  pending_jobs: number;
  in_progress_jobs: number;
  completed_today: number;
  pending_payments: number;
  monthly_revenue: number;
  monthly_avg_rating: number;
}

// ============================================================================
// SUPABASE DATABASE TYPE
// ============================================================================

export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: Agency;
        Insert: Omit<Agency, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Agency, 'id' | 'created_at' | 'updated_at'>>;
      };
      engineers: {
        Row: Engineer;
        Insert: Omit<Engineer, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Engineer, 'id' | 'created_at' | 'updated_at'>>;
      };
      jobs: {
        Row: Job;
        Insert: Omit<Job, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Job, 'id' | 'created_at' | 'updated_at'>>;
      };
      job_status_history: {
        Row: JobStatusHistory;
        Insert: Omit<JobStatusHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<JobStatusHistory, 'id' | 'created_at'>>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Payment, 'id' | 'created_at' | 'updated_at'>>;
      };
      agency_users: {
        Row: AgencyUser;
        Insert: Omit<AgencyUser, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AgencyUser, 'id' | 'created_at' | 'updated_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>;
      };
      fcm_tokens: {
        Row: FCMToken;
        Insert: Omit<FCMToken, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<FCMToken, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: {
      agency_monthly_metrics: {
        Row: AgencyMonthlyMetrics;
      };
      engineer_performance_metrics: {
        Row: EngineerPerformanceMetrics;
      };
      dashboard_realtime: {
        Row: DashboardRealtime;
      };
    };
  };
}
