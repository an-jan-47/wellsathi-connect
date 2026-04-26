/**
 * TypeScript interfaces for Zustand global state management
 * 
 * This file defines the core state interfaces used across the application.
 * Requirements: 12.1, 12.2, 12.3
 */

import type { SearchFilters } from '@/types';

/**
 * Search and filter state interface
 * Persisted across navigation to maintain user context
 */
export interface SearchState {
  filters: SearchFilters;
  searchQuery: string;
  selectedSpecialty: string | null;
  
  // Actions
  setFilters: (filters: Partial<SearchFilters>) => void;
  setSearchQuery: (query: string) => void;
  setSelectedSpecialty: (specialty: string | null) => void;
  resetFilters: () => void;
}

/**
 * UI state interface for managing global UI elements
 * Includes modals, overlays, and loading states
 */
export interface UIState {
  isSearchModalOpen: boolean;
  isMobileMenuOpen: boolean;
  isBookingModalOpen: boolean;
  globalLoading: boolean;
  
  // Actions
  setSearchModalOpen: (isOpen: boolean) => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
  setBookingModalOpen: (isOpen: boolean) => void;
  setGlobalLoading: (isLoading: boolean) => void;
}

/**
 * Navigation state interface
 * Tracks current route and scroll position for smooth navigation
 */
export interface NavigationState {
  currentPath: string;
  previousPath: string | null;
  scrollPosition: number;
  
  // Actions
  setCurrentPath: (path: string) => void;
  setScrollPosition: (position: number) => void;
}
