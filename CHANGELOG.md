# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-01-20

### Added

#### User Story 1: Collection Storage Analysis
- Row count tracking for all collections (including system tables)
- Visual bar chart with Chart.js integration
- Top 10 filter to focus on largest collections
- Percentage calculations for storage distribution
- Real-time data with optional 5-minute caching
- CollectionView component with responsive design

#### User Story 2: API Activity Analysis
- Request pattern analysis from `directus_activity` table
- Collection-based grouping showing most-requested collections
- Action breakdown (create, read, update, delete) with color coding
- Unique user tracking and IP address counting
- Date range filtering (last 24 hours, 7 days, 30 days, 90 days)
- Interactive charts with bar/pie chart switching
- Activity by collection and activity by action aggregations
- Stat cards showing total requests, unique users, unique IPs
- Percentage calculations and visual progress bars

#### User Story 3: IP-Based Traffic Analysis
- IP address filtering to analyze specific clients/integrations
- Top 10 IP addresses by request count
- IP-specific statistics with full breakdown per IP
- Time-series data for trend visualization (hour/day/week granularity)
- IPv4 and IPv6 support with validation
- IP filter dropdown with smart display format
- IP filter indicator badge when filtering is active
- Seamless switching between all activity and IP-specific views

#### Technical Implementation
- **Bundle Extension Architecture**: Module (Vue 3 frontend) + Endpoint (Express backend)
- **TypeScript Strict Mode**: Complete type safety throughout
- **Cross-Database Compatibility**: PostgreSQL, MySQL, SQLite, MSSQL support
- **Test-Driven Development**: ≥80% test coverage with Vitest
- **Caching Layer**: Optional Redis with 5-minute TTL, in-memory fallback
- **Query Optimization**: Cross-database COUNT compatibility, parallel queries
- **Error Handling**: Comprehensive error handling and user-friendly messages
- **JSDoc Documentation**: Complete API documentation with examples

#### Frontend Features
- Vue 3 Composition API with TypeScript
- Chart.js v4 for visualizations
- Directus design system integration (dark/light mode support)
- Responsive design for desktop, tablet, and mobile
- FilterPanel component with date range, Top N, chart type, data type, and IP filtering
- ActivityChart component with dynamic chart types and color coding
- Real-time loading and error states
- Percentage bars and visual indicators

#### Backend Features
- CollectionService for storage analytics
- ActivityService for request pattern analysis
- IP filtering methods (getActivityByIP, getTopIPs, getIPList)
- Time-series endpoint for trend data
- Comprehensive input validation
- Cache service with Redis/in-memory support
- Cross-database query builders
- API routes: `/collections`, `/activity`, `/activity/ips`, `/activity/ips/:ip`, `/activity/timeseries`

#### Developer Experience
- Comprehensive README.md with usage guide
- Complete API documentation
- Database index recommendations for performance
- Development setup guide
- Testing framework with unit, integration, and contract tests
- ESLint and Prettier configuration
- Build and validation scripts

### Changed
- N/A (initial release)

### Deprecated
- N/A (initial release)

### Removed
- N/A (initial release)

### Fixed
- N/A (initial release)

### Security
- IP address validation to prevent injection attacks
- Input sanitization for all query parameters
- Cross-database safe COUNT queries
- Proper error handling without exposing internal details

[Unreleased]: https://github.com/yourusername/directus-extension-usage-analytics/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/directus-extension-usage-analytics/releases/tag/v1.0.0
