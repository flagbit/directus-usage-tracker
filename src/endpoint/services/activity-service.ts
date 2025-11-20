/**
 * Activity Service
 *
 * Service layer for querying and aggregating directus_activity data.
 * Provides methods to analyze API request patterns by collection, action, user, and IP.
 *
 * @module endpoint/services/activity-service
 */

import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type {
  ActivityStatistics,
  ActivityByCollection,
  ActivityByAction,
} from '@shared/types';
import { CacheService } from './cache-service';
import { CACHE_TTL } from '@shared/constants';

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
 * Service for managing activity analytics
 */
export class ActivityService {
  private database: Knex;
  private logger: Logger;
  private cacheService: CacheService;

  constructor(database: Knex, logger: Logger, cacheService: CacheService) {
    this.database = database;
    this.logger = logger;
    this.cacheService = cacheService;
  }

  /**
   * Get comprehensive activity statistics
   *
   * @param options - Query options for filtering
   * @returns Activity statistics with aggregations
   */
  async getActivityStatistics(
    options: ActivityQueryOptions = {}
  ): Promise<ActivityStatistics> {
    const {
      start_date,
      end_date,
      collections,
      actions,
      ip_addresses,
      limit,
    } = options;

    // Generate cache key
    const cacheKey = CacheService.generateActivityKey({
      start_date,
      end_date,
      collections,
      actions,
      ip_addresses,
      limit,
    });

    // Check cache
    const cached = await this.cacheService.get<ActivityStatistics>(cacheKey);
    if (cached) {
      this.logger.debug({ cacheKey }, 'Activity statistics retrieved from cache');
      return cached;
    }

    try {
      const startTime = Date.now();

      // Set default date range (last 7 days)
      const endDate = end_date || new Date().toISOString();
      const startDate =
        start_date ||
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Execute queries in parallel
      const [totalRequests, uniqueUsers, uniqueIPs, byCollection, byAction] =
        await Promise.all([
          this.getTotalRequests(startDate, endDate, collections, actions, ip_addresses),
          this.getUniqueUsers(startDate, endDate, collections, actions, ip_addresses),
          this.getUniqueIPs(startDate, endDate, collections, actions, ip_addresses),
          this.getActivityByCollection(
            startDate,
            endDate,
            collections,
            actions,
            ip_addresses,
            limit
          ),
          this.getActivityByAction(
            startDate,
            endDate,
            collections,
            actions,
            ip_addresses,
            limit
          ),
        ]);

      const queryTime = Date.now() - startTime;

      const statistics: ActivityStatistics = {
        total_requests: totalRequests,
        unique_users: uniqueUsers,
        unique_ips: uniqueIPs,
        date_range: {
          start: startDate,
          end: endDate,
        },
        by_collection: byCollection,
        by_action: byAction,
        top_users: [], // TODO: Implement in polish phase
        top_ips: [], // TODO: Implement in polish phase
        query_time_ms: queryTime,
        cached: false,
        timestamp: new Date().toISOString(),
      };

      this.logger.info(
        {
          totalRequests,
          uniqueUsers,
          uniqueIPs,
          queryTimeMs: queryTime,
        },
        'Activity statistics retrieved successfully'
      );

      // Cache results
      await this.cacheService.set(cacheKey, statistics, CACHE_TTL.ACTIVITY);

      return statistics;
    } catch (error) {
      this.logger.error({ error }, 'Failed to fetch activity statistics');
      throw error;
    }
  }

  /**
   * Get total request count
   *
   * @param startDate - Start date (ISO string)
   * @param endDate - End date (ISO string)
   * @param collections - Optional collection filter
   * @param actions - Optional action filter
   * @param ipAddresses - Optional IP filter
   * @returns Total request count
   */
  private async getTotalRequests(
    startDate: string,
    endDate: string,
    collections?: string[],
    actions?: string[],
    ipAddresses?: string[]
  ): Promise<number> {
    let query = this.database('directus_activity')
      .count('* as count')
      .whereBetween('timestamp', [startDate, endDate]);

    // Apply filters
    if (collections && collections.length > 0) {
      query = query.whereIn('collection', collections);
    }

    if (actions && actions.length > 0) {
      query = query.whereIn('action', actions);
    }

    if (ipAddresses && ipAddresses.length > 0) {
      query = query.whereIn('ip', ipAddresses);
    }

    const result = await query.first();
    if (!result) return 0;

    // Handle cross-database compatibility
    const countValue = Object.values(result)[0];
    return parseInt(String(countValue), 10);
  }

