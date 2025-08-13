import React from 'react';
import { Button } from '../../ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../../ui/input-otp';

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
    <div className="w-full max-w-lg mx-auto bg-surface rounded-lg p-16 space-y-8">
      <div className="text-center">
        <h2 className="text-headline font-medium">Check your email</h2>
        <p className="text-body-sm text-secondary mt-2">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>
      </div>

      <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); onVerify(); }} className="space-y-8 max-w-sm mx-auto">
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
          variant={otp.length !== 6 ? 'default' : 'accent'}
        >
          {loading ? 'Verifying...' : 'Verify code'}
        </Button>
      </form>

      <div className="text-center max-w-sm mx-auto">
        <Button
          variant="link"
          onClick={onReset}
          disabled={loading}
          className="text-body-sm"
        >
          Use a different email
        </Button>
      </div>
    </div>
  );
};

export default OTPStep;