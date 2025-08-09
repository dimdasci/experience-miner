import Logo from '../../ui/Logo';
import CreditsDisplayContainer from '../../credits/containers/CreditsDisplayContainer';
import UserMenuContainer from '../../auth/containers/UserMenuContainer';
import { ThemeToggle } from '../../ui/ThemeToggle';

const DesktopHeader = () => {
  return (
    <header className="flex-shrink-0 w-full bg-surface sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Logo />
          </div>
          
          <div className="flex items-center space-x-4 sm:space-x-6 text-body-sm">
            <CreditsDisplayContainer />
            <ThemeToggle />
            <UserMenuContainer />
          </div>
        </div>
      </div>
    </header>
  );
};

export default DesktopHeader;