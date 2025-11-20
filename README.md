# Directus Usage Analytics

**Comprehensive analytics extension for Directus** - Track collection storage, API activity, and IP-based traffic patterns.

[![npm version](https://img.shields.io/npm/v/directus-extension-usage-analytics.svg)](https://www.npmjs.com/package/directus-extension-usage-analytics)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

### 📊 Collection Storage Analysis
- **Row count tracking** for all collections (including system tables)
- **Visual bar charts** with Chart.js integration
- **Top 10 filter** to focus on largest collections
- **Percentage calculations** for storage distribution
- **Real-time data** with optional 5-minute caching

### ⚡ API Activity Analysis
- **Request pattern analysis** from `directus_activity` table
- **Collection-based grouping** - See which collections receive most requests
- **Action breakdown** - Analyze read, create, update, delete operations
- **Unique user tracking** and IP address counting
- **Date range filtering** - Last 24 hours, 7 days, 30 days, 90 days
- **Interactive charts** - Switch between bar and pie charts
- **Action color coding** - Visual distinction for CRUD operations

### 🌐 IP-Based Traffic Analysis
- **IP address filtering** - Analyze activity from specific IPs or networks
- **Top IP addresses** - Identify most active clients/integrations
- **IP-specific statistics** - Full breakdown per IP address
- **Time-series data** - Track trends over time (hour/day/week granularity)
- **IPv4 and IPv6 support** with validation

### 🚀 Technical Features
- **Cross-database compatible** - PostgreSQL, MySQL, SQLite, MSSQL
- **TDD approach** - ≥80% test coverage with Vitest
- **TypeScript strict mode** - Type-safe throughout
- **Optional Redis caching** - 5-minute TTL with in-memory fallback
- **Bundle extension** - Combines Module (frontend) + Endpoint (backend)
- **Responsive design** - Works on desktop, tablet, and mobile
- **Directus theme integration** - Respects dark/light mode

## Installation

### Via npm (Recommended)

```bash
npm install directus-extension-usage-analytics
```

### Manual Installation

1. Download the latest release
2. Extract to your Directus `extensions` folder
3. Restart Directus

### Requirements

- **Directus**: 10.x or 11.x
- **Node.js**: 18.x or higher
- **Database**: PostgreSQL, MySQL, SQLite, or MSSQL

## Usage

### Accessing the Module

1. Log in to your Directus instance as an administrator
2. Navigate to **Settings** → **Usage Analytics** from the sidebar
3. Explore the three main tabs:
   - **Collection Storage** - View row counts and storage distribution
   - **API Activity** - Analyze request patterns and user activity
   - **Settings** - Configure caching and view extension information

## Configuration

### Database Indexes (Performance Optimization)

For optimal performance on large `directus_activity` tables, add these indexes:

**PostgreSQL / MySQL / SQLite**:
```sql
CREATE INDEX idx_activity_timestamp_collection
ON directus_activity(timestamp, collection);

CREATE INDEX idx_activity_timestamp_action
ON directus_activity(timestamp, action);

CREATE INDEX idx_activity_timestamp_ip
ON directus_activity(timestamp, ip);
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Directus Community**: [Discord](https://discord.gg/directus)

---

**Made with ❤️ for the Directus community**
