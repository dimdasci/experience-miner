import { CreditsDisplayUI } from '../views/CreditsDisplayUI';
import { MobileCreditsDisplayUI } from '../views/MobileCreditsDisplayUI';
import { useCreditsDisplay } from '../hooks/useCreditsDisplay';

interface CreditsDisplayContainerProps {
  variant?: 'desktop' | 'mobile';
}

const CreditsDisplayContainer = ({ variant = 'desktop' }: CreditsDisplayContainerProps) => {
  const { credits, loading, error, onRefresh } = useCreditsDisplay();
  
  const UIComponent = variant === 'mobile' ? MobileCreditsDisplayUI : CreditsDisplayUI;
  
  return (
    <UIComponent
      credits={credits}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
    />
  );
};

export default CreditsDisplayContainer;