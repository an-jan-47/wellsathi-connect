/**
 * Shared sorting utilities for consistent alphabetical ordering across all dropdowns.
 * Single source of truth — avoids duplicate sorting logic.
 */

/** Sort a string array alphabetically (case-insensitive). */
export function sortAlpha(items: readonly string[]): string[] {
  return [...items].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

/** Sort an array of objects by a string property (case-insensitive). */
export function sortAlphaBy<T>(items: T[], key: keyof T): T[] {
  return [...items].sort((a, b) => {
    const valA = String(a[key] ?? '');
    const valB = String(b[key] ?? '');
    return valA.localeCompare(valB, undefined, { sensitivity: 'base' });
  });
}
