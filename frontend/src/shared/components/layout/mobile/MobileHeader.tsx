import Logo from '@shared/components/ui/Logo';
import CreditsDisplayContainer from '@features/credits/containers/CreditsDisplayContainer';
import MobileOverflowMenu from './MobileOverflowMenu';

const MobileHeader = () => {
  return (
    <header 
      className="h-14 bg-surface border-b flex-shrink-0"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }}
    >
      <div className="px-4 py-3 flex justify-between items-center">
        {/* Brand logo */}
        <Logo />
        
        {/* Right side: Credits + Menu */}
        <div className="flex items-center space-x-2 md:space-x-3">
          <CreditsDisplayContainer variant="mobile" />
          <MobileOverflowMenu />
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;