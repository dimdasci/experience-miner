import Logo from '../../ui/Logo';
import CreditsDisplayContainer from '../../credits/containers/CreditsDisplayContainer';
import UserMenuContainer from '../../auth/containers/UserMenuContainer';
import { ThemeToggle } from '../../ui/ThemeToggle';

const DesktopHeader = () => {
  return (
    <header className="h-16 flex items-center justify-between border-b bg-background flex-shrink-0">
      <div className="flex items-center">
        <Logo />
      </div>
      
      <div className="flex items-center space-x-6">
        <CreditsDisplayContainer />
        <ThemeToggle />
        <UserMenuContainer />
      </div>
    </header>
  );
};

export default DesktopHeader;