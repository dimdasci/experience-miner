import { ReactNode } from 'react';
import DesktopHeader from '../desktop/DesktopHeader';
import DesktopNavigation from '../desktop/DesktopNavigation';

interface DesktopLayoutProps {
  children: ReactNode;
}

const DesktopLayout = ({ children }: DesktopLayoutProps) => {
  return (
    <div className="h-full bg-background">
      <div className="mx-auto max-w-[1280px] min-w-[1024px] px-6 h-full flex flex-col">
        <DesktopHeader />
        <DesktopNavigation />
        <main className="flex-1 bg-background overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DesktopLayout;