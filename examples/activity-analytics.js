/**
 * Directus Activity Analytics
 * Complete implementation example for analyzing 100k+ activity records
 * with <3 second query time performance target
 */

import { createDirectus, rest, aggregate, readItems } from '@directus/sdk';
import Redis from 'ioredis';

// Configuration
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://your-directus.com';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

// Initialize clients
const directus = createDirectus(DIRECTUS_URL).with(rest());
const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  keyPrefix: 'directus:activity:'
});

// ============================================================================
// Core Caching Functions
// ============================================================================

/**
 * Smart cache with stale-while-revalidate pattern
 * @param {string} key - Cache key
 * @param {Function} queryFn - Function to fetch fresh data
 * @param {Object} options - Cache options
 * @returns {Promise<any>} Cached or fresh data
 */
async function smartCache(key, queryFn, options = {}) {
  const { ttl = 300, staleWhileRevalidate = 60 } = options;

  const cached = await redis.get(key);
  const cacheAge = await redis.ttl(key);

  // Fresh cache - return immediately
  if (cached && cacheAge > staleWhileRevalidate) {
    return JSON.parse(cached);
  }

  // Stale cache - return stale, refresh in background
  if (cached && cacheAge > 0) {
    // Async refresh (don't await)
    queryFn()
      .then(result => redis.setex(key, ttl, JSON.stringify(result)))
      .catch(err => console.error('Background refresh failed:', err));

    return JSON.parse(cached);
  }

  // No cache - fetch fresh and cache
  const result = await queryFn();
  await redis.setex(key, ttl, JSON.stringify(result));
  return result;
}

/**
 * Simple cache helper
 * @param {string} key - Cache key
 * @param {Function} queryFn - Function to fetch fresh data
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<any>} Cached or fresh data
 */
async function getCached(key, queryFn, ttl = 300) {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await queryFn();
  await redis.setex(key, ttl, JSON.stringify(result));
  return result;
}

// ============================================================================
// Analytics Service Class
// ============================================================================

class ActivityAnalytics {
  constructor(directusClient, cache) {
    this.client = directusClient;
    this.cache = cache;
  }

  /**
   * Get activity breakdown by collection
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Collection activity stats
   */
  async getCollectionStats(options = {}) {
    const { days = 7, useCache = true } = options;
    const cacheKey = `collection:${days}d`;

    const queryFn = async () => {
      return this.client.request(
        aggregate('directus_activity', {
          aggregate: {
            count: ['id'],
            countDistinct: ['user', 'ip']
          },
          groupBy: ['collection'],
          query: {
            filter: {
              timestamp: {
                _gte: `$NOW(-${days}d)`
              }
            },
            sort: ['-count']
          }
        })
      );
    };

    if (!useCache) {
      return queryFn();
    }

    return smartCache(cacheKey, queryFn, { ttl: 300, staleWhileRevalidate: 60 });
  }

  /**
   * Get activity breakdown by action type
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Action type stats
   */
  async getActionStats(options = {}) {
    const { days = 7, collection = null } = options;
    const cacheKey = `action:${days}d:${collection || 'all'}`;

    const filter = {
      timestamp: { _gte: `$NOW(-${days}d)` }
    };

    if (collection) {
      filter.collection = { _eq: collection };
    }

    return getCached(
      cacheKey,
      async () => {
        return this.client.request(
          aggregate('directus_activity', {
            aggregate: { count: '*' },
            groupBy: ['action'],
            query: { filter, sort: ['-count'] }
          })
        );
      },
      300 // 5 minute TTL
    );
  }

  /**
   * Get hourly activity time series
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Hourly activity data
   */
  async getHourlyStats(options = {}) {
    const { hours = 24, action = null } = options;
    const cacheKey = `hourly:${hours}h:${action || 'all'}`;

    const filter = {
      timestamp: { _gte: `$NOW(-${hours}h)` }
    };

    if (action) {
      filter.action = { _eq: action };
    }

    return getCached(
      cacheKey,
      async () => {
        const result = await this.client.request(
          aggregate('directus_activity', {
            aggregate: {
              count: '*',
              countDistinct: ['user']
            },
            groupBy: ['hour(timestamp)', 'action'],
            query: { filter }
          })
        );

        return this.transformTimeSeriesData(result);
      },
      300 // 5 minute TTL
    );
  }

