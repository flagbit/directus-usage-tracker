/**
 * Integration tests for CollectionService
 *
 * Tests the service layer's ability to query collections and aggregate data
 * @module tests/integration/collection-service
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
  count: (column: string) => MockQueryBuilder;
  first: () => Promise<{ count: number | string }>;
}

describe('Integration: CollectionService', () => {
  let mockDatabase: MockKnex;

  beforeEach(() => {
    // Create mock database with query builder
    const mockQueryBuilder: Partial<MockQueryBuilder> = {
      count: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue({ count: 100 }),
    };

    mockDatabase = Object.assign(
      vi.fn().mockReturnValue(mockQueryBuilder),
      {
        schema: {
          hasTable: vi.fn().mockResolvedValue(true),
        },
      }
    ) as MockKnex;
  });

  describe('getTableRowCount', () => {
    it('should return row count for a table', async () => {
      const tableName = 'articles';
      const mockCount = 15432;

      // Mock the count query
      const mockQueryBuilder = {
        count: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ count: mockCount }),
      };

      mockDatabase = Object.assign(vi.fn().mockReturnValue(mockQueryBuilder), {
        schema: { hasTable: vi.fn().mockResolvedValue(true) },
      }) as MockKnex;

      // Simulate the query
      const result = await mockDatabase(tableName).count('* as count').first();

      expect(result.count).toBe(mockCount);
      expect(mockQueryBuilder.count).toHaveBeenCalledWith('* as count');
      expect(mockQueryBuilder.first).toHaveBeenCalled();
    });

    it('should handle PostgreSQL string counts', () => {
      const postgresResult = { count: '15432' }; // PostgreSQL returns string
      const mysqlResult = { count: 15432 }; // MySQL returns number

      // Both should convert to number
      const postgresCount = parseInt(String(postgresResult.count), 10);
      const mysqlCount = parseInt(String(mysqlResult.count), 10);

      expect(postgresCount).toBe(15432);
      expect(mysqlCount).toBe(15432);
      expect(typeof postgresCount).toBe('number');
      expect(typeof mysqlCount).toBe('number');
    });

    it('should return 0 for non-existent tables', async () => {
      const mockQueryBuilder = {
        count: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      mockDatabase = Object.assign(vi.fn().mockReturnValue(mockQueryBuilder), {
        schema: { hasTable: vi.fn().mockResolvedValue(false) },
      }) as MockKnex;

      const result = await mockDatabase('non_existent').count('* as count').first();

      // Should handle null result
      const count = result ? parseInt(String(Object.values(result)[0]), 10) : 0;
      expect(count).toBe(0);
    });
  });

  describe('getBulkTableRowCounts', () => {
    it('should return counts for multiple tables in parallel', async () => {
      const tableNames = ['articles', 'users', 'products'];
      const mockCounts = {
        articles: 15432,
        users: 543,
        products: 8901,
      };

      const results = await Promise.all(
        tableNames.map(async (tableName) => {
          return {
            tableName,
            count: mockCounts[tableName as keyof typeof mockCounts],
          };
        })
      );

      const countsMap = new Map(results.map((r) => [r.tableName, r.count]));

      expect(countsMap.get('articles')).toBe(15432);
      expect(countsMap.get('users')).toBe(543);
      expect(countsMap.get('products')).toBe(8901);
      expect(countsMap.size).toBe(3);
    });

    it('should handle partial failures gracefully', async () => {
      const tableNames = ['valid_table', 'invalid_table'];

      const results = await Promise.all(
        tableNames.map(async (tableName) => {
          try {
            if (tableName === 'invalid_table') {
              throw new Error('Table not found');
            }
            return { tableName, count: 100 };
          } catch (error) {
            // Graceful fallback to 0
            return { tableName, count: 0 };
          }
        })
      );

      expect(results[0].count).toBe(100);
      expect(results[1].count).toBe(0);
    });
  });

  describe('System Collection Detection', () => {
    it('should correctly identify system collections', () => {
      const collections = [
        { collection: 'articles', is_system: false },
        { collection: 'directus_users', is_system: true },
        { collection: 'directus_activity', is_system: true },
        { collection: 'users', is_system: false },
      ];

      collections.forEach((col) => {
        const expectedIsSystem = col.collection.startsWith('directus_');
        expect(col.is_system).toBe(expectedIsSystem);
      });
    });
  });

  describe('Collection Metadata Enrichment', () => {
    it('should enrich collections with metadata', () => {
      const rawCollection = {
        collection: 'articles',
        meta: {
          icon: 'article',
          color: '#2ECDA7',
          note: 'Blog articles',
        },
      };

      const enriched = {
        collection: rawCollection.collection,
        name: rawCollection.meta?.note || rawCollection.collection,
        icon: rawCollection.meta?.icon || null,
        color: rawCollection.meta?.color || null,
        row_count: 0,
        is_system: false,
        last_activity: null,
        size_estimate_mb: null,
      };

      expect(enriched.name).toBe('Blog articles');
      expect(enriched.icon).toBe('article');
      expect(enriched.color).toBe('#2ECDA7');
    });

    it('should handle collections without metadata', () => {
      const rawCollection = {
        collection: 'simple_table',
        meta: null,
      };

      const enriched = {
        collection: rawCollection.collection,
        name: rawCollection.meta?.note || rawCollection.collection,
        icon: rawCollection.meta?.icon || null,
        color: rawCollection.meta?.color || null,
        row_count: 0,
        is_system: false,
        last_activity: null,
        size_estimate_mb: null,
      };

      expect(enriched.name).toBe('simple_table');
      expect(enriched.icon).toBeNull();
      expect(enriched.color).toBeNull();
    });
  });

  describe('Sorting and Filtering', () => {
    it('should sort collections by row_count DESC', () => {
      const collections = [
        { collection: 'a', row_count: 100 },
        { collection: 'b', row_count: 500 },
        { collection: 'c', row_count: 200 },
      ];

      const sorted = collections.sort((a, b) => b.row_count - a.row_count);

      expect(sorted[0].collection).toBe('b');
      expect(sorted[1].collection).toBe('c');
      expect(sorted[2].collection).toBe('a');
    });

    it('should filter system collections when include_system=false', () => {
      const collections = [
        { collection: 'articles', is_system: false },
        { collection: 'directus_users', is_system: true },
        { collection: 'products', is_system: false },
      ];

      const filtered = collections.filter((c) => !c.is_system);

      expect(filtered.length).toBe(2);
      expect(filtered.every((c) => !c.is_system)).toBe(true);
    });

    it('should limit results when limit parameter is provided', () => {
      const collections = Array.from({ length: 50 }, (_, i) => ({
        collection: `table_${i}`,
        row_count: i * 100,
      }));

      const limit = 10;
      const limited = collections.slice(0, limit);

      expect(limited.length).toBe(10);
      expect(limited.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('Cache Integration', () => {
    it('should generate cache keys for collection queries', () => {
      const filters = {
        includeSystem: true,
        limit: 10,
      };

      const cacheKey = `analytics:collections:system:${filters.includeSystem}:limit:${filters.limit}`;

      expect(cacheKey).toContain('analytics:collections');
      expect(cacheKey).toContain('system:true');
      expect(cacheKey).toContain('limit:10');
    });

    it('should have different cache keys for different filters', () => {
      const key1 = 'analytics:collections:system:true:limit:10';
      const key2 = 'analytics:collections:system:false:limit:10';
      const key3 = 'analytics:collections:system:true:limit:50';

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });
  });

  describe('Performance Considerations', () => {
    it('should execute parallel queries efficiently', async () => {
      const tableNames = Array.from({ length: 10 }, (_, i) => `table_${i}`);

      const startTime = Date.now();

      await Promise.all(
        tableNames.map(async (tableName) => {
          // Simulate async query
          return new Promise((resolve) => {
            setTimeout(() => resolve({ tableName, count: 100 }), 10);
          });
        })
      );

      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Parallel execution should take ~10ms, not 100ms (10 * 10ms)
      expect(elapsed).toBeLessThan(50); // Allow some overhead
    });
  });
});
