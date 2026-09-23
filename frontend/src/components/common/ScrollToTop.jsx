import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * Ensures every route change resets scroll to the top of the page,
 * or smoothly scrolls to a targeted anchor hash if provided (e.g., #topics, #sponsorship).
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetElement = document.getElementById(hash.replace('#', ''));
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname, search, hash]);

  return null;
}
