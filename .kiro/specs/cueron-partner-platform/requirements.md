# Requirements Document

## Introduction

The Cueron Partner Agency Management Platform is a B2B mobile and web application system designed to connect training agencies, ITI centers, and service vendors with job opportunities from cold storage facilities and warehouse customers across India. The system facilitates partnership management, engineer deployment, job coordination, and business operations for India's first preventive HVAC and cold chain maintenance service network.

The platform consists of two primary applications:
1. **Agency/Admin Web Application** - For partner agencies to manage their engineer teams, view job assignments, track performance, and handle business operations
2. **Engineer Mobile Application** - For field engineers to receive job assignments, update job status, complete service checklists, and communicate with agencies

This is NOT a gig economy platform - it is a B2B service coordination system where agencies manage engineers on their payroll and coordinate with Cueron to fulfill service requests.

## Glossary

- **Agency**: A partner organization (ITI center, training institute, or service vendor) that manages HVAC engineers and receives job assignments from Cueron
- **Engineer**: A certified HVAC technician employed by an Agency who performs on-site service work
- **Client**: A cold storage facility or warehouse customer requiring HVAC maintenance services
- **Job**: A service request from a Client that requires engineer deployment (AMC, repair, installation, or emergency service)
- **System**: The complete Cueron Partner Agency Management Platform including web and mobile applications
- **Web Application**: The Next.js-based dashboard for agency administrators and managers
- **Mobile Application**: The React Native app used by field engineers
- **Supabase**: The PostgreSQL-based backend-as-a-service platform providing database, authentication, storage, and real-time features
- **Job Assignment**: The process of allocating a specific engineer to a job request
- **Service Checklist**: A structured list of tasks and verification items that engineers must complete during service delivery
- **Partnership Tier**: The classification of agency partnerships (standard, premium, enterprise) determining service terms
- **PMKVY**: Pradhan Mantri Kaushal Vikas Yojana - Government skill certification program
- **ITI**: Industrial Training Institute - Government vocational training centers
- **NSDC**: National Skill Development Corporation - Certification body
- **AMC**: Annual Maintenance Contract - Scheduled preventive maintenance service
- **Real-time Updates**: Live data synchronization using Supabase Realtime channels
- **Row Level Security (RLS)**: Database-level access control ensuring agencies only see their own data
- **FCM**: Firebase Cloud Messaging - Push notification service
- **OTP**: One-Time Password for phone-based authentication

## Requirements

### Requirement 1

**User Story:** As an agency administrator, I want to register my organization on the platform, so that I can become a Cueron partner and receive job opportunities.

#### Acceptance Criteria

1. WHEN an agency administrator submits registration information THEN the System SHALL create a new agency record with pending approval status
2. WHEN registration is submitted THEN the System SHALL validate that the GSTN is unique across all agencies
3. WHEN registration includes NSDC code THEN the System SHALL store the certification details for verification
4. WHEN registration is complete THEN the System SHALL send a confirmation notification to the registered phone number
5. WHERE an agency provides bank account details THEN the System SHALL encrypt the sensitive financial information before storage

### Requirement 2

**User Story:** As an agency manager, I want to add and manage my team of engineers, so that they can be assigned to jobs and tracked for performance.

#### Acceptance Criteria

1. WHEN an agency manager adds a new engineer THEN the System SHALL create an engineer profile linked to the agency
2. WHEN engineer details are entered THEN the System SHALL validate that the phone number is unique across all engineers
3. WHEN certification information is provided THEN the System SHALL store the certification type, level, and verification status
4. WHEN an engineer profile is created THEN the System SHALL set the availability status to available by default
5. WHEN bulk engineer data is uploaded THEN the System SHALL process the CSV file and create multiple engineer records

### Requirement 3

**User Story:** As an agency administrator, I want to view available job requests, so that I can assign appropriate engineers based on skills and location.

#### Acceptance Criteria

1. WHEN an agency views the jobs list THEN the System SHALL display only jobs assigned to that agency
2. WHEN displaying job details THEN the System SHALL show client information, location, equipment type, and required skill level
3. WHEN jobs are listed THEN the System SHALL sort them by urgency and scheduled time
4. WHEN a job requires specific skill level THEN the System SHALL highlight the requirement in the job details
5. WHEN job location is displayed THEN the System SHALL calculate and show distance from available engineers

### Requirement 4

**User Story:** As an agency manager, I want to assign engineers to jobs, so that service requests are fulfilled efficiently.

#### Acceptance Criteria

1. WHEN an agency manager assigns an engineer to a job THEN the System SHALL verify the engineer availability status is available
2. WHEN a job assignment is created THEN the System SHALL update the job status to assigned and record the assignment timestamp
3. WHEN an engineer is assigned THEN the System SHALL change the engineer availability status to on_job
4. WHEN assignment is complete THEN the System SHALL send a push notification to the assigned engineer
5. WHEN an engineer is already on a job THEN the System SHALL prevent assignment to additional jobs

### Requirement 5

**User Story:** As a field engineer, I want to receive job assignments on my mobile device, so that I know where to go and what service to perform.

