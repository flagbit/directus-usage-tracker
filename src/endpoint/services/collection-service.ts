/**
 * Collection Service
 *
 * Service layer for querying and aggregating collection storage data.
 * Provides methods to fetch collections, calculate row counts, and enrich with metadata.
 *
 * @module endpoint/services/collection-service
 */

import type { Knex } from 'knex';
import type { SchemaOverview } from '@directus/types';
import type { Logger } from 'pino';
import type { CollectionUsage } from '@shared/types';
import { getTableRowCount, getBulkTableRowCounts } from '../utils/database-helpers';
import { CacheService } from './cache-service';
import { CACHE_TTL } from '../../shared/constants';

/**
 * Service for managing collection storage analytics
 */
export class CollectionService {
  private database: Knex;
  private getSchema: () => Promise<SchemaOverview>;
  private logger: Logger;
  private cacheService: CacheService;

  constructor(
    database: Knex,
    getSchema: () => Promise<SchemaOverview>,
    logger: Logger,
    cacheService: CacheService
  ) {
    this.database = database;
    this.getSchema = getSchema;
    this.logger = logger;
    this.cacheService = cacheService;
  }

  /**
   * Get collection usage statistics with row counts and metadata
   *
   * @param options - Query options
   * @param options.include_system - Include system collections (default: true)
   * @param options.sort - Sort field (default: 'row_count')
   * @param options.order - Sort order (default: 'desc')
   * @param options.limit - Maximum number of results
   * @returns Array of collection usage data with row counts
   */
  async getCollectionUsage(options: {
    include_system?: boolean;
    sort?: 'row_count' | 'collection' | 'name';
    order?: 'asc' | 'desc';
    limit?: number;
  } = {}): Promise<CollectionUsage[]> {
    const {
      include_system = true,
      sort = 'row_count',
      order = 'desc',
      limit,
    } = options;

    // Generate cache key
    const cacheKey = CacheService.generateCollectionKey({
      include_system,
      sort,
      order,
      limit,
    });

    // Check cache
    const cached = await this.cacheService.get<CollectionUsage[]>(cacheKey);
    if (cached) {
      this.logger.debug({ cacheKey }, 'Collection usage data retrieved from cache');
      return cached;
    }

    try {
      const startTime = Date.now();

      // Get schema with collection metadata
      const schema = await this.getSchema();
      const collections = Object.values(schema.collections);

      this.logger.debug(
        { collectionCount: collections.length },
        'Retrieved collections from schema'
      );

      // Filter system collections if needed
      const filteredCollections = include_system
        ? collections
        : collections.filter((c) => !this.isSystemCollection(c.collection));

      // Get row counts for all collections in parallel
      const tableNames = filteredCollections.map((c) => c.collection);
      const rowCounts = await getBulkTableRowCounts(this.database, tableNames);

      // Enrich collections with row counts and metadata
      const enrichedCollections: CollectionUsage[] = filteredCollections.map((collection) => {
        const rowCount = rowCounts.get(collection.collection) || 0;

        return {
          collection: collection.collection,
          name: collection.meta?.note || collection.collection,
          row_count: rowCount,
          is_system: this.isSystemCollection(collection.collection),
          icon: collection.meta?.icon || null,
          color: collection.meta?.color || null,
          last_activity: null, // TODO: Implement in Phase 4 (activity analysis)
          size_estimate_mb: null, // TODO: Calculate from row count estimation
        };
      });

      // Sort collections
      const sorted = this.sortCollections(enrichedCollections, sort, order);

      // Apply limit if specified
      const limited = limit ? sorted.slice(0, limit) : sorted;

      const queryTime = Date.now() - startTime;
      this.logger.info(
        {
          collectionCount: limited.length,
          totalRows: limited.reduce((sum, c) => sum + c.row_count, 0),
          queryTimeMs: queryTime,
        },
        'Collection usage data retrieved successfully'
      );

      // Cache results
      await this.cacheService.set(cacheKey, limited, CACHE_TTL.COLLECTIONS);

      return limited;
    } catch (error) {
      this.logger.error({ error }, 'Failed to fetch collection usage data');
      throw error;
    }
  }

  /**
   * Get row count for a single collection
   *
   * @param collectionName - Name of the collection
   * @returns Row count for the collection
   */
  async getCollectionRowCount(collectionName: string): Promise<number> {
    try {
      const count = await getTableRowCount(this.database, collectionName);
      this.logger.debug({ collectionName, count }, 'Retrieved row count for collection');
      return count;
    } catch (error) {
      this.logger.error({ error, collectionName }, 'Failed to get row count');
      throw error;
    }
  }

  /**
   * Check if a collection is a system collection
   *
   * @param collectionName - Name of the collection
   * @returns True if collection is a system collection
   */
  private isSystemCollection(collectionName: string): boolean {
    return collectionName.startsWith('directus_');
  }

  /**
   * Sort collections by specified field and order
   *
   * @param collections - Array of collections to sort
   * @param sortField - Field to sort by
   * @param sortOrder - Sort order (asc or desc)
   * @returns Sorted array of collections
   */
  private sortCollections(
    collections: CollectionUsage[],
    sortField: 'row_count' | 'collection' | 'name',
    sortOrder: 'asc' | 'desc'
  ): CollectionUsage[] {
    const sorted = [...collections].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'row_count':
          comparison = a.row_count - b.row_count;
          break;
        case 'collection':
          comparison = a.collection.localeCompare(b.collection);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  /**
   * Clear collection cache
   *
   * @returns Promise that resolves when cache is cleared
   */
  async clearCache(): Promise<void> {
    await this.cacheService.clearPattern('analytics:collections:*');
    this.logger.info('Collection cache cleared');
  }
}
