# Data Model: Directus Usage Analytics Module

**Feature**: 001-usage-analytics-module
**Date**: 2025-01-20
**Status**: Complete

## Overview

This document defines all TypeScript interfaces, data structures, and entity relationships for the Directus Usage Analytics Module. All types must be exported for reusability and follow TypeScript strict mode requirements.

---

## 1. Directus System Collection Types

### DirectusActivity

Represents a record from the \`directus_activity\` system table.

\`\`\`typescript
export interface DirectusActivity {
  id: number;
  action: 'create' | 'update' | 'delete' | 'comment' | 'login' | 'authenticate';
  user: string | null;        // User UUID (null for system actions)
  timestamp: string;           // ISO 8601 timestamp
  ip: string | null;           // IPv4 or IPv6 address
  user_agent: string | null;   // Browser/client user agent string
  collection: string;          // Collection name that was accessed
  item: string;                // Item ID that was modified
  comment: string | null;      // Optional comment
  origin: string | null;       // Origin URL
  revisions: any[];            // Array of revision IDs (type: any per Directus)
}
\`\`\`

**Validation Rules**:
- \`timestamp\` must be valid ISO 8601 format
- \`ip\` must be valid IPv4/IPv6 or null
- \`action\` must be one of the allowed enum values
- \`collection\` must match an existing collection name

**Relationships**:
- \`user\` → \`directus_users.id\` (nullable foreign key)
- \`collection\` → Collection name reference
- \`revisions\` → Array of \`directus_revisions.id\`

---

### DirectusCollection

Represents metadata from \`directus_collections\` system table.

\`\`\`typescript
export interface DirectusCollection {
  collection: string;          // Collection/table name (primary key)
  icon: string | null;         // Material icon name
  note: string | null;         // Description/notes
  display_template: string | null;
  hidden: boolean;             // Whether hidden in admin UI
  singleton: boolean;          // Single-record collection
  translations: any | null;    // i18n translations object
  archive_field: string | null;
  archive_app_filter: boolean;
  archive_value: string | null;
  unarchive_value: string | null;
  sort_field: string | null;
  accountability: 'all' | 'activity' | null;
  color: string | null;        // Hex color code
  item_duplication_fields: string[] | null;
  sort: number | null;
  group: string | null;        // Parent collection for grouping
  collapse: 'open' | 'closed' | 'locked';
  preview_url: string | null;
  versioning: boolean;
}
\`\`\`

**Key Fields for Analytics**:
- \`collection\`: Unique identifier
- \`hidden\`: Important for filtering visible vs system collections
- \`icon\`, \`color\`: For UI visualization
- \`accountability\`: Whether activity is tracked

---

## 2. Analytics Data Models

### CollectionUsage

Aggregated storage usage data for a single collection.

\`\`\`typescript
export interface CollectionUsage {
  collection: string;          // Collection/table name
  name: string;                // Display name (from meta or collection name)
  row_count: number;           // Number of rows in table
  is_system: boolean;          // Whether it's a directus_* system collection
  icon: string | null;         // Icon for UI display
  color: string | null;        // Color for charts
  last_activity: string | null; // ISO timestamp of last activity
  size_estimate_mb: number | null; // Rough size estimate (optional)
}
\`\`\`

**Validation Rules**:
- \`row_count\` must be >= 0
- \`last_activity\` must be valid ISO 8601 or null
- \`size_estimate_mb\` must be > 0 if provided

**Business Logic**:
- \`is_system\` = true if \`collection.startsWith('directus_')\`
- \`name\` falls back to \`collection\` if no display name exists
- \`size_estimate_mb\` is optional (requires database-specific queries)

---

### ActivityStatistics

Aggregated API activity statistics for a collection.

\`\`\`typescript
export interface ActivityStatistics {
  collection: string;          // Collection name
  request_count: number;       // Total API requests
  unique_users: number;        // Distinct users who accessed
  unique_ips: number;          // Distinct IP addresses
  action_breakdown: {          // Requests by action type
    create: number;
    read: number;
    update: number;
    delete: number;
    other: number;
  };
  time_range: {               // Query time range
    start: string;             // ISO 8601 start date
    end: string;               // ISO 8601 end date
  };
  top_users: UserActivitySummary[];  // Top 5 users by request count
  top_ips: IPActivitySummary[];      // Top 5 IPs by request count
}
\`\`\`

**Validation Rules**:
- All counts must be >= 0
- \`time_range.start\` must be before \`time_range.end\`
- Sum of \`action_breakdown\` values should equal \`request_count\`

---

### UserActivitySummary

User-level activity summary.

\`\`\`typescript
export interface UserActivitySummary {
  user_id: string | null;      // User UUID (null for anonymous)
  user_email: string | null;   // User email for display
  request_count: number;       // Number of requests by this user
  collections_accessed: string[]; // Collections this user accessed
  last_activity: string;       // ISO 8601 timestamp
}
\`\`\`

---

### IPActivitySummary

IP address-level activity summary.

\`\`\`typescript
export interface IPActivitySummary {
  ip: string;                  // IPv4 or IPv6 address
  request_count: number;       // Number of requests from this IP
  collections_accessed: string[]; // Collections accessed from this IP
  user_ids: string[];          // User IDs associated with this IP
  first_seen: string;          // ISO 8601 timestamp
  last_seen: string;           // ISO 8601 timestamp
  is_suspicious: boolean;      // Flag for anomaly detection
}
\`\`\`

**Validation Rules**:
- \`ip\` must be valid IPv4 or IPv6 format
- \`first_seen\` must be <= \`last_seen\`
- \`request_count\` should match aggregated data

**Business Logic**:
- \`is_suspicious\` = true if request_count > threshold or unusual patterns detected

---

### TimeSeriesDataPoint

Single data point for time-series charts.

\`\`\`typescript
export interface TimeSeriesDataPoint {
  timestamp: string;           // ISO 8601 timestamp (truncated to hour/day)
  value: number;               // Metric value (request count, etc.)
  collection: string | null;   // Optional collection filter
  label: string;               // Human-readable label for chart
}
\`\`\`

---

### DashboardFilters

User-selected filters for dashboard queries.

\`\`\`typescript
export interface DashboardFilters {
  collections: string[];       // Filter by specific collections (empty = all)
  ip_addresses: string[];      // Filter by specific IPs (empty = all)
  user_ids: string[];          // Filter by specific users (empty = all)
  date_range: {
    start: string;             // ISO 8601 start date
    end: string;               // ISO 8601 end date
  };
  actions: ('create' | 'update' | 'delete' | 'login')[];  // Filter by action types
  top_n_limit: number;         // Limit for "Top N" queries (default: 10)
  include_system_collections: boolean; // Whether to include directus_* tables
}
\`\`\`

**Validation Rules**:
- \`date_range.start\` must be before \`date_range.end\`
- \`top_n_limit\` must be between 1 and 100
- Empty arrays mean "no filter" (include all)

**Defaults**:
\`\`\`typescript
const DEFAULT_FILTERS: DashboardFilters = {
  collections: [],
  ip_addresses: [],
  user_ids: [],
  date_range: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    end: new Date().toISOString()
  },
  actions: [],
  top_n_limit: 10,
  include_system_collections: true
};
\`\`\`

---

## 3. API Response Types

### CollectionUsageResponse

Response from \`GET /analytics/collections\` endpoint.

\`\`\`typescript
export interface CollectionUsageResponse {
  data: CollectionUsage[];
  total_collections: number;
  total_rows: number;          // Sum of all row counts
  query_time_ms: number;       // Query execution time in milliseconds
  cached: boolean;             // Whether result was from cache
  timestamp: string;           // ISO 8601 timestamp of query
}
\`\`\`

---

### ActivityAnalyticsResponse

Response from \`GET /analytics/activity\` endpoint.

\`\`\`typescript
export interface ActivityAnalyticsResponse {
  data: ActivityStatistics[];
  filters_applied: DashboardFilters;
  total_requests: number;      // Sum of all requests in filtered data
  query_time_ms: number;
  cached: boolean;
  timestamp: string;
}
\`\`\`

---

### TimeSeriesResponse

Response from \`GET /analytics/timeseries\` endpoint.

\`\`\`typescript
export interface TimeSeriesResponse {
  data: TimeSeriesDataPoint[];
  granularity: 'hour' | 'day' | 'week' | 'month';
  filters_applied: DashboardFilters;
  query_time_ms: number;
  cached: boolean;
  timestamp: string;
}
\`\`\`

---

### ErrorResponse

Standard error response for API endpoints.

\`\`\`typescript
export interface ErrorResponse {
  error: {
    code: string;              // Error code (e.g., 'INVALID_QUERY', 'DATABASE_ERROR')
    message: string;           // Human-readable error message
    details: Record<string, any> | null; // Additional error details
  };
  timestamp: string;           // ISO 8601 timestamp
}
\`\`\`

---

## 4. Chart Configuration Types

### ChartDataset

Dataset configuration for Chart.js.

\`\`\`typescript
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor: string | string[];
  borderWidth: number;
}
\`\`\`

---

### ChartConfiguration

Complete Chart.js configuration object.

\`\`\`typescript
export interface ChartConfiguration {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  options: {
    responsive: boolean;
    maintainAspectRatio: boolean;
    plugins: {
      title: {
        display: boolean;
        text: string;
      };
      legend: {
        display: boolean;
        position: 'top' | 'bottom' | 'left' | 'right';
      };
      tooltip: {
        enabled: boolean;
      };
    };
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
\`\`\`

---

## 5. Module State Management

### AnalyticsModuleState

Vue composable state for the analytics module.

\`\`\`typescript
export interface AnalyticsModuleState {
  // Data
  collectionUsage: Ref<CollectionUsage[]>;
  activityStatistics: Ref<ActivityStatistics[]>;
  timeSeriesData: Ref<TimeSeriesDataPoint[]>;
  
  // UI State
  filters: Ref<DashboardFilters>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  activeTab: Ref<'storage' | 'activity' | 'timeseries'>;
  
  // Computed
  topCollections: ComputedRef<CollectionUsage[]>;  // Top N by row count
  topRequestedCollections: ComputedRef<ActivityStatistics[]>; // Top N by requests
  
  // Methods
  fetchCollectionUsage: () => Promise<void>;
  fetchActivityStatistics: () => Promise<void>;
  fetchTimeSeriesData: (granularity: 'hour' | 'day') => Promise<void>;
  applyFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  exportData: (format: 'csv' | 'json') => Promise<void>;
}
\`\`\`

---

## 6. Entity Relationships

\`\`\`
┌─────────────────────┐
│ DirectusCollection  │
│ (metadata)          │
└──────────┬──────────┘
           │ 1:N
           │
┌──────────▼──────────┐
│ DirectusActivity    │
│ (audit log)         │
└──────────┬──────────┘
           │ aggregates to
           │
┌──────────▼──────────────────┐
│ ActivityStatistics          │
│ (computed)                  │
│ - request_count             │
│ - unique_users              │
│ - action_breakdown          │
└──────────┬──────────────────┘
           │ includes
           │
┌──────────▼──────────────────┐
│ UserActivitySummary         │
│ (top users)                 │
└─────────────────────────────┘

┌──────────────────────┐
│ Database Tables      │
│ (system tables)      │
└──────────┬───────────┘
           │ COUNT queries
           │
┌──────────▼───────────┐
│ CollectionUsage      │
│ (computed)           │
│ - row_count          │
│ - size_estimate      │
└──────────────────────┘
\`\`\`

---

## 7. Database Schema Considerations

### Indexes Required for Performance

\`\`\`sql
-- Critical for time-range queries (10-50x improvement)
CREATE INDEX idx_activity_timestamp_collection
ON directus_activity(timestamp DESC, collection);

-- For IP filtering
CREATE INDEX idx_activity_ip
ON directus_activity(ip) WHERE ip IS NOT NULL;

-- For user queries
CREATE INDEX idx_activity_user
ON directus_activity(user) WHERE user IS NOT NULL;

-- For action filtering
CREATE INDEX idx_activity_action
ON directus_activity(action);
\`\`\`

### Materialized View (Optional - for performance)

\`\`\`sql
CREATE MATERIALIZED VIEW activity_hourly_summary AS
SELECT
  date_trunc('hour', timestamp) AS hour,
  collection,
  action,
  COUNT(*) AS request_count,
  COUNT(DISTINCT user) AS unique_users,
  COUNT(DISTINCT ip) AS unique_ips
FROM directus_activity
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY 1, 2, 3;
\`\`\`

---

## 8. Type Exports (index.ts)

All types must be exported from a central index file:

\`\`\`typescript
// types/index.ts
export type {
  // Directus System Types
  DirectusActivity,
  DirectusCollection,
  
  // Analytics Types
  CollectionUsage,
  ActivityStatistics,
  UserActivitySummary,
  IPActivitySummary,
  TimeSeriesDataPoint,
  DashboardFilters,
  
  // API Response Types
  CollectionUsageResponse,
  ActivityAnalyticsResponse,
  TimeSeriesResponse,
  ErrorResponse,
  
  // Chart Types
  ChartDataset,
  ChartConfiguration,
  
  // Module State
  AnalyticsModuleState,
};
\`\`\`

---

## Summary

This data model defines:
- **2 Directus system types** (DirectusActivity, DirectusCollection)
- **6 analytics data types** (CollectionUsage, ActivityStatistics, etc.)
- **4 API response types**
- **2 chart configuration types**
- **1 module state type**

Total: **15 TypeScript interfaces** covering all data structures for the module.

All types follow TypeScript strict mode requirements and include comprehensive JSDoc comments in implementation.
