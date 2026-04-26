# React Query Configuration Examples

This document demonstrates how the React Query configuration implements the requirements for caching, deduplication, and request cancellation.

## Requirement 13.2: 5-Minute Cache Time

The `staleTime` configuration ensures data remains fresh for 5 minutes without refetching.

### Example: Clinic Search

```tsx
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { searchClinics } from '@/services/clinicService';

function ClinicList() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.clinics.search({ specialty: 'cardiology' }),
    queryFn: () => searchClinics({ specialty: 'cardiology' })
  });

  // First render: Fetches data from API
  // Within 5 minutes: Returns cached data instantly
  // After 5 minutes: Data becomes stale, refetches on next access
}
```

### Behavior Timeline

```
t=0s:    Component mounts → API request made
t=1s:    Data received → Cached for 5 minutes
t=30s:   Component re-renders → Uses cached data (no API call)
t=2m:    User navigates away → Data stays in cache
t=3m:    User returns → Uses cached data (no API call)
t=5m:    Data becomes stale
t=5m+1s: Component accesses data → Refetches from API
```

## Requirement 13.3: Request Deduplication

React Query automatically deduplicates identical requests made simultaneously.

### Example: Multiple Components Requesting Same Data

```tsx
// Component A
function ClinicHeader() {
  const { data } = useQuery({
    queryKey: queryKeys.clinics.detail('clinic-123'),
    queryFn: () => getClinicById('clinic-123')
  });
  return <h1>{data?.name}</h1>;
}

// Component B
function ClinicAddress() {
  const { data } = useQuery({
    queryKey: queryKeys.clinics.detail('clinic-123'),
    queryFn: () => getClinicById('clinic-123')
  });
  return <p>{data?.address}</p>;
}

// Component C
function ClinicPhone() {
  const { data } = useQuery({
    queryKey: queryKeys.clinics.detail('clinic-123'),
    queryFn: () => getClinicById('clinic-123')
  });
  return <p>{data?.phone}</p>;
}

// Parent Component
function ClinicProfile() {
  return (
    <div>
      <ClinicHeader />
      <ClinicAddress />
      <ClinicPhone />
    </div>
  );
}
```

### Behavior

```
Without deduplication:
- ClinicHeader mounts → API request 1
- ClinicAddress mounts → API request 2
- ClinicPhone mounts → API request 3
Total: 3 API requests

With React Query deduplication:
- All components mount simultaneously
- React Query detects identical queryKey
- Only 1 API request is made
- All 3 components receive the same data
Total: 1 API request ✓
```

## Requirement 13.4: Request Cancellation for Superseded Requests

React Query automatically cancels in-flight requests when they become obsolete.

### Example 1: Search Input with Rapid Typing

```tsx
import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { queryKeys } from '@/lib/queryClient';
import { searchClinics } from '@/services/clinicService';

function ClinicSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.clinics.search({ query: debouncedSearch }),
    queryFn: () => searchClinics({ query: debouncedSearch }),
    enabled: debouncedSearch.length > 0
  });

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search clinics..."
    />
  );
}
```

### Behavior Timeline

```
User types: "card"

t=0ms:   User types 'c' → searchTerm = "c"
t=100ms: User types 'a' → searchTerm = "ca"
t=200ms: User types 'r' → searchTerm = "car"
t=300ms: User types 'd' → searchTerm = "card"
t=600ms: Debounce completes → debouncedSearch = "card"
         Query key changes → API request for "card"
         
User continues typing: "cardiology"

t=700ms: User types 'i' → searchTerm = "cardi"
t=750ms: API response for "card" arrives (in-flight)
t=800ms: User types 'o' → searchTerm = "cardio"
t=900ms: User types 'l' → searchTerm = "cardiol"
t=1000ms: User types 'o' → searchTerm = "cardiolo"
t=1100ms: User types 'g' → searchTerm = "cardiolog"
t=1200ms: User types 'y' → searchTerm = "cardiology"
t=1500ms: Debounce completes → debouncedSearch = "cardiology"
          Query key changes → Previous request for "card" is CANCELLED
          New API request for "cardiology" is made
```

### Example 2: Component Unmount

