-- ============================================================================
-- STORAGE BUCKETS CONFIGURATION
-- ============================================================================

-- Create storage buckets for different file types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'engineer-photos',
        'engineer-photos',
        false,
        5242880, -- 5MB
        ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    ),
    (
        'job-photos',
        'job-photos',
        false,
        10485760, -- 10MB
        ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    ),
    (
        'signatures',
        'signatures',
        false,
        1048576, -- 1MB
        ARRAY['image/png', 'image/jpeg', 'image/jpg']
    ),
    (
        'documents',
        'documents',
        false,
        10485760, -- 10MB
        ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    ),
    (
        'invoices',
        'invoices',
        false,
        5242880, -- 5MB
        ARRAY['application/pdf']
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Engineer Photos Bucket Policies
-- Agencies can upload photos for their engineers
CREATE POLICY "Agencies can upload engineer photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'engineer-photos'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM engineers WHERE agency_id = (
            SELECT agency_id FROM agency_users WHERE user_id = auth.uid() LIMIT 1
        )
    )
);

-- Agencies can view their engineers' photos
CREATE POLICY "Agencies can view engineer photos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'engineer-photos'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM engineers WHERE agency_id = (
            SELECT agency_id FROM agency_users WHERE user_id = auth.uid() LIMIT 1
        )
    )
);

-- Engineers can view their own photos
CREATE POLICY "Engineers can view own photos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'engineer-photos'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM engineers WHERE user_id = auth.uid()
    )
);

-- Engineers can upload their own photos
CREATE POLICY "Engineers can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'engineer-photos'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM engineers WHERE user_id = auth.uid()
    )
);

-- Job Photos Bucket Policies
-- Engineers can upload photos for their assigned jobs
CREATE POLICY "Engineers can upload job photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'job-photos'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM jobs WHERE assigned_engineer_id = (
            SELECT id FROM engineers WHERE user_id = auth.uid() LIMIT 1
        )
    )
);

-- Engineers can view photos for their assigned jobs
CREATE POLICY "Engineers can view job photos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'job-photos'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM jobs WHERE assigned_engineer_id = (
            SELECT id FROM engineers WHERE user_id = auth.uid() LIMIT 1
        )
    )
);

-- Agencies can view photos for their jobs
CREATE POLICY "Agencies can view job photos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'job-photos'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM jobs WHERE assigned_agency_id = (
            SELECT agency_id FROM agency_users WHERE user_id = auth.uid() LIMIT 1
        )
    )
);

-- Signatures Bucket Policies
-- Engineers can upload signatures for their jobs
CREATE POLICY "Engineers can upload signatures"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'signatures'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM jobs WHERE assigned_engineer_id = (
            SELECT id FROM engineers WHERE user_id = auth.uid() LIMIT 1
        )
    )
);

-- Engineers can view signatures for their jobs
CREATE POLICY "Engineers can view signatures"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'signatures'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM jobs WHERE assigned_engineer_id = (
            SELECT id FROM engineers WHERE user_id = auth.uid() LIMIT 1
        )
    )
);

-- Agencies can view signatures for their jobs
CREATE POLICY "Agencies can view signatures"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'signatures'
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM jobs WHERE assigned_agency_id = (
            SELECT agency_id FROM agency_users WHERE user_id = auth.uid() LIMIT 1
        )
    )
);

-- Documents Bucket Policies
-- Agencies can upload documents
CREATE POLICY "Agencies can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (
        SELECT agency_id::text FROM agency_users WHERE user_id = auth.uid() LIMIT 1
    )
);

-- Agencies can view their documents
CREATE POLICY "Agencies can view documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (
        SELECT agency_id::text FROM agency_users WHERE user_id = auth.uid() LIMIT 1
    )
);

-- Invoices Bucket Policies
-- System can create invoices (handled by backend)
CREATE POLICY "Allow invoice creation"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'invoices'
);

-- Agencies can view their invoices
CREATE POLICY "Agencies can view invoices"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = (
        SELECT agency_id::text FROM agency_users WHERE user_id = auth.uid() LIMIT 1
    )
);

-- ============================================================================
-- STORAGE HELPER FUNCTIONS
-- ============================================================================

-- Function to get signed URL for private files
CREATE OR REPLACE FUNCTION get_signed_url(bucket_name TEXT, file_path TEXT, expires_in INTEGER DEFAULT 3600)
RETURNS TEXT AS $$
DECLARE
    signed_url TEXT;
BEGIN
    -- This is a placeholder - actual implementation would use Supabase Storage API
    -- In practice, this would be called from the application layer
    RETURN format('https://your-project.supabase.co/storage/v1/object/sign/%s/%s?token=...', bucket_name, file_path);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete old files (cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_storage_files()
RETURNS void AS $$
BEGIN
    -- Delete job photos older than 2 years
    DELETE FROM storage.objects
    WHERE bucket_id = 'job-photos'
    AND created_at < NOW() - INTERVAL '2 years';
    
    -- Delete signatures older than 2 years
    DELETE FROM storage.objects
    WHERE bucket_id = 'signatures'
    AND created_at < NOW() - INTERVAL '2 years';
    
    -- Delete old invoices (keep for 7 years for compliance)
    DELETE FROM storage.objects
    WHERE bucket_id = 'invoices'
    AND created_at < NOW() - INTERVAL '7 years';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
