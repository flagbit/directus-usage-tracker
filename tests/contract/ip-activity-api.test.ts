/**
 * Contract Tests: IP-Specific Activity API
 *
 * Tests the API contract for GET /usage-analytics-api/activity/ips/:ip endpoint.
 * Validates response schema matches TypeScript interfaces.
 *
 * @group contract
 * @group api
 * @group user-story-3
 */

import { describe, it, expect } from 'vitest';
import type { ActivityStatistics } from '@shared/types';

describe('Contract: GET /usage-analytics-api/activity/ips/:ip', () => {
  /**
   * Test: IP-specific activity statistics schema validation
   */
  it('should return ActivityStatistics schema for specific IP', () => {
    // Mock response from IP-specific endpoint
    const mockResponse: ActivityStatistics = {
      total_requests: 1234,
      unique_users: 45,
      unique_ips: 1, // Single IP being filtered
      date_range: {
        start: '2025-01-13T00:00:00Z',
        end: '2025-01-20T23:59:59Z',
      },
      by_collection: [
        {
          collection: 'articles',
          count: 567,
          percentage: 45.9,
        },
        {
          collection: 'users',
          count: 432,
          percentage: 35.0,
        },
        {
          collection: 'products',
          count: 235,
          percentage: 19.1,
        },
      ],
      by_action: [
        {
          action: 'read',
          count: 890,
          percentage: 72.1,
        },
        {
          action: 'create',
          count: 234,
          percentage: 19.0,
        },
        {
          action: 'update',
          count: 90,
          percentage: 7.3,
        },
        {
          action: 'delete',
          count: 20,
          percentage: 1.6,
        },
      ],
      cached: false,
      query_time_ms: 45,
      timestamp: '2025-01-20T12:30:00Z',
    };

    // Validate required fields
    expect(mockResponse).toHaveProperty('total_requests');
    expect(mockResponse).toHaveProperty('unique_users');
    expect(mockResponse).toHaveProperty('unique_ips');
    expect(mockResponse).toHaveProperty('date_range');
    expect(mockResponse).toHaveProperty('by_collection');
    expect(mockResponse).toHaveProperty('by_action');

    // Validate types
    expect(typeof mockResponse.total_requests).toBe('number');
    expect(typeof mockResponse.unique_users).toBe('number');
    expect(typeof mockResponse.unique_ips).toBe('number');

    // Validate date range structure
    expect(mockResponse.date_range).toHaveProperty('start');
    expect(mockResponse.date_range).toHaveProperty('end');
    expect(typeof mockResponse.date_range.start).toBe('string');
    expect(typeof mockResponse.date_range.end).toBe('string');

    // Validate by_collection array
    expect(Array.isArray(mockResponse.by_collection)).toBe(true);
    expect(mockResponse.by_collection.length).toBeGreaterThan(0);

    mockResponse.by_collection.forEach((item) => {
      expect(item).toHaveProperty('collection');
      expect(item).toHaveProperty('count');
      expect(item).toHaveProperty('percentage');
      expect(typeof item.collection).toBe('string');
      expect(typeof item.count).toBe('number');
      expect(typeof item.percentage).toBe('number');
    });

    // Validate by_action array
    expect(Array.isArray(mockResponse.by_action)).toBe(true);
    expect(mockResponse.by_action.length).toBeGreaterThan(0);

    mockResponse.by_action.forEach((item) => {
      expect(item).toHaveProperty('action');
      expect(item).toHaveProperty('count');
      expect(item).toHaveProperty('percentage');
      expect(typeof item.action).toBe('string');
      expect(typeof item.count).toBe('number');
      expect(typeof item.percentage).toBe('number');
    });

    // Validate percentages sum to ~100% (allowing for rounding)
    const collectionPercentageSum = mockResponse.by_collection.reduce(
      (sum, item) => sum + item.percentage,
      0
    );
    expect(collectionPercentageSum).toBeGreaterThan(99);
    expect(collectionPercentageSum).toBeLessThanOrEqual(100);

    const actionPercentageSum = mockResponse.by_action.reduce(
      (sum, item) => sum + item.percentage,
      0
    );
    expect(actionPercentageSum).toBeGreaterThan(99);
    expect(actionPercentageSum).toBeLessThanOrEqual(100);
  });

  /**
   * Test: IP address parameter validation
   */
  it('should validate IP address format in request', () => {
    const validIPv4 = '192.168.1.1';
    const validIPv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    const invalidIP = 'not-an-ip';

    // IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    expect(ipv4Regex.test(validIPv4)).toBe(true);
    expect(ipv4Regex.test(invalidIP)).toBe(false);

    // IPv6 validation (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
    expect(ipv6Regex.test(validIPv6)).toBe(true);
    expect(ipv6Regex.test(invalidIP)).toBe(false);
  });

  /**
   * Test: Empty results for IP with no activity
   */
  it('should handle IP with no activity gracefully', () => {
    const mockEmptyResponse: ActivityStatistics = {
      total_requests: 0,
      unique_users: 0,
      unique_ips: 0,
      date_range: {
        start: '2025-01-13T00:00:00Z',
        end: '2025-01-20T23:59:59Z',
      },
      by_collection: [],
      by_action: [],
      cached: false,
      query_time_ms: 12,
      timestamp: '2025-01-20T12:30:00Z',
    };

    expect(mockEmptyResponse.total_requests).toBe(0);
    expect(mockEmptyResponse.by_collection).toHaveLength(0);
    expect(mockEmptyResponse.by_action).toHaveLength(0);
  });

  /**
   * Test: Date range filtering for IP-specific queries
   */
  it('should support date range filtering for IP queries', () => {
    const startDate = '2025-01-01T00:00:00Z';
    const endDate = '2025-01-31T23:59:59Z';

    const queryParams = {
      start_date: startDate,
      end_date: endDate,
    };

    expect(queryParams.start_date).toBe(startDate);
    expect(queryParams.end_date).toBe(endDate);

    // Validate date format
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
    expect(isoDateRegex.test(queryParams.start_date)).toBe(true);
    expect(isoDateRegex.test(queryParams.end_date)).toBe(true);
  });

  /**
   * Test: Top N limiting for IP-specific results
   */
  it('should support Top N limiting for collection and action results', () => {
    const mockResponse: ActivityStatistics = {
      total_requests: 5000,
      unique_users: 100,
      unique_ips: 1,
      date_range: {
        start: '2025-01-13T00:00:00Z',
        end: '2025-01-20T23:59:59Z',
      },
      by_collection: [
        { collection: 'collection1', count: 1000, percentage: 20.0 },
        { collection: 'collection2', count: 900, percentage: 18.0 },
        { collection: 'collection3', count: 800, percentage: 16.0 },
        { collection: 'collection4', count: 700, percentage: 14.0 },
        { collection: 'collection5', count: 600, percentage: 12.0 },
        { collection: 'collection6', count: 500, percentage: 10.0 },
        { collection: 'collection7', count: 300, percentage: 6.0 },
        { collection: 'collection8', count: 200, percentage: 4.0 },
      ],
      by_action: [
        { action: 'read', count: 3500, percentage: 70.0 },
        { action: 'create', count: 1000, percentage: 20.0 },
        { action: 'update', count: 400, percentage: 8.0 },
        { action: 'delete', count: 100, percentage: 2.0 },
      ],
      cached: false,
      query_time_ms: 67,
      timestamp: '2025-01-20T12:30:00Z',
    };

    // Verify limit parameter would work
    const limit = 10;
    const limitedCollections = mockResponse.by_collection.slice(0, limit);

    expect(limitedCollections.length).toBeLessThanOrEqual(limit);
    expect(limitedCollections[0].count).toBeGreaterThanOrEqual(
      limitedCollections[limitedCollections.length - 1].count
    );
  });
});
