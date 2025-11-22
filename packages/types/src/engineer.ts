import type { UUID, PostGISPoint, Timestamp } from './common';

export type CertificationType = 'PMKVY' | 'ITI' | 'NSDC' | 'Other';

export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export type AvailabilityStatus = 'available' | 'on_job' | 'offline' | 'on_leave';

export type EmploymentType = 'full_time' | 'part_time' | 'gig' | 'apprentice';

export interface Certification {
  type: CertificationType;
  level: number;
  cert_number: string;
  verified: boolean;
  issued_date?: Timestamp;
}

export interface Engineer {
  id: UUID;
  agency_id: UUID;

  // Personal Info
  name: string;
  phone: string;
  email?: string;
  photo_url?: string;

  // Certifications
  certifications: Certification[];
  skill_level: SkillLevel;
  specializations: string[];

  // Work Status
  availability_status: AvailabilityStatus;
  current_location?: PostGISPoint;
  last_location_update?: Timestamp;

  // Performance
  total_jobs_completed: number;
  average_rating: number;
  total_ratings: number;
  success_rate: number;

  // Employment
  employment_type: EmploymentType;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CreateEngineerInput {
  agency_id: UUID;
  name: string;
  phone: string;
  email?: string;
  photo_url?: string;
  certifications: Certification[];
  skill_level: SkillLevel;
  specializations: string[];
  employment_type: EmploymentType;
}

export interface UpdateEngineerInput {
  name?: string;
  phone?: string;
  email?: string;
  photo_url?: string;
  certifications?: Certification[];
  skill_level?: SkillLevel;
  specializations?: string[];
  availability_status?: AvailabilityStatus;
  current_location?: PostGISPoint;
  employment_type?: EmploymentType;
}

export interface EngineerPerformance {
  engineer_id: UUID;
  total_jobs_completed: number;
  success_rate: number;
  average_rating: number;
  total_ratings: number;
  jobs_this_month: number;
  revenue_generated: number;
}

export interface BulkEngineerUpload {
  success_count: number;
  error_count: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}
