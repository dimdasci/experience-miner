import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';
import { CreditsDisplay } from '../credits/CreditsDisplay';

export function UserMenu() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const userPrefix = user.email?.split('@')[0] ?? 'User';

  return (
    <div className="flex items-center space-x-4">
      <CreditsDisplay />
      <span className="text-sm text-muted-foreground">
        {userPrefix}
      </span>      
      <Button
        variant="ghost"
        size="sm"
        onClick={signOut}
        className="h-8 px-2"
      >
        <LogOut className="h-4 w-4" />
        <span className="ml-1">Sign out</span>
      </Button>
    </div>
  );
}