  /**
   * Get unique user count
   *
   * @param startDate - Start date (ISO string)
   * @param endDate - End date (ISO string)
   * @param collections - Optional collection filter
   * @param actions - Optional action filter
   * @param ipAddresses - Optional IP filter
   * @returns Unique user count
   */
  private async getUniqueUsers(
    startDate: string,
    endDate: string,
    collections?: string[],
    actions?: string[],
    ipAddresses?: string[]
  ): Promise<number> {
    let query = this.database('directus_activity')
      .countDistinct('user as count')
      .whereBetween('timestamp', [startDate, endDate])
      .whereNotNull('user'); // Exclude anonymous actions

    // Apply filters
    if (collections && collections.length > 0) {
      query = query.whereIn('collection', collections);
    }

    if (actions && actions.length > 0) {
      query = query.whereIn('action', actions);
    }

    if (ipAddresses && ipAddresses.length > 0) {
      query = query.whereIn('ip', ipAddresses);
    }

    const result = await query.first();
    if (!result) return 0;

    // Handle cross-database compatibility
    const countValue = Object.values(result)[0];
    return parseInt(String(countValue), 10);
  }

  /**
   * Get unique IP count
   *
   * @param startDate - Start date (ISO string)
   * @param endDate - End date (ISO string)
   * @param collections - Optional collection filter
   * @param actions - Optional action filter
   * @param ipAddresses - Optional IP filter
   * @returns Unique IP count
   */
  private async getUniqueIPs(
    startDate: string,
    endDate: string,
    collections?: string[],
    actions?: string[],
    ipAddresses?: string[]
  ): Promise<number> {
    let query = this.database('directus_activity')
      .countDistinct('ip as count')
      .whereBetween('timestamp', [startDate, endDate])
      .whereNotNull('ip');

    // Apply filters
    if (collections && collections.length > 0) {
      query = query.whereIn('collection', collections);
    }

    if (actions && actions.length > 0) {
      query = query.whereIn('action', actions);
    }

    if (ipAddresses && ipAddresses.length > 0) {
      query = query.whereIn('ip', ipAddresses);
    }

    const result = await query.first();
    if (!result) return 0;

    // Handle cross-database compatibility
    const countValue = Object.values(result)[0];
    return parseInt(String(countValue), 10);
  }

  /**
   * Get activity aggregated by collection
   *
   * @param startDate - Start date (ISO string)
   * @param endDate - End date (ISO string)
   * @param collections - Optional collection filter
   * @param actions - Optional action filter
   * @param ipAddresses - Optional IP filter
   * @param limit - Optional limit for top N results
   * @returns Activity by collection with counts and percentages
   */
  private async getActivityByCollection(
    startDate: string,
    endDate: string,
    collections?: string[],
    actions?: string[],
    ipAddresses?: string[],
    limit?: number
  ): Promise<ActivityByCollection[]> {
    let query = this.database('directus_activity')
      .select('collection')
      .count('* as count')
      .whereBetween('timestamp', [startDate, endDate])
      .whereNotNull('collection') // Exclude null collections
      .groupBy('collection')
      .orderBy('count', 'desc');

    // Apply filters
    if (collections && collections.length > 0) {
      query = query.whereIn('collection', collections);
    }

    if (actions && actions.length > 0) {
      query = query.whereIn('action', actions);
    }

    if (ipAddresses && ipAddresses.length > 0) {
      query = query.whereIn('ip', ipAddresses);
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const results = await query;

    // Calculate total for percentages
    const total = results.reduce(
      (sum, row) => sum + parseInt(String(row.count), 10),
      0
    );

    // Add percentages
    return results.map((row) => {
      const count = parseInt(String(row.count), 10);
      return {
        collection: row.collection,
        count,
        percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0,
      };
    });
  }

  /**
   * Get activity aggregated by action type
   *
   * @param startDate - Start date (ISO string)
   * @param endDate - End date (ISO string)
   * @param collections - Optional collection filter
   * @param actions - Optional action filter
   * @param ipAddresses - Optional IP filter
   * @param limit - Optional limit for top N results
   * @returns Activity by action with counts and percentages
   */
  private async getActivityByAction(
    startDate: string,
    endDate: string,
    collections?: string[],
    actions?: string[],
    ipAddresses?: string[],
    limit?: number
  ): Promise<ActivityByAction[]> {
    let query = this.database('directus_activity')
      .select('action')
      .count('* as count')
      .whereBetween('timestamp', [startDate, endDate])
      .whereNotNull('action') // Exclude null actions
      .groupBy('action')
      .orderBy('count', 'desc');

    // Apply filters
    if (collections && collections.length > 0) {
      query = query.whereIn('collection', collections);
    }

    if (actions && actions.length > 0) {
      query = query.whereIn('action', actions);
    }

    if (ipAddresses && ipAddresses.length > 0) {
      query = query.whereIn('ip', ipAddresses);
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const results = await query;

    // Calculate total for percentages
    const total = results.reduce(
      (sum, row) => sum + parseInt(String(row.count), 10),
      0
    );

    // Add percentages
    return results.map((row) => {
      const count = parseInt(String(row.count), 10);
      return {
        action: row.action,
        count,
        percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0,
      };
    });
  }

  /**
   * Clear activity cache
   *
   * @returns Promise that resolves when cache is cleared
   */
  async clearCache(): Promise<void> {
    await this.cacheService.clearPattern('analytics:activity:*');
    this.logger.info('Activity cache cleared');
  }
}
