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
  );
};

export default OTPStep;