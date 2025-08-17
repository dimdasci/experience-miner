# Directory Structure

This guide describes the directory structure for the Experience Miner frontend codebase.

## Overview

Our codebase follows a feature-first organization pattern, with shared components and utilities in dedicated directories.

```
frontend/src/
├── features/           # All business domain features
├── shared/             # Cross-cutting concerns
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
├── index.css           # Global styles
├── constants.ts        # Global constants
├── lib/                # External library integrations (supabase, utils)
├── types.ts            # Global type definitions
└── vite-env.d.ts       # Vite type declarations
```

## Feature Directory Structure

Each feature directory follows this structure:

```
features/auth/                    # Example feature: Authentication
├── elements/                     # Small, single-purpose UI components
│   ├── EmailStep.tsx             # Input for email
│   ├── OTPStep.tsx               # OTP verification UI
│   └── WelcomeMessage.tsx        # Welcome message component
├── containers/                   # Components with business logic
│   ├── AuthFormContainer.tsx     # Manages auth form state and API calls
│   └── UserMenuContainer.tsx     # Manages user menu state and logic
├── hooks/                        # Feature-specific hooks
│   ├── useAuthForm.ts            # Hook for form state and validation
│   └── useUserMenu.ts            # Hook for user menu interactions
├── views/                        # Complete UI assemblies
│   ├── AuthFormUI.tsx            # Full auth form presentation
│   ├── UserMenuUI.tsx            # Desktop user menu UI
│   └── MobileUserMenuUI.tsx      # Mobile-specific user menu UI
├── contexts/                     # Feature-specific context providers
│   └── AuthContext.tsx           # Authentication state context
└── types/                        # Feature-specific type definitions
    └── authTypes.ts              # Types for auth feature
```

## Shared Directory Structure

Shared code that's used across multiple features:

```
shared/
├── ui/                          # Shared UI components
│   ├── button.tsx               # Button component
│   ├── input/                   # Input components
│   │   ├── index.ts             # Barrel exports
│   │   ├── input.tsx            # Standard input
│   │   └── input-otp.tsx        # OTP input
│   └── error-message.tsx        # Error message display
├── hooks/                       # Shared hooks
│   └── utility/
│       └── useLocalStorage.ts   # Local storage hook
├── services/                    # Shared services
│   ├── api/
│   │   └── apiService.ts        # Base API service
│   └── transcription/
│       └── transcriptionService.ts
├── types/                       # Shared type definitions
│   ├── index.ts                 # Re-exports
│   ├── business/                # Business domain types
│   │   └── index.ts
│   └── api/                     # API types
│       └── index.ts
└── utils/                       # Utility functions
    └── logger.ts                # Logging utility
```

## Criteria for Code Placement

Follow these rules to determine where code should be placed:

### When to Create a Feature Directory
- The code represents a distinct business domain
- It has its own screens, workflows, or significant UI components
- It manages a specific part of the application state

### When to Place Code in Shared
- The component or utility is used by 3+ features
- It doesn't depend on feature-specific business logic
- It represents a generic, reusable pattern

### When to Create Subdirectories
- Create subdirectories when you have 3+ related files
- Group by purpose (e.g., input/, theme/, etc.)
- Use index.ts files for clean exports

## Path Aliases

To avoid deep import paths, we use path aliases:

```tsx
// Instead of this:
import { Button } from '../../../shared/ui/button';

// Use this:
import { Button } from '@shared/ui/button';

// Feature imports:
import { AuthFormContainer } from '@features/auth/containers/AuthFormContainer';

// Root-level imports:
import { API_BASE_URL } from '@/constants';
```

## Barrel Exports

Use barrel exports (index.ts files) for cleaner imports:

```tsx
// shared/ui/input/index.ts
export * from './input';
export * from './input-otp';

// Then import like this:
import { Input, InputOTP } from '@shared/ui/input';
```
