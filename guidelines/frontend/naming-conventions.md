# Naming Conventions

This guide outlines the naming conventions for the Experience Miner frontend. Consistent naming improves code readability, searchability, and helps developers quickly understand the purpose and responsibilities of code elements.

## File and Directory Naming

### Feature Directories

Feature directories use kebab-case:

```
features/
  auth/
  user-profile/
  topic-management/
  experience-capture/
```

### Component Files

Component files use PascalCase:

```
features/auth/
  AuthPage.tsx
  components/
    LoginForm.tsx
    SignupForm.tsx
    OtpVerification.tsx
```

### Hook Files

Hook files start with `use` and use camelCase:

```
features/auth/hooks/
  useAuthForm.ts
  useOtpVerification.ts
```

### Context Files

Context files end with `Context` and use PascalCase:

```
features/auth/contexts/
  AuthContext.tsx
```

### Type Files

Type files end with `.types.ts` and use kebab-case:

```
features/auth/
  auth.types.ts
```

### Test Files

Test files should match the file they test and have `.test.ts` or `.spec.ts` extension:

```
features/auth/
  AuthPage.tsx
  AuthPage.test.tsx
```

### Utility Files

Utility files use camelCase:

```
features/auth/utils/
  tokenHelpers.ts
  validationUtils.ts
```

## Component Naming

### General Components

- Component names should be specific and descriptive
- Use PascalCase for all component names
- Avoid abbreviations unless very common (URL, HTTP, etc.)
- Containers end with `Container`
- View/UI components end with relevant UI term or feature name

```tsx
// Good
UserProfileContainer
AuthFormUI
TopicCard
ExperienceList

// Avoid
Form              // Too generic
UP                // Abbreviation
ContainerProfile  // Inconsistent order
```

### Feature-Specific Components

Prefix components with their feature area if needed for clarity when importing:

```tsx
// Good
AuthLoginForm
AuthSignupForm
ExperienceCardList
ExperienceCardItem

// Avoid
Login        // Too generic when importing from another feature
SignupForm   // Could conflict with other signup forms
```

### Shared Components

Generic, reusable UI components should have clear, general names:

```tsx
// Good
Button
Card
Modal
Tooltip

// Avoid
SubmitButton    // Too specific
RedContainer    // Based on appearance, not function
```

Add relevant modifiers only when creating variants:

```tsx
PrimaryButton
OutlinedCard
FloatingTooltip
```

## Function Naming

### Event Handlers

Event handlers in components should use the `handle` prefix:

```tsx
const handleSubmit = (event) => { /* ... */ };
const handleInputChange = (event) => { /* ... */ };
const handleSelectOption = (id) => { /* ... */ };
```

### Callback Props

Callback props should use the `on` prefix:

```tsx
interface ButtonProps {
  onClick: () => void;
  onHover?: () => void;
}
```

### Async Functions

Prefix async functions with verbs that indicate the action:

```tsx
const fetchUserData = async () => { /* ... */ };
const updateProfile = async (data) => { /* ... */ };
const deleteExperience = async (id) => { /* ... */ };
```

### Boolean Functions/Variables

Functions or variables that return boolean values should use `is`, `has`, or `should` prefixes:

```tsx
const isLoggedIn = user !== null;
const hasPermission = (permission) => permissions.includes(permission);
const shouldShowAdminControls = isAdmin && hasPermission('manage_users');
```

## Hook Naming

All custom hooks must start with `use` prefix (React convention):

```tsx
// Good
useAuthState
useTopicList
useFormValidation

// Avoid
getAuthState       // Doesn't follow React hook convention
authStateHook      // Doesn't start with 'use'
```

Hooks should clearly describe what they do:

```tsx
// Good
useLocalStorage    // Manages data in localStorage
useDebounce        // Provides debounced value
useMediaQuery      // Checks media query matches

// Avoid
useData            // Too vague
useStuff           // Unclear purpose
```

## Type Naming

### Interfaces

Interfaces should use PascalCase and clearly describe the data structure:

```tsx
interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
```

Avoid prefixing interfaces with `I` (e.g., `IUser`).

### Props Interfaces

Component prop interfaces should be named after the component with a `Props` suffix:

```tsx
interface UserProfileProps {
  userId: string;
  editable?: boolean;
}

function UserProfile({ userId, editable }: UserProfileProps) {
  // Component implementation
  return (
    <div className="user-profile">
      {/* Profile content */}
    </div>
  );
}
```

### Type Aliases

Type aliases should use PascalCase:

```tsx
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type UserRole = 'admin' | 'moderator' | 'user';
```

### Enums

Enums should use PascalCase and have singular names:

```tsx
enum Status {
  Pending,
  Active,
  Inactive,
  Deleted
}

enum AuthStep {
  Email,
  OTP,
  Complete
}
```

## Context Naming

Context instances and providers should follow these conventions:

```tsx
// Context instance
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ...
};

// Hook to use the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Variable Naming

### General Variables

- Use descriptive, meaningful names
- Avoid single-letter variables except in loops
- Use camelCase for variable names

```tsx
// Good
const userEmail = 'user@example.com';
const isLoading = true;
const errorMessage = 'Failed to load data';

// Avoid
const e = 'user@example.com';    // Too short
const loading_state = true;      // Not camelCase
const err = 'Failed to load';    // Too short
```

### Constants

Constants should use UPPER_SNAKE_CASE:

```tsx
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_TIMEOUT = 5000;
```

## Conclusion

Following these naming conventions ensures code consistency and improves developer experience. When in doubt about a naming convention, look at the existing codebase for reference or consult with the team.
