# Implementation Plan

## Current Status Summary

**Completed Phases:**
- ✅ Phase 1: Project Setup and Infrastructure (Tasks 1-3)
- ✅ Phase 2: Core Data Models and Security (Tasks 4-7)
- ✅ Phase 3: Agency Management Features (Tasks 8-10)
- ✅ Phase 4: Engineer Management Features (Tasks 11-14)
- ✅ Phase 5: Job Management Core (Tasks 15-17)
- ✅ Phase 6: Job Status and Tracking (Tasks 18-19)
- ✅ Phase 7: Service Delivery and Completion (Tasks 21-23)
- ✅ Phase 8: Payment and Invoice Management (Tasks 24-26)
- ✅ Phase 9: Notification System (Tasks 27, 29)
- ✅ Phase 10: Reporting and Analytics (Task 31)
- ✅ Phase 11: Web Application UI - Authentication and Layout (Tasks 33-35)
- ✅ Phase 12: Web Application UI - Jobs and Team Management (Tasks 36-40)
- ✅ Phase 13: Mobile Application - Authentication and Navigation (Task 42-43)

**Remaining Work:**
- 🔄 Task 28: SMS notification system (not started)
- 🔄 Task 30: Report export functionality (not started)
- 🔄 Task 32: Checkpoint (pending)
- 🔄 Task 41: Mobile authentication screens (not started)
- 🔄 Phase 14: Mobile service delivery screens (Tasks 44-47)
- 🔄 Phase 15: Mobile profile and notifications (Tasks 48-50)
- 🔄 Phase 16-19: Testing, optimization, and deployment (Tasks 52-66)

**Key Missing Features:**
1. SMS notification system for OTP and critical alerts
2. Report export (CSV/PDF) functionality
3. Mobile authentication UI (currently placeholder)
4. Mobile job status update screens
5. Mobile service checklist and photo capture
6. Mobile job completion with signature
7. Mobile profile and performance screens
8. Push notification handling in mobile app
9. Comprehensive error handling and security hardening
10. Testing infrastructure (property-based tests, E2E tests)

## Phase 1: Project Setup and Infrastructure

- [x] 1. Initialize project structure and development environment





  - Create monorepo structure with web and mobile apps
  - Set up Next.js 14 web application with App Router and TypeScript
  - Set up React Native 0.72+ mobile application with TypeScript
  - Configure shared packages for types, utilities, and configurations
  - Set up package managers (pnpm) and workspace configuration
  - Configure ESLint, Prettier, and TypeScript strict mode
  - Set up Git repository with .gitignore and branch protection
  - _Requirements: All requirements (foundational)_

- [x] 2. Configure Supabase backend and database





  - Create Supabase project and configure environment variables
  - Set up PostgreSQL database with PostGIS extension
  - Create database schema for agencies, engineers, jobs, payments tables
  - Implement database indexes for performance optimization
  - Configure Row Level Security (RLS) policies for data isolation
  - Set up Supabase Auth with phone OTP provider
  - Configure Supabase Storage buckets for photos and documents
  - Set up Supabase Realtime channels for job updates
  - _Requirements: 1.1, 2.1, 3.1, 12.1, 13.3, 17.3_

- [x] 3. Set up third-party service integrations
  - Configure Google Maps API keys in environment variables
  - Set up Razorpay payment gateway credentials (already integrated in code)
  - Configure Twilio or MSG91 for SMS/OTP delivery
  - Configure Firebase Cloud Messaging credentials for push notifications
  - Configure Sentry DSN for error tracking and monitoring
  - Set up SendGrid or AWS SES for email notifications (optional)
  - _Requirements: 1.4, 12.1, 14.1, 19.1, 20.3_
  - _Note: Razorpay and FCM client code is implemented, only credentials needed_


## Phase 2: Core Data Models and Security
-

- [x] 4. Implement data models and TypeScript interfaces




  - Create TypeScript interfaces for Agency, Engineer, Job, Payment models
  - Implement Zod schemas for runtime validation
  - Create database migration files for all tables
  - Set up Prisma ORM (optional) for complex queries
  - Create database seed data for development and testing
  - _Requirements: 1.1, 2.1, 3.1, 11.1_

- [x] 5. Implement encryption and security utilities





  - Create AES-256-CBC encryption/decryption functions
  - Implement secure key management for encryption keys
  - Create utility functions for hashing sensitive data
  - Implement JWT token validation middleware
  - Create HTTPS enforcement utilities
  - _Requirements: 1.5, 11.5, 17.1, 17.2_

- [x] 5.1 Write property test for encryption


  - **Property 5: Bank detail encryption**
  - **Validates: Requirements 1.5**

- [x] 5.2 Write property test for sensitive data encryption


  - **Property 77: Sensitive data encryption**
  - **Validates: Requirements 17.1**
-

- [x] 6. Implement authentication system




  - Create Supabase Auth client configuration
  - Implement phone OTP sending functionality
  - Implement OTP verification and session creation
  - Create JWT token management utilities
  - Implement session persistence and refresh logic
  - Create authentication middleware for API routes
  - _Requirements: 12.1, 12.3, 12.4, 12.5_

