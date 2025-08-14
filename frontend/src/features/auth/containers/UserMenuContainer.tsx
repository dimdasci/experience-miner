import { useUserMenu } from '../hooks/useUserMenu';
import { UserMenuUI } from '../views/UserMenuUI';
import { MobileUserMenuUI } from '../views/MobileUserMenuUI';

interface UserMenuContainerProps {
  variant?: 'desktop' | 'mobile';
}

const UserMenuContainer = ({ variant = 'desktop' }: UserMenuContainerProps) => {
  const { user, userPrefix, signOut } = useUserMenu();
  if (!user) return null;
  
  const UIComponent = variant === 'mobile' ? MobileUserMenuUI : UserMenuUI;
  
  return (
    <UIComponent
      userPrefix={userPrefix}
      onSignOut={signOut}
    />
  );
};

export default UserMenuContainer;
