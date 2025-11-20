/**
 * Query Builders
 *
 * Reusable query builder functions for constructing cross-database compatible SQL queries.
 * Provides helpers for common query patterns used across the analytics endpoints.
 *
 * @module endpoint/utils/query-builders
 */

import type { Knex } from 'knex';

/**
 * Query builder result type
 */
export interface QueryBuilderResult<T = any> {
  query: Knex.QueryBuilder;
  execute: () => Promise<T>;
}

/**
 * Build a COUNT query with cross-database compatibility
 *
 * Handles differences in COUNT return types between databases:
 * - PostgreSQL returns string
 * - MySQL returns number
 * - SQLite returns number
 * - MSSQL returns number
 *
 * @param database - Knex database instance
 * @param tableName - Name of table to count
 * @param columnExpression - Column expression to count (default: '* as count')
 * @returns Query builder result with execute method
 *
 * @example
 * ```typescript
 * const result = buildCountQuery(db, 'articles');
 * const count = await result.execute();
 * // count is guaranteed to be a number
 * ```
 */
export function buildCountQuery(
  database: Knex,
  tableName: string,
  columnExpression: string = '* as count'
): QueryBuilderResult<number> {
  const query = database(tableName).count(columnExpression).first();

  return {
    query,
    execute: async (): Promise<number> => {
      const result = await query;
      if (!result) return 0;

      // Extract count value (handle object with dynamic key)
      const countValue = Object.values(result)[0];

      // Convert to number (handles both string and number types)
      return parseInt(String(countValue), 10);
    },
  };
}

/**
 * Build a batch COUNT query for multiple tables
 *
 * Executes COUNT queries in parallel for improved performance.
 *
 * @param database - Knex database instance
 * @param tableNames - Array of table names to count
 * @returns Promise resolving to Map of table names to row counts
 *
 * @example
 * ```typescript
 * const counts = await buildBatchCountQuery(db, ['articles', 'users', 'products']);
 * console.log(counts.get('articles')); // 15432
 * ```
 */
export async function buildBatchCountQuery(
  database: Knex,
  tableNames: string[]
): Promise<Map<string, number>> {
  const results = await Promise.all(
    tableNames.map(async (tableName) => {
      const builder = buildCountQuery(database, tableName);
      const count = await builder.execute();
      return { tableName, count };
    })
  );

  return new Map(results.map((r) => [r.tableName, r.count]));
}

/**
 * Build a query with WHERE clause filters
 *
 * Applies multiple filter conditions to a query builder.
 *
 * @param query - Base query builder
 * @param filters - Object with filter conditions
 * @returns Modified query builder
 *
 * @example
 * ```typescript
 * const query = database('directus_activity').select('*');
 * const filtered = buildWhereClause(query, {
 *   action: 'create',
 *   user: '1234',
 *   timestamp: { '>': '2025-01-01' }
 * });
 * ```
 */
export function buildWhereClause(
  query: Knex.QueryBuilder,
  filters: Record<string, any>
): Knex.QueryBuilder {
  Object.entries(filters).forEach(([key, value]) => {
    if (value === null) {
      query.whereNull(key);
    } else if (value === undefined) {
      // Skip undefined values
      return;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Handle operator objects like { '>': '2025-01-01' }
      Object.entries(value).forEach(([operator, opValue]) => {
        query.where(key, operator, opValue);
      });
    } else if (Array.isArray(value)) {
      query.whereIn(key, value);
    } else {
      query.where(key, value);
    }
  });

  return query;
}

/**
 * Build a date range filter
 *
 * Applies date range filtering to a query for a timestamp column.
 *
 * @param query - Base query builder
 * @param columnName - Name of timestamp column
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns Modified query builder
 *
 * @example
 * ```typescript
 * const query = database('directus_activity').select('*');
 * const filtered = buildDateRangeFilter(
 *   query,
 *   'timestamp',
 *   '2025-01-01T00:00:00Z',
 *   '2025-01-31T23:59:59Z'
 * );
 * ```
 */
export function buildDateRangeFilter(
  query: Knex.QueryBuilder,
  columnName: string,
  startDate?: string,
  endDate?: string
): Knex.QueryBuilder {
  if (startDate) {
    query.where(columnName, '>=', startDate);
  }

  if (endDate) {
    query.where(columnName, '<=', endDate);
  }

  return query;
}

