/**
 * Activity Analytics Composable
 *
 * Vue composable for fetching and managing activity statistics data.
 * Provides reactive state management for API activity analytics with filtering.
 *
 * @module module/composables/use-activity-analytics
 */

import { ref, computed, type Ref } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import type { ActivityStatistics, ActivityByCollection, ActivityByAction } from '@shared/types';
import { API_ENDPOINTS } from '../../shared/constants';

/**
 * Activity query options
 */
export interface ActivityQueryOptions {
  start_date?: string;
  end_date?: string;
  collections?: string[];
  actions?: string[];
  ip_addresses?: string[];
  limit?: number;
}

/**
 * Activity analytics composable return type
 */
export interface UseActivityAnalyticsReturn {
  // State
  statistics: Ref<ActivityStatistics | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;

  // Computed
  totalRequests: Ref<number>;
  uniqueUsers: Ref<number>;
  uniqueIPs: Ref<number>;
  byCollection: Ref<ActivityByCollection[]>;
  byAction: Ref<ActivityByAction[]>;
  dateRange: Ref<{ start: string; end: string } | null>;

  // Methods
  fetchActivity: (options?: ActivityQueryOptions) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

/**
 * Composable for activity analytics data
 *
 * @param initialOptions - Initial query options
 * @returns Activity analytics state and methods
 *
 * @example
 * ```typescript
 * const {
 *   statistics,
 *   loading,
 *   error,
 *   totalRequests,
 *   byCollection,
 *   fetchActivity,
 *   refresh
 * } = useActivityAnalytics({
 *   start_date: '2025-01-13T00:00:00Z',
 *   end_date: '2025-01-20T23:59:59Z',
 *   limit: 10
 * });
 *
 * // Fetch data on mount
 * onMounted(() => {
 *   fetchActivity();
 * });
 * ```
 */
export function useActivityAnalytics(
  initialOptions: ActivityQueryOptions = {}
): UseActivityAnalyticsReturn {
  const api = useApi();

  // ============================================================================
  // State
  // ============================================================================

  const statistics = ref<ActivityStatistics | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const lastOptions = ref<ActivityQueryOptions>(initialOptions);

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Total request count
   */
  const totalRequests = computed(() => statistics.value?.total_requests || 0);

  /**
   * Unique user count
   */
  const uniqueUsers = computed(() => statistics.value?.unique_users || 0);

  /**
   * Unique IP count
   */
  const uniqueIPs = computed(() => statistics.value?.unique_ips || 0);

  /**
   * Activity by collection
   */
  const byCollection = computed(() => statistics.value?.by_collection || []);

  /**
   * Activity by action
   */
  const byAction = computed(() => statistics.value?.by_action || []);

  /**
   * Date range
   */
  const dateRange = computed(() => statistics.value?.date_range || null);

  // ============================================================================
  // Methods
  // ============================================================================

  /**
   * Fetch activity statistics from API
   *
   * @param options - Query options for filtering
   */
  async function fetchActivity(options: ActivityQueryOptions = {}): Promise<void> {
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

      if (queryOptions.start_date) {
        params.append('start_date', queryOptions.start_date);
      }

      if (queryOptions.end_date) {
        params.append('end_date', queryOptions.end_date);
      }

      if (queryOptions.collections && queryOptions.collections.length > 0) {
        params.append('collections', queryOptions.collections.join(','));
      }

      if (queryOptions.actions && queryOptions.actions.length > 0) {
        params.append('actions', queryOptions.actions.join(','));
      }

      if (queryOptions.ip_addresses && queryOptions.ip_addresses.length > 0) {
        params.append('ip_addresses', queryOptions.ip_addresses.join(','));
      }

      if (queryOptions.limit) {
        params.append('limit', String(queryOptions.limit));
      }

      const queryString = params.toString();
      const url = queryString
        ? `${API_ENDPOINTS.ACTIVITY}?${queryString}`
        : API_ENDPOINTS.ACTIVITY;

      // Fetch data from API
      // Note: api.get() returns Axios response: { data: {...} }
      const result = await api.get<ActivityStatistics>(url);

      // Update state
      statistics.value = result.data;
    } catch (err) {
      console.error('[useActivityAnalytics] Fetch error:', err);

      if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'Failed to fetch activity statistics';
      }

      statistics.value = null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Refresh data with last used options
   */
  async function refresh(): Promise<void> {
    await fetchActivity(lastOptions.value);
  }

  /**
   * Clear error state
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Fetch top IP addresses by request count
   *
   * @param options - Query options
   * @returns Promise that resolves when IPs are fetched
   *
   * @example
   * ```typescript
   * await fetchTopIPs({ limit: 10, start_date: '2025-01-01T00:00:00Z' });
   * ```
   */
  async function fetchTopIPs(
    options: ActivityQueryOptions = {}
  ): Promise<Array<{ ip: string; count: number; percentage: number }>> {
    loading.value = true;
    error.value = null;

    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (options.start_date) {
        params.append('start_date', options.start_date);
      }

      if (options.end_date) {
        params.append('end_date', options.end_date);
      }

      if (options.collections && options.collections.length > 0) {
        params.append('collections', options.collections.join(','));
      }

      if (options.actions && options.actions.length > 0) {
        params.append('actions', options.actions.join(','));
      }

      if (options.limit) {
        params.append('limit', String(options.limit));
      }

      const queryString = params.toString();
      const url = queryString
        ? `${API_ENDPOINTS.ACTIVITY}/ips?${queryString}`
        : `${API_ENDPOINTS.ACTIVITY}/ips`;

      // Fetch data from API
      // Note: api.get() returns Axios response: { data: {...} }
      const result = await api.get<{ ips: Array<{ ip: string; count: number; percentage: number }> }>(url);

      return result.data.ips;
    } catch (err) {
      console.error('[useActivityAnalytics] Fetch top IPs error:', err);

      if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'Failed to fetch top IP addresses';
      }

      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch activity statistics for a specific IP address
   *
   * @param ip - IP address to analyze
   * @param options - Additional query options
   * @returns Promise that resolves when IP activity is fetched
   *
   * @example
   * ```typescript
   * await fetchActivityByIP('192.168.1.100', {
   *   start_date: '2025-01-01T00:00:00Z',
   *   limit: 10
   * });
   * ```
   */
  async function fetchActivityByIP(
    ip: string,
    options: Omit<ActivityQueryOptions, 'ip_addresses'> = {}
  ): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (options.start_date) {
        params.append('start_date', options.start_date);
      }

      if (options.end_date) {
        params.append('end_date', options.end_date);
      }

      if (options.collections && options.collections.length > 0) {
        params.append('collections', options.collections.join(','));
      }

      if (options.actions && options.actions.length > 0) {
        params.append('actions', options.actions.join(','));
      }

      if (options.limit) {
        params.append('limit', String(options.limit));
      }

      const queryString = params.toString();
      const url = queryString
        ? `${API_ENDPOINTS.ACTIVITY}/ips/${encodeURIComponent(ip)}?${queryString}`
        : `${API_ENDPOINTS.ACTIVITY}/ips/${encodeURIComponent(ip)}`;

      // Fetch data from API
      // Note: api.get() returns Axios response: { data: {...} }
      const result = await api.get<ActivityStatistics>(url);

      // Update state
      statistics.value = result.data;
    } catch (err) {
      console.error('[useActivityAnalytics] Fetch IP activity error:', err);

      if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'Failed to fetch IP activity statistics';
      }

      statistics.value = null;
    } finally {
      loading.value = false;
    }
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    statistics,
    loading,
    error,

    // Computed
    totalRequests,
    uniqueUsers,
    uniqueIPs,
    byCollection,
    byAction,
    dateRange,

    // Methods
    fetchActivity,
    fetchTopIPs,
    fetchActivityByIP,
    refresh,
    clearError,
  };
}
