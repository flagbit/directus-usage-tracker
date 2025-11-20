# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure with Bundle Extension architecture
- TypeScript strict mode configuration
- Project documentation and specifications

## [1.0.0] - TBD

### Added
- Collection storage usage analytics with row counts
- Visual charts for Top 10 collections
- API request activity analysis from directus_activity log
- IP address filtering for activity analysis
- Support for all Directus databases (PostgreSQL, MySQL, SQLite, MSSQL)
- Cross-browser compatibility
- Directus 10.x and 11.x support

### Features
- **Collection Storage Analysis**: Display row counts for all collections including system tables
- **API Activity Analytics**: Aggregate and analyze API request patterns
- **IP-Based Filtering**: Filter activity by IP address for client analysis
- **Visual Dashboard**: Chart.js visualizations with interactive filtering
- **Performance Optimized**: Database indexes, Redis caching, and materialized views
- **Type-Safe**: Full TypeScript coverage with strict mode

[Unreleased]: https://github.com/yourusername/directus-extension-usage-analytics/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/directus-extension-usage-analytics/releases/tag/v1.0.0