/**
 * Build a GROUP BY aggregation query
 *
 * Creates a query with grouping and aggregation functions.
 *
 * @param database - Knex database instance
 * @param tableName - Name of table to query
 * @param groupByColumns - Columns to group by
 * @param aggregations - Aggregation functions to apply
 * @returns Query builder
 *
 * @example
 * ```typescript
 * const query = buildGroupByQuery(
 *   db,
 *   'directus_activity',
 *   ['collection', 'action'],
 *   { count: '*', max_timestamp: 'timestamp' }
 * );
 * const results = await query;
 * ```
 */
export function buildGroupByQuery(
  database: Knex,
  tableName: string,
  groupByColumns: string[],
  aggregations: Record<string, string>
): Knex.QueryBuilder {
  const query = database(tableName).select(...groupByColumns);

  // Add aggregation functions
  Object.entries(aggregations).forEach(([alias, column]) => {
    if (alias.startsWith('count')) {
      query.count(`${column} as ${alias}`);
    } else if (alias.startsWith('sum')) {
      query.sum(`${column} as ${alias}`);
    } else if (alias.startsWith('avg')) {
      query.avg(`${column} as ${alias}`);
    } else if (alias.startsWith('min')) {
      query.min(`${column} as ${alias}`);
    } else if (alias.startsWith('max')) {
      query.max(`${column} as ${alias}`);
    }
  });

  query.groupBy(...groupByColumns);

  return query;
}

/**
 * Build a paginated query
 *
 * Applies pagination (limit and offset) to a query.
 *
 * @param query - Base query builder
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Modified query builder with pagination
 *
 * @example
 * ```typescript
 * const query = database('directus_activity').select('*');
 * const paginated = buildPaginatedQuery(query, 2, 50); // Page 2, 50 items
 * ```
 */
export function buildPaginatedQuery(
  query: Knex.QueryBuilder,
  page: number = 1,
  pageSize: number = 50
): Knex.QueryBuilder {
  const offset = (page - 1) * pageSize;
  return query.limit(pageSize).offset(offset);
}

/**
 * Build an ORDER BY clause
 *
 * Applies sorting to a query with multiple sort fields.
 *
 * @param query - Base query builder
 * @param sortFields - Array of sort specifications
 * @returns Modified query builder with sorting
 *
 * @example
 * ```typescript
 * const query = database('directus_activity').select('*');
 * const sorted = buildOrderByClause(query, [
 *   { column: 'timestamp', order: 'desc' },
 *   { column: 'collection', order: 'asc' }
 * ]);
 * ```
 */
export function buildOrderByClause(
  query: Knex.QueryBuilder,
  sortFields: Array<{ column: string; order: 'asc' | 'desc' }>
): Knex.QueryBuilder {
  sortFields.forEach(({ column, order }) => {
    query.orderBy(column, order);
  });

  return query;
}

/**
 * Check if table exists in database
 *
 * @param database - Knex database instance
 * @param tableName - Name of table to check
 * @returns Promise resolving to true if table exists
 *
 * @example
 * ```typescript
 * const exists = await tableExists(db, 'directus_activity');
 * if (exists) {
 *   // Query the table
 * }
 * ```
 */
export async function tableExists(database: Knex, tableName: string): Promise<boolean> {
  try {
    const hasTable = await database.schema.hasTable(tableName);
    return hasTable;
  } catch (error) {
    return false;
  }
}

/**
 * Get database client type
 *
 * Identifies the database system in use for client-specific queries.
 *
 * @param database - Knex database instance
 * @returns Database client type
 *
 * @example
 * ```typescript
 * const client = getDatabaseClient(db);
 * if (client === 'pg') {
 *   // Use PostgreSQL-specific features
 * }
 * ```
 */
export function getDatabaseClient(database: Knex): string {
  return database.client.config.client;
}

/**
 * Build a DISTINCT query
 *
 * Selects distinct values from specified columns.
 *
 * @param query - Base query builder
 * @param columns - Columns to select distinct values from
 * @returns Modified query builder with DISTINCT
 *
 * @example
 * ```typescript
 * const query = database('directus_activity');
 * const distinct = buildDistinctQuery(query, ['collection', 'action']);
 * ```
 */
export function buildDistinctQuery(
  query: Knex.QueryBuilder,
  columns: string[]
): Knex.QueryBuilder {
  return query.distinct(...columns);
}
