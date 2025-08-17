# TypeScript Usage Guidelines

This guide outlines best practices for using TypeScript in the Experience Miner frontend to ensure code quality, maintainability, and type safety.

## TypeScript Configuration

Our project uses a strict TypeScript configuration to maximize the benefits of type checking. Key compiler options include:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    
    /* Type checking - strict mode */
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    
    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["./src/shared/*"],
      "@features/*": ["./src/features/*"],
      "@lib/*": ["./src/lib/*"]
    }
  }
}
```

## Type Definitions

### Type Organization

Organize types in one of these ways:

1. **Co-located with components**: For component-specific types
2. **Feature-specific type files**: For types shared within a feature
3. **Global type files**: For types shared across features

### Component Props

Define props interfaces for all components:

```tsx
// Good practice
interface UserProfileProps {
  userId: string;
  name: string;
  email: string;
  isAdmin?: boolean;
  onUpdate: (data: UserUpdateData) => void;
}

const UserProfile = ({
  userId,
  name,
  email,
  isAdmin = false,
  onUpdate
}: UserProfileProps): JSX.Element => {
  // Component implementation
};
```

For small components, you can define the props inline:

```tsx
const Button = ({
  variant = 'primary',
  size = 'medium',
  children,
  ...props
}: {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  // Button implementation
};
```

### API Responses and Requests

Define types for all API responses and requests:

```tsx
// API request types
interface CreateTopicRequest {
  title: string;
  description: string;
  tags?: string[];
}

// API response types
interface TopicResponse {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

### State Types

Define types for component and application state:

```tsx
interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Usage in a component or hook
const [state, setState] = useState<AuthState>({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false
});
```

### Function Types

Define function types for callbacks and handlers:

```tsx
type FetchCallback<T> = (data: T) => void;
type ErrorHandler = (error: Error) => void;
type FormSubmitHandler<T> = (data: T) => Promise<void>;

// Usage
const handleSubmit: FormSubmitHandler<UserFormData> = async (data) => {
  try {
    await userService.updateUser(userId, data);
  } catch (error) {
    // Handle error
  }
};
```

## Type Safety Best Practices

### Avoid Type Assertions

the use of type assertions (`as` keyword) is not allowed:

```tsx
// Prohibited
const user = someValue as User;

// Proper: Use type guards
function isUser(value: any): value is User {
  return (
    value &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string'
  );
}

if (isUser(someValue)) {
  // someValue is now typed as User
  console.log(someValue.name);
}
```

### Use Discriminated Unions

Use discriminated unions for handling different states:

```tsx
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

// Usage
const [state, setState] = useState<RequestState<User>>({ status: 'idle' });

// Type-safe access
if (state.status === 'success') {
  // TypeScript knows state.data exists here
  console.log(state.data.name);
}
```

### Nullability

Always handle null and undefined values explicitly:

```tsx
// Function that might return null
function findUser(id: string): User | null {
  // Implementation
}

const user = findUser('123');

// Good: Explicit null check
if (user) {
  console.log(user.name);
} else {
  console.log('User not found');
}

// Also good: Optional chaining
console.log(user?.name);
```

### Type Guards

Use type guards for runtime type checking:

```tsx
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

try {
  // Some operation
} catch (err: unknown) {
  if (isError(err)) {
    // TypeScript knows err is Error here
    console.error(err.message);
  } else {
    console.error('Unknown error occurred');
  }
}
```

## React-Specific TypeScript Patterns

### Function Components

Define function components with explicit props types and return types:

```tsx
// Preferred approach - direct props typing with optional return type
const UserProfile = ({ name, email, isAdmin }: UserProfileProps): JSX.Element => {
  return <div>...</div>;
};

// Alternative function declaration syntax
function UserProfile({ name, email, isAdmin }: UserProfileProps): JSX.Element {
  return <div>...</div>;
}

// For components that need to handle children explicitly
const Panel = ({ 
  children, 
  title 
}: { 
  children: React.ReactNode;
  title: string;
}): JSX.Element => {
  return (
    <div className="panel">
      <h2>{title}</h2>
      <div className="panel-content">{children}</div>
    </div>
  );
};
```

> Note: Avoid using `React.FC` or `React.FunctionComponent` as they have several drawbacks:
> - They implicitly include children even when not used
> - They complicate compound component patterns
> - They reduce control over explicit prop typing
> - They don't work well with default props

### Typing State Management

For detailed state management patterns, refer to our [State Management Guidelines](./state-management.md). Here we'll focus on TypeScript-specific aspects of state hooks.

#### Typing useState

```tsx
// Explicit type annotation (required for null/undefined initial values)
const [user, setUser] = useState<User | null>(null);

// Type inference for primitive values (preferred when possible)
const [count, setCount] = useState(0); // inferred as number
const [isActive, setIsActive] = useState(false); // inferred as boolean
const [name, setName] = useState(''); // inferred as string

// Type inference for arrays and objects
const [items, setItems] = useState(['item1', 'item2']); // inferred as string[]
const [point, setPoint] = useState({ x: 0, y: 0 }); // inferred as { x: number, y: number }

// For complex objects, consider defining an interface
interface FormState {
  username: string;
  email: string;
  agreeToTerms: boolean;
}

const [form, setForm] = useState<FormState>({
  username: '',
  email: '',
  agreeToTerms: false
});
```

#### Typing useReducer

```tsx
// Define the state shape
interface CounterState {
  count: number;
  lastUpdated: Date | null;
}

// Define action types using discriminated union
type CounterAction = 
  | { type: 'INCREMENT'; payload: number }
  | { type: 'DECREMENT'; payload: number }
  | { type: 'RESET' };

// Type-safe reducer function
function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case 'INCREMENT':
      return { 
        count: state.count + action.payload, 
        lastUpdated: new Date() 
      };
    case 'DECREMENT':
      return { 
        count: state.count - action.payload, 
        lastUpdated: new Date() 
      };
    case 'RESET':
      return { 
        count: 0, 
        lastUpdated: new Date() 
      };
    default:
      // This ensures we handle all possible action types
      // TypeScript will error if a new action type is added but not handled
      const exhaustiveCheck: never = action;
      return exhaustiveCheck;
  }
}

// Usage in component
function Counter() {
  const [state, dispatch] = useReducer(counterReducer, {
    count: 0,
    lastUpdated: null
  });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'INCREMENT', payload: 1 })}>
        Increment
      </button>
      <button onClick={() => dispatch({ type: 'DECREMENT', payload: 1 })}>
        Decrement
      </button>
      <button onClick={() => dispatch({ type: 'RESET' })}>
        Reset
      </button>
    </div>
  );
}
```

### Hooks

Type hook parameters and return values:

```tsx
// Custom hooks with explicitly typed parameters and return values
function useUser(userId: string): {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  // Implementation
  return {
    user,
    loading,
    error,
    refetch: async () => { /* implementation */ }
  };
}

// Better: Define an interface for the return type
interface UseUserResult {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function useUser(userId: string): UseUserResult {
  // Implementation
}
```

> **TypeScript and useReducer**: 
> When typing reducers, use discriminated unions for action types to get exhaustive pattern 
> matching in switch statements. This ensures all action types are handled properly and helps
> prevent bugs when adding new actions.

### Context

Type context properly with undefined or default values:

```tsx
// Define the shape of your context
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Option 1: Use undefined (recommended for required providers)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Option 2: Provide default values (use when reasonable defaults exist)
const defaultAuthContext: AuthContextType = {
  user: null,
  login: async () => { 
    console.warn('AuthProvider not found, using fallback login');
  },
  logout: async () => {
    console.warn('AuthProvider not found, using fallback logout');
  },
  loading: false,
  error: null
};
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// Create a provider component with proper children typing
export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  // Implementation with useState or useReducer
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Implementation details...
  
  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    login,
    logout,
    loading,
    error
  }), [user, loading, error]);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

For more detailed context patterns and state management best practices, refer to our [State Management Guidelines](./state-management.md).

### Event Handlers

Type event handlers properly:

```tsx
// Form events
const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  // Form handling code
};

// Input events
const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setName(event.target.value);
};

