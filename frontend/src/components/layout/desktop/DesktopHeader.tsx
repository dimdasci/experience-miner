
import { CreditsDisplay } from '../../credits/CreditsDisplay';
import { UserMenu } from '../../auth/UserMenu';
import { ThemeToggle } from '../../ui/ThemeToggle';

const DesktopHeader = () => {
  return (
    <header className="h-16 flex items-center justify-between border-b bg-background flex-shrink-0">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold">espejo</h1>
      </div>
      
      <div className="flex items-center space-x-6">
        <CreditsDisplay />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
};

export default DesktopHeader;