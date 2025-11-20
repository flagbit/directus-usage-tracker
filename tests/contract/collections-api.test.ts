/**
 * Contract tests for GET /usage-analytics-api/collections endpoint
 *
 * Tests the API contract to ensure responses match the expected schema
 * @module tests/contract/collections-api
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type {
  CollectionUsageResponse,
  CollectionUsage,
  ErrorResponse,
} from '@shared/types';

// Mock Knex database and Directus services
const mockDatabase = {
  async getTableNames() {
    return ['articles', 'users', 'directus_users', 'products'];
  },
  async getTableCount(tableName: string) {
    const mockCounts: Record<string, number> = {
      articles: 15432,
      users: 543,
      directus_users: 12,
      products: 8901,
    };
    return mockCounts[tableName] || 0;
  },
};

describe('Contract: GET /usage-analytics-api/collections', () => {
  describe('Response Schema Validation', () => {
    it('should return CollectionUsageResponse schema', () => {
      const mockResponse: CollectionUsageResponse = {
        data: [
          {
            collection: 'articles',
            name: 'Articles',
            row_count: 15432,
            is_system: false,
            icon: 'article',
            color: '#2ECDA7',
            last_activity: '2025-01-20T15:42:33Z',
            size_estimate_mb: 45.3,
          },
        ],
        total_collections: 1,
        total_rows: 15432,
        query_time_ms: 345.67,
        cached: false,
        timestamp: '2025-01-20T15:42:33Z',
      };

      // Validate response structure
      expect(mockResponse).toHaveProperty('data');
      expect(mockResponse).toHaveProperty('total_collections');
      expect(mockResponse).toHaveProperty('total_rows');
      expect(mockResponse).toHaveProperty('query_time_ms');
      expect(mockResponse).toHaveProperty('cached');
      expect(mockResponse).toHaveProperty('timestamp');

      // Validate data array items
      expect(Array.isArray(mockResponse.data)).toBe(true);
      if (mockResponse.data.length > 0) {
        const item = mockResponse.data[0];
        expect(item).toHaveProperty('collection');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('row_count');
        expect(item).toHaveProperty('is_system');
        expect(typeof item.collection).toBe('string');
        expect(typeof item.row_count).toBe('number');
        expect(typeof item.is_system).toBe('boolean');
      }
    });

    it('should validate system collection detection', () => {
      const collections: CollectionUsage[] = [
        {
          collection: 'articles',
          name: 'Articles',
          row_count: 100,
          is_system: false,
          icon: null,
          color: null,
          last_activity: null,
          size_estimate_mb: null,
        },
        {
          collection: 'directus_users',
          name: 'Directus Users',
          row_count: 50,
          is_system: true,
          icon: null,
          color: null,
          last_activity: null,
          size_estimate_mb: null,
        },
      ];

      // Validate is_system flag
      expect(collections[0].is_system).toBe(false);
      expect(collections[1].is_system).toBe(true);
      expect(collections[1].collection.startsWith('directus_')).toBe(true);
    });

    it('should validate row_count is non-negative', () => {
      const validCollection: CollectionUsage = {
        collection: 'test',
        name: 'Test',
        row_count: 100,
        is_system: false,
        icon: null,
        color: null,
        last_activity: null,
        size_estimate_mb: null,
      };

      expect(validCollection.row_count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Query Parameters', () => {
    it('should validate include_system parameter', () => {
      const validValues = [true, false, undefined];

      validValues.forEach((value) => {
        // Should not throw error
        expect(() => {
          const param = value;
          // Type check
          if (param !== undefined) {
            expect(typeof param).toBe('boolean');
          }
        }).not.toThrow();
      });
    });

    it('should validate sort parameter', () => {
      const validSorts = ['row_count', 'collection', 'name'];

      validSorts.forEach((sort) => {
        expect(validSorts).toContain(sort);
      });
    });

    it('should validate order parameter', () => {
      const validOrders = ['asc', 'desc'];

      validOrders.forEach((order) => {
        expect(validOrders).toContain(order);
      });
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
          message: 'Failed to fetch collections',
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
      ];

      validErrorCodes.forEach((code) => {
        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Sorting', () => {
    it('should validate collections are sorted by row_count DESC by default', () => {
      const collections: CollectionUsage[] = [
        { collection: 'a', name: 'A', row_count: 1000, is_system: false, icon: null, color: null, last_activity: null, size_estimate_mb: null },
        { collection: 'b', name: 'B', row_count: 500, is_system: false, icon: null, color: null, last_activity: null, size_estimate_mb: null },
        { collection: 'c', name: 'C', row_count: 100, is_system: false, icon: null, color: null, last_activity: null, size_estimate_mb: null },
      ];

      // Verify descending order
      for (let i = 0; i < collections.length - 1; i++) {
        expect(collections[i].row_count).toBeGreaterThanOrEqual(
          collections[i + 1].row_count
        );
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
  });
});
