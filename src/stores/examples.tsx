/**
 * Example Components Demonstrating Store Usage
 * 
 * These examples show best practices for using Zustand stores
 * with selective subscriptions to prevent unnecessary re-renders.
 * 
 * Requirements: 12.2, 12.3
 */

import { useSearchFilters, useSearchActions, useUIActions, useSearchModalState } from './index';

/**
 * Example 1: Search Filter Component
 * Only subscribes to filters, not the entire search state
 */
export function SearchFilterExample() {
  // Selective subscription - only re-renders when filters change
  const filters = useSearchFilters();
  
  // Actions never cause re-renders
  const { setFilters, resetFilters } = useSearchActions();

  return (
    <div>
      <input
        type="text"
        placeholder="Location"
        value={filters.location}
        onChange={(e) => setFilters({ location: e.target.value })}
      />
      <input
        type="text"
        placeholder="Specialty"
        value={filters.specialty}
        onChange={(e) => setFilters({ specialty: e.target.value })}
      />
      <button onClick={resetFilters}>Reset</button>
    </div>
  );
}

/**
 * Example 2: Modal Toggle Component
 * Only subscribes to modal state, not all UI state
 */
export function SearchModalToggleExample() {
  // Selective subscription - only re-renders when modal state changes
  const isOpen = useSearchModalState();
  
  // Actions never cause re-renders
  const { setSearchModalOpen } = useUIActions();

  return (
    <button onClick={() => setSearchModalOpen(!isOpen)}>
      {isOpen ? 'Close' : 'Open'} Search
    </button>
  );
}

/**
 * Example 3: Action-Only Component
 * Never re-renders because it only uses actions
 */
export function SearchResetButtonExample() {
  // Only actions - this component never re-renders from store changes
  const { resetFilters } = useSearchActions();

  return (
    <button onClick={resetFilters}>
      Clear All Filters
    </button>
  );
}

/**
 * Example 4: Multiple Selective Subscriptions
 * Subscribes to multiple state slices independently
 */
export function SearchSummaryExample() {
  const filters = useSearchFilters();
  const isModalOpen = useSearchModalState();
  
  // This component only re-renders when filters OR modal state changes
  // It won't re-render if other search state (like searchQuery) changes
  
  return (
    <div>
      <p>Location: {filters.location || 'Any'}</p>
      <p>Specialty: {filters.specialty || 'Any'}</p>
      <p>Modal: {isModalOpen ? 'Open' : 'Closed'}</p>
    </div>
  );
}
