import { ReactNode } from 'react';
import MobileHeader from '../mobile/MobileHeader';
import MobileBottomNav from '../mobile/MobileBottomNav';

interface MobileLayoutProps {
  children: ReactNode;
}

const MobileLayout = ({ children }: MobileLayoutProps) => {
  return (
    <div className="h-full bg-background flex flex-col">
      <MobileHeader />
      
      {/* Main content area with internal scrolling */}
      <main className="flex-1 overflow-y-auto px-4 flex flex-col">
        {children}
      </main>
      
      <MobileBottomNav />
    </div>
  );
};

export default MobileLayout;