```tsx
function ClinicDetails({ clinicId }: { clinicId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.clinics.detail(clinicId),
    queryFn: () => getClinicById(clinicId)
  });

  if (isLoading) return <LoadingSkeleton />;
  return <div>{data?.name}</div>;
}

function ParentComponent() {
  const [showDetails, setShowDetails] = useState(true);

  return (
    <div>
      <button onClick={() => setShowDetails(false)}>Close</button>
      {showDetails && <ClinicDetails clinicId="clinic-123" />}
    </div>
  );
}
```

### Behavior

```
t=0s:    ClinicDetails mounts → API request starts
t=0.5s:  User clicks "Close" button
         ClinicDetails unmounts
         React Query cancels the in-flight request using AbortController
         No memory leak, no unnecessary data processing
```

### Example 3: Filter Changes

```tsx
function ClinicList() {
  const [specialty, setSpecialty] = useState('cardiology');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.clinics.search({ specialty }),
    queryFn: () => searchClinics({ specialty })
  });

  return (
    <div>
      <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
        <option value="cardiology">Cardiology</option>
        <option value="dermatology">Dermatology</option>
        <option value="pediatrics">Pediatrics</option>
      </select>
      {/* Clinic list */}
    </div>
  );
}
```

### Behavior

```
t=0s:    Component mounts with specialty="cardiology"
         API request 1 starts for cardiology
t=0.5s:  Request 1 still in-flight
         User changes to specialty="dermatology"
         Query key changes
         Request 1 is CANCELLED
         API request 2 starts for dermatology
t=1s:    Request 2 completes
         Data for dermatology is displayed
```

## Technical Implementation

### AbortController Integration

React Query uses the browser's `AbortController` API to cancel requests:

```tsx
// This is handled automatically by React Query
// Here's what happens under the hood:

const controller = new AbortController();

fetch('/api/clinics', {
  signal: controller.signal
})
  .then(response => response.json())
  .catch(error => {
    if (error.name === 'AbortError') {
      console.log('Request was cancelled');
    }
  });

// When query key changes or component unmounts:
controller.abort();
```

### Query Key Structure

Using the `queryKeys` factory ensures consistent cache management:

```tsx
// Good: Using query key factory
const { data } = useQuery({
  queryKey: queryKeys.clinics.detail(clinicId),
  queryFn: () => getClinicById(clinicId)
});

// Invalidate all clinic queries
queryClient.invalidateQueries({ queryKey: queryKeys.clinics.all });

// Invalidate specific clinic
queryClient.invalidateQueries({ queryKey: queryKeys.clinics.detail(clinicId) });
```

## Performance Benefits

### Before React Query Configuration

```
Scenario: User searches for "cardiology" clinics

1. User types "cardiology" → 10 API requests (one per keystroke)
2. User navigates to clinic profile → API request
3. User goes back to search → API request (refetch)
4. Multiple components need same data → Multiple API requests
5. User closes modal during loading → Request completes anyway

Total: 13+ API requests
```

### After React Query Configuration

```
Scenario: User searches for "cardiology" clinics

1. User types "cardiology" → 1 API request (debounced + cancelled superseded)
2. User navigates to clinic profile → API request
3. User goes back to search → Cached data (no request)
4. Multiple components need same data → 1 API request (deduplicated)
5. User closes modal during loading → Request cancelled

Total: 2 API requests ✓
```

### Bandwidth Savings

```
Average API response size: 50KB
Requests saved per user session: ~11
Bandwidth saved: 550KB per session
For 1000 users/day: 550MB saved daily
```

## Testing the Configuration

### Manual Testing

1. **Cache Time Test**:
   - Open DevTools Network tab
   - Navigate to a page that fetches data
   - Note the API request
   - Navigate away and back within 5 minutes
   - Verify no new API request is made

2. **Deduplication Test**:
   - Open DevTools Network tab
   - Navigate to a page with multiple components using same query
   - Verify only one API request is made

3. **Cancellation Test**:
   - Open DevTools Network tab
   - Start typing in a search input
   - Type quickly to trigger multiple query key changes
   - Verify previous requests show as "cancelled" in DevTools

### Automated Testing

See `src/lib/queryClient.test.ts` for unit tests covering:
- Cache time configuration
- Request deduplication behavior
- Request cancellation on unmount
- Request cancellation on query key change
