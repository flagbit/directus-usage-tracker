/**
 * Cache service for usage analytics data
 *
 * Provides optional Redis caching with in-memory fallback
 * TTL: 5 minutes for hot data (Constitution Principle V: Performance)
 * @module cache-service
 */

import { CACHE_TTL, CACHE_KEYS } from '@shared/constants';

// ============================================================================
// Types
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

type CacheStore = Map<string, CacheEntry<any>>; // eslint-disable-line @typescript-eslint/no-explicit-any

// ============================================================================
// In-Memory Cache (Fallback)
// ============================================================================

/**
 * In-memory cache store (used when Redis is not available).
 * Map-based implementation with TTL support.
 */
const memoryCache: CacheStore = new Map();

/**
 * Clean up expired entries from memory cache.
 * Should be called periodically to prevent memory leaks.
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const expiredKeys: string[] = [];

  memoryCache.forEach((entry, key) => {
    if (now - entry.timestamp > entry.ttl) {
      expiredKeys.push(key);
    }
  });

  expiredKeys.forEach((key) => memoryCache.delete(key));
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

// ============================================================================
// Cache Service
// ============================================================================

/**
 * Cache service class with optional Redis integration.
 * Falls back to in-memory caching if Redis is not available.
 */
export class CacheService {
  private useRedis: boolean = false;
  private redisClient: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

  /**
   * Initialize cache service with optional Redis client.
   *
   * @param redisClient - Optional Redis client instance
   */
  constructor(redisClient?: any) {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    if (redisClient) {
      this.redisClient = redisClient;
      this.useRedis = true;
      console.log('[CacheService] Using Redis for caching');
    } else {
      console.log('[CacheService] Using in-memory cache (Redis not available)');
    }
  }