  /**
   * Get top active IP addresses
   * @param {Object} options - Query options
   * @returns {Promise<Array>} IP activity stats
   */
  async getIPStats(options = {}) {
    const { days = 7, minActivity = 10, limit = 50 } = options;
    const cacheKey = `ip:${days}d:${minActivity}:${limit}`;

    return getCached(
      cacheKey,
      async () => {
        const result = await this.client.request(
          aggregate('directus_activity', {
            aggregate: {
              count: '*',
              countDistinct: ['collection', 'user', 'action']
            },
            groupBy: ['ip'],
            query: {
              filter: {
                timestamp: { _gte: `$NOW(-${days}d)` },
                ip: { _nnull: true }
              },
              sort: ['-count'],
              limit
            }
          })
        );

        // Filter and calculate risk scores
        return result
          .filter(item => item.count >= minActivity)
          .map(item => ({
            ...item,
            riskLevel: this.calculateRiskLevel(item),
            activityScore: this.calculateActivityScore(item)
          }));
      },
      600 // 10 minute TTL
    );
  }

  /**
   * Get user activity summary
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User activity stats
   */
  async getUserStats(options = {}) {
    const { days = 30, limit = 100 } = options;
    const cacheKey = `user:${days}d:${limit}`;

    return getCached(
      cacheKey,
      async () => {
        return this.client.request(
          aggregate('directus_activity', {
            aggregate: {
              count: '*',
              countDistinct: ['collection', 'action']
            },
            groupBy: ['user'],
            query: {
              filter: {
                timestamp: { _gte: `$NOW(-${days}d)` },
                user: { _nnull: true }
              },
              sort: ['-count'],
              limit
            }
          })
        );
      },
      180 // 3 minute TTL
    );
  }

  /**
   * Get individual user activity
   * @param {string} userId - User UUID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} User activity details
   */
  async getUserActivity(userId, options = {}) {
    const { days = 30 } = options;
    const cacheKey = `user:detail:${userId}:${days}d`;

    return getCached(
      cacheKey,
      async () => {
        const [summary, byCollection, byAction] = await Promise.all([
          // Overall summary
          this.client.request(
            aggregate('directus_activity', {
              aggregate: {
                count: '*',
                countDistinct: ['collection', 'ip']
              },
              query: {
                filter: {
                  user: { _eq: userId },
                  timestamp: { _gte: `$NOW(-${days}d)` }
                }
              }
            })
          ),

          // By collection
          this.client.request(
            aggregate('directus_activity', {
              aggregate: { count: '*' },
              groupBy: ['collection'],
              query: {
                filter: {
                  user: { _eq: userId },
                  timestamp: { _gte: `$NOW(-${days}d)` }
                },
                sort: ['-count']
              }
            })
          ),

          // By action
          this.client.request(
            aggregate('directus_activity', {
              aggregate: { count: '*' },
              groupBy: ['action'],
              query: {
                filter: {
                  user: { _eq: userId },
                  timestamp: { _gte: `$NOW(-${days}d)` }
                }
              }
            })
          )
        ]);

        return {
          userId,
          period: `${days} days`,
          summary: summary[0],
          byCollection,
          byAction
        };
      },
      180 // 3 minute TTL
    );
  }

  /**
   * Detect suspicious activity patterns
   * @param {Object} options - Detection options
   * @returns {Promise<Array>} Suspicious activity alerts
   */
  async detectSuspiciousActivity(options = {}) {
    const { hours = 1, threshold = 100 } = options;
    const cacheKey = `security:suspicious:${hours}h:${threshold}`;

    return getCached(
      cacheKey,
      async () => {
        const ipStats = await this.getIPStats({
          days: hours / 24,
          minActivity: threshold,
          limit: 100
        });

        // Flag high-risk IPs
        return ipStats
          .filter(item => item.riskLevel === 'high')
          .map(item => ({
            ...item,
            alertType: this.determineAlertType(item),
            timestamp: new Date()
          }));
      },
      60 // 1 minute TTL for security data
    );
  }

