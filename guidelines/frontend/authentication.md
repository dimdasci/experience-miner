# Authentication Implementation

## Prerequisites

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.52.0",
    "react": "^19.1.0"
  }
}
```

## Setup

1. Initialize Supabase client:
```typescript
// src/shared/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

2. Create AuthContext:
```typescript
// src/shared/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@shared/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithOTP: (email: string) => Promise<{ error: any }>;
  verifyOTP: (email: string, token: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithOTP = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }
    });
    return { error };
  };

  const verifyOTP = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithOTP, verifyOTP, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

3. Wrap app with AuthProvider:
```typescript
// src/App.tsx
import { AuthProvider } from '@shared/contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
}
```

## Usage

### Login Component
```typescript
const { signInWithOTP } = useAuth();

const handleLogin = async (email: string) => {
  const { error } = await signInWithOTP(email);
  if (error) {
    // Handle error
  }
  // User receives email with OTP code
};
```

### OTP Verification Component
```typescript
const { verifyOTP } = useAuth();

const handleVerify = async (email: string, code: string) => {
  const { error } = await verifyOTP(email, code);
  if (error) {
    // Handle error
  }
  // User is authenticated, onAuthStateChange fires automatically
};
```

### Protected Component
```typescript
const { user, loading } = useAuth();

if (loading) return <div>Loading...</div>;
if (!user) return <Navigate to="/login" />;

return <div>Protected content</div>;
```

### Logout
```typescript
const { signOut } = useAuth();

const handleLogout = async () => {
  await signOut();
  // User is logged out, onAuthStateChange fires automatically
};
```

## API Integration

Get access token for authenticated requests:
```typescript
const session = await supabase.auth.getSession();
const token = session.data.session?.access_token;

fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Auth Flow

1. User enters email → `signInWithOTP(email)` → Supabase sends OTP email
2. User enters OTP code → `verifyOTP(email, code)` → Supabase validates
3. On success → `onAuthStateChange` fires → Context updates `user` and `session`
4. Token auto-refreshes → `onAuthStateChange` fires with new session
5. User logs out → `signOut()` → Context clears state

## UI Components

### Auth Form Hook

```typescript
// src/features/auth/hooks/useAuthForm.ts
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
    const { error: err } = await signInWithOTP(email);
    if (err) {
      setError(err.message);
    } else {
      setStep('otp');
    }
    setLoading(false);
  };

  const verifyCode = async () => {
    if (!otp || otp.length !== 6) return;
    setLoading(true);
    setError('');
    const { error: err } = await verifyOTP(email, otp);
    if (err) {
      setError(err.message);
      setOtp('');
    }
    setLoading(false);
  };

  const reset = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setError('');
  };

  return { email, setEmail, otp, setOtp, step, loading, error, sendCode, verifyCode, reset };
};
```

### Email Input Step

```typescript
// src/features/auth/elements/EmailStep.tsx
interface EmailStepProps {
  email: string;
  loading: boolean;
  onEmailChange: (val: string) => void;
  onSend: () => void;
}

const EmailStep = ({ email, loading, onEmailChange, onSend }: EmailStepProps) => {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSend(); }}>
      <label htmlFor="email">
        Sign in or sign up with just your email
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={e => onEmailChange(e.target.value)}
        placeholder="email"
        required
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !email}
      >
        {loading ? 'Sending...' : 'Get Started'}
      </button>
    </form>
  );
};
```

### OTP Input Step

```typescript
// src/features/auth/elements/OTPStep.tsx
interface OTPStepProps {
  email: string;
  otp: string;
  loading: boolean;
  onOtpChange: (val: string) => void;
  onVerify: () => void;
  onReset: () => void;
}

const OTPStep = ({ email, otp, loading, onOtpChange, onVerify, onReset }: OTPStepProps) => {
  return (
    <div>
      <h2>Check your email</h2>
      <p>We sent a 6-digit code to {email}</p>

      <form onSubmit={(e) => { e.preventDefault(); onVerify(); }}>
        <input
          type="text"
          maxLength={6}
          value={otp}
          onChange={e => onOtpChange(e.target.value)}
          placeholder="000000"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || otp.length !== 6}
        >
          {loading ? 'Verifying...' : 'Verify code'}
        </button>
      </form>

      <button onClick={onReset} disabled={loading}>
        Use a different email
      </button>
    </div>
  );
};
```

### Main Auth Form

```typescript
// src/features/auth/containers/AuthFormContainer.tsx
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
```

```typescript
// src/features/auth/views/AuthFormUI.tsx
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
  <div>
    {error && <div className="error">{error}</div>}

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

### UI Component Flow

1. **Email step** - User enters email, clicks submit
2. **Hook calls** `signInWithOTP(email)` → Supabase sends email
3. **Step changes** to `'otp'` → Renders OTPStep component
4. **OTP step** - User enters 6-digit code, clicks verify
5. **Hook calls** `verifyOTP(email, otp)` → Supabase validates
6. **On success** - `onAuthStateChange` fires → User redirected
7. **On error** - Error message displayed, OTP input cleared
8. **Reset** - Returns to email step, clears all state
