# Testing Guide - Directus Usage Analytics Extension

Complete guide for testing the extension in a local Docker-based Directus environment.

## Prerequisites

- **Docker** & **Docker Compose** installed
- **Node.js** 18.x or higher
- **npm** 9.x or higher

## Quick Start

### 1. Build the Extension

```bash
# Install dependencies
npm install

# Build the extension (creates dist/ folder)
npm run build
```

**Expected Output**:
- `dist/api.js` (~79KB) - Backend endpoint
- `dist/app.js` (~244KB) - Frontend module

### 2. Start Directus with Docker

```bash
# Start all services (PostgreSQL + Directus)
docker-compose up -d

# Watch logs
docker-compose logs -f directus
```

**Wait for**:
```
directus-app  | Server started at http://0.0.0.0:8055
```

### 3. Access Directus Admin Panel

1. Open browser: **http://localhost:8055**
2. Login credentials:
   - **Email**: `admin@example.com`
   - **Password**: `admin123`

### 4. Find the Extension

1. Navigate to **Settings** (gear icon in sidebar)
2. Scroll down to find **Usage Analytics** in the settings menu
3. Click to open the analytics dashboard

## Testing Checklist

### ✅ User Story 1: Collection Storage Analysis

**Tab: Collection Storage**

- [ ] **View collection list** - Should show all Directus collections
- [ ] **Row count accuracy** - Verify row counts match actual data
- [ ] **Bar chart visualization** - Chart should display correctly
- [ ] **Top 10 toggle** - Enable/disable to filter largest collections
- [ ] **Percentage calculations** - Should sum to ~100%
- [ ] **Refresh button** - Should reload data without page refresh
- [ ] **Loading states** - Show spinner while fetching
- [ ] **Error handling** - Disconnect database to test error display
- [ ] **Responsive design** - Test on mobile/tablet viewport sizes
- [ ] **Dark/Light mode** - Toggle Directus theme and verify styling

**API Endpoint**:
```bash
# Test direct API call
curl http://localhost:8055/usage-analytics/collections?limit=10
```

**Expected Response**:
```json
{
  "collections": [
    { "collection": "directus_users", "row_count": 1, "percentage": 5.0 },
    { "collection": "directus_files", "row_count": 0, "percentage": 0.0 }
  ],
  "total_collections": 20,
  "total_rows": 100,
  "cached": false,
  "query_time_ms": 45,
  "timestamp": "2025-01-20T10:00:00.000Z"
}
```

---

### ✅ User Story 2: API Activity Analysis

**Tab: API Activity**

- [ ] **Date range filter** - Test all presets (24h, 7d, 30d, 90d)
- [ ] **Activity by collection** - Verify most-requested collections
- [ ] **Activity by action** - See read/create/update/delete breakdown
- [ ] **Action color coding** - Verify colors (green=read, blue=create, orange=update, red=delete)
- [ ] **Chart type toggle** - Switch between bar and pie charts
- [ ] **Data type toggle** - Switch between collection and action grouping
- [ ] **Top 10 filter** - Test enabling/disabling
- [ ] **Statistics cards** - Verify total requests, unique users, unique IPs
- [ ] **Percentage bars** - Visual representation in tables
- [ ] **Cache indicator** - Should show "Cached data" after 2nd request
- [ ] **Refresh button** - Should bust cache and reload

**Generate Test Data** (in Directus):
```bash
# Create some test collections and data
# Perform various operations: create items, read lists, update fields, delete items
# This will populate directus_activity table
```

**API Endpoint**:
```bash
# Test activity API
curl "http://localhost:8055/usage-analytics/activity?start_date=2025-01-01T00:00:00Z&end_date=2025-01-20T23:59:59Z&limit=10"
```

**Expected Response**:
```json
{
  "total_requests": 150,
  "unique_users": 3,
  "unique_ips": 5,
  "date_range": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-20T23:59:59Z"
  },
  "by_collection": [
    { "collection": "products", "count": 50, "percentage": 33.3 },
    { "collection": "users", "count": 30, "percentage": 20.0 }
  ],
  "by_action": [
    { "action": "read", "count": 80, "percentage": 53.3 },
    { "action": "create", "count": 40, "percentage": 26.7 }
  ],
  "cached": false,
  "query_time_ms": 120,
  "timestamp": "2025-01-20T10:00:00.000Z"
}
```

---

### ✅ User Story 3: IP-Based Traffic Analysis

**Tab: API Activity (with IP filtering)**

- [ ] **IP filter dropdown** - Should populate with top IPs
- [ ] **IP selection** - Filter activity by specific IP address
- [ ] **IP indicator badge** - Show active IP filter with clear button
- [ ] **IP-specific stats** - Verify data changes when IP selected
- [ ] **Clear IP filter** - Return to all activity view
- [ ] **IPv4 support** - Test with IPv4 addresses
- [ ] **IPv6 support** - Test with IPv6 addresses (if available)
- [ ] **Top IPs list** - Shows most active IP addresses
- [ ] **Request counts per IP** - Accurate counting
- [ ] **Percentage distribution** - Verify calculations

**API Endpoints**:
```bash
# Get top IPs
curl "http://localhost:8055/usage-analytics/activity/ips?start_date=2025-01-01T00:00:00Z&limit=10"

# Get activity for specific IP
curl "http://localhost:8055/usage-analytics/activity/ips/192.168.1.100?start_date=2025-01-01T00:00:00Z"

# Get time-series data
curl "http://localhost:8055/usage-analytics/activity/timeseries?start_date=2025-01-01T00:00:00Z&granularity=day"
```

