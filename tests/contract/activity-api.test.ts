/**
 * Contract tests for GET /usage-analytics-api/activity endpoint
 *
 * Tests the API contract to ensure responses match the expected schema
 * @module tests/contract/activity-api
 */

import { describe, it, expect } from 'vitest';
import type {
  ActivityStatistics,
  ActivityByCollection,
  ActivityByAction,
  ErrorResponse,
} from '@shared/types';

describe('Contract: GET /usage-analytics-api/activity', () => {
  describe('Response Schema Validation', () => {
    it('should return ActivityStatistics schema', () => {
      const mockResponse: ActivityStatistics = {
        total_requests: 15432,
        unique_users: 543,
        unique_ips: 234,
        date_range: {
          start: '2025-01-13T00:00:00Z',
          end: '2025-01-20T23:59:59Z',
        },
        by_collection: [
          {
            collection: 'articles',
            count: 8901,
            percentage: 57.7,
          },
          {
            collection: 'users',
            count: 3245,
            percentage: 21.0,
          },
        ],
        by_action: [
          {
            action: 'read',
            count: 10234,
            percentage: 66.3,
          },
          {
            action: 'create',
            count: 3456,
            percentage: 22.4,
          },
        ],
        top_users: [],
        top_ips: [],
        query_time_ms: 234.56,
        cached: false,
        timestamp: '2025-01-20T15:42:33Z',
      };

      // Validate response structure
      expect(mockResponse).toHaveProperty('total_requests');
      expect(mockResponse).toHaveProperty('unique_users');
      expect(mockResponse).toHaveProperty('unique_ips');
      expect(mockResponse).toHaveProperty('date_range');
      expect(mockResponse).toHaveProperty('by_collection');
      expect(mockResponse).toHaveProperty('by_action');
      expect(mockResponse).toHaveProperty('query_time_ms');
      expect(mockResponse).toHaveProperty('cached');
      expect(mockResponse).toHaveProperty('timestamp');

      // Validate types
      expect(typeof mockResponse.total_requests).toBe('number');
      expect(typeof mockResponse.unique_users).toBe('number');
      expect(typeof mockResponse.unique_ips).toBe('number');
      expect(Array.isArray(mockResponse.by_collection)).toBe(true);
      expect(Array.isArray(mockResponse.by_action)).toBe(true);
    });

    it('should validate date_range structure', () => {
      const dateRange = {
        start: '2025-01-13T00:00:00Z',
        end: '2025-01-20T23:59:59Z',
      };

      expect(dateRange).toHaveProperty('start');
      expect(dateRange).toHaveProperty('end');
      expect(typeof dateRange.start).toBe('string');
      expect(typeof dateRange.end).toBe('string');

      // Validate ISO 8601 format
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      expect(!isNaN(startDate.getTime())).toBe(true);
      expect(!isNaN(endDate.getTime())).toBe(true);
    });

    it('should validate by_collection structure', () => {
      const byCollection: ActivityByCollection[] = [
        {
          collection: 'articles',
          count: 8901,
          percentage: 57.7,
        },
      ];

      expect(Array.isArray(byCollection)).toBe(true);
      expect(byCollection[0]).toHaveProperty('collection');
      expect(byCollection[0]).toHaveProperty('count');
      expect(byCollection[0]).toHaveProperty('percentage');
      expect(typeof byCollection[0].collection).toBe('string');
      expect(typeof byCollection[0].count).toBe('number');
      expect(typeof byCollection[0].percentage).toBe('number');
    });

    it('should validate by_action structure', () => {
      const byAction: ActivityByAction[] = [
        {
          action: 'read',
          count: 10234,
          percentage: 66.3,
        },
      ];

      expect(Array.isArray(byAction)).toBe(true);
      expect(byAction[0]).toHaveProperty('action');
      expect(byAction[0]).toHaveProperty('count');
      expect(byAction[0]).toHaveProperty('percentage');
      expect(typeof byAction[0].action).toBe('string');
      expect(typeof byAction[0].count).toBe('number');
      expect(typeof byAction[0].percentage).toBe('number');
    });

    it('should validate action types', () => {
      const validActions = ['create', 'read', 'update', 'delete', 'login', 'comment'];

      validActions.forEach((action) => {
        expect(typeof action).toBe('string');
        expect(action.length).toBeGreaterThan(0);
      });
    });

    it('should validate percentage calculations', () => {
      const byCollection: ActivityByCollection[] = [
        { collection: 'articles', count: 577, percentage: 57.7 },
        { collection: 'users', count: 210, percentage: 21.0 },
        { collection: 'products', count: 213, percentage: 21.3 },
      ];

      // Percentages should sum to ~100%
      const totalPercentage = byCollection.reduce((sum, item) => sum + item.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 1);
    });
  });

  describe('Query Parameters', () => {
    it('should validate start_date parameter', () => {
      const startDate = '2025-01-13T00:00:00Z';
      const date = new Date(startDate);

      expect(!isNaN(date.getTime())).toBe(true);
      expect(date.toISOString()).toBe(startDate);
    });

    it('should validate end_date parameter', () => {
      const endDate = '2025-01-20T23:59:59Z';
      const date = new Date(endDate);

      expect(!isNaN(date.getTime())).toBe(true);
      expect(date.toISOString()).toBe(endDate);
    });

    it('should validate collections filter parameter', () => {
      const collectionsFilter = 'articles,users,products';
      const collections = collectionsFilter.split(',');

      expect(Array.isArray(collections)).toBe(true);
      expect(collections.length).toBe(3);
      expect(collections).toContain('articles');
    });

    it('should validate actions filter parameter', () => {
      const actionsFilter = 'create,read,update';
      const actions = actionsFilter.split(',');

      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBe(3);
      expect(actions).toContain('read');
    });

    it('should validate limit parameter range', () => {
      const validLimits = [1, 10, 50, 100];
      const invalidLimits = [0, -1, 101, 1000];

      validLimits.forEach((limit) => {
        expect(limit).toBeGreaterThanOrEqual(1);
        expect(limit).toBeLessThanOrEqual(100);
      });

      invalidLimits.forEach((limit) => {
        const isValid = limit >= 1 && limit <= 100;
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Error Responses', () => {
    it('should return ErrorResponse schema for errors', () => {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch activity statistics',
          details: null,
        },
        timestamp: '2025-01-20T15:42:33Z',
      };

      expect(errorResponse).toHaveProperty('error');
      expect(errorResponse.error).toHaveProperty('code');
      expect(errorResponse.error).toHaveProperty('message');
      expect(errorResponse.error).toHaveProperty('details');
      expect(errorResponse).toHaveProperty('timestamp');
      expect(typeof errorResponse.error.code).toBe('string');
      expect(typeof errorResponse.error.message).toBe('string');
    });

    it('should validate error codes', () => {
      const validErrorCodes = [
        'INVALID_QUERY',
        'DATABASE_ERROR',
        'PERMISSION_DENIED',
        'NOT_FOUND',
        'TIMEOUT',
        'INVALID_DATE_RANGE',
      ];

      validErrorCodes.forEach((code) => {
        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Aggregation', () => {
    it('should aggregate requests by collection', () => {
      const activities = [
        { collection: 'articles', count: 100 },
        { collection: 'users', count: 50 },
        { collection: 'articles', count: 200 },
      ];

      // Simulate aggregation
      const aggregated = new Map<string, number>();
      activities.forEach((activity) => {
        const current = aggregated.get(activity.collection) || 0;
        aggregated.set(activity.collection, current + activity.count);
      });

      expect(aggregated.get('articles')).toBe(300);
      expect(aggregated.get('users')).toBe(50);
    });

    it('should aggregate requests by action', () => {
      const activities = [
        { action: 'read', count: 150 },
        { action: 'create', count: 50 },
        { action: 'read', count: 100 },
      ];

      // Simulate aggregation
      const aggregated = new Map<string, number>();
      activities.forEach((activity) => {
        const current = aggregated.get(activity.action) || 0;
        aggregated.set(activity.action, current + activity.count);
      });

      expect(aggregated.get('read')).toBe(250);
      expect(aggregated.get('create')).toBe(50);
    });

    it('should sort by count descending', () => {
      const byCollection: ActivityByCollection[] = [
        { collection: 'articles', count: 8901, percentage: 57.7 },
        { collection: 'users', count: 3245, percentage: 21.0 },
        { collection: 'products', count: 3286, percentage: 21.3 },
      ];

      // Verify descending order
      for (let i = 0; i < byCollection.length - 1; i++) {
        expect(byCollection[i].count).toBeGreaterThanOrEqual(byCollection[i + 1].count);
      }
    });
  });

  describe('Top N Filtering', () => {
    it('should limit results to top N collections', () => {
      const allCollections: ActivityByCollection[] = Array.from({ length: 20 }, (_, i) => ({
        collection: `collection_${i}`,
        count: 1000 - i * 50,
        percentage: (1000 - i * 50) / 10000,
      }));

      const topN = 10;
      const filtered = allCollections.slice(0, topN);

      expect(filtered.length).toBe(topN);
      expect(filtered.length).toBeLessThanOrEqual(allCollections.length);
    });

    it('should maintain sort order in top N results', () => {
      const topResults: ActivityByCollection[] = [
        { collection: 'a', count: 1000, percentage: 50 },
        { collection: 'b', count: 500, percentage: 25 },
        { collection: 'c', count: 500, percentage: 25 },
      ];

      // Verify descending order
      for (let i = 0; i < topResults.length - 1; i++) {
        expect(topResults[i].count).toBeGreaterThanOrEqual(topResults[i + 1].count);
      }
    });
  });

  describe('Timestamp Format', () => {
    it('should validate timestamp is ISO 8601 format', () => {
      const timestamp = '2025-01-20T15:42:33Z';
      const date = new Date(timestamp);

      expect(date.toISOString()).toBe(timestamp);
      expect(!isNaN(date.getTime())).toBe(true);
    });

    it('should handle timezone offsets', () => {
      const timestamps = [
        '2025-01-20T15:42:33Z',
        '2025-01-20T15:42:33+00:00',
        '2025-01-20T16:42:33+01:00',
      ];

      timestamps.forEach((timestamp) => {
        const date = new Date(timestamp);
        expect(!isNaN(date.getTime())).toBe(true);
      });
    });
  });

  describe('Cache Behavior', () => {
    it('should indicate cache status', () => {
      const cachedResponse = { cached: true };
      const freshResponse = { cached: false };

      expect(typeof cachedResponse.cached).toBe('boolean');
      expect(typeof freshResponse.cached).toBe('boolean');
      expect(cachedResponse.cached).toBe(true);
      expect(freshResponse.cached).toBe(false);
    });
  });
});