// Use typed event handler with target type inference
const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  // TypeScript knows event.target.value is a string
  const value = parseInt(event.target.value, 10) || 0;
  setCount(value);
};

// Button clicks
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  // Click handling code
};

// With callback parameters
const handleUserSelect = (userId: string, event: React.MouseEvent<HTMLButtonElement>) => {
  // Handle user selection
};

// For custom events
interface CustomEventDetail {
  message: string;
  timestamp: number;
}

const handleCustomEvent = (event: CustomEvent<CustomEventDetail>) => {
  console.log(event.detail.message, event.detail.timestamp);
};
```

## Advanced TypeScript Features

### Utility Types

Use TypeScript utility types to transform existing types:

```tsx
// Make all properties optional
type PartialUser = Partial<User>;

// Make all properties required
type RequiredUser = Required<User>;

// Pick specific properties
type UserCredentials = Pick<User, 'email' | 'password'>;

// Omit specific properties
type PublicUser = Omit<User, 'password' | 'token'>;

// Extract properties of a specific type
type UserDates = Extract<keyof User, Date>;

// Extract union member satisfying a type
type StringProps = Extract<keyof User, string>;
```

### Generic Components

Create reusable, type-safe components with generics:

```tsx
interface DataListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function DataList<T>({
  items,
  renderItem,
  keyExtractor
}: DataListProps<T>): JSX.Element {
  return (
    <div>
      {items.map((item) => (
        <div key={keyExtractor(item)}>{renderItem(item)}</div>
      ))}
    </div>
  );
}

