import Logo  from '@/components/ui/Logo';

interface WelcomeMessageProps {
  step: 'email' | 'otp';
}

const WelcomeMessage = ({ step }: WelcomeMessageProps) => {
  return (
    <>
      <div className="text-center">
        <div className="mb-8">
          <Logo/>
        </div>
        <h1 className="text-display font-bold leading-tight mb-6">Uncover hidden gems in your career</h1>
        { step === 'email' ? (
          <>
            <p className="text-headline text-secondary">
              AI-guided conversations help you remember and organize achievements for stronger applications
            </p>
          </>
        ) : null}
      </div>
    </>
  );
};

export default WelcomeMessage;