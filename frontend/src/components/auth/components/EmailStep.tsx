import React from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

interface EmailStepProps {
  email: string;
  loading: boolean;
  onEmailChange: (val: string) => void;
  onSend: () => void;
}

const EmailStep = ({ email, loading, onEmailChange, onSend }: EmailStepProps) => {
  return (
    <div>
      <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); onSend(); }} className="space-y-4">
        <div>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => onEmailChange(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={loading}
          />
        </div>

        <div className="text-center w-full">
          <Button type="submit" disabled={loading || !email}>
            {loading ? 'Sending...' : 'Get Started'}
          </Button>
          <p className="mt-4 text-sm text-secondary">
            By clicking "Get Started," you agree to our "Terms of Service" and "Privacy Policy".
          </p>
        </div>
      </form>
    </div>
  );
};

export default EmailStep;