# Quick Start: Directus Usage Analytics Bundle Extension

**Feature**: 001-usage-analytics-module  
**Type**: Bundle Extension (Module + Endpoint)  
**For**: Developers building a publishable Directus extension  
**Time**: 30 minutes to setup, 3-4 days to implement and publish

## Overview

Build a **publishable Directus Bundle Extension** combining:
- **Frontend Module**: Vue 3 dashboard with Chart.js analytics
- **Backend Endpoint**: API routes for database queries and aggregation
- **Single Package**: Distributed as `directus-extension-usage-analytics` on npm

**Architecture**: One npm package → Two compiled outputs (dist/app.js + dist/api.js)

---

## Prerequisites

- **Directus 10+ or 11+** installed and running
- **Node.js 18+** with npm/pnpm
- **TypeScript 5.x** knowledge
- **Vue 3 Composition API** familiarity
- **npm account** for publishing (create at https://www.npmjs.com)

---

## Project Structure (Bundle Extension)

```
directus-extension-usage-analytics/
├── src/
│   ├── module/           # Vue 3 Frontend → dist/app.js
│   │   ├── index.ts      # Module entry point
│   │   ├── views/        # Vue components
│   │   ├── components/   # Reusable UI
│   │   └── composables/  # Vue composables
│   ├── endpoint/         # Backend API → dist/api.js
│   │   ├── index.ts      # Endpoint entry point
│   │   ├── routes/       # API handlers
│   │   └── services/     # Business logic
│   └── shared/           # Shared types
│       └── types.ts
├── dist/                 # Build output (generated)
│   ├── app.js
│   ├── api.js
│   └── package.json
├── package.json          # Bundle configuration
├── tsconfig.json
├── README.md
└── LICENSE
```

---

## Quick Start (Create New Extension)

### Step 1: Create Bundle Extension (5 min)

```bash
# Create new bundle
npx create-directus-extension@latest

# Interactive prompts:
# ? Name: directus-extension-usage-analytics
# ? Type: bundle
# ? Language: TypeScript
# ? Install dependencies? Yes

cd directus-extension-usage-analytics
```

### Step 2: Add Extension Components (5 min)

```bash
# Add Module (Frontend)
npm run add
# ? Type: module
# ? Name: usage-analytics
# ? Language: TypeScript

# Add Endpoint (Backend)
npm run add
# ? Type: endpoint
# ? Name: usage-analytics-api
# ? Language: TypeScript
```

### Step 3: Configure package.json (5 min)

```json
{
  "name": "directus-extension-usage-analytics",
  "version": "1.0.0",
  "description": "Visual analytics for collection storage and API usage",
  "type": "module",
  "keywords": [
    "directus",
    "directus-extension",
    "directus-extension-bundle",
    "analytics"
  ],
  "license": "MIT",
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
        "source": "src/usage-analytics/index.ts"
      },
      {
        "type": "endpoint",
        "name": "usage-analytics-api",
        "source": "src/usage-analytics-api/index.ts"
      }
    ],
    "host": "^10.0.0 || ^11.0.0",
    "partial": true
  },
  "scripts": {
    "build": "directus-extension build",
    "dev": "directus-extension build --watch",
    "link": "directus-extension link"
  },
  "devDependencies": {
    "@directus/extensions-sdk": "^12.0.0",
    "typescript": "^5.0.0",
    "vue": "^3.3.0"
  },
  "dependencies": {
    "@directus/sdk": "^17.0.0",
    "chart.js": "^4.0.0",
    "vue-chart-3": "^3.0.0"
  }
}
```

### Step 4: Install Chart.js (2 min)

```bash
npm install chart.js vue-chart-3
```

---

## Implementation Guide

### Backend Endpoint (src/endpoint/index.ts)

```typescript
import { defineEndpoint } from '@directus/extensions-sdk';

export default defineEndpoint({
  id: 'usage-analytics-api',
  handler: (router, { database, getSchema }) => {
    
    router.get('/collections', async (req, res) => {
      try {
        const schema = await getSchema();
        const { CollectionsService } = await import('@directus/api/services');
        
        const collectionsService = new CollectionsService({ 
          schema, 
          accountability: req.accountability 
        });
        
        const collections = await collectionsService.readByQuery({});
        
        const withCounts = await Promise.all(
          collections.map(async (col) => {
            const result = await database(col.collection)
              .count('* as count')
              .first();
            const count = parseInt(Object.values(result)[0], 10);
            
            return {
              collection: col.collection,
              name: col.meta?.name || col.collection,
              row_count: count,
              is_system: col.collection.startsWith('directus_'),
            };
          })
        );
        
        res.json({
          data: withCounts.sort((a, b) => b.row_count - a.row_count),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  },
});
```

### Frontend Module (src/module/index.ts)

```typescript
import { defineModule } from '@directus/extensions-sdk';
import ModuleComponent from './ModuleComponent.vue';

export default defineModule({
  id: 'usage-analytics',
  name: 'Usage Analytics',
  icon: 'analytics',
  routes: [
    {
      path: '',
      component: ModuleComponent,
    },
  ],
});
```

### Vue Component (src/module/ModuleComponent.vue)

```vue
<template>
  <private-view title="Usage Analytics">
    <div class="container">
      <h1>Collection Storage Usage</h1>
      
      <div v-if="loading">Loading...</div>
      <div v-else-if="error">Error: {{ error }}</div>
      <div v-else>
        <bar-chart :chart-data="chartData" :options="chartOptions" />
        
        <table>
          <thead>
            <tr>
              <th>Collection</th>
              <th>Rows</th>
              <th>System</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in collections" :key="item.collection">
              <td>{{ item.name }}</td>
              <td>{{ item.row_count.toLocaleString() }}</td>
              <td>{{ item.is_system ? 'Yes' : 'No' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </private-view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { BarChart } from 'vue-chart-3';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const api = useApi();
const collections = ref([]);
const loading = ref(true);
const error = ref(null);

const chartData = computed(() => {
  if (!collections.value.length) return null;
  const top10 = collections.value.slice(0, 10);
  
  return {
    labels: top10.map(c => c.name),
    datasets: [{
      label: 'Row Count',
      data: top10.map(c => c.row_count),
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
    }],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: 'Top 10 Collections by Row Count'
    }
  }
};

onMounted(async () => {
  try {
    const response = await api.get('/usage-analytics-api/collections');
    collections.value = response.data.data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.container {
  padding: var(--content-padding);
}
table {
  width: 100%;
  margin-top: 2rem;
}
</style>
```

---

## Development Workflow

### Local Development

```bash
# Terminal 1: Build with hot reload
npm run dev

# Terminal 2: Run Directus with auto-reload
cd /path/to/directus
EXTENSIONS_AUTO_RELOAD=true npx directus start
```

### Link to Local Directus

```bash
npm run link
# Follow prompts to link to your Directus instance
# Extension will be available at: http://localhost:8055/admin/usage-analytics
```

---

## Publishing Workflow

### Pre-Publishing Checklist

- [ ] **Build passes**: `npm run build`
- [ ] **Validation passes**: `npx create-directus-extension@latest validate -v`
- [ ] **README.md** with clear installation/usage instructions
- [ ] **LICENSE** file (MIT recommended)
- [ ] **package.json** keywords include `directus-extension`
- [ ] **Screenshots** for marketplace (if applicable)
- [ ] **Tested** in Directus 10.x and 11.x
- [ ] **No secrets** in code (API keys, tokens)
- [ ] **Version bumped**: `npm version patch|minor|major`
- [ ] **CHANGELOG.md** updated

### Publishing Steps

```bash
# 1. Build production bundle
npm run build

# 2. Validate extension
npx create-directus-extension@latest validate -v

# 3. Login to npm (first time only)
npm login

# 4. Publish to npm
npm publish

# 5. Verify in marketplace (wait a few hours)
# Visit: https://directus.io/extensions
```

### Installation by Users

```bash
# Via npm
cd /path/to/directus
npm install directus-extension-usage-analytics

# Or via Directus Admin UI
# Settings → Marketplace → Search for "usage analytics"
```

---

## Testing

### Manual Testing

```bash
# 1. Build and link
npm run build
npm run link

# 2. Restart Directus
cd /path/to/directus
npx directus start

# 3. Access module
# Open: http://localhost:8055/admin/usage-analytics

# 4. Test API endpoint
curl http://localhost:8055/usage-analytics-api/collections
```

### Automated Testing

```bash
# Unit tests
npm test

# Type checking
npx tsc --noEmit
```

---

## Common Tasks

### Update Dependencies

```bash
npm update @directus/extensions-sdk
npm update @directus/sdk
```

### Add New API Route

```typescript
// src/endpoint/index.ts
router.get('/activity', async (req, res) => {
  const result = await database('directus_activity')
    .count('* as count')
    .groupBy('collection')
    .orderBy('count', 'desc');
  
  res.json({ data: result });
});
```

### Add New Vue View

```typescript
// src/module/index.ts
routes: [
  { path: '', redirect: '/usage-analytics/storage' },
  { path: 'storage', component: StorageView },
  { path: 'activity', component: ActivityView },
]
```

---

## Troubleshooting

**"Extension not loading"**
- Check dist/ folder exists with app.js and api.js
- Verify package.json in extensions directory
- Restart Directus

**"Module can't call endpoint"**
- Use correct path: `/usage-analytics-api/route`
- Check endpoint is registered: `GET http://localhost:8055/usage-analytics-api`

**"Build fails"**
- Run `npm install`
- Check tsconfig.json
- Verify @directus/extensions-sdk version

**"npm publish fails"**
- Run `npm login`
- Check package name availability
- Verify version number

---

## Resources

- **Bundle Guide**: https://directus.io/docs/guides/extensions/bundles
- **Publishing Guide**: https://directus.io/docs/guides/extensions/marketplace/publishing
- **Extension SDK**: https://www.npmjs.com/package/@directus/extensions-sdk
- **Marketplace**: https://directus.io/extensions

---

**Time Estimate**: 3-4 days for full implementation and publishing  
**LOC Estimate**: ~2500-3500 lines  
**Bundle Size Target**: <500KB total
