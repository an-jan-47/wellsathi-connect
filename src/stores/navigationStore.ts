/**
 * Navigation State Store
 * 
 * Manages navigation state including current path, previous path, and scroll position.
 * Persists scroll position across navigation for better UX.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NavigationState } from './types';

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      currentPath: '/',
      previousPath: null,
      scrollPosition: 0,

      setCurrentPath: (path) =>
        set((state) => ({
          currentPath: path,
          previousPath: state.currentPath,
        })),

      setScrollPosition: (position) =>
        set({ scrollPosition: position }),
    }),
    {
      name: 'navigation-storage',
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

// Selector for current path only
export const useCurrentPath = () =>
  useNavigationStore((state) => state.currentPath);

// Selector for previous path only
export const usePreviousPath = () =>
  useNavigationStore((state) => state.previousPath);

// Selector for scroll position only
export const useScrollPosition = () =>
  useNavigationStore((state) => state.scrollPosition);

// Selector for actions only (doesn't cause re-renders on state changes)
export const useNavigationActions = () =>
  useNavigationStore((state) => ({
    setCurrentPath: state.setCurrentPath,
    setScrollPosition: state.setScrollPosition,
  }));
