import type { UUID, Address, Timestamp } from './common';
import { PaymentStatus } from './database';
import type { SkillLevel } from './engineer';

export type JobType = 'AMC' | 'Repair' | 'Installation' | 'Emergency';

export type JobUrgency = 'emergency' | 'urgent' | 'normal' | 'scheduled';

export type JobStatus =
  | 'pending'
  | 'assigned'
  | 'accepted'
  | 'travelling'
  | 'onsite'
  | 'completed'
  | 'cancelled';

export interface EquipmentDetails {
  brand?: string;
  model?: string;
  serial_number?: string;
  capacity?: string;
}

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

export interface Job {
  id: UUID;
  job_number: string;

  // Client
  client_id?: UUID;
  client_name: string;
  client_phone: string;

  // Job Details
  job_type: JobType;
  equipment_type: string;
  equipment_details?: EquipmentDetails;
  issue_description?: string;

  // Location
  site_location: Address;

  // Assignment
  assigned_agency_id?: UUID;
  assigned_engineer_id?: UUID;
  required_skill_level: SkillLevel;

  // Scheduling
  scheduled_time?: Timestamp;
  urgency: JobUrgency;
  response_deadline?: Timestamp;

  // Status & Timeline
  status: JobStatus;
  assigned_at?: Timestamp;
  accepted_at?: Timestamp;
  started_at?: Timestamp;
  completed_at?: Timestamp;

  // Financial
  service_fee?: number;
  payment_status: PaymentStatus;

  // Service Completion
  service_checklist?: ChecklistItem[];
  parts_used?: PartUsed[];
  photos_before?: string[];
  photos_after?: string[];
  engineer_notes?: string;
  client_signature_url?: string;

  // Rating
  client_rating?: 1 | 2 | 3 | 4 | 5;
  client_feedback?: string;

  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CreateJobInput {
  client_name: string;
  client_phone: string;
  job_type: JobType;
  equipment_type: string;
  equipment_details?: EquipmentDetails;
  issue_description?: string;
  site_location: Address;
  required_skill_level: SkillLevel;
  scheduled_time?: Timestamp;
  urgency: JobUrgency;
  service_fee?: number;
}

export interface UpdateJobInput {
  status?: JobStatus;
  assigned_engineer_id?: UUID;
  service_checklist?: ChecklistItem[];
  parts_used?: PartUsed[];
  photos_before?: string[];
  photos_after?: string[];
  engineer_notes?: string;
  client_signature_url?: string;
  client_rating?: 1 | 2 | 3 | 4 | 5;
  client_feedback?: string;
}

export interface JobFilters {
  status?: JobStatus[];
  urgency?: JobUrgency[];
  date_from?: Timestamp;
  date_to?: Timestamp;
  location?: {
    lat: number;
    lng: number;
    radius_km: number;
  };
}

export interface JobAssignment {
  job_id: UUID;
  engineer_id: UUID;
  assigned_by: UUID;
  assigned_at: Timestamp;
}

export interface JobStatusHistory {
  job_id: UUID;
  status: JobStatus;
  timestamp: Timestamp;
  location?: {
    lat: number;
    lng: number;
  };
  notes?: string;
}
