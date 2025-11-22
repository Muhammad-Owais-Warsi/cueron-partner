# Quick Start Guide

This guide will help you get the Cueron Partner Platform up and running quickly.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **pnpm** (v8 or higher) - Install with: `npm install -g pnpm`
- **Git** - [Download](https://git-scm.com/)

For mobile development, you'll also need:
- **Xcode** (macOS only, for iOS development)
- **Android Studio** (for Android development)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cueron-partner-platform
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all dependencies for the monorepo, including the web app, mobile app, and shared packages.

### 3. Set Up Environment Variables

#### Web Application

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local` and add your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
# ... other variables
```

#### Mobile Application

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Edit `apps/mobile/.env` and add your credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
# ... other variables
```

## Running the Applications

### Web Application (Agency Dashboard)

```bash
# Start development server
pnpm dev

# The web app will be available at http://localhost:3000
```

### Mobile Application (Engineer App)

```bash
# Start Expo development server
pnpm dev:mobile

# Then choose your platform:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Scan QR code with Expo Go app on your physical device
```

## Project Structure Overview

```
cueron-partner-platform/
├── apps/
│   ├── web/          # Next.js web application (Agency Dashboard)
│   └── mobile/       # React Native mobile app (Engineer App)
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── utils/        # Shared utility functions
│   └── config/       # Shared configuration
└── .kiro/            # Kiro spec files (requirements, design, tasks)
```

## Common Commands

```bash
# Development
pnpm dev              # Run web app
pnpm dev:mobile       # Run mobile app

# Building
pnpm build            # Build web app for production
pnpm build:mobile     # Build mobile app

# Code Quality
pnpm lint             # Lint all packages
pnpm format           # Format all code
pnpm type-check       # Type check all packages
pnpm test             # Run all tests

# Cleaning
pnpm clean            # Clean all build artifacts
```

## Next Steps

1. **Review the Documentation**
   - [Requirements](.kiro/specs/cueron-partner-platform/requirements.md)
   - [Design](.kiro/specs/cueron-partner-platform/design.md)
   - [Tasks](.kiro/specs/cueron-partner-platform/tasks.md)

2. **Set Up Supabase**
   - Create a Supabase project at https://supabase.com
   - Run database migrations (coming in next tasks)
   - Configure authentication providers

3. **Configure Third-Party Services**
   - Google Maps API
   - Razorpay payment gateway
   - Twilio/MSG91 for SMS
   - Firebase Cloud Messaging for push notifications
   - Sentry for error tracking

4. **Start Development**
   - Check the [Tasks](.kiro/specs/cueron-partner-platform/tasks.md) file
   - Follow the implementation plan
   - Refer to [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines

## Troubleshooting

### pnpm install fails

- Ensure you're using Node.js v18 or higher: `node --version`
- Ensure you're using pnpm v8 or higher: `pnpm --version`
- Clear pnpm cache: `pnpm store prune`
- Try again: `pnpm install`

### Web app won't start

- Check that port 3000 is not in use
- Verify environment variables in `apps/web/.env.local`
- Check for TypeScript errors: `cd apps/web && pnpm type-check`

### Mobile app won't start

- Ensure Expo CLI is installed: `npm install -g expo-cli`
- Clear Expo cache: `cd apps/mobile && expo start -c`
- For iOS: Ensure Xcode is installed and up to date
- For Android: Ensure Android Studio and emulator are set up

## Getting Help

- Check the [CONTRIBUTING.md](CONTRIBUTING.md) guide
- Review the spec documents in `.kiro/specs/cueron-partner-platform/`
- Contact the development team

## What's Next?

Now that your development environment is set up, you can:

1. Explore the codebase structure
2. Review the requirements and design documents
3. Start implementing features from the tasks list
4. Run tests to ensure everything works correctly

Happy coding! 🚀
