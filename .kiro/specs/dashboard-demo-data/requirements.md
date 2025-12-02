# Requirements Document

## Introduction

This feature enables the dashboard to display realistic demo/dummy data for mock users upon login. This allows users to explore the application's functionality and interface without needing to create real data, facilitating demos, testing, and onboarding experiences.

## Glossary

- **Dashboard**: The main interface displayed after user login showing agency metrics, earnings, jobs, and analytics
- **Demo Data**: Realistic but fictitious data generated for demonstration purposes
- **Mock User**: A user account specifically designated for demonstration or testing purposes
- **System**: The web application dashboard and its data presentation components
- **Data Generator**: A utility that creates realistic dummy data conforming to the application's data models
- **Seed Data**: Pre-generated demo data stored in the system for immediate display

## Requirements

### Requirement 1

**User Story:** As a demo user, I want to see realistic dashboard data immediately upon login, so that I can explore the application's features without manual data entry.

#### Acceptance Criteria

1. WHEN a mock user logs into the dashboard THEN the System SHALL display pre-generated demo data including earnings, jobs, engineers, and analytics
2. WHEN the dashboard loads demo data THEN the System SHALL populate all overview cards with realistic numeric values
3. WHEN demo data is displayed THEN the System SHALL include trend indicators showing positive and negative changes
4. WHEN charts are rendered with demo data THEN the System SHALL display realistic time-series data spanning multiple months
5. WHEN the user navigates between dashboard sections THEN the System SHALL maintain consistent demo data across all views

### Requirement 2

**User Story:** As a developer, I want a data generator utility that creates realistic demo data, so that the demo experience accurately represents production usage.

#### Acceptance Criteria

1. WHEN the data generator creates earnings data THEN the System SHALL produce daily, monthly, and yearly earnings with realistic values
2. WHEN the data generator creates job data THEN the System SHALL include varied job types, statuses, ratings, and completion dates
3. WHEN the data generator creates engineer data THEN the System SHALL include multiple engineers with varied performance metrics and availability statuses
4. WHEN the data generator creates analytics data THEN the System SHALL produce chart-ready data structures matching the production data format
5. WHEN generating time-series data THEN the System SHALL create data points spanning the requested time period with realistic temporal patterns

### Requirement 3

**User Story:** As a system administrator, I want to identify mock users automatically, so that the system can serve demo data without manual configuration.

#### Acceptance Criteria

1. WHEN a user account is created as a mock user THEN the System SHALL store a flag indicating demo status in the user profile
2. WHEN the authentication system loads a user session THEN the System SHALL include the demo status flag in the session data
3. WHEN API endpoints receive requests from mock users THEN the System SHALL detect the demo status from the session
4. WHEN a mock user is identified THEN the System SHALL serve demo data instead of querying the production database
5. WHERE a user account has demo status enabled THEN the System SHALL prevent modifications to production data

### Requirement 4

**User Story:** As a product manager, I want demo data to be visually indistinguishable from real data, so that demonstrations are convincing and professional.

#### Acceptance Criteria

1. WHEN demo earnings are displayed THEN the System SHALL show values in the typical range for agency operations
2. WHEN demo job counts are displayed THEN the System SHALL show realistic numbers consistent with agency capacity
3. WHEN demo ratings are displayed THEN the System SHALL show values between 3.5 and 5.0 stars with appropriate distribution
4. WHEN demo engineer names are displayed THEN the System SHALL use realistic placeholder names
5. WHEN demo timestamps are displayed THEN the System SHALL use recent dates relative to the current date

### Requirement 5

**User Story:** As a developer, I want demo data generation to be deterministic, so that the same mock user sees consistent data across sessions.

#### Acceptance Criteria

1. WHEN a mock user logs in multiple times THEN the System SHALL display identical demo data in each session
2. WHEN generating demo data for a specific user THEN the System SHALL use the user ID as a seed for random generation
3. WHEN demo data includes random variations THEN the System SHALL produce the same variations for the same user ID
4. WHEN the system restarts THEN the System SHALL regenerate identical demo data for each mock user
5. WHEN multiple mock users exist THEN the System SHALL generate unique but consistent demo data for each user

### Requirement 6

**User Story:** As a QA engineer, I want to easily create and manage mock user accounts, so that I can test the demo data functionality.

#### Acceptance Criteria

1. WHEN creating a new user account THEN the System SHALL provide an option to mark the account as a mock user
2. WHEN a mock user flag is set THEN the System SHALL persist the flag in the database
3. WHEN viewing user account details THEN the System SHALL display the mock user status
4. WHEN an administrator updates a user account THEN the System SHALL allow toggling the mock user status
5. WHERE a user account is marked as a mock user THEN the System SHALL apply demo data behavior to all dashboard views
