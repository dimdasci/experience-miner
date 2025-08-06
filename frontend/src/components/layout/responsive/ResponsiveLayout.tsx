import { ReactNode } from 'react';
import { useViewport } from './hooks/useViewport';
import DesktopLayout from './DesktopLayout';
import MobileLayout from './MobileLayout';

interface ResponsiveLayoutProps {
  children: ReactNode;
}

const ResponsiveLayout = ({ children }: ResponsiveLayoutProps) => {
  const viewport = useViewport();

  return (
    <div className="h-full">
      {viewport === 'desktop' ? (
        <DesktopLayout>{children}</DesktopLayout>
      ) : (
        <MobileLayout>{children}</MobileLayout>
      )}
    </div>
  );
};

export default ResponsiveLayout;