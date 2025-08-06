import { useState, useEffect } from 'react';

export type ViewportType = 'desktop' | 'mobile';

export const useViewport = (): ViewportType => {
  const [viewport, setViewport] = useState<ViewportType>(
    window.innerWidth >= 1024 ? 'desktop' : 'mobile'
  );

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setViewport(window.innerWidth >= 1024 ? 'desktop' : 'mobile');
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