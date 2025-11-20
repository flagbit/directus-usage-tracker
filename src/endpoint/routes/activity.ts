/**
 * Activity Route Handler
 *
 * API route for retrieving activity statistics and API request patterns.
 * Provides endpoints for analyzing directus_activity data.
 *
 * @module endpoint/routes/activity
 */

import type { Router } from 'express';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { ActivityStatistics, ErrorResponse } from '@shared/types';
import { ActivityService } from '../services/activity-service';
import { CacheService } from '../services/cache-service';
import { validateDateRange, validateQueryParams } from '../utils/validators';

/**
 * Register activity routes
 *
 * @param router - Express router instance
 * @param context - Directus endpoint context
 */
export function registerActivityRoutes(
  router: Router,
  context: {
    database: Knex;
    logger: Logger;
    cacheService: CacheService;
  }
): void {
  const { database, logger, cacheService } = context;
  const activityService = new ActivityService(database, logger, cacheService);

  /**
   * GET /activity
   *
   * Retrieve activity statistics and request patterns
   *
   * Query Parameters:
   * - start_date: ISO 8601 date (default: 7 days ago)
   * - end_date: ISO 8601 date (default: now)
   * - collections: comma-separated collection names
   * - actions: comma-separated action types
   * - ip_addresses: comma-separated IP addresses
   * - limit: number - Maximum number of results per aggregation (1-100)
   *
   * Response: ActivityStatistics
   */
  router.get('/activity', async (req, res) => {
    try {
      const startTime = Date.now();

      // Parse query parameters
      const start_date = req.query.start_date as string | undefined;
      const end_date = req.query.end_date as string | undefined;
      const collectionsParam = req.query.collections as string | undefined;
      const actionsParam = req.query.actions as string | undefined;
      const ipAddressesParam = req.query.ip_addresses as string | undefined;
      const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      // Validate date range
      const dateValidation = validateDateRange(start_date, end_date);
      if (!dateValidation.valid) {
        const errorResponse: ErrorResponse = {
          error: {
            code: 'INVALID_DATE_RANGE',
            message: dateValidation.error || 'Invalid date range',
            details: null,
          },
          timestamp: new Date().toISOString(),
        };

        return res.status(400).json(errorResponse);
      }

      // Validate limit range
      const limit = limitParam && (limitParam < 1 || limitParam > 100) ? undefined : limitParam;

      if (limitParam && !limit) {
        const errorResponse: ErrorResponse = {
          error: {
            code: 'INVALID_QUERY',
            message: 'Limit must be between 1 and 100',
            details: { provided: limitParam, min: 1, max: 100 },
          },
          timestamp: new Date().toISOString(),
        };

        return res.status(400).json(errorResponse);
      }

      // Parse comma-separated filters
      const collections = collectionsParam
        ? collectionsParam.split(',').map((c) => c.trim())
        : undefined;

      const actions = actionsParam ? actionsParam.split(',').map((a) => a.trim()) : undefined;

      const ip_addresses = ipAddressesParam
        ? ipAddressesParam.split(',').map((ip) => ip.trim())
        : undefined;

      logger.info(
        {
          start_date,
          end_date,
          collections,
          actions,
          ip_addresses,
          limit,
        },
        'Processing activity request'
      );

      // Check cache
      const cacheKey = CacheService.generateActivityKey({
        start_date,
        end_date,
        collections,
        actions,
        ip_addresses,
        limit,
      });

      const cached = await cacheService.get<ActivityStatistics>(cacheKey);
      if (cached) {
        logger.debug({ cacheKey }, 'Returning cached activity response');
        return res.json({ ...cached, cached: true });
      }

      // Fetch activity statistics
      const statistics = await activityService.getActivityStatistics({
        start_date,
        end_date,
        collections,
        actions,
        ip_addresses,
        limit,
      });

      const queryTime = Date.now() - startTime;

      logger.info(
        {
          totalRequests: statistics.total_requests,
          uniqueUsers: statistics.unique_users,
          uniqueIPs: statistics.unique_ips,
          queryTimeMs: queryTime,
        },
        'Activity request completed successfully'
      );

      // Update query time
      statistics.query_time_ms = queryTime;

      // Cache response
      await cacheService.set(cacheKey, statistics, 5 * 60 * 1000); // 5 minutes

      res.json(statistics);
    } catch (error) {
      logger.error({ error }, 'Failed to process activity request');

      const errorResponse: ErrorResponse = {
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch activity statistics',
          details: error instanceof Error ? error.message : null,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(errorResponse);
    }
  });

  /**
   * GET /activity/timeseries
   *
   * Get time-series activity data (for charts)
   *
   * Query Parameters:
   * - start_date: ISO 8601 date (required)
   * - end_date: ISO 8601 date (required)
   * - granularity: hour|day|week|month (default: day)
   * - collection: collection name filter
   * - action: action type filter
   *
   * Response: Time-series data points
   *
   * TODO: Implement in Phase 4 polish
   */
  router.get('/activity/timeseries', async (req, res) => {
    try {
      logger.info('Time-series endpoint called (not yet implemented)');

      const errorResponse: ErrorResponse = {
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Time-series endpoint will be implemented in polish phase',
          details: {
            phase: 'Phase 4 - Polish',
            available_in: 'next_implementation_phase',
          },
        },
        timestamp: new Date().toISOString(),
      };

      res.status(501).json(errorResponse);
    } catch (error) {
      logger.error({ error }, 'Failed to process timeseries request');

      const errorResponse: ErrorResponse = {
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch time-series data',
          details: error instanceof Error ? error.message : null,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(errorResponse);
    }
  });

  /**
   * DELETE /activity/cache
   *
   * Clear activity cache
   *
   * Response: Success message
   */
  router.delete('/activity/cache', async (req, res) => {
    try {
      logger.info('Clearing activity cache');

      await activityService.clearCache();

      res.json({
        success: true,
        message: 'Activity cache cleared successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ error }, 'Failed to clear cache');

      const errorResponse: ErrorResponse = {
        error: {
          code: 'CACHE_ERROR',
          message: 'Failed to clear activity cache',
          details: error instanceof Error ? error.message : null,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(errorResponse);
    }
  });
}