- [x] 6.1 Write property test for OTP sending


  - **Property 53: OTP sending**
  - **Validates: Requirements 12.1**

- [x] 6.2 Write property test for OTP verification


  - **Property 54: OTP verification**
  - **Validates: Requirements 12.3**

- [x] 6.3 Write property test for session creation


  - **Property 55: Session creation**
  - **Validates: Requirements 12.4**

- [x] 6.4 Write property test for session persistence


  - **Property 56: Session persistence**
  - **Validates: Requirements 12.5**

- [x] 7. Implement authorization and role-based access control




  - Create role-based middleware for API routes
  - Implement RLS policy enforcement helpers
  - Create permission checking utilities
  - Implement agency data isolation logic
  - Create role verification functions (admin, manager, viewer)
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
- [x] 7.1 Write property test for role retrieval


  - **Property 57: Role retrieval on login**
  - **Validates: Requirements 13.1**

- [x] 7.2 Write property test for role-based access control


  - **Property 58: Role-based access control**
  - **Validates: Requirements 13.2**

- [x] 7.3 Write property test for RLS enforcement


  - **Property 59: Row Level Security enforcement**
  - **Validates: Requirements 13.3**

- [x] 7.4 Write property test for admin access


  - **Property 60: Admin full access**
  - **Validates: Requirements 13.4**

- [x] 7.5 Write property test for viewer restrictions


  - **Property 61: Viewer read-only restriction**
  - **Validates: Requirements 13.5**


## Phase 3: Agency Management Features
-

- [x] 8. Implement agency registration API




  - Create POST /api/agencies/register endpoint
  - Implement agency data validation with Zod
  - Implement GSTN uniqueness validation
  - Create agency record with pending_approval status
  - Implement bank detail encryption before storage
  - Send confirmation notification via SMS
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 8.1 Write property test for agency creation
  - **Property 1: Agency creation with pending status**
  - **Validates: Requirements 1.1**

- [ ]* 8.2 Write property test for GSTN uniqueness
  - **Property 2: GSTN uniqueness enforcement**
  - **Validates: Requirements 1.2**

- [ ]* 8.3 Write property test for NSDC code storage
  - **Property 3: NSDC code storage**
  - **Validates: Requirements 1.3**

- [ ]* 8.4 Write property test for registration notification
  - **Property 4: Registration notification**
  - **Validates: Requirements 1.4**

- [x] 9. Implement agency profile management





  - Create GET /api/agencies/{id} endpoint
  - Create PATCH /api/agencies/{id} endpoint
  - Implement agency profile update validation
  - Create agency settings update functionality
  - Implement service area management
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 10. Implement agency metrics and analytics API








  - Create GET /api/agencies/{id}/metrics endpoint
  - Implement monthly metrics calculation
  - Create materialized view refresh logic
  - Implement performance trend calculations
  - Create revenue aggregation queries
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 10.1 Write property test for analytics data isolation
  - **Property 47: Analytics data isolation**
  - **Validates: Requirements 10.5**

- [ ]* 10.2 Write property test for engineer metrics calculation
  - **Property 46: Engineer metrics calculation**
  - **Validates: Requirements 10.4**


## Phase 4: Engineer Management Features

- [x] 11. Implement engineer management APIs
  - Create GET /api/agencies/{id}/engineers endpoint
  - Create POST /api/agencies/{id}/engineers endpoint
  - Create PATCH /api/engineers/{id} endpoint
  - Implement engineer data validation
  - Implement phone number uniqueness validation
  - Set default availability status to 'available'
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 11.1 Write property test for engineer-agency linkage
  - **Property 6: Engineer-agency linkage**
  - **Validates: Requirements 2.1**

- [ ]* 11.2 Write property test for phone uniqueness
  - **Property 7: Engineer phone uniqueness**
  - **Validates: Requirements 2.2**

- [ ]* 11.3 Write property test for certification storage
  - **Property 8: Certification data completeness**
  - **Validates: Requirements 2.3**

- [ ]* 11.4 Write property test for default availability
  - **Property 9: Default availability status**
  - **Validates: Requirements 2.4**
- [x] 12. Implement bulk engineer upload









- [x] 12. Implement bulk engineer upload
  - Create POST /api/engineers/bulk-upload endpoint
  - Implement CSV file parsing and validation
  - Create batch engineer creation logic
  - Implement error reporting for invalid records
  - Create success/failure summary response
  - _Requirements: 2.5_

- [ ]* 12.1 Write property test for bulk creation
  - **Property 10: Bulk engineer creation**
  - **Validates: Requirements 2.5**


- [x] 13. Implement engineer location tracking



  - Create location update endpoint
  - Implement PostGIS POINT storage
  - Create periodic location update logic (30-second intervals)
  - Implement location timestamp recording
  - Create location persistence on status changes
  - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [ ]* 13.1 Write property test for periodic updates
  - **Property 39: Periodic location updates**
  - **Validates: Requirements 9.1**

