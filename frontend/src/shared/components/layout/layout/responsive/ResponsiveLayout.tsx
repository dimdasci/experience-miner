import { ReactNode, Suspense, lazy } from 'react';
import { useViewport } from './hooks/useViewport';

// Lazy load layouts for better performance
const DesktopLayout = lazy(() => import('./DesktopLayout'));
const MobileLayout = lazy(() => import('./MobileLayout'));

interface ResponsiveLayoutProps {
  children: ReactNode;
}

const ResponsiveLayout = ({ children }: ResponsiveLayoutProps) => {
  const viewport = useViewport();

  return (
    <div className="h-full">
      <Suspense fallback={<div className="h-screen bg-background" />}>
        {viewport === 'desktop' ? (
          <DesktopLayout>{children}</DesktopLayout>
        ) : (
          <MobileLayout>{children}</MobileLayout>
        )}
      </Suspense>
    </div>
  );
};

export default ResponsiveLayout;