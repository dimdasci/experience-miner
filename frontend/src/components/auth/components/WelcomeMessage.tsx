import { HeartHandshake } from 'lucide-react';

interface WelcomeMessageProps {
  step: 'email' | 'otp';
}

const WelcomeMessage = ({ step }: WelcomeMessageProps) => {
  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-bold">Remember What You've Accomplished</h1>
        <p className="text-muted-foreground mt-2">
          Beat the blank page - rediscover your professional experiences through conversational interviews
        </p>
      </div>

      {step === 'email' && (
        <div className="w-full max-w-md mx-auto space-y-6 p-6 text-center">
          <div className="mt-2">Get free credits to try it out.</div>
          <div className="mt-2">Early preview version - help us make it better</div>
          <HeartHandshake />
        </div>
      )}
    </>
  );
};

export default WelcomeMessage;