/**
 * Database utility functions for cross-database compatibility
 *
 * Provides Knex query builders that work across PostgreSQL, MySQL, SQLite, and MSSQL
 * @module database-helpers
 */

import type { Knex } from 'knex';

// ============================================================================
// Row Count Queries (Cross-Database Compatible)
// ============================================================================

/**
 * Get row count for a specific table using cross-database compatible query.
 *
 * **Cross-Database Compatibility**:
 * - PostgreSQL returns COUNT as string
 * - MySQL/SQLite return COUNT as number
 * - MSSQL returns COUNT as number
 *
 * This function normalizes the result to always return a number.
 *
 * @param database - Knex database instance
 * @param tableName - Name of the table to count
 * @returns Promise resolving to row count as number
 *
 * @example
 * ```typescript
 * const count = await getTableRowCount(database, 'articles');
 * console.log(`Articles table has ${count} rows`);
 * ```
 */
export async function getTableRowCount(database: Knex, tableName: string): Promise<number> {
  try {
    const result = await database(tableName).count('* as count').first();

    if (!result) {
      return 0;
    }

    // Cross-database compatibility: handle both string and number return types
    // PostgreSQL returns string, MySQL/SQLite return number
    const countValue = Object.values(result)[0];
    return parseInt(String(countValue), 10);
  } catch (error) {
    console.error(`Error getting row count for table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Get row counts for multiple tables in parallel.
 *
 * @param database - Knex database instance
 * @param tableNames - Array of table names to count
 * @returns Promise resolving to Map of table name to row count
 *
 * @example
 * ```typescript
 * const counts = await getBulkTableRowCounts(database, ['articles', 'users', 'products']);
 * console.log(`Articles: ${counts.get('articles')}`);
 * ```
 */
export async function getBulkTableRowCounts(
  database: Knex,
  tableNames: string[]
): Promise<Map<string, number>> {
  const results = new Map<string, number>();

  // Execute all queries in parallel for better performance
  const countPromises = tableNames.map(async (tableName) => {
    try {
      const count = await getTableRowCount(database, tableName);
      return { tableName, count };
    } catch (error) {
      console.warn(`Failed to get count for table ${tableName}, using 0:`, error);
      return { tableName, count: 0 };
    }
  });

  const counts = await Promise.all(countPromises);

  counts.forEach(({ tableName, count }) => {
    results.set(tableName, count);
  });

  return results;
}

// ============================================================================
// Activity Log Queries
// ============================================================================

/**
 * Build a base query for directus_activity with common filters.
 *
 * @param database - Knex database instance
 * @param filters - Optional filters to apply
 * @returns Knex query builder
 *
 * @example
 * ```typescript
 * const query = buildActivityQuery(database, {
 *   collections: ['articles'],
 *   startDate: '2025-01-01',
 *   endDate: '2025-01-31'
 * });
 * const results = await query;
 * ```
 */
export function buildActivityQuery(
  database: Knex,
  filters?: {
    collections?: string[];
    ipAddresses?: string[];
    userIds?: string[];
    actions?: string[];
    startDate?: string;
    endDate?: string;
  }
): Knex.QueryBuilder {
  let query = database('directus_activity');

  // Apply collection filter
  if (filters?.collections && filters.collections.length > 0) {
    query = query.whereIn('collection', filters.collections);
  }

  // Apply IP address filter
  if (filters?.ipAddresses && filters.ipAddresses.length > 0) {
    query = query.whereIn('ip', filters.ipAddresses);
  }

  // Apply user ID filter
  if (filters?.userIds && filters.userIds.length > 0) {
    query = query.whereIn('user', filters.userIds);
  }

  // Apply action filter
  if (filters?.actions && filters.actions.length > 0) {
    query = query.whereIn('action', filters.actions);
  }

  // Apply date range filter
  if (filters?.startDate) {
    query = query.where('timestamp', '>=', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.where('timestamp', '<=', filters.endDate);
  }

  return query;
}

/**
 * Get aggregated activity statistics by collection.
 *
 * @param database - Knex database instance
 * @param filters - Optional filters
 * @returns Promise resolving to aggregated statistics
 */
export async function getActivityStatsByCollection(
  database: Knex,
  filters?: {
    collections?: string[];
    startDate?: string;
    endDate?: string;
  }
): Promise<
  Array<{
    collection: string;
    request_count: number;
    unique_users: number;
    unique_ips: number;
  }>
> {
  const query = buildActivityQuery(database, filters)
    .select('collection')
    .count('* as request_count')
    .countDistinct('user as unique_users')
    .countDistinct('ip as unique_ips')
    .groupBy('collection')
    .orderBy('request_count', 'desc');

  const results = await query;

  // Normalize results (handle database-specific return types)
  return results.map((row: any) => ({
    collection: row.collection,
    request_count: parseInt(String(row.request_count), 10),
    unique_users: parseInt(String(row.unique_users), 10),
    unique_ips: parseInt(String(row.unique_ips), 10),
  }));
}

/**
 * Get action breakdown (create, read, update, delete) for a collection.
 *
 * @param database - Knex database instance
 * @param collection - Collection name
 * @param filters - Optional date range filters
 * @returns Promise resolving to action breakdown
 */
export async function getActionBreakdown(
  database: Knex,
  collection: string,
  filters?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<{
  create: number;
  read: number;
  update: number;
  delete: number;
  other: number;
}> {
  const query = buildActivityQuery(database, {
    collections: [collection],
    ...filters,
  })
    .select('action')
    .count('* as count')
    .groupBy('action');

  const results = await query;

  const breakdown = {
    create: 0,
    read: 0,
    update: 0,
    delete: 0,
    other: 0,
  };

  results.forEach((row: any) => {
    const count = parseInt(String(row.count), 10);
    switch (row.action) {
      case 'create':
        breakdown.create = count;
        break;
      case 'update':
        breakdown.update = count;
        break;
      case 'delete':
        breakdown.delete = count;
        break;
      case 'login':
      case 'authenticate':
        // These are read-like actions
        breakdown.read += count;
        break;
      default:
        breakdown.other += count;
    }
  });

  return breakdown;
}

// ============================================================================
// Time-Series Queries
// ============================================================================

/**
 * Get time-series data aggregated by specified granularity.
 *
 * @param database - Knex database instance
 * @param granularity - Time granularity (hour, day, week, month)
 * @param filters - Optional filters
 * @returns Promise resolving to time-series data points
 */
export async function getTimeSeriesData(
  database: Knex,
  granularity: 'hour' | 'day' | 'week' | 'month',
  filters?: {
    collection?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<Array<{ timestamp: string; count: number }>> {
  // Build the date truncation based on database type
  const client = database.client.config.client;
  let dateTruncFunction: Knex.Raw;

  if (client === 'pg' || client === 'postgres') {
    // PostgreSQL
    dateTruncFunction = database.raw(`date_trunc('${granularity}', timestamp)`);
  } else if (client === 'mysql' || client === 'mysql2') {
    // MySQL
    const format =
      granularity === 'hour'
        ? '%Y-%m-%d %H:00:00'
        : granularity === 'day'
          ? '%Y-%m-%d'
          : granularity === 'week'
            ? '%Y-%U'
            : '%Y-%m';
    dateTruncFunction = database.raw(`DATE_FORMAT(timestamp, '${format}')`);
  } else {
    // SQLite and others - use strftime
    const format =
      granularity === 'hour'
        ? '%Y-%m-%d %H:00:00'
        : granularity === 'day'
          ? '%Y-%m-%d'
          : granularity === 'week'
            ? '%Y-%W'
            : '%Y-%m';
    dateTruncFunction = database.raw(`strftime('${format}', timestamp)`);
  }

  const query = buildActivityQuery(database, {
    collections: filters?.collection ? [filters.collection] : undefined,
    startDate: filters?.startDate,
    endDate: filters?.endDate,
  })
    .select(database.raw('?? as timestamp', [dateTruncFunction]))
    .count('* as count')
    .groupBy(dateTruncFunction)
    .orderBy(dateTruncFunction);

  const results = await query;

  return results.map((row: any) => ({
    timestamp: row.timestamp,
    count: parseInt(String(row.count), 10),
  }));
}

// ============================================================================
// IP-Based Queries
// ============================================================================

/**
 * Get activity summary for a specific IP address.
 *
 * @param database - Knex database instance
 * @param ip - IP address to analyze
 * @param filters - Optional date range filters
 * @returns Promise resolving to IP activity summary
 */
export async function getIPActivitySummary(
  database: Knex,
  ip: string,
  filters?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<{
  request_count: number;
  unique_users: number;
  collections_accessed: string[];
  first_seen: string;
  last_seen: string;
}> {
  const query = buildActivityQuery(database, {
    ipAddresses: [ip],
    ...filters,
  });

  // Get aggregate stats
  const stats = await query
    .clone()
    .count('* as request_count')
    .countDistinct('user as unique_users')
    .min('timestamp as first_seen')
    .max('timestamp as last_seen')
    .first();

  // Get distinct collections
  const collections = await query
    .clone()
    .distinct('collection')
    .pluck('collection');

  return {
    request_count: parseInt(String(stats?.request_count || 0), 10),
    unique_users: parseInt(String(stats?.unique_users || 0), 10),
    collections_accessed: collections,
    first_seen: stats?.first_seen || '',
    last_seen: stats?.last_seen || '',
  };
}

// ============================================================================
// Database Transaction Helpers
// ============================================================================

/**
 * Execute a function within a database transaction.
 *
 * @param database - Knex database instance
 * @param callback - Function to execute within transaction
 * @returns Promise resolving to callback result
 */
export async function withTransaction<T>(
  database: Knex,
  callback: (trx: Knex.Transaction) => Promise<T>
): Promise<T> {
  return await database.transaction(callback);
}

/**
 * Check if a table exists in the database.
 *
 * @param database - Knex database instance
 * @param tableName - Name of the table to check
 * @returns Promise resolving to true if table exists
 */
export async function tableExists(database: Knex, tableName: string): Promise<boolean> {
  return await database.schema.hasTable(tableName);
}
