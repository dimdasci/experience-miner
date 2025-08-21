import { ReactNode } from 'react';
import DesktopHeader from '../desktop/DesktopHeader';
import DesktopNavigation from '../desktop/DesktopNavigation';
import DesktopFooter from '../desktop/DesktopFooter';

interface DesktopLayoutProps {
  children: ReactNode;
}

const DesktopLayout = ({ children }: DesktopLayoutProps) => {
  return (
    <div className="h-full flex flex-col">
      <DesktopHeader />
      <DesktopNavigation />
      <main className="flex-1 min-h-0 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
        {children}
      </main>
      <DesktopFooter />
    </div>
  );
};

export default DesktopLayout;