- [ ]* 13.2 Write property test for PostGIS storage
  - **Property 40: PostGIS point storage**
  - **Validates: Requirements 9.2**

- [ ]* 13.3 Write property test for location timestamp
  - **Property 42: Location timestamp recording**
  - **Validates: Requirements 9.4**

- [ ]* 13.4 Write property test for offline persistence
  - **Property 43: Offline location persistence**
  - **Validates: Requirements 9.5**
-

- [x] 14. Implement engineer performance tracking




  - Create GET /api/engineers/{id}/performance endpoint
  - Implement success rate calculation logic
  - Create job completion tracking
  - Implement rating aggregation
  - Create performance history queries
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ]* 14.1 Write property test for success rate calculation
  - **Property 68: Success rate calculation**
  - **Validates: Requirements 15.2**


## Phase 5: Job Management Core

- [x] 15. Implement job listing and filtering APIs




  - Create GET /api/agencies/{id}/jobs endpoint
  - Implement status filtering logic
  - Implement date range filtering
  - Implement location-based filtering with PostGIS
  - Implement multi-filter combination (AND logic)
  - Implement job sorting by urgency and scheduled time
  - _Requirements: 3.1, 3.2, 3.3, 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ]* 15.1 Write property test for agency job isolation
  - **Property 11: Agency job isolation**
  - **Validates: Requirements 3.1**

- [ ]* 15.2 Write property test for job list sorting
  - **Property 13: Job list sorting**
  - **Validates: Requirements 3.3**

- [ ]* 15.3 Write property test for filter criteria matching
  - **Property 82: Filter criteria matching**
  - **Validates: Requirements 18.1**

- [ ]* 15.4 Write property test for status filter
  - **Property 83: Status filter accuracy**
  - **Validates: Requirements 18.2**

- [ ]* 15.5 Write property test for date range filter
  - **Property 84: Date range filter accuracy**
  - **Validates: Requirements 18.3**

- [ ]* 15.6 Write property test for spatial filter
  - **Property 85: Spatial filter accuracy**
  - **Validates: Requirements 18.4**

- [ ]* 15.7 Write property test for multi-filter combination
  - **Property 86: Multi-filter combination**
  - **Validates: Requirements 18.5**

- [x] 16. Implement job detail and distance calculation





  - Create GET /api/jobs/{id} endpoint
  - Implement job detail completeness validation
  - Integrate Google Maps Distance Matrix API
  - Implement distance calculation from engineers
  - Create skill requirement highlighting logic
  - _Requirements: 3.2, 3.4, 3.5_

- [ ]* 16.1 Write property test for job detail completeness
  - **Property 12: Job detail completeness**
  - **Validates: Requirements 3.2**

- [ ]* 16.2 Write property test for distance calculation
  - **Property 15: Distance calculation accuracy**
  - **Validates: Requirements 3.5**
-

- [x] 17. Implement job assignment functionality




  - Create POST /api/jobs/{id}/assign endpoint
  - Implement engineer availability validation
  - Update job status to 'assigned' with timestamp
  - Update engineer availability to 'on_job'
  - Send push notification to assigned engineer
  - Prevent double assignment of busy engineers
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 17.1 Write property test for availability validation
  - **Property 16: Assignment availability validation**
  - **Validates: Requirements 4.1**

- [ ]* 17.2 Write property test for assignment status update
  - **Property 17: Assignment status update**
  - **Validates: Requirements 4.2**

- [ ]* 17.3 Write property test for engineer status change
  - **Property 18: Engineer status on assignment**
  - **Validates: Requirements 4.3**

- [ ]* 17.4 Write property test for assignment notification
  - **Property 19: Assignment notification**
  - **Validates: Requirements 4.4**

- [ ]* 17.5 Write property test for double assignment prevention
  - **Property 20: Prevent double assignment**
  - **Validates: Requirements 4.5**


## Phase 6: Job Status and Tracking
-

- [x] 18. Implement job status management




  - Create PATCH /api/jobs/{id}/status endpoint
  - Implement status history recording with location
  - Create status transition validation logic
  - Implement timestamp recording for each status
  - Create Supabase Realtime broadcast for status changes
  - _Requirements: 6.1, 6.3, 6.4_

- [ ]* 18.1 Write property test for status history recording
  - **Property 25: Status history recording**
  - **Validates: Requirements 6.1**

- [ ]* 18.2 Write property test for onsite timestamp
  - **Property 27: Onsite arrival timestamp**
  - **Validates: Requirements 6.3**

- [ ]* 18.3 Write property test for real-time broadcast
  - **Property 28: Real-time status broadcast**

  - **Validates: Requirements 6.4**

- [x] 19. Implement real-time job tracking




  - Set up Supabase Realtime channels for jobs
  - Implement location tracking activation on 'travelling' status
  - Create real-time location update broadcasting
  - Implement subscription management for web clients
  - Create real-time notification delivery system
  - _Requirements: 6.2, 6.4, 14.2, 14.3_

