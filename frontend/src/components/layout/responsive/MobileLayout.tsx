import { ReactNode } from 'react';

interface MobileLayoutProps {
  children: ReactNode;
}

const MobileLayout = ({ children }: MobileLayoutProps) => {
  return (
    <div className="h-full bg-background flex flex-col">
      {/* Mobile header stub */}
      <div className="h-14 bg-background border-b flex-shrink-0">
        <div className="px-4 py-3 flex justify-between items-center">
          <span className="font-semibold">espejo</span>
          <span className="text-sm text-muted-foreground">Mobile Menu</span>
        </div>
      </div>
      
      {/* Mobile content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      
      {/* Mobile bottom navigation stub */}
      <div className="h-16 bg-background border-t flex-shrink-0">
        <div className="px-4 py-2 flex justify-around items-center">
          <span className="text-xs text-muted-foreground">Guide</span>
          <span className="text-xs text-muted-foreground">Interviews</span>
          <span className="text-xs text-muted-foreground">Experience</span>
        </div>
      </div>
    </div>
  );
};

export default MobileLayout;