# Component Architecture

This guide outlines the patterns and principles for building components in the Experience Miner frontend.

## Component Types

We use several distinct component types, each with a specific purpose:

### 1. Container Components

Container components are responsible for:
- Managing state
- Fetching data
- Handling business logic
- Passing data and callbacks to view components

```tsx
// features/auth/containers/AuthFormContainer.tsx
import { useAuthForm } from '../hooks/useAuthForm';
import { AuthFormUI } from '../views/AuthFormUI';

const AuthFormContainer = () => {
  const {
    email,
    setEmail,
    otp,
    setOtp,
    step,
    loading,
    error,
    sendCode,
    verifyCode,
    reset
  } = useAuthForm();

  return (
    <AuthFormUI
      email={email}
      otp={otp}
      step={step}
      loading={loading}
      error={error}
      onEmailChange={setEmail}
      onOtpChange={setOtp}
      onSend={sendCode}
      onVerify={verifyCode}
      onReset={reset}
    />
  );
};

export default AuthFormContainer;
```

### 2. View Components

View components are responsible for:
- Rendering UI based on props
- Handling layout and styling
- Delegating user interactions to callback props
- No direct state management or API calls

```tsx
// features/auth/views/AuthFormUI.tsx
import WelcomeMessage from '../elements/WelcomeMessage';
import EmailStep from '../elements/EmailStep';
import OTPStep from '../elements/OTPStep';

interface AuthFormUIProps {
  email: string;
  otp: string;
  step: 'email' | 'otp';
  loading: boolean;
  error: string;
  onEmailChange: (val: string) => void;
  onOtpChange: (val: string) => void;
  onSend: () => void;
  onVerify: () => void;
  onReset: () => void;
}

export const AuthFormUI = ({
  email,
  otp,
  step,
  loading,
  error,
  onEmailChange,
  onOtpChange,
  onSend,
  onVerify,
  onReset
}: AuthFormUIProps) => (
  <div className="form-container">
    <WelcomeMessage step={step} />
    
    {error && <div className="error-message">{error}</div>}
    
    {step === 'email' ? (
      <EmailStep
        email={email}
        loading={loading}
        onEmailChange={onEmailChange}
        onSend={onSend}
      />
    ) : (
      <OTPStep
        email={email}
        otp={otp}
        loading={loading}
        onOtpChange={onOtpChange}
        onVerify={onVerify}
        onReset={onReset}
      />
    )}
  </div>
);
```

### 3. Element Components

Element components are:
- Small, focused UI building blocks
- Reusable within a feature
- Usually stateless or with minimal internal state
- Concerned with rendering a specific part of the UI

```tsx
// features/auth/elements/EmailStep.tsx
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';

interface EmailStepProps {
  email: string;
  loading: boolean;
  onEmailChange: (val: string) => void;
  onSend: () => void;
}

const EmailStep = ({ email, loading, onEmailChange, onSend }: EmailStepProps) => {
  return (
    <div className="email-step">
      <h2>Enter your email</h2>
      <Input
        type="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        placeholder="email@example.com"
        disabled={loading}
      />
      <Button 
        onClick={onSend} 
        disabled={loading || !email}
      >
        {loading ? 'Sending...' : 'Continue'}
      </Button>
    </div>
  );
};

export default EmailStep;
```

### 4. Shared UI Components

Shared UI components are:
- Highly reusable across the application
- Focused on UI presentation
- Stateless or with self-contained state
- Customizable via props

```tsx
// shared/ui/button.tsx
import React from 'react';
import classNames from 'classnames';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) => {
  const classes = classNames(
    'button',
    `button-${variant}`,
    `button-${size}`,
    { 'button-full-width': fullWidth },
    className
  );

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
```

## Custom Hooks

Custom hooks encapsulate reusable logic:

```tsx
// features/auth/hooks/useAuthForm.ts
import { useState } from 'react';
import { useAuth } from '@shared/contexts/AuthContext';

export const useAuthForm = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithOTP, verifyOTP } = useAuth();

  const sendCode = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await signInWithOTP(email);
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    // Implementation...
  };

  const reset = () => {
    // Implementation...
  };

  return { 
    email, setEmail, 
    otp, setOtp, 
    step, 
    loading, 
    error, 
    sendCode, 
    verifyCode, 
    reset 
  };
};
```

## Context Providers

Context providers manage shared state within a feature:

```tsx
// shared/contexts/AuthContext.tsx  
import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@lib/supabase';

interface AuthContextType {
  user: User | null;
  signInWithOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Auth methods
  const login = async (credentials) => {
    // Implementation
  };
  
  const logout = () => {
    // Implementation
  };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Best Practices

### 1. Props Interfaces

Always define explicit interfaces for component props:

```tsx
interface UserProfileProps {
  userId: string;
  name: string;
  email: string;
  onUpdate: (userId: string, data: UserUpdateData) => void;
}
```

### 2. Avoid Prop Drilling

If you're passing props through more than 2 levels of components, consider:
- Using context for widely needed values
- Restructuring component hierarchy
- Composing components differently

### 3. Component Composition

Prefer composition over complex conditional rendering:

```tsx
// Instead of this:
const UserProfile = ({ userId, isAdmin }) => (
  <div>
    <UserInfo userId={userId} />
    {isAdmin && <AdminControls userId={userId} />}
  </div>
);

// Use this:
const UserProfile = ({ userId, children }) => (
  <div>
    <UserInfo userId={userId} />
    {children}
  </div>
);

// Usage:
<UserProfile userId="123">
  {isAdmin && <AdminControls userId="123" />}
</UserProfile>
```

### 4. Keep Components Focused

- Components should have a single responsibility
- If a component exceeds 200-300 lines, consider splitting it
- Extract repeated patterns into reusable components

### 5. State Management

- Local component state: Use `useState` for UI state
- Complex component state: Use `useReducer` for state with complex logic
- Feature-wide state: Use feature-specific contexts
- Application-wide state: Use shared contexts or state management library

### 6. Error Handling

Always implement proper error handling:

```tsx
const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const data = await apiService.getData();
    setData(data);
  } catch (err) {
    setError(err.message);
    // Optional: Log error
    logger.error('Failed to fetch data', err);
  } finally {
    setLoading(false);
  }
};
```

### 7. Accessibility

- All interactive elements should be keyboard accessible
- Use semantic HTML elements
- Include proper ARIA attributes when needed
- Ensure sufficient color contrast
- Support screen readers

### 8. Performance Considerations

- Use `memo` for components that render often but rarely change
- Use `useCallback()` for callback functions passed to child components
- Use `useMemo()` for expensive calculations
- Use virtualization for long lists (react-window or similar libraries)