- [ ]* 19.1 Write property test for location tracking activation
  - **Property 26: Location tracking activation**
  - **Validates: Requirements 6.2**

- [ ]* 19.2 Write property test for status update broadcast
  - **Property 63: Status update broadcast**
  - **Validates: Requirements 14.2**

- [ ]* 19.3 Write property test for subscription delivery
  - **Property 64: Real-time subscription delivery**
  - **Validates: Requirements 14.3**

- [x] 20. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


## Phase 7: Service Delivery and Completion
-

- [x] 21. Implement service checklist management




  - Create checklist display logic
  - Implement checklist item completion tracking
  - Create checklist persistence to job record
  - Implement completion validation logic
  - Create UI enablement based on checklist status
  - _Requirements: 7.1, 7.2, 7.5, 8.1_

- [ ]* 21.1 Write property test for checklist display
  - **Property 30: Checklist display completeness**
  - **Validates: Requirements 7.1**

- [ ]* 21.2 Write property test for checklist persistence
  - **Property 31: Checklist completion persistence**
  - **Validates: Requirements 7.2**

- [ ]* 21.3 Write property test for completion enablement
  - **Property 34: Completion enablement**
  - **Validates: Requirements 7.5**

- [ ]* 21.4 Write property test for completion validation
  - **Property 35: Completion checklist validation**
  - **Validates: Requirements 8.1**
-

- [x] 22. Implement photo capture and upload




  - Set up Supabase Storage bucket configuration
  - Create photo upload endpoint
  - Implement before photo upload and URL storage
  - Implement after photo upload and association
  - Create file type and size validation
  - Implement upload retry mechanism
  - _Requirements: 7.3, 7.4, 17.4, 20.4_

- [ ]* 22.1 Write property test for before photo upload
  - **Property 32: Before photo upload**
  - **Validates: Requirements 7.3**

- [ ]* 22.2 Write property test for after photo association
  - **Property 33: After photo association**
  - **Validates: Requirements 7.4**

- [ ]* 22.3 Write property test for file upload validation
  - **Property 80: File upload validation**
  - **Validates: Requirements 17.4**

- [ ]* 22.4 Write property test for upload retry
  - **Property 93: Upload retry availability**
  - **Validates: Requirements 20.4**
-

- [x] 23. Implement job completion workflow




  - Create POST /api/jobs/{id}/complete endpoint
  - Implement signature capture and upload
  - Update job status to 'completed' with timestamp
  - Update engineer availability to 'available'
  - Create automatic payment record generation
  - _Requirements: 8.2, 8.3, 8.4, 8.5, 11.2_

- [ ]* 23.1 Write property test for signature upload
  - **Property 36: Signature upload**
  - **Validates: Requirements 8.3**

- [ ]* 23.2 Write property test for completion status update
  - **Property 37: Job completion status update**
  - **Validates: Requirements 8.4**

- [ ]* 23.3 Write property test for availability restoration
  - **Property 38: Engineer availability restoration**
  - **Validates: Requirements 8.5**

- [ ]* 23.4 Write property test for automatic payment creation
  - **Property 49: Automatic payment creation**
  - **Validates: Requirements 11.2**


## Phase 8: Payment and Invoice Management
-

- [x] 24. Implement payment management APIs






  - Create GET /api/agencies/{id}/payments endpoint
  - Implement payment list isolation by agency
  - Create payment status update logic
  - Implement payment timestamp recording
  - Create Razorpay integration for payment processing
  - _Requirements: 11.1, 11.3_

- [ ]* 24.1 Write property test for payment list isolation
  - **Property 48: Payment list isolation**
  - **Validates: Requirements 11.1**

- [ ]* 24.2 Write property test for payment processing
  - **Property 50: Payment processing update**
  - **Validates: Requirements 11.3**

- [ ]* 24.3 Write property test for payment encryption
  - **Property 52: Payment detail encryption**
  - **Validates: Requirements 11.5**
-

- [x] 25. Implement invoice generation




  - Create POST /api/payments/create-invoice endpoint
  - Implement unique invoice number generation
  - Create PDF invoice generation with branding
  - Store invoice URL in payment record
  - Implement invoice email delivery
  - _Requirements: 11.4_

- [ ]* 25.1 Write property test for invoice uniqueness
  - **Property 51: Invoice uniqueness**
  - **Validates: Requirements 11.4**
-

- [x] 26. Implement Razorpay payment gateway integration




  - Create payment order creation endpoint
  - Implement Razorpay checkout integration
  - Create payment webhook handler
  - Implement payment verification logic
  - Create payment failure handling
  - _Requirements: 11.3_


## Phase 9: Notification System
-

- [x] 27. Implement push notification infrastructure




  - Set up Firebase Cloud Messaging configuration
  - Create FCM token registration endpoint
  - Implement device token storage
  - Create push notification sending utility
  - Implement notification content formatting
  - _Requirements: 14.1, 14.5_

- [ ]* 27.1 Write property test for job assignment notification
  - **Property 62: Job assignment notification**
  - **Validates: Requirements 14.1**

