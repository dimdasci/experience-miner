import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserJourneyLogger } from '../utils/logger';

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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        const userPrefix = session.user.email?.split('@')[0] ?? 'unknown';
        // Set user context in Sentry for all subsequent events
        UserJourneyLogger.setUser(session.user.id, { 
          email_prefix: userPrefix
        });
        UserJourneyLogger.logUserAction({ 
          action: 'session_restored',
          data: { user: userPrefix }
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      const userPrefix = session?.user?.email?.split('@')[0] ?? 'unknown';
      
      if (session?.user) {
        // Set user context in Sentry for all subsequent events
        UserJourneyLogger.setUser(session.user.id, { 
          email_prefix: userPrefix
        });
      }
      
      UserJourneyLogger.logUserAction({ 
        action: 'auth_state_changed',
        data: { event, user: userPrefix }
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithOTP = async (email: string) => {
    const userPrefix = email.split('@')[0];
    UserJourneyLogger.logUserAction({ 
      action: 'otp_signin_initiated',
      data: { user: userPrefix }
    });
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      UserJourneyLogger.logError(new Error('OTP sign in failed'), { user: userPrefix, error: error.message });
    } else {
      UserJourneyLogger.logUserAction({ 
        action: 'otp_sent',
        data: { user: userPrefix }
      });
    }

    return { error };
  };

  const verifyOTP = async (email: string, token: string) => {
    const userPrefix = email.split('@')[0];
    UserJourneyLogger.logUserAction({ 
      action: 'otp_verification_started',
      data: { user: userPrefix }
    });

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      UserJourneyLogger.logError(new Error('OTP verification failed'), { user: userPrefix, error: error.message });
    } else {
      UserJourneyLogger.logUserAction({ 
        action: 'otp_verification_successful',
        data: { user: userPrefix }
      });
      // Note: User context will be set by the auth state change handler
    }

    return { error };
  };

  const signOut = async () => {
    const userPrefix = user?.email?.split('@')[0] ?? 'unknown';
    UserJourneyLogger.logUserAction({ 
      action: 'signout_initiated',
      data: { user: userPrefix }
    });
    
    await supabase.auth.signOut();
    
    // Clear user context in Sentry
    UserJourneyLogger.setUser('', {});
    
    UserJourneyLogger.logUserAction({ 
      action: 'signout_completed',
      data: { user: userPrefix }
    });
  };

  const value = {
    user,
    session,
    loading,
    signInWithOTP,
    verifyOTP,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}