#### Acceptance Criteria

1. WHEN a job is assigned to an engineer THEN the Mobile Application SHALL display a push notification with job details
2. WHEN an engineer opens a job notification THEN the Mobile Application SHALL show the complete job information including client location
3. WHEN job details are displayed THEN the Mobile Application SHALL provide navigation options to the service location
4. WHEN an engineer views assigned jobs THEN the Mobile Application SHALL show jobs sorted by scheduled time
5. WHEN an engineer accepts a job THEN the Mobile Application SHALL update the job status to accepted and record the timestamp

### Requirement 6

**User Story:** As a field engineer, I want to update job status as I progress through service delivery, so that the agency and client can track my progress.

#### Acceptance Criteria

1. WHEN an engineer changes job status THEN the System SHALL record the status change with timestamp and engineer location
2. WHEN status is updated to travelling THEN the System SHALL begin tracking engineer location in real-time
3. WHEN status changes to onsite THEN the System SHALL record the arrival time for service duration calculation
4. WHEN status updates occur THEN the System SHALL broadcast changes via Supabase Realtime to the Web Application
5. WHEN an engineer is onsite THEN the Mobile Application SHALL enable access to service checklist and photo capture

### Requirement 7

**User Story:** As a field engineer, I want to complete a service checklist and capture photos, so that I can document the work performed.

#### Acceptance Criteria

1. WHEN an engineer accesses the service checklist THEN the Mobile Application SHALL display all required verification items
2. WHEN checklist items are completed THEN the Mobile Application SHALL store the completion status in the job record
3. WHEN an engineer captures before photos THEN the Mobile Application SHALL upload images to Supabase Storage
4. WHEN an engineer captures after photos THEN the Mobile Application SHALL associate images with the job completion record
5. WHEN all checklist items are marked complete THEN the Mobile Application SHALL enable the job completion action

### Requirement 8

**User Story:** As a field engineer, I want to mark a job as complete with client signature, so that service delivery is formally confirmed.

#### Acceptance Criteria

1. WHEN an engineer completes a job THEN the Mobile Application SHALL require all mandatory checklist items to be completed
2. WHEN job completion is initiated THEN the Mobile Application SHALL prompt for client signature capture
3. WHEN signature is captured THEN the System SHALL upload the signature image to Supabase Storage
4. WHEN job is marked complete THEN the System SHALL update job status to completed and record completion timestamp
5. WHEN job completion is confirmed THEN the System SHALL update engineer availability status to available

### Requirement 9

**User Story:** As an agency administrator, I want to track engineer locations in real-time, so that I can monitor field operations and optimize assignments.

#### Acceptance Criteria

1. WHEN an engineer is on a job THEN the Mobile Application SHALL update location coordinates every 30 seconds
2. WHEN location updates are sent THEN the System SHALL store the coordinates as PostGIS POINT data type
3. WHEN an agency views the team map THEN the Web Application SHALL display current locations of all active engineers
4. WHEN location tracking is active THEN the System SHALL record the last location update timestamp
5. WHEN an engineer goes offline THEN the System SHALL retain the last known location for reference

### Requirement 10

**User Story:** As an agency administrator, I want to view performance analytics and metrics, so that I can assess business performance and identify improvement opportunities.

#### Acceptance Criteria

1. WHEN an agency accesses the analytics dashboard THEN the Web Application SHALL display jobs completed, revenue, and average ratings
2. WHEN viewing monthly metrics THEN the System SHALL query the agency_monthly_metrics materialized view
3. WHEN performance data is displayed THEN the Web Application SHALL show trends using charts and visualizations
4. WHEN engineer performance is reviewed THEN the System SHALL calculate success rate, average rating, and jobs completed
5. WHEN analytics are requested THEN the System SHALL filter data to show only the requesting agency information

### Requirement 11

**User Story:** As an agency administrator, I want to manage payment information and view invoices, so that I can track financial transactions with Cueron.

#### Acceptance Criteria

1. WHEN an agency views payments THEN the Web Application SHALL display all payment records associated with the agency
2. WHEN a job is completed THEN the System SHALL create a payment record with pending status
3. WHEN payment is processed THEN the System SHALL update payment status and record the payment timestamp
4. WHEN an invoice is generated THEN the System SHALL create a unique invoice number and store the invoice URL
5. WHEN payment details are stored THEN the System SHALL encrypt bank account information using AES-256-CBC encryption

### Requirement 12

**User Story:** As a field engineer, I want to authenticate using my phone number, so that I can securely access the mobile application.

#### Acceptance Criteria

1. WHEN an engineer enters a phone number THEN the Mobile Application SHALL send an OTP via Supabase Auth
2. WHEN OTP is sent THEN the System SHALL use Twilio or MSG91 as the SMS provider
3. WHEN an engineer enters the OTP THEN the Mobile Application SHALL verify the code with Supabase Auth
4. WHEN OTP verification succeeds THEN the System SHALL create a session with JWT token
5. WHEN authentication is complete THEN the Mobile Application SHALL store the session for subsequent requests

### Requirement 13

