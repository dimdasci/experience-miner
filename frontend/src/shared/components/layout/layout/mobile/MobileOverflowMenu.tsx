import { useState } from 'react';
import { MoreVertical, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { MobileThemeToggle } from '../../ui/MobileThemeToggle';
import UserMenuContainer from '../../auth/containers/UserMenuContainer';
import MobileFooter from './MobileFooter';

const MobileOverflowMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 p-0"
      >
        {isOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <MoreVertical className="h-4 w-4" />
        )}
        <span className="sr-only">Open menu</span>
      </Button>

      {isOpen && (
        <>
          {/* Overlay to close menu */}
          <div 
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu content */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-background border rounded-md shadow-lg z-50 animate-in slide-in-from-top-2">
            <div className="py-2">
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <span className="text-sm font-medium">Settings</span>
                <MobileThemeToggle />
              </div>
              
              <div className="px-2 py-2">
                <UserMenuContainer variant="mobile" />
              </div>
              
              <div className="px-2">
                <MobileFooter />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileOverflowMenu;