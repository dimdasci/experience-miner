import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signInWithOTP, verifyOTP } = useAuth();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    const { error } = await signInWithOTP(email);

    if (error) {
      setError(error.message);
    } else {
      setStep('otp');
    }

    setLoading(false);
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return;

    setLoading(true);
    setError('');

    const { error } = await verifyOTP(email, otp);

    if (error) {
      setError(error.message);
      setOtp('');
    }

    setLoading(false);
  };

  const handleOTPComplete = (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      handleOTPSubmit(new Event('submit') as any);
    }
  };

  const resetForm = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome to Experience Miner</h1>
        <p className="text-muted-foreground mt-2">
          Mine your career experiences through AI-powered interviews
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {step === 'email' ? (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || !email}>
            {loading ? 'Sending...' : 'Send verification code'}
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-medium">Check your email</h2>
            <p className="text-sm text-muted-foreground mt-1">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
          </div>

          <form onSubmit={handleOTPSubmit} className="space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={handleOTPComplete}
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
              onClick={resetForm}
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
}