- [ ]* 27.2 Write property test for notification content
  - **Property 66: Notification content completeness**
  - **Validates: Requirements 14.5**

- [ ] 28. Implement SMS notification system
  - Configure Twilio or MSG91 API credentials in environment variables
  - Create SMS sending utility function in packages/utils
  - Implement critical event detection logic (emergency jobs, cancellations)
  - Create SMS notification for emergencies and critical events
  - Implement SMS delivery tracking and error handling
  - Integrate SMS with OTP delivery for authentication
  - _Requirements: 1.4, 12.2, 14.4_
  - _Note: This is required for OTP delivery and critical notifications_

- [ ]* 28.1 Write property test for critical event SMS
  - **Property 65: Critical event SMS**
  - **Validates: Requirements 14.4**
-

- [x] 29. Implement in-app notification system




  - Create notification storage table
  - Implement notification creation logic
  - Create notification list endpoint
  - Implement read/unread status tracking
  - Create notification preferences management
  - _Requirements: 14.1, 14.2, 14.3_


## Phase 10: Reporting and Analytics

- [ ] 30. Implement report export functionality
  - Create GET /api/agencies/{id}/reports/export endpoint with format parameter (csv or pdf)
  - Install and configure CSV generation library (e.g., papaparse, csv-writer)
  - Implement CSV export with proper headers and data formatting
  - Install and configure PDF generation library (e.g., pdfkit, jsPDF, or @react-pdf/renderer)
  - Implement PDF export with agency branding (logo, colors, header/footer)
  - Create monthly report content generation from analytics data
  - Implement export delivery via download link (email optional)
  - Add proper error handling for export failures
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_
  - _Note: Analytics data is available via existing endpoints, needs export implementation_

- [ ]* 30.1 Write property test for report format generation
  - **Property 72: Report format generation**
  - **Validates: Requirements 16.1**

- [ ]* 30.2 Write property test for CSV format
  - **Property 73: CSV format correctness**
  - **Validates: Requirements 16.2**

- [ ]* 30.3 Write property test for PDF branding
  - **Property 74: PDF branding**
  - **Validates: Requirements 16.3**

- [ ]* 30.4 Write property test for monthly report content
  - **Property 75: Monthly report completeness**
  - **Validates: Requirements 16.4**

- [ ]* 30.5 Write property test for export delivery
  - **Property 76: Export delivery**
  - **Validates: Requirements 16.5**
-

- [x] 31. Implement analytics dashboard data




  - Create GET /api/agencies/{id}/analytics endpoint
  - Implement jobs completed aggregation
  - Create revenue calculation logic
  - Implement rating aggregation
  - Create trend analysis calculations
  - Generate chart data for visualizations
  - _Requirements: 10.1, 10.3, 10.4_

- [ ]* 31.1 Write property test for dashboard completeness
  - **Property 44: Analytics dashboard completeness**
  - **Validates: Requirements 10.1**

- [ ]* 31.2 Write property test for chart presence
  - **Property 45: Performance chart presence**
  - **Validates: Requirements 10.3**

- [ ] 32. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.


## Phase 11: Web Application UI - Authentication and Layout

- [x] 33. Implement web authentication UI





  - Create login page with email input (supabase)
  - Implement OTP input component
  - Create authentication form validation
  - Implement loading states and error handling
  - Create session management hooks
  - Implement protected route wrapper
  - _Requirements: 12.1, 12.3, 12.4_

- [x] 34. Create web application layout and navigation





  - Implement dashboard layout with sidebar
  - Create navigation menu with role-based visibility
  - Implement header with user profile dropdown
  - Create responsive mobile navigation
  - Implement breadcrumb navigation
  - _Requirements: 13.4, 13.5_

- [x] 35. Implement web dashboard components




  - Create dashboard overview cards
  - Implement quick action buttons
  - Create recent activity feed with real-time updates
  - Implement performance charts using Recharts
  - Create loading skeletons for async data
  - _Requirements: 10.1, 10.3_


## Phase 12: Web Application UI - Jobs and Team Management

- [x] 36. Implement jobs list and filtering UI





  - Create jobs list page with table view
  - Implement status filter dropdown
  - Create date range picker for filtering
  - Implement location filter with map
  - Create search and filter combination logic
  - Implement pagination and sorting controls
  - _Requirements: 3.1, 3.3, 18.1, 18.2, 18.3, 18.4_
-

- [x] 37. Implement job detail and assignment UI




  - Create job detail page with all information
  - Implement embedded map with location markers
  - Create engineer selection dropdown with availability
  - Implement distance display from engineers
  - Create job assignment confirmation dialog
  - Implement real-time status updates display
  - _Requirements: 3.2, 3.4, 3.5, 4.1, 4.2, 6.4_

- [x] 38. Implement team management UI




  - Create engineers list page with table
  - Implement add engineer form with validation
  - Create engineer profile page
  - Implement bulk upload CSV interface
  - Create team map view with real-time locations
  - Implement engineer availability toggle
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 9.3_

