/**
 * Collection Analytics Composable
 *
 * Vue composable for fetching and managing collection storage usage data.
 * Provides reactive state management for collection analytics with caching support.
 *
 * @module module/composables/use-collection-analytics
 */

import { ref, computed, type Ref } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import type { CollectionUsage, CollectionUsageResponse } from '@shared/types';
import { API_ENDPOINTS } from '../../shared/constants';

/**
 * Collection analytics query options
 */
export interface CollectionQueryOptions {
  include_system?: boolean;
  sort?: 'row_count' | 'collection' | 'name';
  order?: 'asc' | 'desc';
  limit?: number;
}

/**
 * Collection analytics composable return type
 */
export interface UseCollectionAnalyticsReturn {
  // State
  collections: Ref<CollectionUsage[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  response: Ref<CollectionUsageResponse | null>;

  // Computed
  totalCollections: Ref<number>;
  totalRows: Ref<number>;
  systemCollections: Ref<CollectionUsage[]>;
  userCollections: Ref<CollectionUsage[]>;
  topCollections: Ref<CollectionUsage[]>;

  // Methods
  fetchCollections: (options?: CollectionQueryOptions) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

/**
 * Composable for collection analytics data
 *
 * @param initialOptions - Initial query options
 * @returns Collection analytics state and methods
 *
 * @example
 * ```typescript
 * const {
 *   collections,
 *   loading,
 *   error,
 *   totalRows,
 *   fetchCollections,
 *   refresh
 * } = useCollectionAnalytics({ include_system: true, limit: 10 });
 *
 * // Fetch data on mount
 * onMounted(() => {
 *   fetchCollections();
 * });
 * ```
 */
export function useCollectionAnalytics(
  initialOptions: CollectionQueryOptions = {}
): UseCollectionAnalyticsReturn {
  const api = useApi();

  // ============================================================================
  // State
  // ============================================================================

  const collections = ref<CollectionUsage[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const response = ref<CollectionUsageResponse | null>(null);
  const lastOptions = ref<CollectionQueryOptions>(initialOptions);

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Total number of collections
   */
  const totalCollections = computed(() => collections.value.length);

  /**
   * Total row count across all collections
   */
  const totalRows = computed(() =>
    collections.value.reduce((sum, c) => sum + c.row_count, 0)
  );

  /**
   * System collections only (directus_*)
   */
  const systemCollections = computed(() =>
    collections.value.filter((c) => c.is_system)
  );

  /**
   * User-created collections only
   */
  const userCollections = computed(() =>
    collections.value.filter((c) => !c.is_system)
  );

  /**
   * Top 10 collections by row count
   */
  const topCollections = computed(() => {
    const sorted = [...collections.value].sort((a, b) => b.row_count - a.row_count);
    return sorted.slice(0, 10);
  });

  // ============================================================================
  // Methods
  // ============================================================================

  /**
   * Fetch collection usage data from API
   *
   * @param options - Query options for filtering and sorting
   */
  async function fetchCollections(options: CollectionQueryOptions = {}): Promise<void> {
    loading.value = true;
    error.value = null;

    // Merge with initial options
    const queryOptions = {
      ...lastOptions.value,
      ...options,
    };

    // Save for refresh
    lastOptions.value = queryOptions;

    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (queryOptions.include_system !== undefined) {
        params.append('include_system', String(queryOptions.include_system));
      }

      if (queryOptions.sort) {
        params.append('sort', queryOptions.sort);
      }

      if (queryOptions.order) {
        params.append('order', queryOptions.order);
      }

      if (queryOptions.limit) {
        params.append('limit', String(queryOptions.limit));
      }

      const queryString = params.toString();
      const url = queryString
        ? `${API_ENDPOINTS.COLLECTIONS}?${queryString}`
        : API_ENDPOINTS.COLLECTIONS;

      // Fetch data from API
      const result = await api.get<CollectionUsageResponse>(url);

      // Update state
      response.value = result;
      collections.value = result.data || [];
    } catch (err) {
      console.error('[useCollectionAnalytics] Fetch error:', err);

      if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'Failed to fetch collection usage data';
      }

      collections.value = [];
      response.value = null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Refresh data with last used options
   */
  async function refresh(): Promise<void> {
    await fetchCollections(lastOptions.value);
  }

  /**
   * Clear error state
   */
  function clearError(): void {
    error.value = null;
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    collections,
    loading,
    error,
    response,

    // Computed
    totalCollections,
    totalRows,
    systemCollections,
    userCollections,
    topCollections,

    // Methods
    fetchCollections,
    refresh,
    clearError,
  };
}
