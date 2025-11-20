/**
 * Directus Usage Analytics API Endpoint Entry Point
 *
 * Custom API endpoint for analytics queries and data aggregation.
 * Provides REST API routes for collection usage, activity statistics, and time-series data.
 *
 * @module endpoint
 */

import { defineEndpoint } from '@directus/extensions-sdk';
import type { Request, Response } from 'express';
import { createCacheService } from './services/cache-service';

/**
 * Usage Analytics API Endpoint
 *
 * Registers custom API routes under `/usage-analytics-api/*`
 * Provides database access and caching for analytics queries.
 */
export default defineEndpoint({
  id: 'usage-analytics-api',

  handler: (router, context) => {
    const { database, getSchema, logger } = context;

    // Initialize cache service (optional Redis, falls back to memory)
    const cacheService = createCacheService();

    // Log endpoint initialization
    logger.info('[Usage Analytics API] Endpoint initialized');

    // ========================================================================
    // Health Check Route
    // ========================================================================

    /**
     * GET /usage-analytics-api/health
     * Health check endpoint for monitoring
     */
    router.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        endpoint: 'usage-analytics-api',
        version: '1.0.0',
      });
    });

    // ========================================================================
    // Collections Routes (User Story 1)
    // ========================================================================

    /**
     * GET /usage-analytics-api/collections
     * Get storage usage for all collections
     *
     * Query Parameters:
     * - include_system: boolean (default: true)
     * - sort: string (row_count|collection|name)
     * - order: string (asc|desc)
     * - limit: number (1-100)
     *
     * TODO: Implement in Phase 3 (User Story 1)
     */
    router.get('/collections', async (req: Request, res: Response) => {
      try {
        // Placeholder implementation
        res.status(501).json({
          error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Collection usage endpoint not yet implemented',
            details: {
              phase: 'Phase 3 - User Story 1',
              available_in: 'next_implementation_phase',
            },
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        logger.error('[Collections] Error:', error);
        res.status(500).json({
          error: {
            code: 'DATABASE_ERROR',
            message: error.message || 'Failed to fetch collection usage',
            details: null,
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // ========================================================================
    // Activity Routes (User Story 2)
    // ========================================================================

    /**
     * GET /usage-analytics-api/activity
     * Get API activity statistics
     *
     * Query Parameters:
     * - start_date: ISO 8601 date
     * - end_date: ISO 8601 date
     * - collections: comma-separated collection names
     * - ip_addresses: comma-separated IP addresses
     * - actions: comma-separated action types
     * - limit: number (1-100)
     *
     * TODO: Implement in Phase 4 (User Story 2)
     */
    router.get('/activity', async (req: Request, res: Response) => {
      try {
        // Placeholder implementation
        res.status(501).json({
          error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Activity statistics endpoint not yet implemented',
            details: {
              phase: 'Phase 4 - User Story 2',
              available_in: 'next_implementation_phase',
            },
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        logger.error('[Activity] Error:', error);
        res.status(500).json({
          error: {
            code: 'DATABASE_ERROR',
            message: error.message || 'Failed to fetch activity statistics',
            details: null,
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    /**
     * GET /usage-analytics-api/activity/timeseries
     * Get time-series activity data
     *
     * Query Parameters:
     * - start_date: ISO 8601 date (required)
     * - end_date: ISO 8601 date (required)
     * - granularity: hour|day|week|month
     * - collection: collection name filter
     *
     * TODO: Implement in Phase 4 (User Story 2)
     */
    router.get('/activity/timeseries', async (req: Request, res: Response) => {
      try {
        // Placeholder implementation
        res.status(501).json({
          error: {
            code: 'NOT_IMPLEMENTED',
            message: 'Time-series endpoint not yet implemented',
            details: {
              phase: 'Phase 4 - User Story 2',
              available_in: 'next_implementation_phase',
            },
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        logger.error('[Timeseries] Error:', error);
        res.status(500).json({
          error: {
            code: 'DATABASE_ERROR',
            message: error.message || 'Failed to fetch time-series data',
            details: null,
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // ========================================================================
    // IP-Based Routes (User Story 3)
    // ========================================================================

    /**
     * GET /usage-analytics-api/activity/ips/:ip
     * Get activity for specific IP address
     *
     * Path Parameters:
     * - ip: IP address (IPv4 or IPv6)
     *
     * Query Parameters:
     * - start_date: ISO 8601 date
     * - end_date: ISO 8601 date
     *
     * TODO: Implement in Phase 5 (User Story 3)
     */
    router.get('/activity/ips/:ip', async (req: Request, res: Response) => {
      try {
        const { ip } = req.params;

        // Placeholder implementation
        res.status(501).json({
          error: {
            code: 'NOT_IMPLEMENTED',
            message: `IP activity endpoint not yet implemented for ${ip}`,
            details: {
              phase: 'Phase 5 - User Story 3',
              available_in: 'next_implementation_phase',
            },
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        logger.error('[IP Activity] Error:', error);
        res.status(500).json({
          error: {
            code: 'DATABASE_ERROR',
            message: error.message || 'Failed to fetch IP activity',
            details: null,
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // ========================================================================
    // Cache Management Routes (Admin Only)
    // ========================================================================

    /**
     * DELETE /usage-analytics-api/cache
     * Clear all analytics cache entries
     *
     * TODO: Add admin permission check
     */
    router.delete('/cache', async (_req: Request, res: Response) => {
      try {
        await cacheService.clearPattern('analytics:*');

        res.json({
          success: true,
          message: 'Analytics cache cleared successfully',
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        logger.error('[Cache] Error clearing cache:', error);
        res.status(500).json({
          error: {
            code: 'CACHE_ERROR',
            message: error.message || 'Failed to clear cache',
            details: null,
          },
          timestamp: new Date().toISOString(),
        });
      }
    });

    // ========================================================================
    // Error Handler
    // ========================================================================

    /**
     * Global error handler for unhandled routes
     */
    router.use((req: Request, res: Response) => {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Route not found: ${req.method} ${req.path}`,
          details: {
            available_routes: [
              'GET /usage-analytics-api/health',
              'GET /usage-analytics-api/collections',
              'GET /usage-analytics-api/activity',
              'GET /usage-analytics-api/activity/timeseries',
              'GET /usage-analytics-api/activity/ips/:ip',
              'DELETE /usage-analytics-api/cache',
            ],
          },
        },
        timestamp: new Date().toISOString(),
      });
    });

    logger.info('[Usage Analytics API] Routes registered successfully');
  },
});
