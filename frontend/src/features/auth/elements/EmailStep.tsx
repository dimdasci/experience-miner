import React from 'react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';

interface EmailStepProps {
  email: string;
  loading: boolean;
  onEmailChange: (val: string) => void;
  onSend: () => void;
}

const EmailStep = ({ email, loading, onEmailChange, onSend }: EmailStepProps) => {
  return (
    <div className="w-full max-w-lg mx-auto bg-surface rounded-lg px-8 py-10 md:p-16">
      <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); onSend(); }} className="space-y-8">
        <div className="max-w-sm mx-auto">
          <label htmlFor="email" className="block text-body font-medium mb-2">
            Sign in or sign up with just your email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => onEmailChange(e.target.value)}
            placeholder="email"
            required
            disabled={loading}
          />
        </div>

        <div className="text-center w-full max-w-sm mx-auto">
          <p className="mb-4 text-body-sm text-secondary">
            By clicking "Get Started," you agree to our<br />
            <a href="/terms" className="text-accent hover:underline focus-transitional-invert">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-accent hover:underline focus-transitional-invert">Privacy Policy</a>.
          </p>
          <Button 
            type="submit" 
            disabled={loading || !email}
            variant={!email ? 'default' : 'accent'}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Get Started'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EmailStep;