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
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email address
          </label>
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

        <Button type="submit" className="w-full" disabled={loading || !email}>
          {loading ? 'Sending...' : 'Send verification code'}
        </Button>
      </form>
    </div>
  );
};

export default EmailStep;