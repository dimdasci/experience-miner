import { useAuth } from '@shared/contexts/AuthContext';

export const useUserMenu = () => {
  const { user, signOut } = useAuth();
  const userPrefix = user?.email?.split('@')[0] ?? 'User';
  return { user, userPrefix, signOut };
};