- [x] 39. Implement analytics and reports UI





  - Create analytics dashboard with charts
  - Implement performance metrics display
  - Create engineer performance comparison view
  - Implement report export interface
  - Create monthly report preview
  - _Requirements: 10.1, 10.3, 10.4, 16.1, 16.4_

- [x] 40. Implement settings and profile UI




  - Create agency profile edit form
  - Implement user management interface
  - Create notification preferences page
  - Implement payment settings page
  - Create integration settings interface
  - _Requirements: 1.1, 1.5, 11.1, 14.1_


## Phase 13: Mobile Application - Authentication and Navigation

- [ ] 41. Implement mobile authentication screens
  - Replace placeholder LoginScreen with phone number input UI
  - Implement OTP sending via Supabase Auth
  - Create OTP input component with 6-digit verification
  - Implement OTP verification and session creation
  - Add biometric authentication (fingerprint/Face ID) for quick access using react-native-biometrics
  - Implement session persistence using @react-native-async-storage/async-storage
  - Create splash screen with authentication state check
  - Handle authentication errors gracefully
  - _Requirements: 12.1, 12.3, 12.4, 12.5_
  - _Note: Supabase Auth is configured, needs mobile UI implementation_

- [x] 42. Create mobile navigation structure





  - Set up React Navigation with tab navigator
  - Create bottom tab navigation
  - Implement stack navigation for screens
  - Create custom header components
  - Implement deep linking for notifications
  - _Requirements: 5.1, 5.2_

- [ ]* 42.1 Write property test for notification navigation
  - **Property 21: Job notification navigation**
  - **Validates: Requirements 5.2**


## Phase 14: Mobile Application - Jobs and Service Delivery

- [x] 43. Implement mobile jobs list and detail screens
  - Replace mock data in JobsListScreen with real API calls to fetch assigned jobs
  - Implement job sorting by scheduled_time in ascending order
  - Enhance JobDetailScreen with complete job information (client, equipment, location)
  - Integrate react-native-maps to display job location on embedded map
  - Add navigation button to launch device maps app (Google Maps/Apple Maps)
  - Implement job acceptance functionality with status update to 'accepted'
  - Add pull-to-refresh and loading states
  - _Requirements: 5.2, 5.3, 5.4, 5.5, 19.1, 19.3, 19.4_
  - _Note: Implemented with real API integration and map functionality_

- [ ]* 43.1 Write property test for navigation options
  - **Property 22: Navigation options presence**
  - **Validates: Requirements 5.3**

- [ ]* 43.2 Write property test for jobs sorting
  - **Property 23: Assigned jobs sorting**
  - **Validates: Requirements 5.4**

- [ ]* 43.3 Write property test for job acceptance
  - **Property 24: Job acceptance status update**
  - **Validates: Requirements 5.5**

- [ ]* 43.4 Write property test for map display
  - **Property 87: Map display in job details**
  - **Validates: Requirements 19.1**

- [ ]* 43.5 Write property test for navigation launch
  - **Property 88: Navigation app launch**
  - **Validates: Requirements 19.3**

- [ ]* 43.6 Write property test for dual location display
  - **Property 89: Dual location display**
  - **Validates: Requirements 19.4**

- [x] 44. Implement job status update screens




  - Create JobStatusScreen component in apps/mobile/src/screens/jobs/
  - Add JobStatusScreen to JobsStackNavigator navigation
  - Implement status update buttons (travelling, onsite, completed)
  - Implement status change confirmation dialogs
  - Activate location tracking when status changes to 'travelling'
  - Install and configure @react-native-community/geolocation or react-native-geolocation-service
  - Implement background location tracking with proper permissions
  - Create status timeline display showing job progress
  - Send location updates to API every 30 seconds
  - Handle location permission requests (iOS and Android)
  - _Requirements: 6.1, 6.2, 6.3, 6.5_
  - _Note: Status update API exists, needs mobile UI_

- [ ]* 44.1 Write property test for onsite feature enablement
  - **Property 29: Onsite feature enablement**
  - **Validates: Requirements 6.5**

- [x] 45. Implement service checklist screen



  - Create ServiceChecklistScreen component in apps/mobile/src/screens/jobs/
  - Add ServiceChecklistScreen to JobsStackNavigator navigation
  - Implement interactive checklist items with checkbox toggling
  - Create parts used input form with name, quantity, and cost fields
  - Implement engineer notes text area for service observations
  - Add completion validation (all mandatory items must be checked)
  - Save checklist state to API using PATCH /api/jobs/{id}/checklist
  - Show completion progress indicator
  - Handle offline state with local storage
  - _Requirements: 7.1, 7.2, 7.5, 8.1_
  - _Note: Checklist API exists, needs mobile UI_

