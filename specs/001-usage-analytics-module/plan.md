# Implementation Plan: Directus Usage Analytics Bundle Extension

**Branch**: `001-usage-analytics-module` | **Date**: 2025-01-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-usage-analytics-module/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a **publishable Directus Bundle Extension** that provides visual analytics for collection storage usage and API request patterns. The extension bundles a Vue 3 frontend module with backend API endpoints, packaged as a single npm package ready for publication to the Directus marketplace. The module will display row counts for all collections (including system tables), aggregate API activity from directus_activity log, and provide filtering capabilities by collection name and IP address. Primary goal: identify collections/endpoints consuming excessive resources to enable optimization.

**Publishing Goal**: Release as `directus-extension-usage-analytics` on npm, following Directus best practices for community extensions.

## Technical Context

**Language/Version**: TypeScript 5.x (required by Directus 10+ extensions and constitution)

**Extension Type**: Bundle (combines Module + Endpoint)
- **Frontend**: Vue 3 Module with Chart.js visualizations
- **Backend**: API Endpoint for database queries and aggregation

**Primary Dependencies**:
- `@directus/extensions-sdk` ^12.0.0 (Directus extension development and build tools)
- `@directus/sdk` ^17.0.0 (Directus API SDK for runtime)
- Vue 3.3+ (Directus module UI framework, provided by Directus)
- Chart.js v4 with vue-chart-3 (71KB gzipped, tree-shakable to ~50KB)
- Knex.js (exposed via Directus `database` parameter in API endpoints)

**Storage**: Reads from Directus database (PostgreSQL, MySQL, SQLite, MSSQL) - no new storage required
**Testing**: Vitest (Directus standard), Testing Library for Vue components
**Target Platform**: Directus 10+ and 11+ admin interface (web browser)
**Project Type**: Bundle Extension (publishable npm package)
**Distribution**: npm package `directus-extension-usage-analytics`
**Performance Goals**:
- Collection metadata retrieval: <2s for 100+ collections
- Activity aggregation: <3s for 100k+ activity records
- Chart rendering: <1s
- Dashboard load: <5s total

**Constraints**:
- Must work across all Directus-supported databases (PostgreSQL, MySQL, SQLite, MSSQL, etc.)
- Cannot break with Directus version updates (use stable APIs only)
- Must respect Directus permissions system
- Bundle size <500KB total (app.js + api.js combined)
- Compatible with Directus 10.x and 11.x (host: "^10.0.0 || ^11.0.0")

**Publishing Requirements**:
- npm package name: `directus-extension-usage-analytics`
- Keywords: `directus`, `directus-extension`, `directus-extension-bundle`, `analytics`
- License: MIT (for community adoption)
- README with installation, configuration, and usage instructions
- Screenshots for Directus marketplace listing
- Semantic versioning (starting at 1.0.0)

**Scale/Scope**:
- Support 100+ collections
- Handle activity logs with 100k+ entries
- Support 10+ concurrent users viewing analytics
- Module codebase: ~2500-3500 LOC (increased for bundle structure)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Type Safety First (NON-NEGOTIABLE)
- **Status**: PASS (with plan)
- **Compliance**: All code will be written in TypeScript with strict mode
- **Actions Required**:
  - Configure tsconfig.json with strict: true
  - Define TypeScript interfaces for all Directus collections used (directus_activity, directus_collections, etc.)
  - Create type definitions for module configuration and state
  - Export all public interfaces for reusability

### ✅ II. Directus SDK Best Practices
- **Status**: PASS (with considerations)
- **Compliance**: Will use @directus/sdk for all API interactions
- **Considerations**:
  - Direct database queries may be needed for accurate row counts (SDK limitation)
  - If direct DB access required, will document justification and use Directus's Knex instance
  - All SDK queries will use TypeScript generics: `directus.items<ActivityRecord>('directus_activity')`

### ✅ III. Testing & Validation
- **Status**: PASS (with plan)
- **Compliance**: Will implement comprehensive testing
- **Actions Required**:
  - Contract tests for all Directus API endpoints (collections metadata, activity queries)
  - Integration tests for data aggregation logic
  - Unit tests for chart rendering and filtering logic
  - Mock Directus responses for consistent testing
  - Target: ≥80% code coverage

