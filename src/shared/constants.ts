/**
 * Shared constants for Directus Usage Analytics Bundle Extension
 *
 * All configuration values and default settings
 * @module constants
 */

import type { DashboardFilters } from './types';

// ============================================================================
// API Configuration
// ============================================================================

/**
 * Base API route for analytics endpoints.
 * All analytics API calls are prefixed with this route.
 */
export const API_BASE_ROUTE = '/usage-analytics-api';

/**
 * API endpoint paths relative to base route.
 */
export const API_ENDPOINTS = {
  COLLECTIONS: `${API_BASE_ROUTE}/collections`,
  ACTIVITY: `${API_BASE_ROUTE}/activity`,
  ACTIVITY_TIMESERIES: `${API_BASE_ROUTE}/activity/timeseries`,
  ACTIVITY_BY_IP: (ip: string): string => `${API_BASE_ROUTE}/activity/ips/${ip}`,
} as const;

/**
 * Default HTTP timeout for API requests (milliseconds).
 */
export const API_TIMEOUT_MS = 30000; // 30 seconds

// ============================================================================
// Cache Configuration
// ============================================================================

/**
 * Cache Time-To-Live values (milliseconds).
 */
export const CACHE_TTL = {
  /** Collection metadata cache (5 minutes) */
  COLLECTIONS: 5 * 60 * 1000,
  /** Activity statistics cache (5 minutes) */
  ACTIVITY: 5 * 60 * 1000,
  /** Time-series data cache (2 minutes) */
  TIMESERIES: 2 * 60 * 1000,
} as const;

/**
 * Cache key prefixes for Redis/memory cache.
 */
export const CACHE_KEYS = {
  COLLECTIONS: 'analytics:collections',
  ACTIVITY: 'analytics:activity',
  TIMESERIES: 'analytics:timeseries',
  IP_ACTIVITY: 'analytics:ip',
} as const;

// ============================================================================
// Pagination & Limits
// ============================================================================

/**
 * Default pagination limit for API queries.
 */
export const DEFAULT_PAGINATION_LIMIT = 100;

/**
 * Maximum pagination limit (prevents excessive data transfer).
 */
export const MAX_PAGINATION_LIMIT = 1000;

/**
 * Default "Top N" limit for dashboard queries.
 */
export const DEFAULT_TOP_N_LIMIT = 10;

/**
 * Maximum "Top N" limit allowed.
 */
export const MAX_TOP_N_LIMIT = 100;

// ============================================================================
// Date & Time Configuration
// ============================================================================

/**
 * Default date range for activity queries (days).
 */
export const DEFAULT_DATE_RANGE_DAYS = 7;

/**
 * Maximum date range allowed for queries (days).
 * Prevents excessive database load from very large time ranges.
 */
export const MAX_DATE_RANGE_DAYS = 90;

/**
 * Time-series granularity options.
 */
export const TIMESERIES_GRANULARITY = {
  HOUR: 'hour',
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
} as const;

// ============================================================================
// Default Filters
// ============================================================================

/**
 * Default dashboard filter settings.
 * Used when initializing the analytics module.
 */
export const DEFAULT_FILTERS: DashboardFilters = {
  collections: [],
  ip_addresses: [],
  user_ids: [],
  date_range: {
    // Default: last 7 days
    start: new Date(Date.now() - DEFAULT_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  },
  actions: [],
  top_n_limit: DEFAULT_TOP_N_LIMIT,
  include_system_collections: true,
};

// ============================================================================
// Chart Configuration
// ============================================================================

/**
 * Default chart colors for visualizations.
 * Uses a color palette optimized for accessibility.
 */
export const CHART_COLORS = {
  PRIMARY: '#2ECDA7',
  SECONDARY: '#4F46E5',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
  INFO: '#3B82F6',
  GRAY: '#6B7280',
  DARK: '#1F2937',
} as const;

/**
 * Color palette for multi-series charts.
 * Provides visually distinct colors for up to 10 series.
 */
export const CHART_PALETTE = [
  '#2ECDA7', // Primary green (Directus brand)
  '#4F46E5', // Indigo
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Green
  '#F97316', // Orange
  '#6366F1', // Indigo-blue
] as const;

/**
 * Default Chart.js configuration options.
 */
export const DEFAULT_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
    },
    tooltip: {
      enabled: true,
      mode: 'index' as const,
      intersect: false,
    },
  },
} as const;