// Usage
<DataList
  items={users}
  renderItem={(user) => <UserCard user={user} />}
  keyExtractor={(user) => user.id}
/>
```

### Type Predicates

Use type predicates for custom type guards:

```tsx
function isCompleteUser(user: Partial<User>): user is User {
  return (
    user.id !== undefined &&
    user.name !== undefined &&
    user.email !== undefined
  );
}

// Usage
const partialUser: Partial<User> = { id: '123', name: 'John' };

if (isCompleteUser(partialUser)) {
  // TypeScript knows partialUser is a complete User here
  sendEmail(partialUser.email);
} else {
  console.log('Incomplete user data');
}
```

## Performance Considerations

### Type Imports

Use explicit type imports to avoid importing unnecessary runtime code:

```tsx
// Good: Only imports the type
import type { User } from './types';

// Avoid if User is only used as a type
import { User } from './types';
```

### Avoid Excessive Type Complexity

Keep types simple and focused:

```tsx
// Avoid deeply nested conditional types when possible
type ComplexType<T> = T extends string
  ? T extends 'admin'
    ? AdminPermissions
    : T extends 'user'
    ? UserPermissions
    : NoPermissions
  : never;

// Better: Split into smaller, composable types
type UserRole = 'admin' | 'user' | 'guest';

type PermissionMap = {
  admin: AdminPermissions;
  user: UserPermissions;
  guest: NoPermissions;
};

type Permissions<T extends UserRole> = PermissionMap[T];
```

## Code Quality with Biome

We use Biome for linting, formatting, and code quality enforcement. Biome provides built-in TypeScript support and fast performance:

**Commands:**
```bash
# Check code for linting and formatting issues
npm run lint

# Format code
npm run format

# Both linting and formatting in one command
biome check . --write
```

**Configuration in `biome.json`:**
```json
{
  "$schema": "https://biomejs.dev/schemas/1.0.0/schema.json",
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error",
        "noImplicitAnyLet": "error"
      },
      "correctness": {
        "noUnusedVariables": "error",
        "useExhaustiveDependencies": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "typescript": {
    "enabled": true
  }
}
```

**Benefits of Biome:**
- 10-100x faster than ESLint
- Built-in formatting (replaces Prettier)  
- Native TypeScript support
- Single tool for linting and formatting

## Conclusion

Following these TypeScript guidelines ensures type safety, improves developer experience, and helps prevent bugs. When in doubt, err on the side of more explicit types rather than using `any` or type assertions.
