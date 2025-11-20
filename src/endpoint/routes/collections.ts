/**
 * Collections Route Handler
 *
 * API route for retrieving collection storage usage data.
 * Provides endpoints for analyzing row counts and storage statistics.
 *
 * @module endpoint/routes/collections
 */

import type { Router } from 'express';
import type { Knex } from 'knex';
import type { SchemaOverview } from '@directus/types';
import type { Logger } from 'pino';
import type { CollectionUsageResponse, ErrorResponse } from '@shared/types';
import { CollectionService } from '../services/collection-service';
import { CacheService } from '../services/cache-service';
import { validateQueryParams } from '../utils/validators';

/**
 * Register collections routes
 *
 * @param router - Express router instance
 * @param context - Directus endpoint context
 */
export function registerCollectionsRoutes(
  router: Router,
  context: {
    database: Knex;
    getSchema: () => Promise<SchemaOverview>;
    logger: Logger;
    cacheService: CacheService;
  }
): void {
  const { database, getSchema, logger, cacheService } = context;
  const collectionService = new CollectionService(database, getSchema, logger, cacheService);

  /**
   * GET /collections
   *
   * Retrieve collection storage usage statistics
   *
   * Query Parameters:
   * - include_system: boolean - Include system collections (default: true)
   * - sort: string - Sort field (row_count|collection|name, default: row_count)
   * - order: string - Sort order (asc|desc, default: desc)
   * - limit: number - Maximum number of results (1-100)
   *
   * Response: CollectionUsageResponse
   */
  router.get('/collections', async (req, res) => {
    try {
      const startTime = Date.now();

      // Parse and validate query parameters
      const include_system = req.query.include_system !== 'false';
      const sort = (req.query.sort as string) || 'row_count';
      const order = (req.query.order as string) || 'desc';
      const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      // Validate query parameters
      const validation = validateQueryParams({
        sort: ['row_count', 'collection', 'name'],
        order: ['asc', 'desc'],
        limit: limitParam,
      });

      if (!validation.valid) {
        const errorResponse: ErrorResponse = {
          error: {
            code: 'INVALID_QUERY',
            message: validation.error || 'Invalid query parameters',
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

      logger.info(
        {
          include_system,
          sort,
          order,
          limit,
        },
        'Processing collections request'
      );

      // Check cache
      const cacheKey = CacheService.generateCollectionKey({
        include_system,
        sort: sort as 'row_count' | 'collection' | 'name',
        order: order as 'asc' | 'desc',
        limit,
      });

      const cached = await cacheService.get<CollectionUsageResponse>(cacheKey);
      if (cached) {
        logger.debug({ cacheKey }, 'Returning cached collections response');
        return res.json({ ...cached, cached: true });
      }

      // Fetch collection usage data
      const collections = await collectionService.getCollectionUsage({
        include_system,
        sort: sort as 'row_count' | 'collection' | 'name',
        order: order as 'asc' | 'desc',
        limit,
      });

      const queryTime = Date.now() - startTime;

      // Build response
      const response: CollectionUsageResponse = {
        data: collections,
        total_collections: collections.length,
        total_rows: collections.reduce((sum, c) => sum + c.row_count, 0),
        query_time_ms: queryTime,
        cached: false,
        timestamp: new Date().toISOString(),
      };

      logger.info(
        {
          collectionCount: response.total_collections,
          totalRows: response.total_rows,
          queryTimeMs: queryTime,
        },
        'Collections request completed successfully'
      );

      // Cache response
      await cacheService.set(cacheKey, response, 5 * 60 * 1000); // 5 minutes

      res.json(response);
    } catch (error) {
      logger.error({ error }, 'Failed to process collections request');

      const errorResponse: ErrorResponse = {
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch collection usage data',
          details: error instanceof Error ? error.message : null,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(errorResponse);
    }
  });

  /**
   * GET /collections/:collection
   *
   * Get usage statistics for a specific collection
   *
   * Path Parameters:
   * - collection: string - Collection name
   *
   * Response: Single CollectionUsage object
   */
  router.get('/collections/:collection', async (req, res) => {
    try {
      const { collection } = req.params;

      logger.info({ collection }, 'Fetching usage for single collection');

      // Get all collections and find the requested one
      const collections = await collectionService.getCollectionUsage({
        include_system: true,
      });

      const targetCollection = collections.find((c) => c.collection === collection);

      if (!targetCollection) {
        const errorResponse: ErrorResponse = {
          error: {
            code: 'NOT_FOUND',
            message: `Collection '${collection}' not found`,
            details: null,
          },
          timestamp: new Date().toISOString(),
        };

        return res.status(404).json(errorResponse);
      }

      res.json(targetCollection);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch collection');

      const errorResponse: ErrorResponse = {
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch collection data',
          details: error instanceof Error ? error.message : null,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(errorResponse);
    }
  });

  /**
   * DELETE /collections/cache
   *
   * Clear collection cache
   *
   * Response: Success message
   */
  router.delete('/collections/cache', async (req, res) => {
    try {
      logger.info('Clearing collection cache');

      await collectionService.clearCache();

      res.json({
        success: true,
        message: 'Collection cache cleared successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ error }, 'Failed to clear cache');

      const errorResponse: ErrorResponse = {
        error: {
          code: 'CACHE_ERROR',
          message: 'Failed to clear collection cache',
          details: error instanceof Error ? error.message : null,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(errorResponse);
    }
  });
}