  /**
   * Get complete dashboard data
   * @param {Object} options - Dashboard options
   * @returns {Promise<Object>} Complete dashboard data
   */
  async getDashboardData(options = {}) {
    const { days = 7 } = options;
    const cacheKey = `dashboard:${days}d`;

    return smartCache(
      cacheKey,
      async () => {
        // Fetch all dashboard data in parallel
        const [collections, actions, hourly, topIPs, topUsers] = await Promise.all([
          this.getCollectionStats({ days, useCache: false }),
          this.getActionStats({ days }),
          this.getHourlyStats({ hours: Math.min(days * 24, 168) }), // Max 7 days
          this.getIPStats({ days, limit: 10 }),
          this.getUserStats({ days, limit: 10 })
        ]);

        // Calculate summary metrics
        const totalActivity = collections.reduce((sum, c) => sum + c.count, 0);
        const uniqueUsers = new Set(
          collections.flatMap(c => c.countDistinct_user)
        ).size;
        const uniqueIPs = new Set(collections.flatMap(c => c.countDistinct_ip))
          .size;

        return {
          summary: {
            totalActivity,
            uniqueUsers,
            uniqueIPs,
            period: `${days} days`,
            timestamp: new Date()
          },
          collections,
          actions,
          hourly,
          topIPs: topIPs.slice(0, 10),
          topUsers: topUsers.slice(0, 10)
        };
      },
      { ttl: 300, staleWhileRevalidate: 60 }
    );
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Transform aggregated data into time series format
   * @param {Array} data - Raw aggregation data
   * @returns {Array} Transformed time series data
   */
  transformTimeSeriesData(data) {
    const grouped = {};

    for (const item of data) {
      const timeKey = item['hour(timestamp)'];
      if (!grouped[timeKey]) {
        grouped[timeKey] = {
          timestamp: timeKey,
          total: 0,
          uniqueUsers: 0,
          byAction: {}
        };
      }

      grouped[timeKey].total += item.count;
      grouped[timeKey].uniqueUsers += item.countDistinct_user || 0;
      grouped[timeKey].byAction[item.action] = item.count;
    }

    return Object.values(grouped).sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
  }

  /**
   * Calculate risk level for IP activity
   * @param {Object} activity - IP activity data
   * @returns {string} Risk level: low, medium, high
   */
  calculateRiskLevel(activity) {
    let score = 0;

    // High activity volume
    if (activity.count > 500) score += 3;
    else if (activity.count > 200) score += 2;
    else if (activity.count > 100) score += 1;

    // Many collections accessed
    if (activity.countDistinct_collection > 10) score += 2;
    else if (activity.countDistinct_collection > 5) score += 1;

    // Diverse action types
    if (activity.countDistinct_action > 4) score += 1;

    // Classify
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  /**
   * Calculate activity score
   * @param {Object} activity - Activity data
   * @returns {number} Activity score (0-100)
   */
  calculateActivityScore(activity) {
    const countScore = Math.min((activity.count / 1000) * 50, 50);
    const collectionScore = Math.min(
      (activity.countDistinct_collection / 20) * 25,
      25
    );
    const actionScore = Math.min((activity.countDistinct_action / 5) * 25, 25);

    return Math.round(countScore + collectionScore + actionScore);
  }

  /**
   * Determine alert type for suspicious activity
   * @param {Object} activity - Activity data
   * @returns {string} Alert type
   */
  determineAlertType(activity) {
    if (activity.count > 500) return 'EXCESSIVE_REQUESTS';
    if (activity.countDistinct_collection > 10) return 'BROAD_ACCESS';
    if (activity.countDistinct_action > 4) return 'DIVERSE_ACTIONS';
    return 'SUSPICIOUS_PATTERN';
  }

  /**
   * Warm cache with popular queries
   * @returns {Promise<void>}
   */
  async warmCache() {
    console.log('Warming cache...');

    const queries = [
      { method: 'getCollectionStats', args: [{ days: 7, useCache: false }] },
      { method: 'getActionStats', args: [{ days: 7 }] },
      { method: 'getHourlyStats', args: [{ hours: 24 }] },
      { method: 'getIPStats', args: [{ days: 7 }] },
      { method: 'getDashboardData', args: [{ days: 7 }] }
    ];

    await Promise.all(
      queries.map(async q => {
        try {
          await this[q.method](...q.args);
          console.log(`✓ Cached: ${q.method}`);
        } catch (error) {
          console.error(`✗ Failed to cache ${q.method}:`, error.message);
        }
      })
    );

    console.log('Cache warming complete!');
  }

  /**
   * Clear all cached data
   * @returns {Promise<void>}
   */
  async clearCache() {
    const pattern = 'directus:activity:*';
    const keys = await this.cache.keys(pattern);

    if (keys.length > 0) {
      await this.cache.del(...keys);
      console.log(`Cleared ${keys.length} cache keys`);
    } else {
      console.log('No cache keys to clear');
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache stats
   */
  async getCacheStats() {
    const info = await this.cache.info('stats');
    const lines = info.split('\r\n');
    const stats = {};

    for (const line of lines) {
      const [key, value] = line.split(':');
      if (key && value) {
        stats[key] = value;
      }
    }

    const hitRate =
      stats.keyspace_hits /
      (parseInt(stats.keyspace_hits) + parseInt(stats.keyspace_misses));

    return {
      hits: parseInt(stats.keyspace_hits),
      misses: parseInt(stats.keyspace_misses),
      hitRate: (hitRate * 100).toFixed(2) + '%',
      keys: await this.cache.dbsize()
    };
  }
}

// ============================================================================
// Express API Example
// ============================================================================

import express from 'express';

const app = express();
const analytics = new ActivityAnalytics(directus, redis);

// Middleware to track response time
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${duration}ms`);

    if (duration > 3000) {
      console.warn('⚠️  Slow query detected!', {
        url: req.url,
        duration
      });
    }
  });

  next();
});

// Dashboard endpoint
app.get('/api/activity/dashboard', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const data = await analytics.getDashboardData({ days: parseInt(days) });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Collection stats endpoint
app.get('/api/activity/collections', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const data = await analytics.getCollectionStats({ days: parseInt(days) });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Collection stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Hourly time series endpoint
app.get('/api/activity/hourly', async (req, res) => {
  try {
    const { hours = 24, action = null } = req.query;
    const data = await analytics.getHourlyStats({
      hours: parseInt(hours),
      action
    });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Hourly stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// IP activity endpoint
app.get('/api/activity/ips', async (req, res) => {
  try {
    const { days = 7, minActivity = 10, limit = 50 } = req.query;
    const data = await analytics.getIPStats({
      days: parseInt(days),
      minActivity: parseInt(minActivity),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('IP stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Security alerts endpoint
app.get('/api/activity/security/alerts', async (req, res) => {
  try {
    const { hours = 1, threshold = 100 } = req.query;
    const data = await analytics.detectSuspiciousActivity({
      hours: parseInt(hours),
      threshold: parseInt(threshold)
    });

    res.json({
      success: true,
      data,
      count: data.length
    });
  } catch (error) {
    console.error('Security alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// User activity endpoint
app.get('/api/activity/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const data = await analytics.getUserActivity(userId, {
      days: parseInt(days)
    });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('User activity error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cache management endpoints
app.post('/api/cache/warm', async (req, res) => {
  try {
    await analytics.warmCache();
    res.json({
      success: true,
      message: 'Cache warming completed'
    });
  } catch (error) {
    console.error('Cache warming error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.delete('/api/cache/clear', async (req, res) => {
  try {
    await analytics.clearCache();
    res.json({
      success: true,
      message: 'Cache cleared'
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = await analytics.getCacheStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test Redis connection
    await redis.ping();

    // Test Directus connection
    await directus.request(
      aggregate('directus_activity', {
        aggregate: { count: '*' },
        query: { limit: 1 }
      })
    );

    res.json({
      success: true,
      message: 'All systems operational',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`✓ Server running on port ${PORT}`);

  // Warm cache on startup
  try {
    await analytics.warmCache();
  } catch (error) {
    console.error('Initial cache warming failed:', error.message);
  }
});

// Export for use in other modules
export { ActivityAnalytics, smartCache, getCached };
