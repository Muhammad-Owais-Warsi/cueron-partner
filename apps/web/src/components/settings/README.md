# Settings Components

This directory contains all settings-related UI components for the Cueron Partner Platform web application.

## Components

### AgencyProfileSettings
**Requirements: 1.1, 1.5**

Form for editing agency profile information including:
- Basic information (name, contact person, phone, email)
- Service areas management
- Bank account details (encrypted)
- Read-only agency information display

**Features:**
- Real-time form validation
- Encrypted bank account information handling
- Service area tags with add/remove functionality
- Success/error feedback
- Auto-reload after successful update

**Usage:**
```tsx
import { AgencyProfileSettings } from '@/components/settings';

<AgencyProfileSettings />
```

### UserManagementSettings
**Requirements: 1.1**

Interface for managing agency users and their roles:
- View all agency users
- Add new users with role assignment
- Edit user roles
- Remove users
- Role-based access control display

**User Roles:**
- **Admin**: Full access to all features and settings
- **Manager**: Can manage jobs, engineers, and view analytics
- **Viewer**: Read-only access to jobs and analytics

**Features:**
- User table with role badges
- Add user dialog with validation
- Role descriptions and permissions
- Status indicators (active/inactive)

**Usage:**
```tsx
import { UserManagementSettings } from '@/components/settings';

<UserManagementSettings />
```

### NotificationPreferencesSettings
**Requirements: 14.1**

Interface for managing notification preferences:
- Enable/disable notification channels (Push, Email, SMS)
- Configure notification types
- Granular control over notification categories

**Notification Channels:**
- Push Notifications (web dashboard)
- Email Notifications
- SMS Notifications (critical events)

**Notification Types:**
- Job Assigned
- Job Accepted
- Job Status Updates
- Job Completed
- Payment Received
- Payment Pending
- Engineer Added
- Agency Approved
- System Alerts

**Features:**
- Toggle switches for channels
- Checkboxes for notification types
- Descriptive labels for each option
- Success/error feedback
- Persistent preferences

**Usage:**
```tsx
import { NotificationPreferencesSettings } from '@/components/settings';

<NotificationPreferencesSettings />
```

### PaymentSettings
**Requirements: 11.1**

Interface for managing payment-related settings:
- Payment summary dashboard
- Recent payments table
- Payment method information
- Bank account reference
- Support contact information

**Features:**
- Payment summary cards (total, pending, completed)
- Recent payments table with status badges
- Currency formatting (INR)
- Date formatting
- Link to full payment history
- Link to update bank details

**Usage:**
```tsx
import { PaymentSettings } from '@/components/settings';

<PaymentSettings />
```

### IntegrationSettings
**Requirements: 1.1**

Interface for managing third-party integrations:
- View integration status
- Configure API keys (admin only)
- Webhook configuration
- API documentation links

**Integrations:**
- Google Maps (location services)
- Razorpay (payment processing)
- Firebase Cloud Messaging (push notifications)
- SMS Gateway (Twilio/MSG91)
- Sentry (error tracking)

**Features:**
- Integration status badges
- Last sync timestamps
- Webhook URL and secret management
- API documentation links
- Configuration dialogs

**Usage:**
```tsx
import { IntegrationSettings } from '@/components/settings';

<IntegrationSettings />
```

## Settings Page

The main settings page (`apps/web/src/app/dashboard/settings/page.tsx`) provides a tabbed interface for accessing all settings sections:

```tsx
import SettingsPage from '@/app/dashboard/settings/page';

// Tabs:
// - Agency Profile
// - User Management
// - Notifications
// - Payment Settings
// - Integrations
```

## Data Flow

### Agency Profile
1. Load agency data from `/api/agencies/{id}`
2. Populate form with existing data
3. Submit updates via PATCH `/api/agencies/{id}`
4. Reload data after successful update

### User Management
1. Load users from `/api/agencies/{id}/users` (TODO)
2. Add users via POST `/api/agencies/{id}/users` (TODO)
3. Update roles via PATCH `/api/agencies/{id}/users/{userId}` (TODO)
4. Remove users via DELETE `/api/agencies/{id}/users/{userId}` (TODO)

### Notification Preferences
1. Load preferences from `/api/notifications/preferences`
2. Update preferences via PUT `/api/notifications/preferences`

### Payment Settings
1. Load payment data from `/api/agencies/{id}/payments`
2. Calculate summary statistics
3. Display recent payments

### Integration Settings
1. Display integration status (managed at system level)
2. Provide webhook configuration
3. Link to API documentation

## Security Considerations

- Bank account numbers and PAN numbers are encrypted before storage (Requirement 1.5)
- Only admins can modify certain settings
- API keys are masked in the UI
- Webhook secrets are never displayed in full
- User management respects role-based access control

## Styling

All components use Tailwind CSS with consistent styling:
- Form inputs: `border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500`
- Buttons: `bg-blue-600 text-white rounded-lg hover:bg-blue-700`
- Cards: `border border-gray-200 rounded-lg p-4`
- Status badges: Color-coded based on status
- Success messages: `bg-green-50 border-green-200`
- Error messages: `bg-red-50 border-red-200`

## Future Enhancements

- [ ] Implement user management API endpoints
- [ ] Add email verification for new users
- [ ] Add two-factor authentication settings
- [ ] Add audit log for settings changes
- [ ] Add export settings functionality
- [ ] Add integration health monitoring
- [ ] Add webhook event logs
