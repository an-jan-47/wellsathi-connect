/**
 * UI State Store
 * 
 * Manages global UI state including modals, overlays, and loading states.
 * Does not persist to storage as UI state should reset on page reload.
 * 
 * Requirements: 12.1, 12.2, 12.3
 */

import { create } from 'zustand';
import type { UIState } from './types';

export const useUIStore = create<UIState>((set) => ({
  isSearchModalOpen: false,
  isMobileMenuOpen: false,
  isBookingModalOpen: false,
  globalLoading: false,

  setSearchModalOpen: (isOpen) =>
    set({ isSearchModalOpen: isOpen }),

  setMobileMenuOpen: (isOpen) =>
    set({ isMobileMenuOpen: isOpen }),

  setBookingModalOpen: (isOpen) =>
    set({ isBookingModalOpen: isOpen }),

  setGlobalLoading: (isLoading) =>
    set({ globalLoading: isLoading }),
}));

/**
 * Selectors for selective state subscriptions (Requirement 12.2, 12.3)
 * These prevent unnecessary re-renders by allowing components to subscribe
 * only to the specific state slices they need.
 */

// Selector for search modal state
export const useSearchModalState = () =>
  useUIStore((state) => state.isSearchModalOpen);

// Selector for mobile menu state
export const useMobileMenuState = () =>
  useUIStore((state) => state.isMobileMenuOpen);

// Selector for booking modal state
export const useBookingModalState = () =>
  useUIStore((state) => state.isBookingModalOpen);

// Selector for global loading state
export const useGlobalLoadingState = () =>
  useUIStore((state) => state.globalLoading);

// Selector for actions only (doesn't cause re-renders on state changes)
export const useUIActions = () =>
  useUIStore((state) => ({
    setSearchModalOpen: state.setSearchModalOpen,
    setMobileMenuOpen: state.setMobileMenuOpen,
    setBookingModalOpen: state.setBookingModalOpen,
    setGlobalLoading: state.setGlobalLoading,
  }));
