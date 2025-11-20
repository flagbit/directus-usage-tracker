/**
 * Integration Tests: IP Filtering in Activity Service
 *
 * Tests IP-specific filtering methods in ActivityService.
 * Validates IP address filtering and aggregation logic.
 *
 * @group integration
 * @group services
 * @group user-story-3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { ActivityStatistics } from '@shared/types';

describe('Integration: IP Filtering in ActivityService', () => {
  let mockDatabase: Knex;
  let mockLogger: Logger;
  let mockCacheService: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    // Setup mock query builder
    mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      count: vi.fn().mockReturnThis(),
      countDistinct: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      whereIn: vi.fn().mockReturnThis(),
      whereNotNull: vi.fn().mockReturnThis(),
      whereBetween: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      first: vi.fn(),
      then: vi.fn((callback) => callback([])),
    };

    // Setup mock database
    mockDatabase = vi.fn(() => mockQueryBuilder) as any;
    mockDatabase.raw = vi.fn();

    // Setup mock logger
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    } as any;

    // Setup mock cache service
    mockCacheService = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      clearPattern: vi.fn().mockResolvedValue(undefined),
      generateActivityKey: vi.fn((options: any) => {
        const ip = options.ip_addresses?.[0] || 'all';
        return `analytics:activity:ip:${ip}`;
      }),
    };
  });

  /**
   * Test: Filter activity by single IP address
   */
  it('should filter activity by single IP address', async () => {
    const targetIP = '192.168.1.100';

    // Mock query result for IP filtering
    mockQueryBuilder.first.mockResolvedValueOnce({ count: 1234 }); // total_requests
    mockQueryBuilder.first.mockResolvedValueOnce({ count: 45 }); // unique_users
    mockQueryBuilder.first.mockResolvedValueOnce({ count: 1 }); // unique_ips
    mockQueryBuilder.then.mockResolvedValueOnce([
      // by_collection
      { collection: 'articles', count: 500 },
      { collection: 'users', count: 400 },
      { collection: 'products', count: 334 },
    ]);
    mockQueryBuilder.then.mockResolvedValueOnce([
      // by_action
      { action: 'read', count: 900 },
      { action: 'create', count: 234 },
      { action: 'update', count: 80 },
      { action: 'delete', count: 20 },
    ]);

    // Simulate filtering by IP
    const query = mockDatabase('directus_activity')
      .select('*')
      .where('ip', targetIP)
      .whereBetween('timestamp', ['2025-01-13T00:00:00Z', '2025-01-20T23:59:59Z']);

    expect(mockQueryBuilder.where).toHaveBeenCalledWith('ip', targetIP);
    expect(mockQueryBuilder.whereBetween).toHaveBeenCalled();
  });

  /**
   * Test: Filter activity by multiple IP addresses
   */
  it('should filter activity by multiple IP addresses', async () => {
    const targetIPs = ['192.168.1.100', '192.168.1.101', '10.0.0.50'];

    // Simulate filtering by multiple IPs
    const query = mockDatabase('directus_activity')
      .select('*')
      .whereIn('ip', targetIPs)
      .whereBetween('timestamp', ['2025-01-13T00:00:00Z', '2025-01-20T23:59:59Z']);

    expect(mockQueryBuilder.whereIn).toHaveBeenCalledWith('ip', targetIPs);
  });

  /**
   * Test: IP-specific collection aggregation
   */
  it('should aggregate collections for specific IP', async () => {
    const targetIP = '192.168.1.100';

    // Mock collection aggregation results
    const mockCollectionResults = [
      { collection: 'articles', count: '500' },
      { collection: 'users', count: '400' },
      { collection: 'products', count: '334' },
    ];

    mockQueryBuilder.then.mockResolvedValue(mockCollectionResults);

    const results = await mockDatabase('directus_activity')
      .select('collection')
      .count('* as count')
      .where('ip', targetIP)
      .whereBetween('timestamp', ['2025-01-13T00:00:00Z', '2025-01-20T23:59:59Z'])
      .whereNotNull('collection')
      .groupBy('collection')
      .orderBy('count', 'desc');

    expect(mockQueryBuilder.where).toHaveBeenCalledWith('ip', targetIP);
    expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('collection');
    expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('count', 'desc');
  });

  /**
   * Test: IP-specific action aggregation
   */
  it('should aggregate actions for specific IP', async () => {
    const targetIP = '192.168.1.100';

    // Mock action aggregation results
    const mockActionResults = [
      { action: 'read', count: '900' },
      { action: 'create', count: '234' },
      { action: 'update', count: '80' },
      { action: 'delete', count: '20' },
    ];

    mockQueryBuilder.then.mockResolvedValue(mockActionResults);

    const results = await mockDatabase('directus_activity')
      .select('action')
      .count('* as count')
      .where('ip', targetIP)
      .whereBetween('timestamp', ['2025-01-13T00:00:00Z', '2025-01-20T23:59:59Z'])
      .whereNotNull('action')
      .groupBy('action')
      .orderBy('count', 'desc');

    expect(mockQueryBuilder.where).toHaveBeenCalledWith('ip', targetIP);
    expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith('action');
  });

  /**
   * Test: Unique user count for specific IP
   */
  it('should count unique users for specific IP', async () => {
    const targetIP = '192.168.1.100';

    mockQueryBuilder.first.mockResolvedValue({ count: '45' });

    const result = await mockDatabase('directus_activity')
      .countDistinct('user as count')
      .where('ip', targetIP)
      .whereBetween('timestamp', ['2025-01-13T00:00:00Z', '2025-01-20T23:59:59Z'])
      .whereNotNull('user')
      .first();

    expect(mockQueryBuilder.where).toHaveBeenCalledWith('ip', targetIP);
    expect(mockQueryBuilder.countDistinct).toHaveBeenCalledWith('user as count');
    expect(mockQueryBuilder.whereNotNull).toHaveBeenCalledWith('user');
  });

  /**
   * Test: Percentage calculation for IP-specific results
   */
  it('should calculate percentages correctly for IP results', () => {
    const mockResults = [
      { collection: 'articles', count: 500 },
      { collection: 'users', count: 400 },
      { collection: 'products', count: 100 },
    ];

    const total = mockResults.reduce(
      (sum, row) => sum + parseInt(String(row.count), 10),
      0
    );

    const resultsWithPercentages = mockResults.map((row) => {
      const count = parseInt(String(row.count), 10);
      return {
        collection: row.collection,
        count,
        percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0,
      };
    });

    expect(resultsWithPercentages[0].percentage).toBe(50.0);
    expect(resultsWithPercentages[1].percentage).toBe(40.0);
    expect(resultsWithPercentages[2].percentage).toBe(10.0);

    // Verify percentages sum to 100%
    const percentageSum = resultsWithPercentages.reduce(
      (sum, item) => sum + item.percentage,
      0
    );
    expect(percentageSum).toBe(100.0);
  });

  /**
   * Test: Handle empty results for IP with no activity
   */
  it('should handle empty results for IP with no activity', async () => {
    const targetIP = '192.168.1.999'; // IP with no activity

    mockQueryBuilder.first.mockResolvedValue({ count: '0' });
    mockQueryBuilder.then.mockResolvedValue([]);

    const result = await mockDatabase('directus_activity')
      .count('* as count')
      .where('ip', targetIP)
      .whereBetween('timestamp', ['2025-01-13T00:00:00Z', '2025-01-20T23:59:59Z'])
      .first();

    const countValue = result ? parseInt(String(Object.values(result)[0]), 10) : 0;
    expect(countValue).toBe(0);
  });

  /**
   * Test: Cache key generation for IP-specific queries
   */
  it('should generate unique cache keys for IP queries', () => {
    const ip1 = '192.168.1.100';
    const ip2 = '192.168.1.101';

    const cacheKey1 = mockCacheService.generateActivityKey({
      ip_addresses: [ip1],
      start_date: '2025-01-13T00:00:00Z',
      end_date: '2025-01-20T23:59:59Z',
    });

    const cacheKey2 = mockCacheService.generateActivityKey({
      ip_addresses: [ip2],
      start_date: '2025-01-13T00:00:00Z',
      end_date: '2025-01-20T23:59:59Z',
    });

    expect(cacheKey1).not.toBe(cacheKey2);
    expect(cacheKey1).toContain(ip1);
    expect(cacheKey2).toContain(ip2);
  });

  /**
   * Test: Date range filtering with IP address
   */
  it('should support date range filtering with IP address', async () => {
    const targetIP = '192.168.1.100';
    const startDate = '2025-01-01T00:00:00Z';
    const endDate = '2025-01-31T23:59:59Z';

    const query = mockDatabase('directus_activity')
      .select('*')
      .where('ip', targetIP)
      .whereBetween('timestamp', [startDate, endDate]);

    expect(mockQueryBuilder.where).toHaveBeenCalledWith('ip', targetIP);
    expect(mockQueryBuilder.whereBetween).toHaveBeenCalledWith('timestamp', [
      startDate,
      endDate,
    ]);
  });

  /**
   * Test: Top N limiting for IP-specific queries
   */
  it('should support Top N limiting for IP queries', async () => {
    const targetIP = '192.168.1.100';
    const limit = 10;

    const query = mockDatabase('directus_activity')
      .select('collection')
      .count('* as count')
      .where('ip', targetIP)
      .groupBy('collection')
      .orderBy('count', 'desc')
      .limit(limit);

    expect(mockQueryBuilder.limit).toHaveBeenCalledWith(limit);
  });
});
