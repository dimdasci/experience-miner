import { useState, useEffect } from 'react';

import { getViewportType } from '@shared/config/breakpoints';

export type ViewportType = 'desktop' | 'mobile';

export const useViewport = (): ViewportType => {
  const [viewport, setViewport] = useState<ViewportType>(
    getViewportType(window.innerWidth)
  );

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setViewport(getViewportType(window.innerWidth));
      }, 100); // Debounce for 100ms
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return viewport;
};