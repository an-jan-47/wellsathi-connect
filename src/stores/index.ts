/**
 * Zustand Store Exports
 * 
 * Central export point for all Zustand stores and their selectors.
 * This provides a clean import interface for components.
 * 
 * Requirements: 12.1, 12.2, 12.3
 */

// Auth Store
export { useAuthStore } from './authStore';

// Search Store
export {
  useSearchStore,
  useSearchFilters,
  useSearchQuery,
  useSelectedSpecialty,
  useSearchActions,
} from './searchStore';

// UI Store
export {
  useUIStore,
  useSearchModalState,
  useMobileMenuState,
  useBookingModalState,
  useGlobalLoadingState,
  useUIActions,
} from './uiStore';

// Navigation Store
export {
  useNavigationStore,
  useCurrentPath,
  usePreviousPath,
  useScrollPosition,
  useNavigationActions,
} from './navigationStore';

// Types
export type { SearchState, UIState, NavigationState } from './types';
