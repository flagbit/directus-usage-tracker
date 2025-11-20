# Research: Directus Usage Analytics Module

**Feature**: 001-usage-analytics-module
**Date**: 2025-01-20
**Status**: Complete

## Overview

This document consolidates research findings for technical decisions required by the Directus Usage Analytics Module. All NEEDS CLARIFICATION items from the Technical Context have been resolved.

---

## 1. Charting Library Selection

### Decision: Chart.js v4 with vue-chart-3

**Rationale**:
- **Optimal Bundle Size**: 71KB gzipped (can be tree-shaken to ~50-60KB)
- **Vue 3 Native**: vue-chart-3 built specifically for Vue 3 Composition API
- **TypeScript Excellence**: Full type definitions with excellent IDE support
- **Performance**: Handles 100+ data points efficiently with canvas rendering
- **Proven**: Battle-tested by millions, active maintenance (latest: Oct 2024)
- **Simplicity**: Easy API reduces development time

**Alternatives Considered**:
- **ApexCharts**: ~100-130KB gzipped - too large, more complex API
- **D3.js**: Powerful but no Vue wrapper, steep learning curve, overkill for standard charts
- **ECharts**: ~350KB full - exceeds bundle constraints, too feature-rich

**Installation**:
\`\`\`bash
npm install chart.js vue-chart-3
\`\`\`

**Implementation Example**:
\`\`\`typescript
import { BarChart } from 'vue-chart-3';
import { Chart, BarController, BarElement, CategoryScale, LinearScale } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale);

const chartData = ref({
  labels: ['Collection A', 'Collection B'],
  datasets: [{
    label: 'Row Count',
    data: [12000, 19000]
  }]
});
\`\`\`

---

## 2. Direct Database Access in Directus Extensions

### Decision: Use Directus API Endpoints with ItemsService + Knex for Count Queries

**Architecture**:
\`\`\`
Frontend Module (Vue 3)
  ↓ useApi() composable
Custom API Endpoint (backend)
  ↓ ItemsService + database (Knex)
Database (PostgreSQL/MySQL/SQLite/MSSQL)
\`\`\`

**Rationale**:
- Frontend Directus modules cannot directly access the database
- Must create custom API endpoint for database operations
- Use \`ItemsService\` for permission-respecting queries
- Use Knex (\`database\`) for efficient COUNT queries

**Key Findings**:

1. **Frontend Module Access**:
   - Use \`useApi()\` composable to call custom endpoints
   - Use \`useStores()\` for CollectionsStore, PermissionsStore
   - Cannot directly query database from frontend

2. **Backend API Endpoint Access**:
   - Access Knex via \`database\` parameter in endpoint context
   - Access services via \`services\` parameter
   - Full database access with cross-database compatibility

3. **Getting Row Counts**:

   **Method 1: ItemsService with Aggregate** (Recommended for most cases)
   \`\`\`typescript
   const service = new ItemsService(collection, { database, schema });
   const result = await service.readByQuery({
     aggregate: { count: ['*'] },
   });
   // Returns: { count: { '*': number } }
   \`\`\`

   **Method 2: Direct Knex Query** (Recommended for system tables)
   \`\`\`typescript
   const result = await database(tableName).count('* as count').first();
   const count = parseInt(Object.values(result)[0], 10);
   \`\`\`

**Cross-Database Compatibility**:
- PostgreSQL returns COUNT as string, MySQL/SQLite as number
- Use \`Object.values(result)[0]\` pattern for compatibility
- Avoid database-specific SQL (e.g., \`information_schema\` not in SQLite)
- Use Knex query builder for portability

---

## 3. Activity Log Aggregation Best Practices

### Decision: Database-Layer Aggregation with Redis Caching + Materialized Views

**Strategy**: Three-tier architecture for optimal performance

**Tier 1: Database Indexes** (Critical - 10-50x performance improvement)
\`\`\`sql
-- Most critical index for time-range queries
CREATE INDEX idx_activity_timestamp_collection
ON directus_activity(timestamp DESC, collection);

-- For IP-based filtering
CREATE INDEX idx_activity_ip
ON directus_activity(ip) WHERE ip IS NOT NULL;

-- For user-based queries
CREATE INDEX idx_activity_user
ON directus_activity(user) WHERE user IS NOT NULL;

-- For action filtering
CREATE INDEX idx_activity_action
ON directus_activity(action);
\`\`\`

**Tier 2: Redis Caching** (90% load reduction)
- Cache aggregated results for 5 minutes (TTL: 300s)
- Use stale-while-revalidate pattern for seamless updates
- Implement cache warming for dashboard queries

**Tier 3: Materialized Views** (70% faster for dashboard queries)
- Pre-compute hourly aggregations
- Refresh every 15 minutes
- Use for dashboard queries

**Performance Targets**:
- Uncached query: <1s for 100k records
- Cached query: <200ms
- Dashboard load: <3s total (meets requirement)

---

## Summary of Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Charting Library** | Chart.js v4 + vue-chart-3 | Lightweight (71KB), Vue 3 native, excellent TypeScript |
| **Database Access** | Custom API endpoint with ItemsService + Knex | Only way to access DB from frontend module |
| **Activity Aggregation** | DB-layer aggregation + Redis + Materialized Views | 10-50x faster with indexes, 90% load reduction |
| **Caching TTL** | 5 minutes for hot data | Balances freshness with performance |

---

## References

- [Directus Extensions Documentation](https://docs.directus.io/extensions/)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [Knex.js Query Builder](https://knexjs.org/)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)

---

## 4. Bundle Extension Architecture & Publishing

### Decision: Directus Bundle Extension (Publishable to npm)

**Rationale**:
- **Single Package Distribution**: Combines frontend module + backend endpoint in one npm package
- **Marketplace Ready**: Follows Directus best practices for community extensions
- **Type Sharing**: Shared TypeScript types between frontend and backend via `src/shared/`
- **Unified Versioning**: Single version number for entire extension
- **Easy Installation**: Users install once, get both components automatically

**Bundle Structure**:
```
src/
├── module/      # Vue 3 frontend (compiled to dist/app.js)
├── endpoint/    # Backend API (compiled to dist/api.js)
└── shared/      # Shared types and utilities
```

**Key Findings**:

1. **Extension Types**:
   - **Module**: Top-level Vue 3 UI section in Directus admin
   - **Endpoint**: Custom backend API routes with database access
   - **Bundle**: Packages multiple extension types together

2. **Package Configuration**:
   ```json
   {
     "directus:extension": {
       "type": "bundle",
       "path": {
         "app": "dist/app.js",
         "api": "dist/api.js"
       },
       "entries": [
         { "type": "module", "source": "src/module/index.ts" },
         { "type": "endpoint", "source": "src/endpoint/index.ts" }
       ],
       "host": "^10.0.0 || ^11.0.0",
       "partial": true
     }
   }
   ```

3. **Build Process**:
   - Single command: `npm run build`
   - Outputs: `dist/app.js` (frontend) + `dist/api.js` (backend)
   - Build tool: `@directus/extensions-sdk` CLI

4. **Publishing Requirements**:
   - npm package name must include `directus-extension-` prefix
   - Keywords: `["directus", "directus-extension", "directus-extension-bundle"]`
   - LICENSE file required (MIT recommended)
   - README.md with installation and usage instructions
   - Semantic versioning (start at 1.0.0)
   - Icon: Material Icons name (e.g., "analytics")

5. **Communication Pattern**:
   ```typescript
   // Frontend (Module)
   import { useApi } from '@directus/extensions-sdk';
   const api = useApi();
   const data = await api.get('/usage-analytics-api/stats');
   
   // Backend (Endpoint)
   router.get('/stats', async (req, res) => {
     // Database access via Knex
     const result = await database('table').count();
     res.json({ data: result });
   });
   ```

6. **Development Workflow**:
   ```bash
   # Create bundle
   npx create-directus-extension@latest
   # Select: bundle
   
   # Development with hot reload
   npm run dev
   
   # Link to local Directus for testing
   npm run link
   
   # Validate before publishing
   npx create-directus-extension@latest validate -v
   
   # Publish to npm
   npm publish
   ```

7. **Marketplace Discovery**:
   - Extensions auto-discovered via npm keyword `"directus-extension"`
   - Appears in Directus marketplace within a few hours
   - Only latest version shown in marketplace
   - Display name: npm name minus `directus-extension-` prefix

**Real-World Examples**:
- **directus-extension-stripe-bundle**: Payment processing (Hook + Endpoint)
- **directus-extension-ai-operation-bundle**: OpenAI integration (5 Operations + Hook)
- **directus-extension-media-ai-bundle**: AI media processing (Multiple Operations)

**Official Documentation**:
- Bundle Guide: https://directus.io/docs/guides/extensions/bundles
- Publishing Guide: https://directus.io/docs/guides/extensions/marketplace/publishing
- Module Docs: https://directus.io/docs/guides/extensions/app-extensions/modules
- Endpoint Docs: https://directus.io/docs/guides/extensions/api-extensions/endpoints
- Extensions SDK: https://www.npmjs.com/package/@directus/extensions-sdk

**Advantages Over Separate Extensions**:
- ✅ Single installation step for users
- ✅ Guaranteed version compatibility between frontend and backend
- ✅ Shared dependencies reduce bundle size
- ✅ Shared TypeScript types ensure type safety
- ✅ Simplified distribution and updates
- ✅ Better marketplace presentation

**Publishing Checklist**:
- [ ] Build passes: `npm run build`
- [ ] Validation passes: `npx create-directus-extension@latest validate -v`
- [ ] README.md with clear instructions
- [ ] LICENSE file (MIT)
- [ ] package.json has correct keywords and host version
- [ ] Screenshots for marketplace (if UI extension)
- [ ] Tested in local Directus instance (10.x and 11.x)
- [ ] No sensitive data (API keys, tokens) in code
- [ ] Semantic version bumped appropriately
- [ ] CHANGELOG.md updated
- [ ] npm account authenticated: `npm login`
- [ ] Published: `npm publish`
- [ ] Verified in marketplace: https://directus.io/extensions

**Bundle Size Considerations**:
- Total bundle target: <500KB (app.js + api.js combined)
- Tree-shake dependencies where possible
- Use dynamic imports for lazy-loading in Vue components
- Minimize backend dependencies (Knex provided by Directus)
- Chart.js: ~50-70KB (acceptable)
- Vue components: ~100-150KB (typical for dashboard)
- Backend API: ~50-100KB (lightweight)

