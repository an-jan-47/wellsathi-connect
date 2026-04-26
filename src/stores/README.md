# Zustand Store Documentation

This directory contains the global state management implementation using Zustand 5.0+.

## Architecture Overview

The store architecture follows these principles:

1. **Separation of Concerns**: Each store manages a specific domain (auth, search, UI, navigation)
2. **Selective Subscriptions**: Exported selectors prevent unnecessary re-renders (Requirement 12.2, 12.3)
3. **State Persistence**: Uses sessionStorage for temporary state across navigation (Requirement 12.4, 19.1)
4. **Type Safety**: Full TypeScript support with strict typing

## Store Structure

### `authStore.ts`
Manages authentication state including user, session, profile, and roles.

**Usage:**
```typescript
import { useAuthStore } from '@/stores';

// Subscribe to entire store (causes re-render on any auth state change)
const { user, profile, signIn, signOut } = useAuthStore();

// Better: Subscribe to specific state slices
const user = useAuthStore((state) => state.user);
const signIn = useAuthStore((state) => state.signIn);
```

### `searchStore.ts`
Manages search filters, query, and selected specialty. Persists to sessionStorage.

**Usage:**
```typescript
import { useSearchFilters, useSearchActions } from '@/stores';

function SearchComponent() {
  // Subscribe only to filters (no re-render when query changes)
  const filters = useSearchFilters();
  
  // Get actions (never causes re-renders)
  const { setFilters, resetFilters } = useSearchActions();
  
  return (
    <div>
      <input 
        value={filters.location}
        onChange={(e) => setFilters({ location: e.target.value })}
      />
    </div>
  );
}
```

### `uiStore.ts`
Manages global UI state (modals, loading states). Does not persist.

**Usage:**
```typescript
import { useSearchModalState, useUIActions } from '@/stores';

function Header() {
  // Subscribe only to search modal state
  const isOpen = useSearchModalState();
  
  // Get actions
  const { setSearchModalOpen } = useUIActions();
  
  return (
    <button onClick={() => setSearchModalOpen(true)}>
      Open Search
    </button>
  );
}
```

### `navigationStore.ts`
Manages navigation state and scroll position. Persists to sessionStorage.

**Usage:**
```typescript
import { useCurrentPath, useNavigationActions } from '@/stores';

function NavigationTracker() {
  const currentPath = useCurrentPath();
  const { setCurrentPath } = useNavigationActions();
  
  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, [window.location.pathname]);
  
  return null;
}
```

## Best Practices

### 1. Use Selectors to Prevent Prop Drilling (Requirement 12.2)

**Bad:**
```typescript
// Prop drilling through multiple levels
<Parent>
  <Child filters={filters} setFilters={setFilters}>
    <GrandChild filters={filters} setFilters={setFilters}>
      <GreatGrandChild filters={filters} setFilters={setFilters} />
    </GrandChild>
  </Child>
</Parent>
```

**Good:**
```typescript
// Each component subscribes directly to needed state
function GreatGrandChild() {
  const filters = useSearchFilters();
  const { setFilters } = useSearchActions();
  // Use filters and setFilters directly
}
```

### 2. Subscribe to Minimal State (Requirement 12.3)

**Bad:**
```typescript
// Component re-renders on ANY search state change
const { filters, searchQuery, selectedSpecialty } = useSearchStore();
```

**Good:**
```typescript
// Component only re-renders when filters change
const filters = useSearchFilters();
```

### 3. Separate Actions from State

**Bad:**
```typescript
// Re-renders when state changes even though we only need actions
const { setFilters } = useSearchStore();
```

**Good:**
```typescript
// Never causes re-renders
const { setFilters } = useSearchActions();
```

### 4. Batch State Updates (Requirement 31.3)

```typescript
// Zustand automatically batches updates in the same function
const { setFilters, setSearchQuery } = useSearchActions();

function handleSearch(location: string, query: string) {
  // These updates are batched - only one re-render
  setFilters({ location });
  setSearchQuery(query);
}
```

## State Persistence

### sessionStorage vs localStorage (Requirement 19.1)

- **sessionStorage**: Used for search, navigation state (temporary, cleared on tab close)
- **httpOnly cookies**: Used for authentication tokens (handled by Supabase)
- **localStorage**: Avoided for sensitive data per security requirements

### Persisted Stores

- `searchStore`: Maintains filters across navigation within session
- `navigationStore`: Maintains scroll position and path history within session
- `uiStore`: NOT persisted (UI state resets on reload)
- `authStore`: NOT persisted (handled by Supabase session management)

## TypeScript Types

All store types are defined in `types.ts` and exported from `index.ts`:

```typescript
import type { SearchState, UIState, NavigationState } from '@/stores';
```

## Testing

When testing components that use stores:

```typescript
import { useSearchStore } from '@/stores';

// Reset store state before each test
beforeEach(() => {
  useSearchStore.setState({
    filters: initialFilters,
    searchQuery: '',
    selectedSpecialty: null,
  });
});
```

## Requirements Mapping

- **12.1**: Centralized state management with Zustand
- **12.2**: Selective subscriptions via exported selectors
- **12.3**: Avoid prop drilling beyond 2 levels
- **12.4**: State persistence across navigation using sessionStorage
- **19.1**: Avoid localStorage for sensitive data
- **31.3**: Automatic state batching for smooth transitions
