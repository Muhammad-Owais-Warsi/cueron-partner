# Contributing to Cueron Partner Platform

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Git

### For Mobile Development

- Xcode (for iOS development on macOS)
- Android Studio (for Android development)
- Expo CLI

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cueron-partner-platform
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
# Web app
cp apps/web/.env.example apps/web/.env.local

# Mobile app
cp apps/mobile/.env.example apps/mobile/.env
```

4. Fill in the environment variables with your credentials.

## Project Structure

```
cueron-partner-platform/
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   ├── components/    # React components
│   │   │   ├── lib/           # Utilities and helpers
│   │   │   └── styles/        # Global styles
│   │   ├── public/            # Static assets
│   │   └── package.json
│   │
│   └── mobile/                 # React Native mobile app
│       ├── src/
│       │   ├── screens/       # Screen components
│       │   ├── components/    # Reusable components
│       │   ├── navigation/    # Navigation configuration
│       │   ├── services/      # API services
│       │   └── App.tsx        # Root component
│       ├── assets/            # Images, fonts, etc.
│       └── package.json
│
├── packages/
│   ├── types/                  # Shared TypeScript types
│   │   └── src/
│   │       ├── agency.ts
│   │       ├── engineer.ts
│   │       ├── job.ts
│   │       ├── payment.ts
│   │       └── common.ts
│   │
│   ├── utils/                  # Shared utility functions
│   │   └── src/
│   │       ├── validation.ts
│   │       ├── formatting.ts
│   │       └── constants.ts
│   │
│   └── config/                 # Shared configuration
│       └── src/
│           ├── eslint.ts
│           └── tailwind.ts
│
└── .kiro/                      # Kiro spec files
    └── specs/
        └── cueron-partner-platform/
            ├── requirements.md
            ├── design.md
            └── tasks.md
```

## Development Workflow

### Running the Web Application

```bash
# Development mode
pnpm dev

# Build for production
pnpm build

# Start production server
cd apps/web && pnpm start
```

### Running the Mobile Application

```bash
# Start Expo development server
pnpm dev:mobile

# Run on iOS simulator
cd apps/mobile && pnpm ios

# Run on Android emulator
cd apps/mobile && pnpm android
```

## Code Quality

### Linting

```bash
# Lint all packages
pnpm lint

# Lint specific package
cd apps/web && pnpm lint
```

### Formatting

```bash
# Format all files
pnpm format

# Check formatting
pnpm format:check
```

### Type Checking

```bash
# Type check all packages
pnpm type-check

# Type check specific package
cd apps/web && pnpm type-check
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests for specific package
cd apps/web && pnpm test
```

## Git Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions or updates

Example: `feature/agency-registration`

### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or updates
- `chore`: Build process or auxiliary tool changes

Example:
```
feat(web): add agency registration form

Implement the agency registration form with validation
using Zod schemas and Supabase integration.

Closes #123
```

## Code Style Guidelines

### TypeScript

- Use strict mode
- Prefer `interface` over `type` for object shapes
- Use explicit return types for public functions
- Avoid `any` type - use `unknown` if necessary
- Use optional chaining and nullish coalescing

### React

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper TypeScript types for props
- Avoid inline styles - use Tailwind CSS (web) or StyleSheet (mobile)

### File Naming

- Components: PascalCase (e.g., `AgencyCard.tsx`)
- Utilities: camelCase (e.g., `formatCurrency.ts`)
- Types: camelCase (e.g., `agency.ts`)
- Constants: UPPER_SNAKE_CASE in files named camelCase

## Testing Guidelines

### Unit Tests

- Test business logic and utility functions
- Test component rendering and interactions
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Property-Based Tests

- Use fast-check for property-based testing
- Test universal properties across all inputs
- Tag tests with property references from design doc
- Run minimum 100 iterations per property test

### Integration Tests

- Test complete user workflows
- Test API endpoints with real database
- Test real-time synchronization

## Documentation

- Update README.md for significant changes
- Document complex algorithms and business logic
- Add JSDoc comments for public APIs
- Keep spec documents up to date

## Getting Help

- Check the [Requirements](.kiro/specs/cueron-partner-platform/requirements.md)
- Review the [Design](.kiro/specs/cueron-partner-platform/design.md)
- See the [Tasks](.kiro/specs/cueron-partner-platform/tasks.md)
- Ask questions in team chat or create an issue
