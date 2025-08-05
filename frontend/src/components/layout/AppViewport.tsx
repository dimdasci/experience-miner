import React, { ReactNode } from 'react';

interface AppViewportProps {
  children: ReactNode;
}

/**
 * AppViewport provides the global wrapper for the entire application,
 * setting background, font, and min-height, replacing inline div in App.tsx.
 */
const AppViewport: React.FC<AppViewportProps> = ({ children }) => (
  <div className="min-h-screen bg-background font-sans antialiased">
    {children}
  </div>
);

export default AppViewport;
