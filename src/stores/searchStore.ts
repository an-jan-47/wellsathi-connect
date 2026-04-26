/**
 * Search and Filter State Store
 * 
 * Manages search filters and query state with persistence across navigation.
 * Uses sessionStorage for temporary state (Requirement 19.1 - avoid localStorage for sensitive data).
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SearchState } from './types';

const initialFilters = {
  location: '',
  specialty: '',
  minFees: undefined,
  maxFees: undefined,
  minRating: undefined,
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      filters: initialFilters,
      searchQuery: '',
      selectedSpecialty: null,

      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

      setSearchQuery: (query) =>
        set({ searchQuery: query }),

      setSelectedSpecialty: (specialty) =>
        set({ selectedSpecialty: specialty }),

      resetFilters: () =>
        set({
          filters: initialFilters,
          searchQuery: '',
          selectedSpecialty: null,
        }),
    }),
    {
      name: 'search-storage',
      // Use sessionStorage for temporary state (Requirement 12.4, 19.1)
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);

/**
 * Selectors for selective state subscriptions (Requirement 12.2, 12.3)
 * These prevent unnecessary re-renders by allowing components to subscribe
 * only to the specific state slices they need.
 */

// Selector for filters only
export const useSearchFilters = () => useSearchStore((state) => state.filters);

// Selector for search query only
export const useSearchQuery = () => useSearchStore((state) => state.searchQuery);

// Selector for selected specialty only
export const useSelectedSpecialty = () => useSearchStore((state) => state.selectedSpecialty);

// Selector for actions only (doesn't cause re-renders on state changes)
export const useSearchActions = () =>
  useSearchStore((state) => ({
    setFilters: state.setFilters,
    setSearchQuery: state.setSearchQuery,
    setSelectedSpecialty: state.setSelectedSpecialty,
    resetFilters: state.resetFilters,
  }));
