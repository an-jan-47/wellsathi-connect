import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of the provided value.
 * Updates the debounced value after the specified delay of inactivity.
 *
 * @param value - The raw value to debounce
 * @param delay - Debounce delay in ms (default: 300)
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
