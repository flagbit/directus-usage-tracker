# Directus Activity Analytics - Implementation Examples

This directory contains production-ready code for implementing efficient Directus activity analytics with <3 second query time for 100k+ records.

## 📁 Files Overview

- **`activity-analytics.js`** - Complete Node.js implementation with caching and API
- **`setup-database.sql`** - PostgreSQL optimization script with indexes and materialized views
- **`package.json`** - Node.js dependencies and scripts
- **`.env.example`** - Environment configuration template

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+ (with Directus installed)
- Redis 6+
- Directus 10+

### Step 1: Install Dependencies

```bash
cd examples
npm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

Required configuration:
```env
DIRECTUS_URL=https://your-directus.com
DIRECTUS_TOKEN=your-access-token
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Step 3: Set Up Database

```bash
# Run the database optimization script
psql -U your_user -d your_database -f setup-database.sql
```

This will create:
- 4 optimized indexes for query performance
- 3 materialized views for dashboard queries
- Helper functions for analytics
- Performance monitoring views

### Step 4: Start the Server

```bash
npm start
```

Server will start on `http://localhost:3000` with automatic cache warming.

## 📊 API Endpoints

### Dashboard Data
```bash
GET /api/activity/dashboard?days=7

Response:
{
  "success": true,
  "data": {
    "summary": {
      "totalActivity": 125840,
      "uniqueUsers": 342,
      "uniqueIPs": 567,
      "period": "7 days"
    },
    "collections": [...],
    "actions": [...],
    "hourly": [...],
    "topIPs": [...],
    "topUsers": [...]
  }
}
```

### Collection Statistics
```bash
GET /api/activity/collections?days=7

Response:
{
  "success": true,
  "data": [
    {
      "collection": "articles",
      "count": 45230,
      "countDistinct_user": 123,
      "countDistinct_ip": 234
    }
  ]
}
```

### Hourly Time Series
```bash
GET /api/activity/hourly?hours=24&action=create

Response:
{
  "success": true,
  "data": [
    {
      "timestamp": "2024-11-20T10:00:00Z",
      "total": 1250,
      "uniqueUsers": 45,
      "byAction": {
        "create": 450,
        "update": 600,
        "delete": 200
      }
    }
  ]
}
```

### IP Activity Analysis
```bash
GET /api/activity/ips?days=7&minActivity=10&limit=50

Response:
{
  "success": true,
  "data": [
    {
      "ip": "192.168.1.100",
      "count": 2450,
      "countDistinct_collection": 8,
      "countDistinct_user": 3,
      "riskLevel": "medium",
      "activityScore": 65
    }
  ]
}
```

### Security Alerts
```bash
GET /api/activity/security/alerts?hours=1&threshold=100

Response:
{
  "success": true,
  "data": [
    {
      "ip": "203.0.113.45",
      "count": 543,
      "riskLevel": "high",
      "alertType": "EXCESSIVE_REQUESTS",
      "timestamp": "2024-11-20T10:30:00Z"
    }
  ],
  "count": 3
}
```

### User Activity
```bash
GET /api/activity/users/:userId?days=30

Response:
{
  "success": true,
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "period": "30 days",
    "summary": {
      "count": 1250,
      "countDistinct_collection": 12,
      "countDistinct_ip": 3
    },
    "byCollection": [...],
    "byAction": [...]
  }
}
```

### Cache Management

#### Warm Cache
```bash
POST /api/cache/warm

Response:
{
  "success": true,
  "message": "Cache warming completed"
}
```

#### Clear Cache
```bash
DELETE /api/cache/clear

Response:
{
  "success": true,
  "message": "Cache cleared"
}
```

#### Cache Statistics
```bash
GET /api/cache/stats

Response:
{
  "success": true,
  "data": {
    "hits": 15234,
    "misses": 892,
    "hitRate": "94.47%",
    "keys": 42
  }
}
```

### Health Check
```bash
GET /api/health

Response:
{
  "success": true,
  "message": "All systems operational",
  "timestamp": "2024-11-20T10:30:00Z"
}
```

## 🎯 Performance Targets

With proper setup, you should achieve:

| Endpoint | Target | Typical (Cached) | Typical (Uncached) |
|----------|--------|------------------|-------------------|
| Dashboard | <3s | <200ms | <1s |
| Collections | <2s | <100ms | <500ms |
| Hourly | <2s | <100ms | <400ms |
| IP Stats | <2s | <150ms | <800ms |
| Security Alerts | <1s | <50ms | <600ms |

## 🔧 Database Functions

The setup script creates several helper functions:

### Get IP Activity Stats
```sql
SELECT * FROM get_ip_activity_stats(
    p_days := 7,
    p_min_count := 10,
    p_limit := 50
);
```

### Get User Engagement Metrics
```sql
SELECT * FROM get_user_engagement_metrics(
    p_days := 30
);
```

### Detect Anomalies
```sql
SELECT * FROM detect_activity_anomalies(
    p_hours := 1,
    p_stddev_threshold := 3.0
);
```

### Run Maintenance
```sql
SELECT maintain_activity_table();
```

### Test Performance
```sql
SELECT * FROM test_activity_query_performance();
```

## 📈 Monitoring

### View Index Usage
```sql
SELECT * FROM v_activity_index_stats;
```

Expected output:
```
indexname                          | scans  | usage_level
-----------------------------------|--------|-------------
idx_activity_timestamp_collection  | 125340 | HIGH_USAGE
idx_activity_user_timestamp        | 45230  | HIGH_USAGE
idx_activity_ip_timestamp          | 23450  | MEDIUM_USAGE
```