// ============================================================================
// Performance Configuration
// ============================================================================

/**
 * Performance thresholds and targets.
 */
export const PERFORMANCE_TARGETS = {
  /** Target query time for collection metadata (milliseconds) */
  COLLECTION_QUERY_MS: 2000,
  /** Target query time for activity aggregation (milliseconds) */
  ACTIVITY_QUERY_MS: 3000,
  /** Target chart rendering time (milliseconds) */
  CHART_RENDER_MS: 1000,
  /** Target dashboard load time (milliseconds) */
  DASHBOARD_LOAD_MS: 5000,
} as const;

/**
 * Database query limits to prevent performance issues.
 */
export const QUERY_LIMITS = {
  /** Maximum number of collections to analyze at once */
  MAX_COLLECTIONS: 500,
  /** Maximum number of activity records to process */
  MAX_ACTIVITY_RECORDS: 100000,
  /** Batch size for bulk operations */
  BATCH_SIZE: 1000,
} as const;

// ============================================================================
// UI Configuration
// ============================================================================

/**
 * Dashboard tab identifiers.
 */
export const DASHBOARD_TABS = {
  STORAGE: 'storage',
  ACTIVITY: 'activity',
  TIMESERIES: 'timeseries',
} as const;

/**
 * Available sort orders for collection lists.
 */
export const SORT_OPTIONS = {
  ROW_COUNT_DESC: 'row_count_desc',
  ROW_COUNT_ASC: 'row_count_asc',
  NAME_ASC: 'name_asc',
  NAME_DESC: 'name_desc',
  COLLECTION_ASC: 'collection_asc',
  COLLECTION_DESC: 'collection_desc',
} as const;

/**
 * Chart type options for visualizations.
 */
export const CHART_TYPES = {
  BAR: 'bar',
  LINE: 'line',
  PIE: 'pie',
  DOUGHNUT: 'doughnut',
} as const;

// ============================================================================
// Error Messages
// ============================================================================

/**
 * Standard error messages for API responses.
 */
export const ERROR_MESSAGES = {
  INVALID_QUERY: 'Invalid query parameters',
  DATABASE_ERROR: 'Database query failed',
  PERMISSION_DENIED: 'Insufficient permissions to access analytics',
  NOT_FOUND: 'Resource not found',
  TIMEOUT: 'Request timeout exceeded',
  INVALID_DATE_RANGE: 'Invalid date range: start date must be before end date',
  CACHE_ERROR: 'Cache operation failed',
  EXPORT_ERROR: 'Failed to export data',
} as const;

/**
 * Error codes for API responses.
 */
export const ERROR_CODES = {
  INVALID_QUERY: 'INVALID_QUERY',
  DATABASE_ERROR: 'DATABASE_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NOT_FOUND: 'NOT_FOUND',
  TIMEOUT: 'TIMEOUT',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  CACHE_ERROR: 'CACHE_ERROR',
  EXPORT_ERROR: 'EXPORT_ERROR',
} as const;

// ============================================================================
// Security Configuration
// ============================================================================

/**
 * Anomaly detection thresholds.
 */
export const ANOMALY_THRESHOLDS = {
  /** Requests per IP per hour that triggers suspicious flag */
  REQUESTS_PER_IP_HOUR: 1000,
  /** Requests per user per hour that triggers review */
  REQUESTS_PER_USER_HOUR: 500,
  /** Failed auth attempts that trigger suspicious flag */
  FAILED_AUTH_ATTEMPTS: 10,
} as const;

/**
 * IP address validation regex patterns.
 */
export const IP_PATTERNS = {
  /** IPv4 pattern */
  IPV4: /^(\d{1,3}\.){3}\d{1,3}$/,
  /** IPv6 pattern (simplified) */
  IPV6: /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/,
} as const;

// ============================================================================
// Module Configuration
// ============================================================================

/**
 * Module metadata for Directus registration.
 */
export const MODULE_CONFIG = {
  ID: 'usage-analytics',
  NAME: 'Usage Analytics',
  ICON: 'analytics',
  COLOR: '#2ECDA7',
  ROUTES: {
    ROOT: '',
    STORAGE: '/storage',
    ACTIVITY: '/activity',
    SETTINGS: '/settings',
  },
} as const;
