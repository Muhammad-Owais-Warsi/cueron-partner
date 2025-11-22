# Web Authentication UI

This directory contains the authentication UI components for the Cueron Partner Platform web application.

## Components

### LoginForm
The initial login form that allows users to authenticate using phone number or email.

**Features:**
- Phone number input with validation
- Email input (placeholder for future implementation)
- Toggle between phone and email authentication
- Loading states during OTP sending
- Error handling and display
- Form validation

**Usage:**
```tsx
import { LoginForm } from '@/components/auth/LoginForm';

<LoginForm onOTPSent={(phone) => console.log('OTP sent to:', phone)} />
```

### OTPInput
A 6-digit OTP input component with auto-focus and auto-submit functionality.

**Features:**
- 6 individual input boxes for OTP digits
- Auto-focus next input on digit entry
- Auto-submit when all 6 digits entered
- Paste support for OTP codes
- Backspace navigation between inputs
- Loading states during verification
- Error handling and display
- Resend OTP functionality

**Usage:**
```tsx
import { OTPInput } from '@/components/auth/OTPInput';

<OTPInput 
  phone="+919876543210" 
  onBack={() => console.log('Back to login')}
  onSuccess={() => console.log('OTP verified')}
/>
```

### ProtectedRoute
A wrapper component that protects pages requiring authentication.

**Features:**
- Automatic redirect to login if not authenticated
- Loading state while checking authentication
- Customizable redirect path
- Customizable loading component

**Usage:**
```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

**Higher-Order Component:**
```tsx
import { withAuth } from '@/components/auth/ProtectedRoute';

function MyProtectedPage() {
  return <div>Protected content</div>;
}

export default withAuth(MyProtectedPage);
```

## Hooks

### useAuth
Manages authentication state and provides current user and session.

**Returns:**
- `user`: Current authenticated user or null
- `session`: Current session or null
- `loading`: Boolean indicating if auth state is loading
- `error`: Error object if authentication check failed

**Usage:**
```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, session, loading, error } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;
  
  return <div>Welcome {user.phone}</div>;
}
```

### useRequireAuth
Hook that automatically redirects to login if not authenticated.

**Usage:**
```tsx
import { useRequireAuth } from '@/hooks/useAuth';

function MyProtectedComponent() {
  const { user, loading } = useRequireAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return <div>Welcome {user.phone}</div>;
}
```

### useSession
Provides session management functions.

**Returns:**
- `session`: Current session or null
- `loading`: Boolean indicating if session is loading
- `refreshSession`: Function to refresh the session
- `signOut`: Function to sign out and redirect to login

**Usage:**
```tsx
import { useSession } from '@/hooks/useAuth';

function MyComponent() {
  const { session, signOut, refreshSession } = useSession();
  
  return (
    <div>
      <button onClick={signOut}>Sign Out</button>
      <button onClick={refreshSession}>Refresh Session</button>
    </div>
  );
}
```

### useUserProfile
Fetches and provides user profile data from the database.

**Returns:**
- `user`: Current authenticated user
- `profile`: User profile data (engineer or agency_user)
- `loading`: Boolean indicating if profile is loading
- `error`: Error object if profile fetch failed

**Usage:**
```tsx
import { useUserProfile } from '@/hooks/useAuth';

function MyComponent() {
  const { user, profile, loading, error } = useUserProfile();
  
  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <p>Type: {profile?.type}</p>
      <p>Role: {profile?.role}</p>
      <p>Agency: {profile?.agency?.name}</p>
    </div>
  );
}
```

## Pages

### /login
The login page that handles the authentication flow.

**Flow:**
1. User enters phone number
2. OTP is sent via Supabase Auth
3. User enters 6-digit OTP
4. OTP is verified
5. Session is created
6. User is redirected to dashboard

### /dashboard
Protected dashboard page that requires authentication.

**Features:**
- Automatic redirect to login if not authenticated
- User profile display
- Sign out functionality
- Quick stats cards
- Coming soon notice for full features

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant LoginForm
    participant Supabase
    participant OTPInput
    participant Dashboard

    User->>LoginForm: Enter phone number
    LoginForm->>Supabase: sendOTP(phone)
    Supabase-->>LoginForm: OTP sent
    LoginForm->>OTPInput: Show OTP input
    User->>OTPInput: Enter 6-digit OTP
    OTPInput->>Supabase: verifyOTP(phone, otp)
    Supabase-->>OTPInput: Session created
    OTPInput->>Dashboard: Redirect to dashboard
    Dashboard->>User: Show protected content
```

## Validation

### Phone Number Validation
- Must be 10 digits
- Validated using `validatePhoneNumber` from `@cueron/utils`
- Formatted using `formatPhoneNumber` before sending to Supabase

### OTP Validation
- Must be 6 digits
- Validated using `validateOTP` from `@cueron/utils`
- Auto-submit when all 6 digits entered

## Error Handling

All components include comprehensive error handling:
- Network errors
- Invalid credentials
- Session expiration
- Database errors
- Validation errors

Errors are displayed in user-friendly messages with appropriate styling.

## Loading States

All components include loading states:
- Spinner animations during async operations
- Disabled inputs during loading
- Loading text indicators
- Skeleton screens where appropriate

## Security

- JWT tokens stored in httpOnly cookies (handled by Supabase)
- Session refresh on expiration
- Automatic redirect on authentication failure
- Row Level Security enforced at database level
- HTTPS required for all authentication requests

## Requirements Validation

This implementation satisfies the following requirements:

**Requirement 12.1**: Phone OTP authentication via Supabase Auth
**Requirement 12.3**: OTP verification with session creation
**Requirement 12.4**: Session management with JWT tokens

## Testing

To test the authentication flow:

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Navigate to `http://localhost:3000`

3. You'll be redirected to `/login`

4. Enter a valid phone number (requires Supabase SMS provider configured)

5. Enter the OTP received

6. You'll be redirected to `/dashboard`

## Future Enhancements

- Email authentication with magic links
- Biometric authentication for mobile
- Remember device functionality
- Multi-factor authentication
- Social authentication providers
- Password-based authentication option
