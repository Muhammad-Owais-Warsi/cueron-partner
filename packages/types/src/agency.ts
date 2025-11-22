import type { UUID, Address, Timestamp } from './common';

export type AgencyType = 'ITI' | 'Training' | 'Service' | 'Vendor';

export type PartnershipTier = 'standard' | 'premium' | 'enterprise';

export type PartnershipModel = 'job_placement' | 'dedicated_resource' | 'training_placement';

export type AgencyStatus = 'pending_approval' | 'active' | 'suspended' | 'inactive';

export interface Agency {
  id: UUID;
  name: string;
  type: AgencyType;
  registration_number: string;
  gstn: string;
  nsdc_code?: string;

  // Contact
  contact_person: string;
  phone: string;
  email: string;

  // Location
  primary_location: Address;
  service_areas: string[];

  // Partnership
  partnership_tier: PartnershipTier;
  partnership_model: PartnershipModel;
  engineer_capacity: number;

  // Bank Details (encrypted in database)
  bank_account_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  pan_number?: string;

  // Status
  status: AgencyStatus;
  onboarded_at?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface AgencyMetrics {
  jobs_completed: number;
  revenue: number;
  avg_rating: number;
  engineers_utilized: number;
  success_rate: number;
}

export interface CreateAgencyInput {
  name: string;
  type: AgencyType;
  registration_number: string;
  gstn: string;
  nsdc_code?: string;
  contact_person: string;
  phone: string;
  email: string;
  primary_location: Address;
  service_areas: string[];
  partnership_tier: PartnershipTier;
  partnership_model: PartnershipModel;
  engineer_capacity: number;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  pan_number?: string;
}

export interface UpdateAgencyInput {
  name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  primary_location?: Address;
  service_areas?: string[];
  bank_account_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  pan_number?: string;
}
