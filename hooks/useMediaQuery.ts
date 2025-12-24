import { useEffect, useState } from 'react';

const DEFAULT_BREAKPOINT = 768;

export function useIsMobile(breakpoint: number = DEFAULT_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState(false);
  const [hasWindowObject, setHasWindowObject] = useState(false);

  useEffect(() => {
    setHasWindowObject(true);
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, [breakpoint]);

  return hasWindowObject ? isMobile : false;
}

export function useIsDesktop(breakpoint: number = DEFAULT_BREAKPOINT): boolean {
  const isMobile = useIsMobile(breakpoint);
  return !isMobile;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  const [hasWindowObject, setHasWindowObject] = useState(false);

  useEffect(() => {
    setHasWindowObject(true);
    const mediaQueryList = window.matchMedia(query);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQueryList.addEventListener('change', handleChange);
    setMatches(mediaQueryList.matches);

    return () => mediaQueryList.removeEventListener('change', handleChange);
  }, [query]);

  return hasWindowObject ? matches : false;
}