- [x] 46. Implement photo capture functionality



  - Install and configure react-native-image-picker or expo-image-picker
  - Create PhotoCaptureScreen component in apps/mobile/src/screens/jobs/
  - Add PhotoCaptureScreen to JobsStackNavigator navigation
  - Implement camera access for before photos
  - Implement camera access for after photos
  - Add photo preview with retake option
  - Upload photos to Supabase Storage using POST /api/jobs/{id}/photos
  - Show upload progress indicator
  - Handle camera permissions (iOS and Android)
  - Handle errors gracefully with retry option
  - Support both camera and gallery selection
  - _Requirements: 7.3, 7.4_
  - _Note: Photo upload API exists, needs mobile camera integration_

- [x] 47. Implement job completion screen



  - Install and configure react-native-signature-canvas or @react-native-community/signature-pad
  - Create JobCompletionScreen component in apps/mobile/src/screens/jobs/
  - Add JobCompletionScreen to JobsStackNavigator navigation
  - Implement signature capture canvas with clear and save options
  - Display completion summary (checklist status, photos, parts used)
  - Add completion confirmation dialog
  - Validate all requirements (checklist complete, photos uploaded, signature captured)
  - Upload signature to Supabase Storage
  - Call POST /api/jobs/{id}/complete with all completion data
  - Show success feedback screen with job summary
  - Handle completion errors with retry option
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  - _Note: Job completion API exists, needs mobile UI_


## Phase 15: Mobile Application - Profile and Notifications

- [x] 48. Implement engineer profile screen



  - Replace placeholder ProfileScreen with real engineer data from GET /api/engineers/{id}
  - Fetch performance data from GET /api/engineers/{id}/performance
  - Display profile photo, name, and contact information
  - Show performance metrics cards (jobs completed, average rating, success rate)
  - Create job history list with completion dates and ratings
  - Display certifications with type, level, and verification status
  - Add availability status toggle (available/offline/on_leave)
  - Implement profile photo upload functionality
  - Add pull-to-refresh for updated metrics
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  - _Note: Engineer performance API exists, needs mobile UI_

- [ ]* 48.1 Write property test for profile metrics
  - **Property 67: Profile metrics display**
  - **Validates: Requirements 15.1**

- [ ]* 48.2 Write property test for job history
  - **Property 69: Job history completeness**
  - **Validates: Requirements 15.3**

- [ ]* 48.3 Write property test for feedback display
  - **Property 70: Feedback display**
  - **Validates: Requirements 15.4**

- [ ]* 48.4 Write property test for certification display
  - **Property 71: Certification display completeness**
  - **Validates: Requirements 15.5**

- [x] 49. Implement push notification handling



  - Install and configure @react-native-firebase/app and @react-native-firebase/messaging
  - Configure Firebase project for iOS and Android
  - Request notification permissions on app launch
  - Register FCM token with POST /api/fcm/register endpoint
  - Implement foreground notification display with local notifications
  - Handle background and quit state notifications
  - Implement notification tap navigation to relevant screens (job detail, etc.)
  - Update FCM token on refresh and app restart
  - Handle notification payload parsing
  - Test notifications on both iOS and Android
  - _Requirements: 5.1, 14.1, 14.5_
  - _Note: FCM registration API exists, needs mobile integration_

- [x] 50. Implement notifications list screen



  - Replace placeholder NotificationsListScreen with real notification data
  - Fetch notifications from GET /api/notifications endpoint
  - Display notification cards with icons based on type
  - Show read/unread status indicators
  - Implement mark as read using PATCH /api/notifications/{id}/read
  - Add mark all as read functionality
  - Add notification action buttons (view job, dismiss)
  - Implement pull-to-refresh
  - Add empty state when no notifications
  - Implement notification filtering (all, unread, job-related)
  - _Requirements: 14.1, 14.5_
  - _Note: Notifications API exists, needs mobile UI enhancement_

- [x] 51. Checkpoint - Ensure mobile app builds and runs



  - Ensure all mobile screens are implemented and functional
  - Test navigation flows between screens
  - Verify API integrations work correctly
  - Test on both iOS and Android devices/simulators
  - Ask the user if questions arise.


## Phase 16: Error Handling and Security Hardening

- [x] 52. Implement comprehensive error handling



  - Create error boundary components for React (web and mobile)
  - Implement network error retry logic with exponential backoff
  - Create user-friendly error messages for common error scenarios
  - Configure and implement error logging to Sentry
  - Create graceful degradation for offline mode in mobile app
  - Add error toast notifications
  - _Requirements: 20.1, 20.2, 20.3, 20.5_

- [ ]* 52.1 Write property test for network error messaging
  - **Property 90: Network error messaging**
  - **Validates: Requirements 20.1**

- [ ]* 52.2 Write property test for request retry
  - **Property 91: Request retry logic**
  - **Validates: Requirements 20.2**

- [ ]* 52.3 Write property test for timeout logging
  - **Property 92: Timeout error logging**
  - **Validates: Requirements 20.3**

- [ ]* 52.4 Write property test for critical error reporting
  - **Property 94: Critical error reporting**
  - **Validates: Requirements 20.5**

