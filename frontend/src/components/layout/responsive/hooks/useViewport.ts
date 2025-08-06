import { useState, useEffect } from 'react';

export type ViewportType = 'desktop' | 'mobile';

export const useViewport = (): ViewportType => {
  const [viewport, setViewport] = useState<ViewportType>(
    window.innerWidth >= 1024 ? 'desktop' : 'mobile'
  );

  useEffect(() => {
    const handleResize = () => {
      setViewport(window.innerWidth >= 1024 ? 'desktop' : 'mobile');
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};