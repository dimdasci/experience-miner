import Logo  from '@/components/ui/Logo';

interface WelcomeMessageProps {
  step: 'email' | 'otp';
}

const WelcomeMessage = ({ step }: WelcomeMessageProps) => {
  return (
    <>
      <div className="text-center">
        <Logo/>
        <h1 className="text-2xl font-bold">Uncover hidden gems in your career</h1>
        { step === 'email' ? (
          <>
            <p className="text-secondary mt-2">
              AI-guided conversations help you remember and organize achievements for stronger applications
            </p>
          </>
        ) : null}
      </div>
    </>
  );
};

export default WelcomeMessage;