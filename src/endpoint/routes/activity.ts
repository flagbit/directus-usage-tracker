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
   * GET /activity/ips
   *
   * Get list of top IP addresses by request count
   *
   * Query Parameters:
   * - start_date: ISO 8601 date (default: 7 days ago)
   * - end_date: ISO 8601 date (default: now)
   * - collections: comma-separated collection names
   * - actions: comma-separated action types
   * - limit: number - Maximum number of results (1-100, default: 10)
   *
   * Response: Array of { ip, count, percentage }
   */
  router.get('/activity/ips', async (req, res) => {
    try {
      const startTime = Date.now();

      // Parse query parameters
      const start_date = req.query.start_date as string | undefined;
      const end_date = req.query.end_date as string | undefined;
      const collectionsParam = req.query.collections as string | undefined;
      const actionsParam = req.query.actions as string | undefined;
      const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

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
      const limit = limitParam && (limitParam < 1 || limitParam > 100) ? 10 : limitParam;

      // Parse comma-separated filters
      const collections = collectionsParam
        ? collectionsParam.split(',').map((c) => c.trim())
        : undefined;

      const actions = actionsParam ? actionsParam.split(',').map((a) => a.trim()) : undefined;

      logger.info({ start_date, end_date, collections, actions, limit }, 'Processing top IPs request');

      // Fetch top IPs
      const topIPs = await activityService.getTopIPs({
        start_date,
        end_date,
        collections,
        actions,
        limit,
      });

      const queryTime = Date.now() - startTime;

      logger.info({ ipCount: topIPs.length, queryTimeMs: queryTime }, 'Top IPs request completed');

      res.json({
        ips: topIPs,
        query_time_ms: queryTime,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ error }, 'Failed to process top IPs request');

      const errorResponse: ErrorResponse = {
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch top IPs',
          details: error instanceof Error ? error.message : null,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(errorResponse);
    }
  });

  /**
   * GET /activity/ips/:ip
   *
   * Get activity statistics for a specific IP address
   *
   * Path Parameters:
   * - ip: IP address to analyze
   *
   * Query Parameters:
   * - start_date: ISO 8601 date (default: 7 days ago)
   * - end_date: ISO 8601 date (default: now)
   * - collections: comma-separated collection names
   * - actions: comma-separated action types
   * - limit: number - Maximum number of results per aggregation (1-100)
   *
   * Response: ActivityStatistics (filtered by IP)
   */
  router.get('/activity/ips/:ip', async (req, res) => {
    try {
      const startTime = Date.now();
      const { ip } = req.params;

      // Validate IP address format (basic validation)
      if (!ip || ip.trim().length === 0) {
        const errorResponse: ErrorResponse = {
          error: {
            code: 'INVALID_IP',
            message: 'IP address is required',
            details: null,
          },
          timestamp: new Date().toISOString(),
        };

        return res.status(400).json(errorResponse);
      }

      // Parse query parameters
      const start_date = req.query.start_date as string | undefined;
      const end_date = req.query.end_date as string | undefined;
      const collectionsParam = req.query.collections as string | undefined;
      const actionsParam = req.query.actions as string | undefined;
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

      // Parse comma-separated filters
      const collections = collectionsParam
        ? collectionsParam.split(',').map((c) => c.trim())
        : undefined;

      const actions = actionsParam ? actionsParam.split(',').map((a) => a.trim()) : undefined;

      logger.info({ ip, start_date, end_date, collections, actions, limit }, 'Processing IP activity request');

      // Fetch activity statistics for IP
      const statistics = await activityService.getActivityByIP(ip, {
        start_date,
        end_date,
        collections,
        actions,
        limit,
      });

      const queryTime = Date.now() - startTime;

      logger.info(
        {
          ip,
          totalRequests: statistics.total_requests,
          uniqueUsers: statistics.unique_users,
          queryTimeMs: queryTime,
        },
        'IP activity request completed successfully'
      );

      // Update query time
      statistics.query_time_ms = queryTime;

      res.json(statistics);
    } catch (error) {
      logger.error({ error }, 'Failed to process IP activity request');

      const errorResponse: ErrorResponse = {
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch IP activity statistics',
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
   * Get time-series activity data (for charts and trends)
   *
   * Query Parameters:
   * - start_date: ISO 8601 date (default: 30 days ago)
   * - end_date: ISO 8601 date (default: now)
   * - granularity: hour|day|week (default: day)
   * - collections: comma-separated collection names
   * - actions: comma-separated action types
   * - ip_addresses: comma-separated IP addresses
   *
   * Response: Time-series data points with timestamps and counts
   */
  router.get('/activity/timeseries', async (req, res) => {
    try {
      const startTime = Date.now();

      // Parse query parameters
      const start_date = req.query.start_date as string | undefined;
      const end_date = req.query.end_date as string | undefined;
      const granularity = (req.query.granularity as 'hour' | 'day' | 'week') || 'day';
      const collectionsParam = req.query.collections as string | undefined;
      const actionsParam = req.query.actions as string | undefined;
      const ipAddressesParam = req.query.ip_addresses as string | undefined;

      // Validate granularity
      if (!['hour', 'day', 'week'].includes(granularity)) {
        const errorResponse: ErrorResponse = {
          error: {
            code: 'INVALID_GRANULARITY',
            message: 'Granularity must be one of: hour, day, week',
            details: { provided: granularity, valid: ['hour', 'day', 'week'] },
          },
          timestamp: new Date().toISOString(),
        };

        return res.status(400).json(errorResponse);
      }

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

      // Set default date range (last 30 days)
      const endDate = end_date || new Date().toISOString();
      const startDate =
        start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Parse comma-separated filters
      const collections = collectionsParam
        ? collectionsParam.split(',').map((c) => c.trim())
        : undefined;

      const actions = actionsParam ? actionsParam.split(',').map((a) => a.trim()) : undefined;

      const ip_addresses = ipAddressesParam
        ? ipAddressesParam.split(',').map((ip) => ip.trim())
        : undefined;

      logger.info(
        { start_date: startDate, end_date: endDate, granularity, collections, actions, ip_addresses },
        'Processing timeseries request'
      );

      // Build time-series query with dynamic date truncation
      let dateFormat: string;
      switch (granularity) {
        case 'hour':
          dateFormat = '%Y-%m-%d %H:00:00';
          break;
        case 'week':
          dateFormat = '%Y-%W';
          break;
        case 'day':
        default:
          dateFormat = '%Y-%m-%d';
      }

      let query = database('directus_activity')
        .select(database.raw(`DATE_FORMAT(timestamp, '${dateFormat}') as period`))
        .count('* as count')
        .whereBetween('timestamp', [startDate, endDate])
        .groupBy('period')
        .orderBy('period', 'asc');

      // Apply filters
      if (collections && collections.length > 0) {
        query = query.whereIn('collection', collections);
      }

      if (actions && actions.length > 0) {
        query = query.whereIn('action', actions);
      }

      if (ip_addresses && ip_addresses.length > 0) {
        query = query.whereIn('ip', ip_addresses);
      }

      const results = await query;

      // Transform results
      const timeseries = results.map((row) => ({
        period: row.period,
        count: parseInt(String(row.count), 10),
      }));

      const queryTime = Date.now() - startTime;

      logger.info(
        { dataPoints: timeseries.length, queryTimeMs: queryTime },
        'Timeseries request completed'
      );

      res.json({
        timeseries,
        granularity,
        date_range: {
          start: startDate,
          end: endDate,
        },
        query_time_ms: queryTime,
        timestamp: new Date().toISOString(),
      });
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
