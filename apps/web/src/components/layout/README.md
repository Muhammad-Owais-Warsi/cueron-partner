# Dashboard Layout Components

This directory contains the layout components for the Cueron Partner Platform web application dashboard.

## Components

### DashboardLayout

The main layout wrapper that provides the overall structure for dashboard pages.

**Features:**
- Responsive sidebar navigation
- Header with user profile
- Breadcrumb navigation
- Mobile-friendly with collapsible sidebar

**Usage:**
```tsx
import { DashboardLayout } from '@/components/layout';

export default function MyPage() {
  return (
    <DashboardLayout>
      <div>Your page content here</div>
    </DashboardLayout>
  );
}
```

### Sidebar

Navigation sidebar with role-based menu items.

**Features:**
- Desktop and mobile versions
- Role-based navigation filtering (admin, manager, viewer)
- Active route highlighting
- User role badge display
- Smooth animations

**Navigation Items:**
- Dashboard (all roles)
- Jobs (admin, manager, viewer)
- Team (admin, manager, viewer)
- Analytics (admin, manager, viewer)
- Payments (admin, manager, viewer)
- Settings (admin, manager only)

### Header

Top header bar with user profile and notifications.

**Features:**
- Mobile menu toggle button
- Notifications button with badge
- User profile dropdown
- Sign out functionality
- Agency name display

**Dropdown Menu Items:**
- User profile information
- Your Profile link
- Settings link
- Sign Out button

### Breadcrumbs

Automatic breadcrumb navigation based on current route.

**Features:**
- Auto-generates from URL path
- Formats hyphenated paths (e.g., "team-management" → "Team Management")
- Hidden on dashboard home page
- Clickable navigation links

## Role-Based Access Control

The layout components integrate with the authorization system to show/hide navigation items based on user roles:

- **Admin**: Full access to all features
- **Manager**: Access to most features except user management
- **Viewer**: Read-only access to jobs, team, analytics, and payments
- **Engineer**: Limited access (mobile app primarily)

## Responsive Design

All components are fully responsive:

- **Desktop (lg+)**: Fixed sidebar, full header
- **Tablet (md-lg)**: Collapsible sidebar, compact header
- **Mobile (<md)**: Overlay sidebar, mobile-optimized header

## Styling

Components use Tailwind CSS for styling with a consistent design system:

- Primary color: Blue (600)
- Background: Gray (50)
- Cards: White with subtle shadows
- Text: Gray scale (900, 700, 600, 500)

## Integration

The layout components integrate with:

- `useAuth` hook for user authentication state
- `useUserProfile` hook for user profile and role information
- Next.js App Router for navigation
- Supabase for authentication

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 13.4**: Admin role users have full access to agency management functions
- **Requirement 13.5**: Viewer role users are restricted to read-only operations

The navigation menu dynamically filters items based on user role, ensuring proper access control at the UI level.
