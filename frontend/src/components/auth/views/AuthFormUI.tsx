import React from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../../ui/input-otp';
import { HeartHandshake } from 'lucide-react';

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
  <div className="w-full max-w-md mx-auto space-y-6 p-6">
    <div className="text-center">
      <h1 className="text-2xl font-bold">Remember What You've Accomplished</h1>
      <p className="text-muted-foreground mt-2">
        Beat the blank page - rediscover your professional experiences through conversational interviews
      </p>
    </div>

    {error && (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md text-sm">
        {error}
      </div>
    )}

    {step === 'email' ? (
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
        <div className="w-full max-w-md mx-auto space-y-6 p-6 text-center">
          <div className="mt-2">Get free credits to try it out.</div>
          <div className="mt-2">Early preview version - help us make it better</div>
          <HeartHandshake />
        </div>
      </div>
    ) : (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-medium">Check your email</h2>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); onVerify(); }} className="space-y-4">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={onOtpChange}
              disabled={loading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || otp.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify code'}
          </Button>
        </form>

        <div className="text-center">
          <Button
            variant="link"
            onClick={onReset}
            disabled={loading}
            className="text-sm"
          >
            Use a different email
          </Button>
        </div>
      </div>
    )}
  </div>
);
