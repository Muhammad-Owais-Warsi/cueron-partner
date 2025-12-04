/**
 * Zod Validation Schemas
 * Runtime validation schemas for all data models
 */

import { z } from 'zod';

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const AddressSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, 'Invalid pincode')
    .optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const PostGISPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([
    z.number().min(-180).max(180), // longitude
    z.number().min(-90).max(90), // latitude
  ]),
});

// ============================================================================
// AGENCY SCHEMAS
// ============================================================================

export const AgencyTypeSchema = z.enum(['ITI', 'Training', 'Service', 'Vendor']);

export const PartnershipTierSchema = z.enum(['standard', 'premium', 'enterprise']);

export const PartnershipModelSchema = z.enum([
  'job_placement',
  'dedicated_resource',
  'training_placement',
]);

export const AgencyStatusSchema = z.enum(['pending_approval', 'active', 'suspended', 'inactive']);

export const AgencySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3, 'Agency name must be at least 3 characters'),
  type: AgencyTypeSchema,
  registration_number: z.string().min(1, 'Registration number is required'),
  gstn: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTN format'),
  nsdc_code: z.string().optional(),

  // Contact
  contact_person: z.string().min(1, 'Contact person is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email address'),

  // Location
  primary_location: AddressSchema,
  service_areas: z.array(z.string()),

  // Partnership
  partnership_tier: PartnershipTierSchema,
  partnership_model: PartnershipModelSchema,
  engineer_capacity: z.number().int().min(0),

  // Bank Details (encrypted in database)
  bank_account_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_ifsc: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code')
    .optional(),
  pan_number: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN')
    .optional(),

  // Status
  status: AgencyStatusSchema,
  onboarded_at: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateAgencyInputSchema = z.object({
  name: z.string().min(3, 'Agency name must be at least 3 characters'),
  type: AgencyTypeSchema,
  registration_number: z.string().min(1, 'Registration number is required'),
  gstn: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTN format'),
  nsdc_code: z.string().optional(),
  contact_person: z.string().min(1, 'Contact person is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email address'),
  primary_location: AddressSchema,
  service_areas: z.array(z.string()),
  partnership_tier: PartnershipTierSchema,
  partnership_model: PartnershipModelSchema,
  engineer_capacity: z.number().int().min(0),
  bank_account_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_ifsc: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code')
    .optional(),
  pan_number: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN')
    .optional(),
});

export const UpdateAgencyInputSchema = z.object({
  name: z.string().min(3).optional(),
  contact_person: z.string().min(1).optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/)
    .optional(),
  email: z.string().email().optional(),
  primary_location: AddressSchema.optional(),
  service_areas: z.array(z.string()).optional(),
  bank_account_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_ifsc: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .optional(),
  pan_number: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .optional(),
});

// ============================================================================
// ENGINEER SCHEMAS
// ============================================================================

export const CertificationTypeSchema = z.enum(['PMKVY', 'ITI', 'NSDC', 'Other']);

export const SkillLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const AvailabilityStatusSchema = z.enum(['available', 'on_job', 'offline', 'on_leave']);

export const EmploymentTypeSchema = z.enum(['full_time', 'part_time', 'gig', 'apprentice']);

export const CertificationSchema = z.object({
  type: CertificationTypeSchema,
  level: z.number().int().min(1),
  cert_number: z.string().min(1, 'Certificate number is required'),
  verified: z.boolean(),
  issued_date: z.string().optional(),
});

export const EngineerSchema = z.object({
  id: z.string().uuid(),
  agency_id: z.string().uuid(),

  // Personal Info
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  email: z.string().email().optional().nullable(),
  photo_url: z.string().url().optional().nullable(),

  // Certifications
  certifications: z.array(CertificationSchema),
  skill_level: SkillLevelSchema,
  specializations: z.array(z.string()),

  // Work Status
  availability_status: AvailabilityStatusSchema,
  current_location: PostGISPointSchema.optional().nullable(),
  last_location_update: z.string().datetime().optional().nullable(),

  // Performance
  total_jobs_completed: z.number().int().min(0),
  average_rating: z.number().min(0).max(5),
  total_ratings: z.number().int().min(0),
  success_rate: z.number().min(0).max(100),

  // Employment
  employment_type: EmploymentTypeSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateEngineerInputSchema = z.object({
  agency_id: z.string().uuid().optional(), // Made agency_id optional
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  email: z.string().email().optional(),
  photo_url: z.string().url().optional(),
  certifications: z.array(CertificationSchema).default([]),
  skill_level: SkillLevelSchema,
  specializations: z.array(z.string()).default([]),
  employment_type: EmploymentTypeSchema,
});

// Alias for easier use in API routes
export const engineerSchema = CreateEngineerInputSchema;

export const UpdateEngineerInputSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/)
    .optional(),
  email: z.string().email().optional(),
  photo_url: z.string().url().optional(),
  certifications: z.array(CertificationSchema).optional(),
  skill_level: SkillLevelSchema.optional(),
  specializations: z.array(z.string()).optional(),
  availability_status: AvailabilityStatusSchema.optional(),
  current_location: PostGISPointSchema.optional(),
  employment_type: EmploymentTypeSchema.optional(),
});

// ============================================================================
// JOB SCHEMAS
// ============================================================================

export const JobTypeSchema = z.enum(['AMC', 'Repair', 'Installation', 'Emergency']);

export const JobUrgencySchema = z.enum(['emergency', 'urgent', 'normal', 'scheduled']);

export const JobStatusSchema = z.enum([
  'pending',
  'assigned',
  'accepted',
  'travelling',
  'onsite',
  'completed',
  'cancelled',
]);