### View Slow Queries
```sql
SELECT * FROM v_activity_slow_queries;
```

### View Table Health
```sql
SELECT * FROM v_activity_table_stats;
```

## 🔄 Maintenance

### Refresh Materialized Views

#### Manual Refresh
```sql
-- Hourly stats (every 15 minutes)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_activity_hourly_stats;

-- Daily summary (once per day)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_activity_daily_summary;

-- Collection stats (every 5 minutes)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_activity_collection_stats;
```

#### Automated Refresh (using pg_cron)

1. Enable pg_cron extension:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

2. Schedule refreshes:
```sql
-- Hourly stats every 15 minutes
SELECT cron.schedule(
    'refresh-activity-hourly-stats',
    '*/15 * * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_activity_hourly_stats'
);

-- Collection stats every 5 minutes
SELECT cron.schedule(
    'refresh-activity-collection-stats',
    '*/5 * * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_activity_collection_stats'
);

-- Daily summary at 1 AM
SELECT cron.schedule(
    'refresh-activity-daily-summary',
    '0 1 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_activity_daily_summary'
);
```

3. View scheduled jobs:
```sql
SELECT * FROM cron.job;
```

### Rebuild Indexes (Quarterly)
```sql
SELECT rebuild_activity_indexes();
```

### Run Table Analysis
```sql
SELECT maintain_activity_table();
```

## 🧪 Testing

### Test Query Performance
```bash
npm test
```

Or directly in PostgreSQL:
```sql
SELECT * FROM test_activity_query_performance();
```

Expected results for 100k records:
```
query_name                              | execution_time_ms | rows_returned
----------------------------------------|-------------------|---------------
Collection Aggregation (7 days)         | 245.67           | 23
Hourly Time Series (24 hours)           | 178.34           | 24
IP Aggregation (7 days, top 100)        | 542.89           | 100
```

### Test API Endpoints
```bash
# Test dashboard (should be <1s)
time curl http://localhost:3000/api/activity/dashboard?days=7

# Test with cache (should be <200ms)
time curl http://localhost:3000/api/activity/dashboard?days=7

# Test security alerts
curl http://localhost:3000/api/activity/security/alerts?hours=1&threshold=100

# View cache statistics
curl http://localhost:3000/api/cache/stats
```

## 🔍 Troubleshooting

### Slow Queries (>3s)

1. **Check indexes exist:**
```sql
\d directus_activity
```

2. **Analyze query plan:**
```sql
EXPLAIN ANALYZE
SELECT collection, COUNT(*)
FROM directus_activity
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY collection;
```

Look for "Index Scan" (good) vs "Seq Scan" (bad)

3. **Run table maintenance:**
```sql
SELECT maintain_activity_table();
```

### Cache Not Working

1. **Test Redis connection:**
```bash
redis-cli ping
# Should return PONG
```

2. **Check cache stats:**
```bash
curl http://localhost:3000/api/cache/stats
```

3. **Clear and warm cache:**
```bash
curl -X DELETE http://localhost:3000/api/cache/clear
curl -X POST http://localhost:3000/api/cache/warm
```

### High Memory Usage

1. **Check Redis memory:**
```bash
redis-cli info memory
```

2. **Limit result sets in queries:**
```javascript
// Add limit to prevent large result sets
query: {
  limit: 1000,
  sort: ['-timestamp']
}
```

3. **Reduce cache TTL:**
```env
CACHE_TTL_DASHBOARD=180  # 3 minutes instead of 5
```

### Database Connection Errors

1. **Test connection:**
```bash
psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT COUNT(*) FROM directus_activity;"
```

2. **Check Directus connection:**
```bash
curl $DIRECTUS_URL/server/health
```

## 📊 Scaling Guide

### Current: 100k Records
- ✅ Database indexes
- ✅ Redis caching
- ✅ Directus SDK aggregation

### Growth: 500k Records
- ➕ Materialized views (already created)
- ➕ Stale-while-revalidate caching (already implemented)
- ➕ Read replicas (optional)

### Scale: 1M+ Records
- ➕ Table partitioning by month
- ➕ BRIN indexes for timestamps
- ➕ ClickHouse for dedicated analytics
- ➕ CDC pipeline for real-time updates

## 🔐 Security Considerations

### API Security
- Add authentication middleware
- Rate limiting for API endpoints
- IP whitelisting for sensitive endpoints
- Input validation and sanitization

### Database Security
- Use read-only database user for analytics
- Implement row-level security if needed
- Regular security audits
- Monitor for SQL injection attempts

### Cache Security
- Enable Redis password authentication
- Use Redis ACL for fine-grained access
- Enable TLS for Redis connections
- Regular cache invalidation

## 📚 Additional Resources

- [Main Research Document](../RESEARCH_DIRECTUS_ACTIVITY_AGGREGATION.md)
- [Quick Start Guide](../QUICK_START_GUIDE.md)
- [Directus SDK Documentation](https://docs.directus.io/packages/@directus/sdk/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Redis Best Practices](https://redis.io/docs/manual/client-side-caching/)

## 🤝 Contributing

Issues and pull requests welcome! Please ensure:
- Code follows existing patterns
- All tests pass
- Performance benchmarks maintained
- Documentation updated

## 📄 License

MIT License - See LICENSE file for details

---

**Need Help?**
- Check troubleshooting section above
- Review main research document
- Monitor database performance with provided views
- Test with `npm test` to verify setup

**Target Performance**: <3 second dashboard load time with 100k+ records ✅
