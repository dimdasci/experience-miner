import React from 'react';
import { Button } from '../../ui/button';
import { LogOut } from 'lucide-react';

interface UserMenuUIProps {
  userPrefix: string;
  onSignOut: () => void;
  creditsElement: React.ReactNode;
}

export const UserMenuUI: React.FC<UserMenuUIProps> = ({ userPrefix, onSignOut, creditsElement }) => (
  <div className="flex items-center space-x-4">
    {creditsElement}
    <span className="text-sm text-muted-foreground">{userPrefix}</span>
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