- [x] 53. Implement security hardening measures



  - Enhance JWT token validation middleware (already exists, add rate limiting)
  - Implement HTTPS enforcement in production
  - Add rate limiting for API endpoints using middleware
  - Configure CORS properly for production domains
  - Create input sanitization utilities for user inputs
  - Verify SQL injection prevention via Supabase parameterized queries
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_
  - _Note: Basic security is implemented, needs hardening_

- [ ]* 53.1 Write property test for JWT validation
  - **Property 78: JWT validation**
  - **Validates: Requirements 17.2**

- [ ]* 53.2 Write property test for RLS enforcement
  - **Property 79: RLS policy enforcement**
  - **Validates: Requirements 17.3**

- [ ]* 53.3 Write property test for session expiration
  - **Property 81: Session expiration handling**
  - **Validates: Requirements 17.5**

- [x] 54. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.


## Phase 17: Testing and Quality Assurance

- [ ]* 55. Set up testing infrastructure
  - Configure Jest and React Testing Library (already configured)
  - Install and configure fast-check for property-based testing
  - Configure Playwright for web E2E testing
  - Set up Detox for mobile E2E testing
  - Enhance test data factories in packages/utils
  - Configure test coverage reporting with thresholds
  - _Requirements: All requirements (testing foundation)_
  - _Note: Jest is configured, needs PBT and E2E setup_

- [ ]* 56. Write integration tests for critical workflows
  - Write integration test for agency registration flow
  - Write integration test for engineer assignment workflow
  - Write integration test for job completion workflow
  - Write integration test for payment processing
  - Write integration test for real-time updates
  - _Requirements: 1.1, 4.1, 8.4, 11.3, 14.2_

- [ ]* 57. Write E2E tests for web application
  - Write E2E test for login and authentication
  - Write E2E test for job assignment workflow
  - Write E2E test for team management
  - Write E2E test for analytics dashboard
  - Write E2E test for report export
  - _Requirements: 12.1, 4.1, 2.1, 10.1, 16.1_

- [ ]* 58. Write E2E tests for mobile application
  - Write E2E test for mobile login
  - Write E2E test for job acceptance and status updates
  - Write E2E test for service checklist completion
  - Write E2E test for photo capture and upload
  - Write E2E test for job completion with signature
  - _Requirements: 12.1, 5.5, 7.1, 7.3, 8.3_

- [ ]* 59. Perform security testing
  - Test authentication bypass attempts
  - Test authorization and role escalation
  - Test SQL injection vulnerabilities
  - Test XSS vulnerabilities
  - Test file upload exploits
  - Verify data encryption at rest
  - _Requirements: 17.1, 17.2, 17.3, 17.4_


## Phase 18: Performance Optimization and Monitoring

- [ ]* 60. Implement performance optimizations
  - Review and optimize database queries with proper indexes (already done)
  - Implement query result caching with React Query/TanStack Query
  - Create code splitting for web application routes
  - Implement lazy loading for images and heavy components
  - Optimize mobile app bundle size
  - Verify database connection pooling in Supabase
  - _Requirements: All requirements (performance)_
  - _Note: Database indexes exist, needs client-side optimization_

- [ ]* 61. Set up monitoring and observability
  - Configure Sentry error tracking with DSN
  - Set up performance monitoring in Sentry
  - Create custom dashboards for key metrics
  - Implement uptime monitoring (e.g., UptimeRobot, Pingdom)
  - Set up alerting for critical errors via Sentry
  - Configure structured logging
  - _Requirements: 20.3, 20.5_

- [ ]* 62. Implement analytics tracking
  - Set up Google Analytics 4 for web application
  - Implement event tracking for key actions (job assignment, completion, etc.)
  - Create user behavior funnels
  - Track job completion rates
  - Monitor API performance metrics
  - _Requirements: 10.1, 10.4_


## Phase 19: Deployment and DevOps

- [ ]* 63. Set up CI/CD pipeline
  - Enhance existing GitHub Actions workflow for web deployment
  - Create GitHub Actions workflow for mobile builds (iOS and Android)
  - Add automated testing in CI pipeline (lint, test, build)
  - Configure environment-specific deployments (staging, production)
  - Set up preview deployments for pull requests
  - _Requirements: All requirements (deployment)_
  - _Note: Basic CI exists, needs enhancement_

- [ ]* 64. Deploy web application to production
  - Configure Vercel project and environment variables
  - Set up custom domain and SSL certificates
  - Deploy to production environment
  - Configure CDN and edge functions
  - Set up automated Supabase database backups
  - _Requirements: All requirements (web deployment)_

- [ ]* 65. Prepare mobile applications for release
  - Configure iOS app signing and provisioning profiles
  - Configure Android app signing with keystore
  - Create app store listings and screenshots
  - Submit iOS app to App Store Connect for review
  - Submit Android app to Google Play Console for review
  - _Requirements: All requirements (mobile deployment)_

- [ ]* 66. Set up production monitoring and maintenance
  - Configure production error tracking
  - Set up database performance monitoring
  - Create backup and disaster recovery procedures
  - Set up automated database migrations
  - Create runbook for common issues
  - _Requirements: 20.3, 20.5_

- [ ] 66. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

