// Application constants

export const APP_NAME = 'Cueron Partner Platform';

export const PHONE_OTP_LENGTH = 6;
export const PHONE_OTP_EXPIRY_MINUTES = 10;

export const LOCATION_UPDATE_INTERVAL_MS = 30000; // 30 seconds

export const MAX_FILE_SIZE_MB = 10;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY_MS = 1000;

export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;

export const SKILL_LEVELS = {
  1: 'Basic',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Expert',
  5: 'Master',
} as const;

export const JOB_STATUS_LABELS = {
  pending: 'Pending',
  assigned: 'Assigned',
  accepted: 'Accepted',
  travelling: 'Travelling',
  onsite: 'On Site',
  completed: 'Completed',
  cancelled: 'Cancelled',
} as const;

export const URGENCY_LABELS = {
  emergency: 'Emergency',
  urgent: 'Urgent',
  normal: 'Normal',
  scheduled: 'Scheduled',
} as const;

export const AVAILABILITY_STATUS_LABELS = {
  available: 'Available',
  on_job: 'On Job',
  offline: 'Offline',
  on_leave: 'On Leave',
} as const;
