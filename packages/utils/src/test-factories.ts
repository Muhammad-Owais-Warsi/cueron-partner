/**
 * Test Data Factories
 * Factory functions for generating test data in TypeScript tests
 */

import type {
  Agency,
  Engineer,
  Job,
  Payment,
  CreateAgencyInput,
  CreateEngineerInput,
  CreateJobInput,
  CreatePaymentInput,
  Certification,
} from '@cueron/types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateJobNumber(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `JOB-${year}-${num}`;
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `INV-${year}-${num}`;
}

function generateGSTN(): string {
  const stateCode = Math.floor(Math.random() * 37)
    .toString()
    .padStart(2, '0');
  const pan = Array(5)
    .fill(0)
    .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
    .join('');
  const entityNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  const entityType = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const checksum = Math.floor(Math.random() * 36).toString(36).toUpperCase();
  return `${stateCode}${pan}${entityNum}${entityType}${checksum}Z${checksum}`;
}

function generatePhone(): string {
  const prefix = [6, 7, 8, 9][Math.floor(Math.random() * 4)];
  const rest = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, '0');
  return `${prefix}${rest}`;
}

// ============================================================================
// AGENCY FACTORIES
// ============================================================================

export function createMockAgency(overrides?: Partial<Agency>): Agency {
  const now = new Date().toISOString();
  return {
    id: generateUUID(),
    name: `Test Agency ${Math.floor(Math.random() * 1000)}`,
    type: ['ITI', 'Training', 'Service', 'Vendor'][
      Math.floor(Math.random() * 4)
    ] as Agency['type'],
    registration_number: `REG-${Math.floor(Math.random() * 10000)}`,
    gstn: generateGSTN(),
    nsdc_code: `NSDC-${Math.floor(Math.random() * 10000)}`,
    contact_person: 'Test Contact',
    phone: generatePhone(),
    email: `test${Math.floor(Math.random() * 10000)}@example.com`,
    primary_location: {
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '110001',
      lat: 28.6139,
      lng: 77.209,
    },
    service_areas: ['Test City', 'Nearby City'],
    partnership_tier: ['standard', 'premium', 'enterprise'][
      Math.floor(Math.random() * 3)
    ] as Agency['partnership_tier'],
    partnership_model: ['job_placement', 'dedicated_resource', 'training_placement'][
      Math.floor(Math.random() * 3)
    ] as Agency['partnership_model'],
    engineer_capacity: Math.floor(Math.random() * 100) + 10,
    status: 'active',
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function createMockCreateAgencyInput(
  overrides?: Partial<CreateAgencyInput>
): CreateAgencyInput {
  return {
    name: `Test Agency ${Math.floor(Math.random() * 1000)}`,
    type: 'ITI',
    registration_number: `REG-${Math.floor(Math.random() * 10000)}`,
    gstn: generateGSTN(),
    contact_person: 'Test Contact',
    phone: generatePhone(),
    email: `test${Math.floor(Math.random() * 10000)}@example.com`,
    primary_location: {
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '110001',
      lat: 28.6139,
      lng: 77.209,
    },
    service_areas: ['Test City'],
    partnership_tier: 'standard',
    partnership_model: 'job_placement',
    engineer_capacity: 50,
    ...overrides,
  };
}

// ============================================================================
// ENGINEER FACTORIES
// ============================================================================

export function createMockCertification(
  overrides?: Partial<Certification>
): Certification {
  return {
    type: ['PMKVY', 'ITI', 'NSDC', 'Other'][
      Math.floor(Math.random() * 4)
    ] as Certification['type'],
    level: Math.floor(Math.random() * 5) + 1,
    cert_number: `CERT-${Math.floor(Math.random() * 10000)}`,
    verified: Math.random() > 0.5,
    ...overrides,
  };
}

export function createMockEngineer(overrides?: Partial<Engineer>): Engineer {
  const now = new Date().toISOString();
  return {
    id: generateUUID(),
    agency_id: generateUUID(),
    name: `Test Engineer ${Math.floor(Math.random() * 1000)}`,
    phone: generatePhone(),
    email: `engineer${Math.floor(Math.random() * 10000)}@example.com`,
    certifications: [createMockCertification()],
    skill_level: (Math.floor(Math.random() * 5) + 1) as Engineer['skill_level'],
    specializations: ['Cold Storage', 'Industrial HVAC'],
    availability_status: 'available',
    total_jobs_completed: Math.floor(Math.random() * 100),
    average_rating: Math.random() * 5,
    total_ratings: Math.floor(Math.random() * 50),
    success_rate: Math.random() * 100,
    employment_type: ['full_time', 'part_time', 'gig', 'apprentice'][
      Math.floor(Math.random() * 4)
    ] as Engineer['employment_type'],
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function createMockCreateEngineerInput(
  overrides?: Partial<CreateEngineerInput>
): CreateEngineerInput {
  return {
    agency_id: generateUUID(),
    name: `Test Engineer ${Math.floor(Math.random() * 1000)}`,
    phone: generatePhone(),
    email: `engineer${Math.floor(Math.random() * 10000)}@example.com`,
    certifications: [createMockCertification()],
    skill_level: 3,
    specializations: ['Cold Storage'],
    employment_type: 'full_time',
    ...overrides,
  };
}

// ============================================================================
// JOB FACTORIES
// ============================================================================

export function createMockJob(overrides?: Partial<Job>): Job {
  const now = new Date().toISOString();
  return {
    id: generateUUID(),
    job_number: generateJobNumber(),
    client_name: `Test Client ${Math.floor(Math.random() * 1000)}`,
    client_phone: generatePhone(),
    job_type: ['AMC', 'Repair', 'Installation', 'Emergency'][
      Math.floor(Math.random() * 4)
    ] as Job['job_type'],
    equipment_type: 'Industrial Chiller',
    equipment_details: {
      brand: 'Test Brand',
      model: 'TEST-1000',
      capacity: '100 TR',
    },
    site_location: {
      address: '456 Test Avenue',
      city: 'Test City',
      state: 'Test State',
      lat: 28.6139,
      lng: 77.209,
    },
    required_skill_level: (Math.floor(Math.random() * 5) + 1) as Job['required_skill_level'],
    urgency: ['emergency', 'urgent', 'normal', 'scheduled'][
      Math.floor(Math.random() * 4)
    ] as Job['urgency'],
    status: 'pending',
    payment_status: 'pending',
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function createMockCreateJobInput(
  overrides?: Partial<CreateJobInput>
): CreateJobInput {
  return {
    client_name: `Test Client ${Math.floor(Math.random() * 1000)}`,
    client_phone: generatePhone(),
    job_type: 'AMC',
    equipment_type: 'Industrial Chiller',
    site_location: {
      address: '456 Test Avenue',
      city: 'Test City',
      state: 'Test State',
      lat: 28.6139,
      lng: 77.209,
    },
    required_skill_level: 3,
    urgency: 'normal',
    ...overrides,
  };
}

// ============================================================================
// PAYMENT FACTORIES
// ============================================================================

export function createMockPayment(overrides?: Partial<Payment>): Payment {
  const now = new Date().toISOString();
  return {
    id: generateUUID(),
    agency_id: generateUUID(),
    job_id: generateUUID(),
    amount: Math.floor(Math.random() * 50000) + 1000,
    payment_type: ['job_payment', 'subscription', 'advance', 'refund'][
      Math.floor(Math.random() * 4)
    ] as Payment['payment_type'],
    status: ['pending', 'processing', 'completed', 'failed'][
      Math.floor(Math.random() * 4)
    ] as Payment['status'],
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function createMockCreatePaymentInput(
  overrides?: Partial<CreatePaymentInput>
): CreatePaymentInput {
  return {
    agency_id: generateUUID(),
    job_id: generateUUID(),
    amount: 5000,
    payment_type: 'job_payment',
    ...overrides,
  };
}

// ============================================================================
// BATCH FACTORIES
// ============================================================================

/**
 * Create multiple mock agencies
 */
export function createMockAgencies(count: number, overrides?: Partial<Agency>): Agency[] {
  return Array.from({ length: count }, () => createMockAgency(overrides));
}

/**
 * Create multiple mock engineers
 */
export function createMockEngineers(
  count: number,
  overrides?: Partial<Engineer>
): Engineer[] {
  return Array.from({ length: count }, () => createMockEngineer(overrides));
}

/**
 * Create multiple mock jobs
 */
export function createMockJobs(count: number, overrides?: Partial<Job>): Job[] {
  return Array.from({ length: count }, () => createMockJob(overrides));
}

/**
 * Create multiple mock payments
 */
export function createMockPayments(count: number, overrides?: Partial<Payment>): Payment[] {
  return Array.from({ length: count }, () => createMockPayment(overrides));
}

// ============================================================================
// SCENARIO FACTORIES
// ============================================================================

/**
 * Create a complete agency with engineers and jobs
 */
export function createMockAgencyWithTeam(engineerCount: number = 5, jobCount: number = 3) {
  const agency = createMockAgency();
  const engineers = createMockEngineers(engineerCount, { agency_id: agency.id });
  const jobs = createMockJobs(jobCount, { assigned_agency_id: agency.id });

  return {
    agency,
    engineers,
    jobs,
  };
}

/**
 * Create a job with full lifecycle data
 */
export function createMockCompletedJob(overrides?: Partial<Job>): Job {
  const now = new Date();
  const assignedAt = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
  const acceptedAt = new Date(assignedAt.getTime() + 60 * 60 * 1000); // 1 hour later
  const startedAt = new Date(acceptedAt.getTime() + 24 * 60 * 60 * 1000); // 1 day later
  const completedAt = new Date(startedAt.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

  return createMockJob({
    status: 'completed',
    assigned_agency_id: generateUUID(),
    assigned_engineer_id: generateUUID(),
    assigned_at: assignedAt.toISOString(),
    accepted_at: acceptedAt.toISOString(),
    started_at: startedAt.toISOString(),
    completed_at: completedAt.toISOString(),
    service_checklist: [
      { item: 'Check refrigerant levels', completed: true },
      { item: 'Inspect compressor', completed: true },
      { item: 'Clean condenser coils', completed: true },
    ],
    photos_before: ['https://example.com/before1.jpg'],
    photos_after: ['https://example.com/after1.jpg'],
    client_signature_url: 'https://example.com/signature.jpg',
    client_rating: 5,
    client_feedback: 'Excellent service',
    payment_status: 'paid',
    ...overrides,
  });
}

/**
 * Create an engineer with job history
 */
export function createMockEngineerWithHistory(
  completedJobs: number,
  cancelledJobs: number
): Engineer {
  const totalJobs = completedJobs + cancelledJobs;
  const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

  return createMockEngineer({
    total_jobs_completed: completedJobs,
    success_rate: successRate,
    average_rating: 4.5,
    total_ratings: completedJobs,
  });
}
