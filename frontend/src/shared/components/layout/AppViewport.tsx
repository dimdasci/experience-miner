import { ReactNode } from 'react';

interface AppViewportProps {
  children: ReactNode;
}

/**
 * AppViewport provides the global wrapper for the entire application,
 * setting background, font, and min-height, replacing inline div in App.tsx.
 */
const AppViewport = ({ children }: AppViewportProps) => (
  <div className="dynamic-viewport-height bg-background font-sans antialiased">
    {children}
  </div>
);

export default AppViewport;
