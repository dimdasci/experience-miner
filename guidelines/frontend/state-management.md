# State Management Guidelines

This guide outlines the state management patterns and best practices for the Experience Miner frontend application.

## State Management Hierarchy

We use a multi-layered approach to state management based on the scope and lifetime of the state:

1. **Local Component State**: For UI-specific state limited to a single component
2. **Feature-Level State**: For state shared between components within a feature
3. **Global Application State**: For state shared across multiple features

## Local Component State

Use React's built-in state management for component-specific state:

### useState

Use for simple state values:

```tsx
const [isOpen, setIsOpen] = useState(false);
const [count, setCount] = useState(0);
const [text, setText] = useState('');
```

For complex state, use an object with useState:

```tsx
const [form, setForm] = useState({
  name: '',
  email: '',
  message: ''
});

// Update with spread operator to maintain immutability
const handleNameChange = (event) => {
  setForm({
    ...form,
    name: event.target.value
  });
};
```

### useReducer

Use for complex state logic with multiple sub-values or when next state depends on previous state:

```tsx
type State = {
  count: number;
  isLoading: boolean;
  error: string | null;
};

type Action =
  | { type: 'INCREMENT'; payload: number }
  | { type: 'DECREMENT'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + action.payload };
    case 'DECREMENT':
      return { ...state, count: state.count - action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// In component
const [state, dispatch] = useReducer(reducer, {
  count: 0,
  isLoading: false,
  error: null
});

// Usage
dispatch({ type: 'INCREMENT', payload: 1 });
dispatch({ type: 'SET_LOADING', payload: true });
```

## Feature-Level State

For state shared within a feature, use React Context with custom hooks:

```tsx
// features/auth/contexts/AuthContext.tsx
import React, { createContext, useContext, useReducer } from 'react';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload, loading: false, error: null };
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, error: action.payload };
    case 'LOGOUT':
      return { ...state, user: null };
    default:
      return state;
  }
}

// Create a context with typed state and dispatch
type AuthContextType = {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const user = await authService.login(email, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message as string });
    }
  };

  const logout = () => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const value = {
    state,
    dispatch,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

Usage in components:

```tsx
// Component using the auth context
import { useAuth } from '../contexts/AuthContext';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, state } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      {state.error && <div className="error">{state.error}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" disabled={state.loading}>
        {state.loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

## Global Application State

For state shared across multiple features, use a centralized context:

```tsx
// src/app/contexts/AppContext.tsx
import React, { createContext, useContext, useReducer } from 'react';

interface AppState {
  theme: 'light' | 'dark';
  notifications: Notification[];
  // Other global state...
}

type AppAction =
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

const initialState: AppState = {
  theme: 'light',
  notifications: []
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          (n) => n.id !== action.payload
        )
      };
    default:
      return state;
  }
}

type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
```

## Custom Hooks for API Data

Use custom hooks to fetch and manage data from APIs:

```tsx
// features/topics/hooks/useTopics.ts
import { useState, useEffect, useCallback } from 'react';
import { topicService } from '../services/topicService';
import type { Topic } from '../topics.types';

export function useTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await topicService.getTopics();
      setTopics(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch topics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const addTopic = async (topic: Omit<Topic, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const newTopic = await topicService.createTopic(topic);
      setTopics((prev) => [...prev, newTopic]);
      return newTopic;
    } catch (err) {
      setError(err.message || 'Failed to add topic');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    topics,
    loading,
    error,
    fetchTopics,
    addTopic
  };
}
```

## Form State Management

For managing form state, use custom hooks:

```tsx
// features/experience/hooks/useExperienceForm.ts
import { useState } from 'react';

interface ExperienceFormData {
  title: string;
  description: string;
  date: string;
  tags: string[];
}

interface FormErrors {
  title?: string;
  description?: string;
  date?: string;
}

export function useExperienceForm(initialData?: Partial<ExperienceFormData>) {
  const [formData, setFormData] = useState<ExperienceFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    date: initialData?.date || '',
    tags: initialData?.tags || []
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData((prev) => ({
      ...prev,
      tags
    }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      tags: []
    });
    setErrors({});
  };

  return {
    formData,
    errors,
    handleChange,
    handleTagsChange,
    validate,
    resetForm
  };
}
```

## State Management Best Practices

### 1. State Colocation

Keep state as close as possible to where it's used:

```tsx
// Good: State is colocated with the component that uses it
const ProfileForm = () => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  
  return (
    <form>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
    </form>
  );
};
```

### 2. Derived State

Calculate derived state on-the-fly instead of storing it:

```tsx
// Good: Deriving state
const ProductList = ({ products }) => {
  // Derived state
  const inStockProducts = products.filter(p => p.inStock);
  const outOfStockProducts = products.filter(p => !p.inStock);
  
  return (
    <div>
      <h2>In Stock ({inStockProducts.length})</h2>
      <ProductGrid products={inStockProducts} />
      
      <h2>Out of Stock ({outOfStockProducts.length})</h2>
      <ProductGrid products={outOfStockProducts} />
    </div>
  );
};
```

### 3. State Initialization

Use lazy initialization for expensive state calculations:

```tsx
// Good: Lazy initialization for expensive operations
const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(() => {
    // This function only runs once during initial render
    return getUserFromLocalStorage(userId);
  });
  
  // Rest of the component
};
```

### 4. Update Patterns

Use functional updates for state that depends on previous state:

```tsx
// Good: Using functional updates
const Counter = () => {
  const [count, setCount] = useState(0);
  
  const increment = () => {
    setCount(prevCount => prevCount + 1);
  };
  
  // Rest of the component
};
```

### 5. Immutability

Always maintain immutability when updating state:

```tsx
// Good: Maintaining immutability
const TodoList = () => {
  const [todos, setTodos] = useState<Array<{ id: number; text: string; completed: boolean }>>([]);
  
  const addTodo = (text: string) => {
    setTodos([...todos, { id: Date.now(), text, completed: false }]);
  };
  
  const toggleTodo = (id: number) => {
    setTodos(
      todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };
  
  // Rest of the component
};
```

### 6. Context Performance

For large contexts, split them by functionality and use memoization:

```tsx
import React, { createContext, useContext, useMemo, useReducer } from 'react';

// Split large contexts into smaller, focused ones
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const UserContext = createContext<UserContextType | undefined>(undefined);

interface ThemeContextType {
  themeState: ThemeState;
  themeDispatch: React.Dispatch<ThemeAction>;
}

interface UserContextType {
  userState: UserState;
  userDispatch: React.Dispatch<UserAction>;
}

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeState, themeDispatch] = useReducer(themeReducer, initialThemeState);
  const [userState, userDispatch] = useReducer(userReducer, initialUserState);
  
  // Memoize context values to prevent unnecessary re-renders
  const themeValue = useMemo(() => {
    return { themeState, themeDispatch };
  }, [themeState]);
  
  const userValue = useMemo(() => {
    return { userState, userDispatch };
  }, [userState]);
  
  return (
    <ThemeContext.Provider value={themeValue}>
      <UserContext.Provider value={userValue}>
        {children}
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
};
```

## Conclusion

This state management approach gives us a flexible system that scales with the application's complexity:

- **Local state** for UI concerns
- **Feature-level context** for sharing state within a feature
- **Global context** for cross-cutting concerns

Choose the right level of state management based on the scope and lifetime of the state. Always prefer the simplest solution that works for your use case.
