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
import { registerCollectionsRoutes } from './routes/collections';
import { registerActivityRoutes } from './routes/activity';

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
     * Register collections routes
     * Provides collection storage usage and analytics endpoints
     *
     * Routes:
     * - GET /collections - List all collections with row counts
     * - GET /collections/:collection - Get specific collection stats
     * - DELETE /collections/cache - Clear collection cache
     */
    registerCollectionsRoutes(router, {
      database,
      getSchema,
      logger,
      cacheService,
    });

    // ========================================================================
    // Activity Routes (User Story 2)
    // ========================================================================

    /**
     * Register activity routes
     * Provides activity statistics and API request pattern analysis endpoints
     *
     * Routes:
     * - GET /activity - Get comprehensive activity statistics
     * - GET /activity/timeseries - Get time-series data (Phase 4 polish)
     * - DELETE /activity/cache - Clear activity cache
     */
    registerActivityRoutes(router, {
      database,
      logger,
      cacheService,
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
