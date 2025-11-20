/**
 * Shared TypeScript types for Directus Usage Analytics Bundle Extension
 *
 * All types follow TypeScript strict mode requirements (Constitution Principle I)
 * @module types
 */

import { Ref, ComputedRef } from 'vue';

// ============================================================================
// 1. Directus System Collection Types
// ============================================================================

/**
 * Represents a record from the `directus_activity` system table.
 * Tracks all user interactions and API requests in Directus.
 */
export interface DirectusActivity {
  /** Primary key */
  id: number;
  /** Action type performed */
  action: 'create' | 'update' | 'delete' | 'comment' | 'login' | 'authenticate';
  /** User UUID who performed the action (null for system actions) */
  user: string | null;
  /** ISO 8601 timestamp of when the action occurred */
  timestamp: string;
  /** IPv4 or IPv6 address of the client */
  ip: string | null;
  /** Browser/client user agent string */
  user_agent: string | null;
  /** Collection name that was accessed */
  collection: string;
  /** Item ID that was modified */
  item: string;
  /** Optional comment attached to the action */
  comment: string | null;
  /** Origin URL of the request */
  origin: string | null;
  /** Array of revision IDs associated with this activity */
  revisions: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Represents metadata from `directus_collections` system table.
 * Contains collection configuration and display settings.
 */
export interface DirectusCollection {
  /** Collection/table name (primary key) */
  collection: string;
  /** Material icon name for UI display */
  icon: string | null;
  /** Description/notes about the collection */
  note: string | null;
  /** Template for displaying item names */
  display_template: string | null;
  /** Whether collection is hidden in admin UI */
  hidden: boolean;
  /** Whether this is a single-record collection */
  singleton: boolean;
  /** i18n translations object */
  translations: any | null; // eslint-disable-line @typescript-eslint/no-explicit-any
  /** Field used for archiving records */
  archive_field: string | null;
  /** Whether to filter archived items in app */
  archive_app_filter: boolean;
  /** Value that indicates archived state */
  archive_value: string | null;
  /** Value that indicates unarchived state */
  unarchive_value: string | null;
  /** Field used for sorting */
  sort_field: string | null;
  /** Activity tracking level */
  accountability: 'all' | 'activity' | null;
  /** Hex color code for UI theming */
  color: string | null;
  /** Fields to include when duplicating items */
  item_duplication_fields: string[] | null;
  /** Sort order in collection list */
  sort: number | null;
  /** Parent collection for grouping */
  group: string | null;
  /** Default collapse state in UI */
  collapse: 'open' | 'closed' | 'locked';
  /** URL template for previewing items */
  preview_url: string | null;
  /** Whether versioning is enabled */
  versioning: boolean;
}

// ============================================================================
// 2. Analytics Data Models
// ============================================================================

/**
 * Aggregated storage usage data for a single collection.
 * Represents database table size and metadata.
 */
export interface CollectionUsage {
  /** Collection/table name */
  collection: string;
  /** Display name (from meta or collection name) */
  name: string;
  /** Number of rows in the table */
  row_count: number;
  /** Whether this is a directus_* system collection */
  is_system: boolean;
  /** Material icon for UI display */
  icon: string | null;
  /** Hex color for charts and UI */
  color: string | null;
  /** ISO timestamp of last activity on this collection */
  last_activity: string | null;
  /** Estimated table size in megabytes (optional) */
  size_estimate_mb: number | null;
}

/**
 * Aggregated API activity statistics for a collection.
 * Provides comprehensive usage metrics from the activity log.
 */
export interface ActivityStatistics {
  /** Collection name */
  collection: string;
  /** Total number of API requests */
  request_count: number;
  /** Number of distinct users who accessed this collection */
  unique_users: number;
  /** Number of distinct IP addresses */
  unique_ips: number;
  /** Breakdown of requests by action type */
  action_breakdown: {
    create: number;
    read: number;
    update: number;
    delete: number;
    other: number;
  };
  /** Time range for the aggregated data */
  time_range: {
    /** ISO 8601 start date */
    start: string;
    /** ISO 8601 end date */
    end: string;
  };
  /** Top 5 users by request count */
  top_users: UserActivitySummary[];
  /** Top 5 IP addresses by request count */
  top_ips: IPActivitySummary[];
}

/**
 * User-level activity summary.
 * Aggregates activity for a single user.
 */
export interface UserActivitySummary {
  /** User UUID (null for anonymous requests) */
  user_id: string | null;
  /** User email for display purposes */
  user_email: string | null;
  /** Total number of requests by this user */
  request_count: number;
  /** List of collections accessed by this user */
  collections_accessed: string[];
  /** ISO 8601 timestamp of last activity */
  last_activity: string;
}

/**
 * IP address-level activity summary.
 * Tracks activity from a specific IP address.
 */
export interface IPActivitySummary {
  /** IPv4 or IPv6 address */
  ip: string;
  /** Total number of requests from this IP */
  request_count: number;
  /** List of collections accessed from this IP */
  collections_accessed: string[];
  /** User IDs associated with this IP address */
  user_ids: string[];
  /** ISO 8601 timestamp of first request from this IP */
  first_seen: string;
  /** ISO 8601 timestamp of most recent request */
  last_seen: string;
  /** Flag indicating potential anomalous behavior */
  is_suspicious: boolean;
}

/**
 * Single data point for time-series charts.
 * Used for visualizing activity trends over time.
 */
export interface TimeSeriesDataPoint {
  /** ISO 8601 timestamp (truncated to hour/day granularity) */
  timestamp: string;
  /** Metric value (e.g., request count) */
  value: number;
  /** Optional collection filter for this data point */
  collection: string | null;
  /** Human-readable label for chart display */
  label: string;
}

/**
 * User-selected filters for dashboard queries.
 * Controls which data is displayed in the analytics dashboard.
 */
export interface DashboardFilters {
  /** Filter by specific collections (empty array = all collections) */
  collections: string[];
  /** Filter by specific IP addresses (empty array = all IPs) */
  ip_addresses: string[];
  /** Filter by specific user IDs (empty array = all users) */
  user_ids: string[];
  /** Date range for activity queries */
  date_range: {
    /** ISO 8601 start date */
    start: string;
    /** ISO 8601 end date */
    end: string;
  };
  /** Filter by action types (empty array = all actions) */
  actions: ('create' | 'update' | 'delete' | 'login')[];
  /** Limit for "Top N" queries (range: 1-100) */
  top_n_limit: number;
  /** Whether to include directus_* system collections */
  include_system_collections: boolean;
}

// ============================================================================
// 3. API Response Types
// ============================================================================

/**
 * Response from `GET /usage-analytics-api/collections` endpoint.
 * Returns storage usage for all collections.
 */
export interface CollectionUsageResponse {
  /** Array of collection usage data */
  data: CollectionUsage[];
  /** Total number of collections returned */
  total_collections: number;
  /** Sum of all row counts across collections */
  total_rows: number;
  /** Query execution time in milliseconds */
  query_time_ms: number;
  /** Whether result was served from cache */
  cached: boolean;
  /** ISO 8601 timestamp of when query was executed */
  timestamp: string;
}

/**
 * Response from `GET /usage-analytics-api/activity` endpoint.
 * Returns aggregated activity statistics.
 */
export interface ActivityAnalyticsResponse {
  /** Array of activity statistics per collection */
  data: ActivityStatistics[];
  /** Filters that were applied to this query */
  filters_applied: DashboardFilters;
  /** Sum of all requests in the filtered dataset */
  total_requests: number;
  /** Query execution time in milliseconds */
  query_time_ms: number;
  /** Whether result was served from cache */
  cached: boolean;
  /** ISO 8601 timestamp of when query was executed */
  timestamp: string;
}

/**
 * Response from `GET /usage-analytics-api/activity/timeseries` endpoint.
 * Returns time-series data for activity trends.
 */
export interface TimeSeriesResponse {
  /** Array of time-series data points */
  data: TimeSeriesDataPoint[];
  /** Granularity of the time-series data */
  granularity: 'hour' | 'day' | 'week' | 'month';
  /** Filters that were applied to this query */
  filters_applied: DashboardFilters;
  /** Query execution time in milliseconds */
  query_time_ms: number;
  /** Whether result was served from cache */
  cached: boolean;
  /** ISO 8601 timestamp of when query was executed */
  timestamp: string;
}

/**
 * Standard error response for API endpoints.
 * Used for all error conditions in the API.
 */
export interface ErrorResponse {
  /** Error details */
  error: {
    /** Error code (e.g., 'INVALID_QUERY', 'DATABASE_ERROR') */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Additional error details (stack trace, field validation errors, etc.) */
    details: Record<string, any> | null; // eslint-disable-line @typescript-eslint/no-explicit-any
  };
  /** ISO 8601 timestamp when error occurred */
  timestamp: string;
}

// ============================================================================
// 4. Chart Configuration Types (for Chart.js integration)
// ============================================================================

/**
 * Dataset configuration for Chart.js charts.
 * Defines how a single data series should be rendered.
 */
export interface ChartDataset {
  /** Label for the dataset (shown in legend) */
  label: string;
  /** Array of data values */
  data: number[];
  /** Background color(s) for the data points/bars */
  backgroundColor: string | string[];
  /** Border color(s) for the data points/bars */
  borderColor: string | string[];
  /** Border width in pixels */
  borderWidth: number;
}

/**
 * Complete Chart.js configuration object.
 * Used to render charts in the Vue components.
 */
export interface ChartConfiguration {
  /** Chart type */
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  /** Chart data configuration */
  data: {
    /** X-axis labels */
    labels: string[];
    /** Array of datasets to display */
    datasets: ChartDataset[];
  };
  /** Chart display options */
  options: {
    /** Whether chart should be responsive to container size */
    responsive: boolean;
    /** Whether to maintain aspect ratio on resize */
    maintainAspectRatio: boolean;
    /** Plugin configurations */
    plugins: {
      /** Chart title configuration */
      title: {
        display: boolean;
        text: string;
      };
      /** Legend configuration */
      legend: {
        display: boolean;
        position: 'top' | 'bottom' | 'left' | 'right';
      };
      /** Tooltip configuration */
      tooltip: {
        enabled: boolean;
      };
    };
    /** Axis configurations (optional, for bar/line charts) */
    scales?: {
      x: {
        title: {
          display: boolean;
          text: string;
        };
      };
      y: {
        title: {
          display: boolean;
          text: string;
        };
        beginAtZero: boolean;
      };
    };
  };
}

// ============================================================================
// 5. Module State Management (Vue Composables)
// ============================================================================

/**
 * Vue composable state for the analytics module.
 * Provides reactive data and methods for the dashboard.
 */
export interface AnalyticsModuleState {
  // Data
  /** Collection usage data */
  collectionUsage: Ref<CollectionUsage[]>;
  /** Activity statistics data */
  activityStatistics: Ref<ActivityStatistics[]>;
  /** Time-series data for charts */
  timeSeriesData: Ref<TimeSeriesDataPoint[]>;

  // UI State
  /** Current filter settings */
  filters: Ref<DashboardFilters>;
  /** Loading state indicator */
  loading: Ref<boolean>;
  /** Error message (null if no error) */
  error: Ref<string | null>;
  /** Currently active dashboard tab */
  activeTab: Ref<'storage' | 'activity' | 'timeseries'>;

  // Computed Properties
  /** Top N collections by row count */
  topCollections: ComputedRef<CollectionUsage[]>;
  /** Top N collections by API request count */
  topRequestedCollections: ComputedRef<ActivityStatistics[]>;

  // Methods
  /** Fetch collection usage data from API */
  fetchCollectionUsage: () => Promise<void>;
  /** Fetch activity statistics from API */
  fetchActivityStatistics: () => Promise<void>;
  /** Fetch time-series data with specified granularity */
  fetchTimeSeriesData: (granularity: 'hour' | 'day') => Promise<void>;
  /** Apply partial filter updates */
  applyFilters: (filters: Partial<DashboardFilters>) => void;
  /** Reset all filters to default values */
  resetFilters: () => void;
  /** Export data in CSV or JSON format */
  exportData: (format: 'csv' | 'json') => Promise<void>;
}