  /**
   * Get a value from cache.
   *
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.useRedis && this.redisClient) {
        return await this.getFromRedis<T>(key);
      } else {
        return this.getFromMemory<T>(key);
      }
    } catch (error) {
      console.error(`[CacheService] Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache with TTL.
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time-to-live in milliseconds (optional, uses default if not provided)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const cacheTTL = ttl || this.getDefaultTTL(key);

      if (this.useRedis && this.redisClient) {
        await this.setInRedis(key, value, cacheTTL);
      } else {
        this.setInMemory(key, value, cacheTTL);
      }
    } catch (error) {
      console.error(`[CacheService] Error setting key ${key}:`, error);
    }
  }

  /**
   * Delete a value from cache.
   *
   * @param key - Cache key to delete
   */
  async delete(key: string): Promise<void> {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.del(key);
      } else {
        memoryCache.delete(key);
      }
    } catch (error) {
      console.error(`[CacheService] Error deleting key ${key}:`, error);
    }
  }

  /**
   * Clear all cache entries matching a pattern.
   *
   * @param pattern - Cache key pattern (e.g., "analytics:*")
   */
  async clearPattern(pattern: string): Promise<void> {
    try {
      if (this.useRedis && this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } else {
        // For memory cache, manually filter and delete matching keys
        const keysToDelete: string[] = [];
        const regexPattern = new RegExp(
          pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
        );

        memoryCache.forEach((_, key) => {
          if (regexPattern.test(key)) {
            keysToDelete.push(key);
          }
        });

        keysToDelete.forEach((key) => memoryCache.delete(key));
      }
    } catch (error) {
      console.error(`[CacheService] Error clearing pattern ${pattern}:`, error);
    }
  }

  /**
   * Clear all cache entries.
   */
  async clearAll(): Promise<void> {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.flushdb();
      } else {
        memoryCache.clear();
      }
    } catch (error) {
      console.error('[CacheService] Error clearing all cache:', error);
    }
  }

  /**
   * Check if a key exists in cache.
   *
   * @param key - Cache key
   * @returns True if key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    try {
      if (this.useRedis && this.redisClient) {
        return (await this.redisClient.exists(key)) === 1;
      } else {
        const entry = memoryCache.get(key);
        if (!entry) {
          return false;
        }

        const now = Date.now();
        const isExpired = now - entry.timestamp > entry.ttl;

        if (isExpired) {
          memoryCache.delete(key);
          return false;
        }

        return true;
      }
    } catch (error) {
      console.error(`[CacheService] Error checking key ${key}:`, error);
      return false;
    }
  }

  // ============================================================================
  // Private Methods - Redis Implementation
  // ============================================================================

  /**
   * Get value from Redis.
   */
  private async getFromRedis<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    if (!value) {
      return null;
    }
    return JSON.parse(value) as T;
  }

  /**
   * Set value in Redis with TTL.
   */
  private async setInRedis<T>(key: string, value: T, ttl: number): Promise<void> {
    const serialized = JSON.stringify(value);
    const ttlSeconds = Math.ceil(ttl / 1000);
    await this.redisClient.setex(key, ttlSeconds, serialized);
  }

  // ============================================================================
  // Private Methods - Memory Implementation
  // ============================================================================

  /**
   * Get value from in-memory cache.
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = memoryCache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      memoryCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in in-memory cache with TTL.
   */
  private setInMemory<T>(key: string, value: T, ttl: number): void {
    memoryCache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
    });
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get default TTL for a cache key based on key prefix.
   */
  private getDefaultTTL(key: string): number {
    if (key.startsWith(CACHE_KEYS.COLLECTIONS)) {
      return CACHE_TTL.COLLECTIONS;
    } else if (key.startsWith(CACHE_KEYS.ACTIVITY)) {
      return CACHE_TTL.ACTIVITY;
    } else if (key.startsWith(CACHE_KEYS.TIMESERIES)) {
      return CACHE_TTL.TIMESERIES;
    } else {
      return CACHE_TTL.ACTIVITY; // Default to 5 minutes
    }
  }

  /**
   * Generate a cache key for collection usage data.
   *
   * @param filters - Optional filter parameters
   * @returns Cache key string
   */
  static generateCollectionKey(filters?: {
    includeSystem?: boolean;
    limit?: number;
  }): string {
    const parts = [CACHE_KEYS.COLLECTIONS];
    if (filters?.includeSystem !== undefined) {
      parts.push(`system:${filters.includeSystem}`);
    }
    if (filters?.limit !== undefined) {
      parts.push(`limit:${filters.limit}`);
    }
    return parts.join(':');
  }

  /**
   * Generate a cache key for activity statistics.
   *
   * @param filters - Filter parameters
   * @returns Cache key string
   */
  static generateActivityKey(filters: {
    collections?: string[];
    startDate?: string;
    endDate?: string;
    ipAddresses?: string[];
  }): string {
    const parts = [CACHE_KEYS.ACTIVITY];

    if (filters.collections && filters.collections.length > 0) {
      parts.push(`cols:${filters.collections.sort().join(',')}`);
    }
    if (filters.startDate) {
      parts.push(`start:${filters.startDate}`);
    }
    if (filters.endDate) {
      parts.push(`end:${filters.endDate}`);
    }
    if (filters.ipAddresses && filters.ipAddresses.length > 0) {
      parts.push(`ips:${filters.ipAddresses.sort().join(',')}`);
    }

    return parts.join(':');
  }

  /**
   * Generate a cache key for time-series data.
   *
   * @param granularity - Time granularity
   * @param filters - Filter parameters
   * @returns Cache key string
   */
  static generateTimeSeriesKey(
    granularity: string,
    filters: {
      collection?: string;
      startDate?: string;
      endDate?: string;
    }
  ): string {
    const parts = [CACHE_KEYS.TIMESERIES, granularity];

    if (filters.collection) {
      parts.push(`col:${filters.collection}`);
    }
    if (filters.startDate) {
      parts.push(`start:${filters.startDate}`);
    }
    if (filters.endDate) {
      parts.push(`end:${filters.endDate}`);
    }

    return parts.join(':');
  }

  /**
   * Generate a cache key for IP activity data.
   *
   * @param ip - IP address
   * @param filters - Optional filter parameters
   * @returns Cache key string
   */
  static generateIPKey(
    ip: string,
    filters?: {
      startDate?: string;
      endDate?: string;
    }
  ): string {
    const parts = [CACHE_KEYS.IP_ACTIVITY, ip];

    if (filters?.startDate) {
      parts.push(`start:${filters.startDate}`);
    }
    if (filters?.endDate) {
      parts.push(`end:${filters.endDate}`);
    }

    return parts.join(':');
  }
}

// ============================================================================
// Cache Statistics
// ============================================================================

/**
 * Get cache statistics (useful for monitoring).
 *
 * @returns Cache statistics object
 */
export function getCacheStats(): {
  type: 'redis' | 'memory';
  entries: number;
  memoryUsageBytes?: number;
} {
  return {
    type: 'memory',
    entries: memoryCache.size,
    memoryUsageBytes: calculateMemoryUsage(),
  };
}

/**
 * Calculate approximate memory usage of cache (rough estimate).
 */
function calculateMemoryUsage(): number {
  let bytes = 0;

  memoryCache.forEach((entry) => {
    // Rough estimation: JSON string length * 2 (UTF-16) + overhead
    const jsonSize = JSON.stringify(entry.data).length * 2;
    bytes += jsonSize + 100; // 100 bytes overhead per entry
  });

  return bytes;
}

// ============================================================================
// Exports
// ============================================================================

/**
 * Create a new cache service instance.
 *
 * @param redisClient - Optional Redis client
 * @returns CacheService instance
 */
export function createCacheService(redisClient?: any): CacheService {
  // eslint-disable-line @typescript-eslint/no-explicit-any
  return new CacheService(redisClient);
}
