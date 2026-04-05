import { useEffect, useRef } from 'react';

const BASE_TITLE = 'WellSathi';

/**
 * Sets the document title declaratively.
 * Reverts to base title on unmount to prevent stale titles.
 *
 * @param title - Page-specific title (e.g. "Search Clinics")
 * @param options.restoreOnUnmount - Whether to restore the base title on unmount (default: true)
 */
export function useDocumentTitle(
  title: string | undefined,
  options: { restoreOnUnmount?: boolean } = {}
) {
  const { restoreOnUnmount = true } = options;
  const previousTitle = useRef(document.title);

  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE;

    return () => {
      if (restoreOnUnmount) {
        document.title = prev;
      }
    };
  }, [title, restoreOnUnmount]);
}
