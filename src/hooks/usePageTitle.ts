import { useEffect } from 'react';

/**
 * Sets the document title for the current page.
 * Automatically appends " | WellSathi" suffix.
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | WellSathi` : 'WellSathi';
    return () => { document.title = prev; };
  }, [title]);
}
