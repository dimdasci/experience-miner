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
  <div className="w-full max-w-3xl mx-auto space-y-12 p-4 md:p-6">
    <WelcomeMessage step={step} />

    {error && (
      <div className="bg-accent/10 border border-accent/20 text-accent p-3 rounded-md text-sm">
        {error}
      </div>
    )}

    {step === 'email' ? (
      <>
        <EmailStep
          email={email}
          loading={loading}
          onEmailChange={onEmailChange}
          onSend={onSend}
        />
        <div className="text-center w-full max-w-lg mx-auto">
          <p className="text-mobile-body-lg-lh md:text-body-lg text-secondary">
            New here? This gets you started with free credits.
          </p>
        </div>
      </>
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