**Expected Top IPs Response**:
```json
{
  "ips": [
    { "ip": "192.168.1.100", "count": 50, "percentage": 33.3 },
    { "ip": "10.0.0.5", "count": 30, "percentage": 20.0 }
  ],
  "query_time_ms": 80,
  "timestamp": "2025-01-20T10:00:00.000Z"
}
```

---

## Performance Testing

### Database Indexes (Recommended)

For optimal performance with large `directus_activity` tables:

```sql
-- Connect to PostgreSQL
docker exec -it directus-db psql -U directus

-- Create indexes
CREATE INDEX idx_activity_timestamp_collection ON directus_activity(timestamp, collection);
CREATE INDEX idx_activity_timestamp_action ON directus_activity(timestamp, action);
CREATE INDEX idx_activity_timestamp_ip ON directus_activity(timestamp, ip);

-- Verify indexes
\di idx_activity_*
```

### Load Testing

```bash
# Generate test activity (use Directus API or custom script)
# Perform 1000+ operations across different collections
# Then test query performance in Usage Analytics module
```

**Performance Targets**:
- Collection query: **<100ms** for <50 collections
- Activity query: **<300ms** for <10,000 records
- IP query: **<200ms** for <1,000 unique IPs
- Chart rendering: **<500ms** for all visualizations

---

## Cross-Browser Testing

Test in the following browsers:
- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (latest)
- [ ] **Edge** (latest)

**Features to verify**:
- Chart.js rendering
- Vue component reactivity
- Directus design system compatibility
- Responsive layout

---

## Troubleshooting

### Extension Not Appearing

**Symptom**: Usage Analytics not visible in Settings menu

**Solutions**:
1. Verify build output exists:
   ```bash
   ls -lh dist/
   # Should show api.js and app.js
   ```

2. Check Docker volume mount:
   ```bash
   docker exec -it directus-app ls -la /directus/extensions/
   # Should show directus-extension-usage-analytics/
   ```

3. Restart Directus with clean cache:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

4. Check Directus logs:
   ```bash
   docker-compose logs directus | grep -i extension
   docker-compose logs directus | grep -i error
   ```

### Empty Charts/No Data

**Symptom**: Charts render but show "No data"

**Solutions**:
1. Verify database has data:
   ```bash
   docker exec -it directus-db psql -U directus -c "SELECT COUNT(*) FROM directus_activity;"
   ```

2. Check API endpoints directly:
   ```bash
   curl http://localhost:8055/usage-analytics/collections
   curl http://localhost:8055/usage-analytics/activity
   ```

3. Open browser console (F12) and check for errors

### Performance Issues

**Symptom**: Slow query times or timeouts

**Solutions**:
1. Create recommended database indexes (see above)
2. Reduce date range (test with 24 hours instead of 90 days)
3. Enable Redis caching:
   - Uncomment Redis service in `docker-compose.yml`
   - Uncomment Redis environment variables in Directus service
   - Restart: `docker-compose up -d`

### Chart Rendering Issues

**Symptom**: Charts not displaying or layout broken

**Solutions**:
1. Check Chart.js version in browser console:
   ```javascript
   Chart.version // Should be "4.x.x"
   ```

2. Verify no CSS conflicts with Directus theme
3. Test with different chart types (bar ↔ pie)
4. Check browser console for JavaScript errors

---

## Testing with Different Databases

The extension supports PostgreSQL, MySQL, SQLite, and MSSQL.

### Test with MySQL

Edit `docker-compose.yml`:
```yaml
database:
  image: mysql:8
  environment:
    MYSQL_ROOT_PASSWORD: root
    MYSQL_DATABASE: directus
    MYSQL_USER: directus
    MYSQL_PASSWORD: directus

directus:
  environment:
    DB_CLIENT: 'mysql'
    DB_HOST: 'database'
    DB_PORT: '3306'
```

### Test with SQLite

Edit `docker-compose.yml`:
```yaml
directus:
  environment:
    DB_CLIENT: 'sqlite3'
    DB_FILENAME: '/directus/database/data.db'
  volumes:
    - directus-db-data:/directus/database
```

---

## Clean Up

### Stop and Remove Containers
```bash
docker-compose down
```

### Remove All Data (Reset)
```bash
docker-compose down -v
# This deletes database, uploads, and Redis data
```

### Rebuild Extension
```bash
npm run build
docker-compose restart directus
```

---

## Automated Testing

Run the test suite:
```bash
# Unit tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint
```

**Coverage Target**: ≥80% for all test types

---

## Success Criteria

The extension is working correctly when:

✅ All 3 user stories are functional
✅ No console errors in browser
✅ API endpoints return valid JSON
✅ Charts render without issues
✅ All filters work as expected
✅ Performance meets targets (<300ms query times)
✅ Responsive design works on all screen sizes
✅ Dark/light mode both look correct
✅ Extension survives Directus restart

---

## Next Steps

After successful testing:

1. **Optional screenshots** for README (T068)
2. **Final quality check** before npm publish (T079)
3. **Publish to npm** when ready (T080)

```bash
# Publish to npm (when ready)
npm publish --access public
```

---

## Support

For issues during testing:
- Check Directus logs: `docker-compose logs -f directus`
- Check database logs: `docker-compose logs -f database`
- Review [Directus Extension Documentation](https://docs.directus.io/extensions/)
- Open an issue on GitHub

**Happy Testing! 🎉**
