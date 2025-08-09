import { Button } from '../../ui/button';
import { LogOut } from 'lucide-react';

interface UserMenuUIProps {
  userPrefix: string;
  onSignOut: () => void;
}

export const UserMenuUI = ({ userPrefix, onSignOut }: UserMenuUIProps) => (
  <div className="flex items-center space-x-4">
    <span className="text-sm text-secondary">{userPrefix}</span>
    <Button
      variant="ghost"
      size="sm"
      onClick={onSignOut}
      className="h-8 px-2"
    >
      <LogOut className="h-4 w-4" />
      <span className="ml-1">Sign out</span>
    </Button>
  </div>
);
