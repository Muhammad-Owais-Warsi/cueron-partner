# Cueron Partner Platform

B2B mobile and web application system for managing HVAC service partnerships across India.

## Project Structure

```
cueron-partner-platform/
├── apps/
│   ├── web/          # Next.js 14 web application (Agency Dashboard)
│   └── mobile/       # React Native mobile application (Engineer App)
├── packages/
│   ├── types/        # Shared TypeScript types and interfaces
│   ├── utils/        # Shared utility functions
│   └── config/       # Shared configuration
└── .kiro/            # Kiro spec files
```

## Tech Stack

### Web Application
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **UI**: shadcn/ui + Tailwind CSS
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)

### Mobile Application
- **Framework**: React Native 0.72+
- **Language**: TypeScript (strict mode)
- **UI**: React Native Paper
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **Backend**: Supabase

### Shared
- **Database**: PostgreSQL 15 with PostGIS (via Supabase)
- **Authentication**: Supabase Auth with phone OTP
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **Maps**: Google Maps API
- **Payments**: Razorpay
- **SMS**: Twilio/MSG91
- **Push Notifications**: Firebase Cloud Messaging
- **Error Tracking**: Sentry

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- React Native development environment (for mobile)

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
# Run web application
pnpm dev

# Run mobile application
pnpm dev:mobile
```

### Build

```bash
# Build web application
pnpm build

# Build mobile application
pnpm build:mobile
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run linting
pnpm lint

# Format code
pnpm format
```

## Environment Variables

Create `.env.local` files in each app directory:

### Web App (`apps/web/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
SENTRY_DSN=
```

### Mobile App (`apps/mobile/.env`)
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
GOOGLE_MAPS_API_KEY=
FCM_SERVER_KEY=
SENTRY_DSN=
```

## Documentation

- [Requirements](.kiro/specs/cueron-partner-platform/requirements.md)
- [Design](.kiro/specs/cueron-partner-platform/design.md)
- [Tasks](.kiro/specs/cueron-partner-platform/tasks.md)

## License

Proprietary - Cueron