export const PaymentStatusSchema = z.enum(['pending', 'processing', 'paid', 'failed']);

export const EquipmentDetailsSchema = z.object({
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  capacity: z.string().optional(),
});

export const ChecklistItemSchema = z.object({
  item: z.string().min(1, 'Checklist item is required'),
  completed: z.boolean(),
  notes: z.string().optional(),
});

export const PartUsedSchema = z.object({
  name: z.string().min(1, 'Part name is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  cost: z.number().min(0, 'Cost must be non-negative'),
});

export const JobSchema = z.object({
  id: z.string().uuid(),
  job_number: z.string().min(1),

  // Client
  client_id: z.string().uuid().optional().nullable(),
  client_name: z.string().min(1, 'Client name is required'),
  client_phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),

  // Job Details
  job_type: JobTypeSchema,
  equipment_type: z.string().min(1, 'Equipment type is required'),
  equipment_details: EquipmentDetailsSchema.optional().nullable(),
  issue_description: z.string().optional().nullable(),

  // Location
  site_location: AddressSchema,

  // Assignment
  assigned_agency_id: z.string().uuid().optional().nullable(),
  assigned_engineer_id: z.string().uuid().optional().nullable(),
  required_skill_level: SkillLevelSchema,

  // Scheduling
  scheduled_time: z.string().datetime().optional().nullable(),
  urgency: JobUrgencySchema,
  response_deadline: z.string().datetime().optional().nullable(),

  // Status & Timeline
  status: JobStatusSchema,
  assigned_at: z.string().datetime().optional().nullable(),
  accepted_at: z.string().datetime().optional().nullable(),
  started_at: z.string().datetime().optional().nullable(),
  completed_at: z.string().datetime().optional().nullable(),

  // Financial
  service_fee: z.number().min(0).optional().nullable(),
  payment_status: PaymentStatusSchema,

  // Service Completion
  service_checklist: z.array(ChecklistItemSchema).optional().nullable(),
  parts_used: z.array(PartUsedSchema).optional().nullable(),
  photos_before: z.array(z.string().url()).optional().nullable(),
  photos_after: z.array(z.string().url()).optional().nullable(),
  engineer_notes: z.string().optional().nullable(),
  client_signature_url: z.string().url().optional().nullable(),

  // Rating
  client_rating: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
    .optional()
    .nullable(),
  client_feedback: z.string().optional().nullable(),

  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateJobInputSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  client_phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  job_type: JobTypeSchema,
  equipment_type: z.string().min(1, 'Equipment type is required'),
  equipment_details: EquipmentDetailsSchema.optional(),
  issue_description: z.string().optional(),
  site_location: AddressSchema,
  required_skill_level: SkillLevelSchema,
  scheduled_time: z.string().datetime().optional(),
  urgency: JobUrgencySchema,
  service_fee: z.number().min(0).optional(),
});

export const UpdateJobInputSchema = z.object({
  status: JobStatusSchema.optional(),
  assigned_engineer_id: z.string().uuid().optional(),
  service_checklist: z.array(ChecklistItemSchema).optional(),
  parts_used: z.array(PartUsedSchema).optional(),
  photos_before: z.array(z.string().url()).optional(),
  photos_after: z.array(z.string().url()).optional(),
  engineer_notes: z.string().optional(),
  client_signature_url: z.string().url().optional(),
  client_rating: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
    .optional(),
  client_feedback: z.string().optional(),
});

export const JobFiltersSchema = z.object({
  status: z.array(JobStatusSchema).optional(),
  urgency: z.array(JobUrgencySchema).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      radius_km: z.number().min(0),
    })
    .optional(),
});

// ============================================================================
// PAYMENT SCHEMAS
// ============================================================================

export const PaymentTypeSchema = z.enum(['job_payment', 'subscription', 'advance', 'refund']);

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  agency_id: z.string().uuid().optional().nullable(),
  job_id: z.string().uuid().optional().nullable(),

  // Payment Details
  amount: z.number().min(0, 'Amount must be non-negative'),
  payment_type: PaymentTypeSchema,

  // Status
  status: PaymentStatusSchema,

  // Payment Method
  payment_method: z.string().optional().nullable(),
  payment_gateway_id: z.string().optional().nullable(),

  // Invoice
  invoice_number: z.string().optional().nullable(),
  invoice_url: z.string().url().optional().nullable(),
  invoice_date: z.string().datetime().optional().nullable(),
  due_date: z.string().datetime().optional().nullable(),

  // Timestamps
  paid_at: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreatePaymentInputSchema = z.object({
  agency_id: z.string().uuid().optional(),
  job_id: z.string().uuid().optional(),
  amount: z.number().min(0, 'Amount must be non-negative'),
  payment_type: PaymentTypeSchema,
  payment_method: z.string().optional(),
  due_date: z.string().datetime().optional(),
});

export const UpdatePaymentInputSchema = z.object({
  status: PaymentStatusSchema.optional(),
  payment_gateway_id: z.string().optional(),
  invoice_number: z.string().optional(),
  invoice_url: z.string().url().optional(),
  paid_at: z.string().datetime().optional(),
});

// ============================================================================
// BULK UPLOAD SCHEMAS
// ============================================================================

export const BulkEngineerUploadSchema = z.object({
  success_count: z.number().int().min(0),
  error_count: z.number().int().min(0),
  errors: z.array(
    z.object({
      row: z.number().int().min(1),
      field: z.string(),
      message: z.string(),
    })
  ),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates data against a schema and returns typed result
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Validates data and throws on error
 */
export function validateDataOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
