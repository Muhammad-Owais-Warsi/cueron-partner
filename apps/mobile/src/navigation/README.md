# Mobile Navigation Structure

This directory contains the complete navigation setup for the Cueron Engineer Mobile Application using React Navigation.

## Architecture

The navigation follows a hierarchical structure:

```
RootNavigator (Stack)
├── Auth Screen (Login)
└── Main (Tab Navigator)
    ├── JobsTab (Stack)
    │   ├── JobsList
    │   ├── JobDetail
    │   ├── JobStatus
    │   ├── ServiceChecklist
    │   ├── PhotoCapture
    │   └── JobCompletion
    ├── NotificationsTab (Stack)
    │   ├── NotificationsList
    │   └── NotificationDetail
    └── ProfileTab (Stack)
        ├── ProfileHome
        ├── JobHistory
        ├── PerformanceMetrics
        └── Settings
```

## Components

### RootNavigator
- Top-level navigator handling authentication flow
- Switches between Auth and Main screens based on authentication state
- Configured with deep linking support

### MainTabNavigator
- Bottom tab navigation with 3 tabs: Jobs, Notifications, Profile
- Custom tab bar icons with active/inactive states
- Badge support for unread notifications and pending jobs

### Stack Navigators
- **JobsStackNavigator**: Handles job-related screens and workflows
- **ProfileStackNavigator**: Manages profile and settings screens
- **NotificationsStackNavigator**: Handles notification screens

### Custom Components
- **CustomHeader**: Reusable header component with back button and actions
- **TabBarIcon**: Custom icon component for bottom tabs

## Deep Linking

Deep linking is configured to handle:
- Push notification navigation
- External URL navigation
- Universal links

### Supported URL Patterns

```
cueron://jobs/:jobId
cueron://jobs/:jobId/status
cueron://jobs/:jobId/checklist
cueron://notifications/:notificationId
```

### Usage

```typescript
// Navigate from notification
const route = parseNotificationToRoute(notification);
if (route) {
  navigation.navigate(route.screen, route.params);
}
```

## Type Safety

All navigation routes and parameters are fully typed using TypeScript:

```typescript
// Example: Navigate to job detail
navigation.navigate('JobDetail', { jobId: '123' });

// Type error: Missing required parameter
navigation.navigate('JobDetail'); // ❌ Error

// Type error: Invalid parameter
navigation.navigate('JobDetail', { id: '123' }); // ❌ Error
```

## Requirements Validation

### Requirement 5.1
✅ Push notifications navigate to job details
- Implemented via deep linking configuration
- `parseNotificationToRoute` function handles notification data

### Requirement 5.2
✅ Job notification opens complete job information
- Deep links navigate to JobDetail screen
- JobDetail screen displays all job information

## Future Implementation

The following screens are placeholders and will be implemented in future tasks:

- **Task 41**: Authentication screens (LoginScreen, OTPScreen)
- **Task 43**: Job screens (JobDetail, JobStatus, etc.)
- **Task 44**: Job status update screens
- **Task 45**: Service checklist screen
- **Task 46**: Photo capture functionality
- **Task 47**: Job completion screen
- **Task 48**: Engineer profile screen
- **Task 49**: Push notification handling
- **Task 50**: In-app notifications screen

## Testing

To test navigation:

```bash
# Run the mobile app
cd apps/mobile
pnpm start

# Test deep linking (iOS)
xcrun simctl openurl booted "cueron://jobs/123"

# Test deep linking (Android)
adb shell am start -W -a android.intent.action.VIEW -d "cueron://jobs/123"
```

## Dependencies

- `@react-navigation/native`: Core navigation library
- `@react-navigation/native-stack`: Stack navigator
- `@react-navigation/bottom-tabs`: Bottom tab navigator
- `react-native-screens`: Native screen components
- `react-native-safe-area-context`: Safe area handling
- `expo-linking`: Deep linking support
- `@expo/vector-icons`: Icon library for tab bar

## Notes

- All navigation types are defined in `types.ts`
- Deep linking configuration is in `linking.ts`
- Custom components are in `../components/navigation/`
- Screen components are in `../screens/`