**User Story:** As an agency administrator, I want role-based access control for my team, so that different users have appropriate permissions.

#### Acceptance Criteria

1. WHEN an agency user logs in THEN the System SHALL retrieve the user role from the agency_users table
2. WHEN a user attempts to access a resource THEN the System SHALL verify the user role against required permissions
3. WHEN Row Level Security policies are applied THEN the System SHALL ensure agencies only query their own data
4. WHEN an admin role user accesses features THEN the System SHALL grant full access to agency management functions
5. WHEN a viewer role user accesses features THEN the System SHALL restrict access to read-only operations

### Requirement 14

**User Story:** As an agency manager, I want to receive real-time notifications about job updates, so that I can respond quickly to changes.

#### Acceptance Criteria

1. WHEN a new job is assigned to an agency THEN the System SHALL send a push notification to agency administrators
2. WHEN an engineer updates job status THEN the System SHALL broadcast the change via Supabase Realtime channel
3. WHEN the Web Application subscribes to job updates THEN the System SHALL deliver status changes in real-time
4. WHEN critical job events occur THEN the System SHALL send SMS notifications to designated agency contacts
5. WHEN notifications are sent THEN the System SHALL include relevant job details and action links

### Requirement 15

**User Story:** As a field engineer, I want to view my performance history and ratings, so that I can track my professional development.

#### Acceptance Criteria

1. WHEN an engineer accesses their profile THEN the Mobile Application SHALL display total jobs completed and average rating
2. WHEN performance metrics are calculated THEN the System SHALL compute success rate from completed versus cancelled jobs
3. WHEN job history is viewed THEN the Mobile Application SHALL show past jobs with completion dates and client ratings
4. WHEN client feedback is available THEN the Mobile Application SHALL display the feedback text with the rating
5. WHEN certifications are displayed THEN the Mobile Application SHALL show certification type, level, and verification status

### Requirement 16

**User Story:** As an agency administrator, I want to export reports in CSV and PDF formats, so that I can analyze data offline and share with stakeholders.

#### Acceptance Criteria

1. WHEN an agency requests a report export THEN the Web Application SHALL generate the report in the requested format
2. WHEN CSV export is selected THEN the System SHALL format data with proper headers and comma separation
3. WHEN PDF export is selected THEN the System SHALL generate a formatted document with agency branding
4. WHEN monthly reports are generated THEN the System SHALL include jobs completed, revenue, engineer utilization, and ratings
5. WHEN export is complete THEN the System SHALL provide a download link or send the report via email

### Requirement 17

**User Story:** As a system administrator, I want to ensure data security and privacy compliance, so that sensitive information is protected according to Fortune 500 standards.

#### Acceptance Criteria

1. WHEN sensitive data is stored THEN the System SHALL encrypt bank account numbers, PAN numbers, and IFSC codes
2. WHEN API requests are made THEN the System SHALL validate JWT tokens and enforce HTTPS connections
3. WHEN database queries execute THEN the System SHALL apply Row Level Security policies to restrict data access
4. WHEN file uploads occur THEN the System SHALL validate file types and enforce maximum file size limits
5. WHEN authentication sessions expire THEN the System SHALL require re-authentication before granting access

### Requirement 18

**User Story:** As an agency administrator, I want to search and filter jobs by status, date, and location, so that I can efficiently manage job assignments.

#### Acceptance Criteria

1. WHEN an agency applies job filters THEN the Web Application SHALL query jobs matching the specified criteria
2. WHEN filtering by status THEN the System SHALL return only jobs with the selected status values
3. WHEN filtering by date range THEN the System SHALL return jobs with scheduled times within the specified period
4. WHEN filtering by location THEN the System SHALL use PostGIS spatial queries to find jobs within the specified area
5. WHEN multiple filters are applied THEN the System SHALL combine criteria using AND logic

### Requirement 19

**User Story:** As a field engineer, I want to navigate to job locations using integrated maps, so that I can reach service sites efficiently.

#### Acceptance Criteria

1. WHEN an engineer views job details THEN the Mobile Application SHALL display the service location on an embedded map
2. WHEN the map is displayed THEN the Mobile Application SHALL use react-native-maps with Google Maps provider
3. WHEN an engineer requests directions THEN the Mobile Application SHALL open the device navigation app with destination coordinates
4. WHEN location is shown THEN the Mobile Application SHALL display the engineer current location and job site location
5. WHEN distance is calculated THEN the System SHALL use the Google Maps Distance Matrix API

### Requirement 20

**User Story:** As an agency administrator, I want the system to handle errors gracefully, so that temporary issues do not disrupt operations.

#### Acceptance Criteria

1. WHEN a network error occurs THEN the Web Application SHALL display a user-friendly error message
2. WHEN API requests fail THEN the System SHALL retry the request up to three times with exponential backoff
3. WHEN database queries timeout THEN the System SHALL log the error to Sentry and return a graceful error response
4. WHEN file uploads fail THEN the Mobile Application SHALL allow the user to retry the upload
5. WHEN critical errors occur THEN the System SHALL send error reports to the monitoring service with stack traces