### ✅ IV. Code Quality Standards
- **Status**: PASS (with plan)
- **Compliance**: Will follow all code quality standards
- **Actions Required**:
  - Configure ESLint with TypeScript, Vue, and Prettier
  - Set up pre-commit hooks
  - Keep functions <50 lines, files <300 lines
  - Add JSDoc to all exported functions
  - Follow Vue 3 Composition API best practices

### ✅ V. Performance & Efficiency
- **Status**: PASS (with plan)
- **Compliance**: Will implement performance optimizations
- **Actions Required**:
  - Use field selection in all Directus queries
  - Implement pagination for large datasets
  - Cache collection metadata (TTL: 5 minutes)
  - Profile aggregation queries and optimize
  - Use Web Workers for heavy computations if needed

### ✅ VI. Security & Data Protection
- **Status**: PASS (with plan)
- **Compliance**: Will follow security best practices
- **Actions Required**:
  - Verify admin permissions before showing module
  - Never log IP addresses or user PII to console
  - Sanitize all query parameters
  - Use Directus authentication middleware
  - Validate all user input (filters, date ranges)

### ✅ Post-Design Re-Evaluation (Phase 1 Complete)

**All research completed - see research.md for details**

**Technical Decisions Finalized**:
1. **Charting Library**: Chart.js v4 + vue-chart-3 ✅
   - Complies with bundle size constraints (<500KB total module)
   - Excellent TypeScript support (Principle I)
   - Vue 3 Composition API native (Code Quality Standards)

2. **Database Access**: Custom API endpoints with Knex ✅
   - Uses Directus's provided Knex instance (Principle II compliant)
   - Cross-database compatible (PostgreSQL, MySQL, SQLite, MSSQL)
   - Documented justification in Complexity Tracking section

3. **Activity Aggregation**: Database-layer + Redis caching ✅
   - Meets performance targets (<3s for 100k records)
   - Implements 3-tier optimization (indexes, caching, materialized views)
   - Profiling and monitoring included (Principle V)

**Constitution Compliance**: ✅ **PASS** - All principles satisfied, no unjustified violations

## Project Structure

### Documentation (this feature)

