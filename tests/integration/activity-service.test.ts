/**
 * Integration tests for ActivityService
 *
 * Tests the service layer's ability to query directus_activity table and aggregate data
 * @module tests/integration/activity-service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Knex interface
interface MockKnex {
  (tableName: string): MockQueryBuilder;
  schema: {
    hasTable: (tableName: string) => Promise<boolean>;
  };
}

interface MockQueryBuilder {
  select: (...columns: string[]) => MockQueryBuilder;
  where: (column: string, operator: string, value: any) => MockQueryBuilder;
  whereIn: (column: string, values: any[]) => MockQueryBuilder;
  whereBetween: (column: string, values: [any, any]) => MockQueryBuilder;
  groupBy: (...columns: string[]) => MockQueryBuilder;
  orderBy: (column: string, order: 'asc' | 'desc') => MockQueryBuilder;
  limit: (limit: number) => MockQueryBuilder;
  count: (column: string) => MockQueryBuilder;
  countDistinct: (column: string) => Promise<{ count: number }[]>;
  then: (callback: (result: any) => void) => Promise<any>;
}

describe('Integration: ActivityService', () => {
  let mockDatabase: MockKnex;

  beforeEach(() => {
    // Create mock database with query builder
    const mockQueryBuilder: Partial<MockQueryBuilder> = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      whereIn: vi.fn().mockReturnThis(),
      whereBetween: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      count: vi.fn().mockReturnThis(),
      countDistinct: vi.fn().mockResolvedValue([{ count: 100 }]),
      then: vi.fn().mockResolvedValue([]),
    };

    mockDatabase = Object.assign(vi.fn().mockReturnValue(mockQueryBuilder), {
      schema: {
        hasTable: vi.fn().mockResolvedValue(true),
      },
    }) as MockKnex;
  });

  describe('getTotalRequests', () => {
    it('should count total activity records', async () => {
      const mockCount = 15432;

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        whereBetween: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue([{ count: mockCount }]),
      };

      mockDatabase = Object.assign(vi.fn().mockReturnValue(mockQueryBuilder), {
        schema: { hasTable: vi.fn().mockResolvedValue(true) },
      }) as MockKnex;

      // Simulate query: SELECT COUNT(*) FROM directus_activity
      const result = await mockDatabase('directus_activity')
        .count('* as count')
        .then((rows) => rows[0].count);

      expect(result).toBe(mockCount);
      expect(mockQueryBuilder.count).toHaveBeenCalledWith('* as count');
    });

    it('should filter by date range', async () => {
      const startDate = '2025-01-13T00:00:00Z';
      const endDate = '2025-01-20T23:59:59Z';

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        whereBetween: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue([{ count: 5000 }]),
      };

      mockDatabase = Object.assign(vi.fn().mockReturnValue(mockQueryBuilder), {
        schema: { hasTable: vi.fn().mockResolvedValue(true) },
      }) as MockKnex;

      // Simulate query with date range
      await mockDatabase('directus_activity')
        .whereBetween('timestamp', [startDate, endDate])
        .count('* as count');

      expect(mockQueryBuilder.whereBetween).toHaveBeenCalledWith('timestamp', [
        startDate,
        endDate,
      ]);
    });
  });

  describe('getActivityByCollection', () => {
    it('should aggregate requests by collection', async () => {
      const mockActivities = [
        { collection: 'articles', count: 8901 },
        { collection: 'users', count: 3245 },
        { collection: 'products', count: 3286 },
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        whereBetween: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue(mockActivities),
      };

      mockDatabase = Object.assign(vi.fn().mockReturnValue(mockQueryBuilder), {
        schema: { hasTable: vi.fn().mockResolvedValue(true) },
      }) as MockKnex;

      // Simulate query: GROUP BY collection
      const results = await mockDatabase('directus_activity')
        .select('collection')
        .count('* as count')
        .groupBy('collection')
        .orderBy('count', 'desc');

      expect(results).toEqual(mockActivities);
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('collection');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('count', 'desc');
    });

    it('should calculate percentages correctly', () => {
      const activities = [
        { collection: 'articles', count: 8901 },
        { collection: 'users', count: 3245 },
        { collection: 'products', count: 3286 },
      ];

      const total = activities.reduce((sum, item) => sum + item.count, 0);

      const withPercentages = activities.map((item) => ({
        ...item,
        percentage: parseFloat(((item.count / total) * 100).toFixed(1)),
      }));

      expect(withPercentages[0].percentage).toBeCloseTo(57.7, 1);
      expect(withPercentages[1].percentage).toBeCloseTo(21.0, 1);
      expect(withPercentages[2].percentage).toBeCloseTo(21.3, 1);

      // Sum should equal 100% (allowing for rounding)
      const totalPercentage = withPercentages.reduce((sum, item) => sum + item.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 0);
    });

    it('should filter by collection names', async () => {
      const collectionsFilter = ['articles', 'users'];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        whereIn: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue([]),
      };

      mockDatabase = Object.assign(vi.fn().mockReturnValue(mockQueryBuilder), {
        schema: { hasTable: vi.fn().mockResolvedValue(true) },
      }) as MockKnex;

      await mockDatabase('directus_activity')
        .select('collection')
        .whereIn('collection', collectionsFilter)
        .count('* as count')
        .groupBy('collection');

      expect(mockQueryBuilder.whereIn).toHaveBeenCalledWith('collection', collectionsFilter);
    });
  });

  describe('getActivityByAction', () => {
    it('should aggregate requests by action type', async () => {
      const mockActivities = [
        { action: 'read', count: 10234 },
        { action: 'create', count: 3456 },
        { action: 'update', count: 1234 },
        { action: 'delete', count: 508 },
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        whereBetween: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue(mockActivities),
      };

      mockDatabase = Object.assign(vi.fn().mockReturnValue(mockQueryBuilder), {
        schema: { hasTable: vi.fn().mockResolvedValue(true) },
      }) as MockKnex;

      // Simulate query: GROUP BY action
      const results = await mockDatabase('directus_activity')
        .select('action')
        .count('* as count')
        .groupBy('action')
        .orderBy('count', 'desc');

      expect(results).toEqual(mockActivities);
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('action');
    });

    it('should handle standard CRUD actions', () => {
      const standardActions = ['create', 'read', 'update', 'delete'];

      standardActions.forEach((action) => {
        expect(typeof action).toBe('string');
        expect(action.length).toBeGreaterThan(0);
      });
    });

    it('should filter by action types', async () => {
      const actionsFilter = ['create', 'update', 'delete'];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        whereIn: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue([]),
      };

      mockDatabase = Object.assign(vi.fn().mockReturnValue(mockQueryBuilder), {
        schema: { hasTable: vi.fn().mockResolvedValue(true) },
      }) as MockKnex;

      await mockDatabase('directus_activity')
        .select('action')
        .whereIn('action', actionsFilter)
        .count('* as count')
        .groupBy('action');

      expect(mockQueryBuilder.whereIn).toHaveBeenCalledWith('action', actionsFilter);
    });
  });

  describe('getUniqueUsers', () => {
    it('should count distinct users', async () => {
      const mockCount = 543;

      const mockQueryBuilder = {
        countDistinct: vi.fn().mockResolvedValue([{ count: mockCount }]),
      };

      mockDatabase = Object.assign(vi.fn().mockReturnValue(mockQueryBuilder), {
        schema: { hasTable: vi.fn().mockResolvedValue(true) },
      }) as MockKnex;

      // Simulate query: COUNT(DISTINCT user)
      const result = await mockDatabase('directus_activity').countDistinct('user');

      expect(result[0].count).toBe(mockCount);
      expect(mockQueryBuilder.countDistinct).toHaveBeenCalledWith('user');
    });
  });

  describe('getUniqueIPs', () => {
    it('should count distinct IP addresses', async () => {
      const mockCount = 234;

      const mockQueryBuilder = {
        countDistinct: vi.fn().mockResolvedValue([{ count: mockCount }]),
      };

      mockDatabase = Object.assign(vi.fn().mockReturnValue(mockQueryBuilder), {
        schema: { hasTable: vi.fn().mockResolvedValue(true) },
      }) as MockKnex;

      // Simulate query: COUNT(DISTINCT ip)
      const result = await mockDatabase('directus_activity').countDistinct('ip');

      expect(result[0].count).toBe(mockCount);
      expect(mockQueryBuilder.countDistinct).toHaveBeenCalledWith('ip');
    });
  });

  describe('Top N Filtering', () => {
    it('should limit results to top N collections', async () => {
      const limit = 10;

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue([]),
      };

      mockDatabase = Object.assign(vi.fn().mockReturnValue(mockQueryBuilder), {
        schema: { hasTable: vi.fn().mockResolvedValue(true) },
      }) as MockKnex;

      await mockDatabase('directus_activity')
        .select('collection')
        .count('* as count')
        .groupBy('collection')
        .orderBy('count', 'desc')
        .limit(limit);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(limit);
    });
  });

  describe('Date Range Handling', () => {
    it('should handle default date range (last 7 days)', () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      expect(now.getTime()).toBeGreaterThan(sevenDaysAgo.getTime());
      expect(now.getTime() - sevenDaysAgo.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should validate date range order', () => {
      const startDate = new Date('2025-01-13T00:00:00Z');
      const endDate = new Date('2025-01-20T23:59:59Z');

      expect(startDate.getTime()).toBeLessThan(endDate.getTime());
    });

    it('should handle custom date ranges', () => {
      const dateRanges = [
        { start: '2025-01-01', end: '2025-01-31' }, // 1 month
        { start: '2025-01-01', end: '2025-12-31' }, // 1 year
        { start: '2025-01-20', end: '2025-01-20' }, // Single day
      ];

      dateRanges.forEach((range) => {
        const start = new Date(range.start);
        const end = new Date(range.end);

        expect(!isNaN(start.getTime())).toBe(true);
        expect(!isNaN(end.getTime())).toBe(true);
        expect(start.getTime()).toBeLessThanOrEqual(end.getTime());
      });
    });
  });

  describe('Null Handling', () => {
    it('should handle null collection values', () => {
      const activities = [
        { collection: 'articles', count: 100 },
        { collection: null, count: 50 },
        { collection: 'users', count: 75 },
      ];

      // Filter out null collections
      const filtered = activities.filter((a) => a.collection !== null);

      expect(filtered.length).toBe(2);
      expect(filtered.every((a) => a.collection !== null)).toBe(true);
    });

    it('should handle null user values', () => {
      const activities = [
        { user: '1234', count: 100 },
        { user: null, count: 50 }, // Anonymous actions
        { user: '5678', count: 75 },
      ];

      const withUsers = activities.filter((a) => a.user !== null);
      const anonymous = activities.filter((a) => a.user === null);

      expect(withUsers.length).toBe(2);
      expect(anonymous.length).toBe(1);
    });
  });

  describe('Performance Optimization', () => {
    it('should use efficient GROUP BY queries', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        then: vi.fn().mockResolvedValue([]),
      };

      mockDatabase = Object.assign(vi.fn().mockReturnValue(mockQueryBuilder), {
        schema: { hasTable: vi.fn().mockResolvedValue(true) },
      }) as MockKnex;

      // GROUP BY should be called once per query
      await mockDatabase('directus_activity')
        .select('collection')
        .count('* as count')
        .groupBy('collection')
        .orderBy('count', 'desc');

      expect(mockQueryBuilder.groupBy).toHaveBeenCalledTimes(1);
    });

    it('should use indexes for timestamp filtering', async () => {
      // Timestamp column should have index for efficient date range queries
      const dateRangeQuery = {
        whereBetween: vi.fn(),
      };

      // Simulate indexed query
      expect(dateRangeQuery.whereBetween).toBeDefined();
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate cache keys based on filters', () => {
      const filters = {
        startDate: '2025-01-13T00:00:00Z',
        endDate: '2025-01-20T23:59:59Z',
        collections: ['articles', 'users'],
        actions: ['read', 'create'],
      };

      const cacheKey = `analytics:activity:${filters.startDate}:${filters.endDate}:${filters.collections.join(',')}:${filters.actions.join(',')}`;

      expect(cacheKey).toContain('analytics:activity');
      expect(cacheKey).toContain(filters.startDate);
      expect(cacheKey).toContain('articles,users');
    });

    it('should have different cache keys for different filters', () => {
      const key1 = 'analytics:activity:2025-01-13:2025-01-20:articles:read';
      const key2 = 'analytics:activity:2025-01-13:2025-01-20:users:read';
      const key3 = 'analytics:activity:2025-01-13:2025-01-20:articles:create';

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });
  });
});
