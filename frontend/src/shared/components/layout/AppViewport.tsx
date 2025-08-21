import { ReactNode } from 'react';

interface AppViewportProps {
  children: ReactNode;
}

/**
 * AppViewport provides the global wrapper for the entire application,
 * setting background, font, and min-height, replacing inline div in App.tsx.
 * Using responsive backgrounds: 
 * - bg-surface for mobile (to match header with system UI areas)
 * - bg-background for desktop (for proper content margins)
 */
const AppViewport = ({ children }: AppViewportProps) => (
  <div className="dynamic-viewport-height bg-surface md:bg-background font-sans antialiased">
    {children}
  </div>
);

export default AppViewport;