```text
specs/001-usage-analytics-module/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (Bundle Extension Structure)

```text
directus-extension-usage-analytics/      # Repository root
├── src/
│   ├── module/                          # Frontend Vue 3 Module
│   │   ├── index.ts                     # Module entry point
│   │   ├── routes.ts                    # Vue Router configuration
│   │   ├── views/                       # Vue components
│   │   │   ├── AnalyticsDashboard.vue   # Main dashboard view
│   │   │   ├── CollectionView.vue       # Collection storage tab
│   │   │   └── ActivityView.vue         # API activity tab
│   │   ├── components/                  # Reusable components
│   │   │   ├── CollectionChart.vue      # Collection charts
│   │   │   ├── ActivityChart.vue        # Activity charts
│   │   │   ├── FilterPanel.vue          # Filter controls
│   │   │   └── TopTenToggle.vue         # Top N toggle
│   │   ├── composables/                 # Vue 3 composables
│   │   │   ├── use-collection-analytics.ts
│   │   │   ├── use-activity-analytics.ts
│   │   │   └── index.ts
│   │   └── utils/                       # Frontend utilities
│   │       ├── chart-helpers.ts
│   │       └── data-formatters.ts
│   │
│   ├── endpoint/                        # Backend API Endpoint
│   │   ├── index.ts                     # Endpoint entry point
│   │   ├── routes/                      # API route handlers
│   │   │   ├── collections.ts           # GET /collections
│   │   │   ├── activity.ts              # GET /activity
│   │   │   └── timeseries.ts            # GET /activity/timeseries
│   │   ├── services/                    # Backend services
│   │   │   ├── collection-service.ts    # Collection queries
│   │   │   ├── activity-service.ts      # Activity aggregation
│   │   │   └── cache-service.ts         # Redis caching layer
│   │   └── utils/                       # Backend utilities
│   │       ├── database-helpers.ts
│   │       └── query-builders.ts
│   │
│   └── shared/                          # Shared code (types, constants)
│       ├── types.ts                     # TypeScript interfaces
│       ├── constants.ts                 # Shared constants
│       └── validators.ts                # Input validation
│
├── dist/                                # Build output (generated)
│   ├── app.js                           # Compiled frontend module
│   ├── api.js                           # Compiled backend endpoint
│   └── package.json                     # Auto-generated metadata
│
├── tests/
│   ├── contract/                        # Contract tests
│   │   ├── collections-api.test.ts
│   │   └── activity-api.test.ts
│   ├── integration/                     # Integration tests
│   │   ├── endpoint.test.ts
│   │   └── module.test.ts
│   └── unit/                            # Unit tests
│       ├── components/
│       ├── services/
│       └── utils/
│
├── package.json                         # Bundle configuration
├── tsconfig.json                        # TypeScript configuration
├── extension.config.js                  # Optional build config
├── README.md                            # Documentation
├── LICENSE                              # MIT License
├── CHANGELOG.md                         # Version history
└── .gitignore
```

**Structure Decision**: Bundle Extension structure chosen to combine frontend module and backend endpoint in a single publishable npm package. Separate `src/module/` and `src/endpoint/` directories enable clean separation of concerns while `src/shared/` allows type and code sharing between frontend and backend. This structure follows Directus best practices for publishable extensions and enables distribution via npm and the Directus marketplace.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Potential direct DB access (violates Principle II) | Directus SDK does not provide row count queries for arbitrary tables; COUNT(*) queries needed for accurate storage metrics | SDK's `readMany()` would require fetching all records and counting client-side, which is inefficient and memory-intensive for large collections |

**Justification**: If direct database access is required, we will use Directus's internal Knex.js instance (provided by the API) rather than creating a separate database connection. This aligns with Directus's architecture and ensures compatibility across different database types. Will document in research.md with links to relevant Directus extension documentation.

---

## Bundle Configuration

### package.json (Bundle Extension)

```json
{
  "name": "directus-extension-usage-analytics",
  "version": "1.0.0",
  "description": "Visual analytics for collection storage usage and API request patterns",
  "type": "module",
  "keywords": [
    "directus",
    "directus-extension",
    "directus-extension-bundle",
    "analytics",
    "monitoring",
    "usage"
  ],
  "license": "MIT",
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/directus-extension-usage-analytics"
  },
  "icon": "analytics",
  "directus:extension": {
    "type": "bundle",
    "path": {
      "app": "dist/app.js",
      "api": "dist/api.js"
    },
    "entries": [
      {
        "type": "module",
        "name": "usage-analytics",
        "source": "src/module/index.ts"
      },
      {
        "type": "endpoint",
        "name": "usage-analytics-api",
        "source": "src/endpoint/index.ts"
      }
    ],
    "host": "^10.0.0 || ^11.0.0",
    "partial": true
  },
  "scripts": {
    "build": "directus-extension build",
    "dev": "directus-extension build --watch",
    "link": "directus-extension link",
    "add": "directus-extension add"
  },
  "devDependencies": {
    "@directus/extensions-sdk": "^12.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vue": "^3.3.0",
    "vitest": "^1.0.0"
  },
  "dependencies": {
    "@directus/sdk": "^17.0.0",
    "chart.js": "^4.0.0",
    "vue-chart-3": "^3.0.0"
  }
}
```

### Key Configuration Explained

- **`"type": "bundle"`**: Indicates this is a bundle combining multiple extensions
- **`path.app`**: Frontend module output path (dist/app.js)
- **`path.api`**: Backend endpoint output path (dist/api.js)
- **`entries[]`**: Array defining each extension in the bundle
- **`partial: true`**: Allows users to disable individual extensions if needed
- **`host`**: Compatible Directus versions (10.x and 11.x)
- **`icon`**: Material Icons name for marketplace display
