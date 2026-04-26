/**
 * React Query Client Configuration
 * 
 * This module exports the configured QueryClient instance used throughout the application.
 * 
 * Key Features:
 * - 5-minute cache time (Requirement 13.2)
 * - Automatic request deduplication (Requirement 13.3)
 * - Automatic request cancellation for superseded requests (Requirement 13.4)
 * 
 * @module queryClient
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Creates and configures the React Query client with optimized settings
 * for caching, deduplication, and request cancellation.
 * 
 * Configuration Details:
 * 
 * 1. Caching (Requirement 13.2):
 *    - staleTime: 5 minutes - Data remains fresh and won't refetch during this period
 *    - gcTime: 15 minutes - Cached data is kept in memory for this duration after becoming unused
 * 
 * 2. Request Deduplication (Requirement 13.3):
 *    - Built-in feature: React Query automatically deduplicates identical requests
 *    - When multiple components request the same data simultaneously, only one network request is made
 *    - All components receive the same data once the request completes
 * 
 * 3. Request Cancellation (Requirement 13.4):
 *    - Built-in feature: React Query uses AbortController to cancel in-flight requests
 *    - Requests are cancelled when:
 *      a) Component unmounts before request completes
 *      b) A new request supersedes an old one (e.g., user types in search)
 *      c) Query keys change, invalidating the previous request
 * 
 * 4. Additional Optimizations:
 *    - retry: 2 - Failed requests are retried up to 2 times with exponential backoff
 *    - refetchOnWindowFocus: false - Prevents unnecessary refetches when user returns to tab
 * 
 * @returns {QueryClient} Configured QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache time: data remains fresh for 5 minutes (Requirement 13.2)
        staleTime: 5 * 60 * 1000,
        
        // Garbage collection: cached data is kept for 15 minutes after becoming unused
        gcTime: 15 * 60 * 1000,
        
        // Retry failed requests up to 2 times with exponential backoff
        retry: 2,
        
        // Disable automatic refetch on window focus to reduce unnecessary requests
        refetchOnWindowFocus: false,
        
        // Request deduplication (Requirement 13.3): 
        // React Query automatically deduplicates identical requests made within the same render cycle
        // This is a built-in feature and requires no additional configuration
        
        // Request cancellation (Requirement 13.4):
        // React Query automatically cancels in-flight requests when:
        // - A component unmounts
        // - A new request supersedes an old one
        // - Query keys change
        // This is a built-in feature using AbortController
      },
    },
  });
}

/**
 * Default QueryClient instance for the application
 * 
 * This instance is used in the QueryClientProvider at the root of the application.
 * 
 * @example
 * ```tsx
 * import { queryClient } from '@/lib/queryClient';
 * import { QueryClientProvider } from '@tanstack/react-query';
 * 
 * function App() {
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       <YourApp />
 *     </QueryClientProvider>
 *   );
 * }
 * ```
 */
export const queryClient = createQueryClient();

/**
 * Type-safe query key factory for consistent cache key generation
 * 
 * Using a query key factory ensures:
 * - Consistent key structure across the application
 * - Type safety for query parameters
 * - Easy cache invalidation
 * 
 * @example
 * ```tsx
 * // In a hook
 * const { data } = useQuery({
 *   queryKey: queryKeys.clinics.search({ specialty: 'cardiology' }),
 *   queryFn: () => searchClinics({ specialty: 'cardiology' })
 * });
 * 
 * // Invalidate all clinic queries
 * queryClient.invalidateQueries({ queryKey: queryKeys.clinics.all });
 * ```
 */
export const queryKeys = {
  clinics: {
    all: ['clinics'] as const,
    lists: () => [...queryKeys.clinics.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.clinics.lists(), filters] as const,
    details: () => [...queryKeys.clinics.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clinics.details(), id] as const,
    search: (params: Record<string, unknown>) => [...queryKeys.clinics.all, 'search', params] as const,
    byOwner: () => [...queryKeys.clinics.all, 'byOwner'] as const,
  },
  appointments: {
    all: ['appointments'] as const,
    lists: () => [...queryKeys.appointments.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.appointments.lists(), filters] as const,
    details: () => [...queryKeys.appointments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.appointments.details(), id] as const,
    user: (userId: string) => [...queryKeys.appointments.all, 'user', userId] as const,
    clinic: (clinicId: string) => [...queryKeys.appointments.all, 'clinic', clinicId] as const,
  },
  slots: {
    all: ['slots'] as const,
    lists: () => [...queryKeys.slots.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.slots.lists(), filters] as const,
    clinic: (clinicId: string) => [...queryKeys.slots.all, 'clinic', clinicId] as const,
  },
  profiles: {
    all: ['profiles'] as const,
    detail: (userId: string) => [...queryKeys.profiles.all, userId] as const,
  },
  specialties: {
    all: ['specialties'] as const,
    lists: () => [...queryKeys.specialties.all, 'list'] as const,
  },
} as const;
