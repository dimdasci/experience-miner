import React from 'react';
import { useUserMenu } from '../hooks/useUserMenu';
import { UserMenuUI } from '../views/UserMenuUI';
import { CreditsDisplay } from '../../credits/CreditsDisplay';

const UserMenuContainer: React.FC = () => {
  const { user, userPrefix, signOut } = useUserMenu();
  if (!user) return null;
  return (
    <UserMenuUI
      userPrefix={userPrefix}
      onSignOut={signOut}
      creditsElement={<CreditsDisplay />}
    />
  );
};

export default UserMenuContainer;
