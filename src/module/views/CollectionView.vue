<template>
  <div class="collection-view">
    <!-- Header Controls -->
    <div class="view-header">
      <div class="header-left">
        <h2 class="view-title">Collection Storage</h2>
        <p class="view-description">View row counts and storage usage for all collections</p>
      </div>

      <div class="header-right">
        <v-button
          v-tooltip.bottom="'Refresh Data'"
          :loading="loading"
          :disabled="loading"
          rounded
          icon
          @click="handleRefresh"
        >
          <v-icon name="refresh" />
        </v-button>
      </div>
    </div>

    <!-- Filters -->
    <div class="view-filters">
      <v-checkbox
        v-model="includeSystem"
        label="Include System Collections"
        @update:model-value="handleFilterChange"
      />

      <TopTenToggle
        v-model="showTopTen"
        :limit="10"
        :total-count="totalCollections"
        @change="handleTopTenChange"
      />

      <div class="filter-group">
        <label class="filter-label">Chart Type:</label>
        <v-select
          v-model="chartType"
          :items="chartTypeOptions"
          placeholder="Select chart type"
        />
      </div>
    </div>

    <!-- Error Alert -->
    <v-notice v-if="error" type="danger" class="error-notice" @close="clearError">
      <p>{{ error }}</p>
    </v-notice>

    <!-- Stats Summary -->
    <div v-if="!loading && !error" class="stats-summary">
      <div class="stat-card">
        <div class="stat-icon">
          <v-icon name="folder" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Total Collections</p>
          <p class="stat-value">{{ formatNumber(totalCollections) }}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <v-icon name="storage" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Total Rows</p>
          <p class="stat-value">{{ formatNumber(totalRows) }}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <v-icon name="account_tree" />
        </div>
        <div class="stat-content">
          <p class="stat-label">User Collections</p>
          <p class="stat-value">{{ formatNumber(userCollections.length) }}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <v-icon name="settings" />
        </div>
        <div class="stat-content">
          <p class="stat-label">System Collections</p>
          <p class="stat-value">{{ formatNumber(systemCollections.length) }}</p>
        </div>
      </div>
    </div>

    <!-- Chart Section -->
    <div class="chart-section">
      <div class="section-header">
        <h3 class="section-title">Collection Row Counts</h3>
        <p v-if="response?.cached" class="cache-indicator">
          <v-icon name="cached" small />
          Cached data
        </p>
      </div>

      <div class="chart-container">
        <CollectionChart
          :collections="collections"
          :chart-type="chartType"
          :top-n="showTopTen ? 10 : undefined"
          :loading="loading"
          :error="error"
        />
      </div>
    </div>

    <!-- Data Table -->
    <div class="table-section">
      <div class="section-header">
        <h3 class="section-title">Collection Details</h3>
      </div>

      <v-table
        v-if="!loading && collections.length > 0"
        :headers="tableHeaders"
        :items="displayCollections"
        :loading="loading"
        show-resize
      >
        <template #item.name="{ item }">
          <div class="collection-name">
            <v-icon v-if="item.icon" :name="item.icon" small />
            <v-icon v-else name="folder" small />
            <span>{{ item.name }}</span>
          </div>
        </template>

        <template #item.row_count="{ item }">
          <span class="row-count">{{ formatNumber(item.row_count) }}</span>
        </template>

        <template #item.is_system="{ item }">
          <v-badge v-if="item.is_system" color="var(--primary)" small>System</v-badge>
          <v-badge v-else color="var(--success)" small>User</v-badge>
        </template>
      </v-table>

      <div v-else-if="!loading" class="table-empty">
        <v-icon name="inbox" />
        <p>No collections found</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCollectionAnalytics } from '../composables/use-collection-analytics';
import CollectionChart from '../components/CollectionChart.vue';
import TopTenToggle from '../components/TopTenToggle.vue';
import { formatNumber } from '../utils/data-formatters';

// ============================================================================
// Composables
// ============================================================================

const {
  collections,
  loading,
  error,
  response,
  totalCollections,
  totalRows,
  systemCollections,
  userCollections,
  fetchCollections,
  refresh,
  clearError,
} = useCollectionAnalytics({
  include_system: true,
  sort: 'row_count',
  order: 'desc',
});

// ============================================================================
// State
// ============================================================================

const includeSystem = ref<boolean>(true);
const showTopTen = ref<boolean>(false);
const chartType = ref<'bar' | 'pie'>('bar');

const chartTypeOptions = [
  { text: 'Bar Chart', value: 'bar' },
  { text: 'Pie Chart', value: 'pie' },
];

const tableHeaders = [
  { text: 'Collection', value: 'name', width: 250 },
  { text: 'Row Count', value: 'row_count', width: 150, align: 'right' },
  { text: 'Type', value: 'is_system', width: 100 },
  { text: 'Icon', value: 'icon', width: 100 },
];

// ============================================================================
// Computed
// ============================================================================

const displayCollections = computed(() => {
  if (showTopTen.value) {
    return [...collections.value]
      .sort((a, b) => b.row_count - a.row_count)
      .slice(0, 10);
  }
  return collections.value;
});

// ============================================================================
// Methods
// ============================================================================

/**
 * Handle filter changes
 */
async function handleFilterChange(): Promise<void> {
  await fetchCollections({
    include_system: includeSystem.value,
    sort: 'row_count',
    order: 'desc',
  });
}

/**
 * Handle Top 10 toggle
 */
function handleTopTenChange(): void {
  // Chart and table automatically update via computed properties
}

/**
 * Handle refresh button click
 */
async function handleRefresh(): Promise<void> {
  await refresh();
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(async () => {
  await fetchCollections({
    include_system: includeSystem.value,
    sort: 'row_count',
    order: 'desc',
  });
});
</script>

<style scoped>
.collection-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: var(--content-padding);
}

/* Header */
.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.header-left {
  flex: 1;
}

.view-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--foreground);
  margin: 0 0 8px 0;
}

.view-description {
  font-size: 14px;
  color: var(--foreground-subdued);
  margin: 0;
}

.header-right {
  display: flex;
  gap: 8px;
}

/* Filters */
.view-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
  padding: 16px;
  background-color: var(--background-subdued);
  border-radius: 8px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--foreground);
  margin: 0;
}

/* Error Notice */
.error-notice {
  margin-bottom: 16px;
}

/* Stats Summary */
.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background-color: var(--background-normal);
  border: 1px solid var(--border-normal);
  border-radius: 8px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: var(--primary-10);
  border-radius: 8px;
  color: var(--primary);
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--foreground-subdued);
  margin: 0 0 4px 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--foreground);
  margin: 0;
}

/* Chart Section */
.chart-section {
  background-color: var(--background-normal);
  border: 1px solid var(--border-normal);
  border-radius: 8px;
  padding: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--foreground);
  margin: 0;
}

.cache-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--foreground-subdued);
  margin: 0;
}

.chart-container {
  min-height: 400px;
}

/* Table Section */
.table-section {
  background-color: var(--background-normal);
  border: 1px solid var(--border-normal);
  border-radius: 8px;
  padding: 24px;
}

.collection-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.row-count {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 64px;
  color: var(--foreground-subdued);
}

.table-empty p {
  margin: 0;
  font-size: 14px;
}
</style>
