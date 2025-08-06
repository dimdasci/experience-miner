import CreditsDisplayContainer from '../../credits/containers/CreditsDisplayContainer';
import MobileOverflowMenu from './MobileOverflowMenu';

const MobileHeader = () => {
  return (
    <header 
      className="h-14 bg-background border-b flex-shrink-0"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }}
    >
      <div className="px-4 py-3 flex justify-between items-center">
        {/* Brand logo */}
        <h1 className="text-lg font-semibold">espejo</h1>
        
        {/* Right side: Credits + Menu */}
        <div className="flex items-center space-x-3">
          <CreditsDisplayContainer variant="mobile" />
          <MobileOverflowMenu />
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;