interface MobileUserMenuUIProps {
  userPrefix: string;
  onSignOut: () => void;
}

export const MobileUserMenuUI = ({ userPrefix, onSignOut }: MobileUserMenuUIProps) => {
  const handleSignOut = () => {
    try {
      onSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="space-y-2">
      <div className="px-2 py-2 text-sm">
        <span className="font-medium truncate">{userPrefix}</span>
      </div>
      <button
        onClick={handleSignOut}
        className="w-full text-left px-2 py-2 text-sm hover:bg-neutral-bg rounded-md transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
};