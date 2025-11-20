<template>
  <div class="activity-view">
    <!-- Error Alert -->
    <v-notice v-if="error" type="danger" class="error-notice" @close="clearError">
      <p>{{ error }}</p>
    </v-notice>

    <!-- Filters -->
    <FilterPanel
      :total-count="byCollection.length"
      :show-ip-filter="true"
      :available-ips="availableIPs"
      @date-range-change="handleDateRangeChange"
      @top-n-change="handleTopNChange"
      @chart-type-change="handleChartTypeChange"
      @data-type-change="handleDataTypeChange"
      @ip-filter-change="handleIPFilterChange"
    />

    <!-- IP Filter Indicator -->
    <div v-if="selectedIP" class="ip-filter-indicator">
      <v-icon name="language" small />
      <span>Viewing activity for IP: <strong>{{ selectedIP }}</strong></span>
      <v-button
        v-tooltip.bottom="'Clear IP filter'"
        x-small
        secondary
        @click="handleIPFilterChange(null)"
      >
        <v-icon name="close" x-small />
      </v-button>
    </div>

    <!-- Stats Summary -->
    <div v-if="loading" class="stats-summary">
      <div v-for="i in 4" :key="i" class="stat-card loading">
        <v-skeleton-loader type="block-list-item-three-line" />
      </div>
    </div>

    <div v-else-if="!error && statistics" class="stats-summary">
      <div class="stat-card">
        <div class="stat-icon">
          <v-icon name="api" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Total Requests</p>
          <p class="stat-value">{{ formatNumber(totalRequests) }}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <v-icon name="people" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Unique Users</p>
          <p class="stat-value">{{ formatNumber(uniqueUsers) }}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <v-icon name="language" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Unique IPs</p>
          <p class="stat-value">{{ formatNumber(uniqueIPs) }}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <v-icon name="date_range" />
        </div>
        <div class="stat-content">
          <p class="stat-label">Date Range</p>
          <p class="stat-value-small">
            {{ formatDateRange(dateRange?.start, dateRange?.end) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Chart Section -->
    <div class="chart-section">
      <div class="section-header">
        <h3 class="section-title">
          {{ chartTitle }}
        </h3>
        <p v-if="statistics?.cached" class="cache-indicator">
          <v-icon name="cached" small />
          Cached data
        </p>
      </div>

      <div class="chart-container">
        <!-- Loading State -->
        <div v-if="loading" class="chart-loading">
          <v-progress-circular indeterminate />
          <p class="loading-text">Lade Chart-Daten...</p>
        </div>

        <!-- Chart -->
        <ActivityChart
          v-else
          :activity-data="currentChartData"
          :data-type="dataType"
          :chart-type="chartType"
          :top-n="showTopTen ? 10 : undefined"
          :loading="loading"
          :error="error"
        />
      </div>
    </div>

    <!-- Data Tables -->
    <div class="tables-section">
      <div class="table-group">
        <div class="section-header">
          <h3 class="section-title">Activity by Collection</h3>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="table-loading">
          <v-skeleton-loader type="table" />
        </div>

        <!-- Table -->
        <v-table
          v-else-if="byCollection.length > 0"
          :headers="collectionTableHeaders"
          :items="displayCollectionData"
          show-resize
        >
          <template #item.collection="{ item }">
            <div class="collection-name">
              <v-icon name="folder" small />
              <span>{{ item.collection }}</span>
            </div>
          </template>

          <template #item.count="{ item }">
            <span class="count-value">{{ formatNumber(item.count) }}</span>
          </template>

          <template #item.percentage="{ item }">
            <div class="percentage-cell">
              <span class="percentage-value">{{ item.percentage }}%</span>
              <div class="percentage-bar">
                <div
                  class="percentage-fill"
                  :style="{ width: `${item.percentage}%` }"
                />
              </div>
            </div>
          </template>
        </v-table>

        <!-- Empty State -->
        <v-info
          v-else
          icon="inbox"
          title="Keine Collection-Aktivität"
          type="info"
          center
        >
          Keine API-Aktivität für Collections in diesem Zeitraum gefunden.
        </v-info>
      </div>

      <div class="table-group">
        <div class="section-header">
          <h3 class="section-title">Activity by Action</h3>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="table-loading">
          <v-skeleton-loader type="table" />
        </div>

        <!-- Table -->
        <v-table
          v-else-if="byAction.length > 0"
          :headers="actionTableHeaders"
          :items="displayActionData"
          show-resize
        >
          <template #item.action="{ item }">
            <v-badge :color="getActionColor(item.action)" small>
              {{ item.action.charAt(0).toUpperCase() + item.action.slice(1) }}
            </v-badge>
          </template>

          <template #item.count="{ item }">
            <span class="count-value">{{ formatNumber(item.count) }}</span>
          </template>

          <template #item.percentage="{ item }">
            <div class="percentage-cell">
              <span class="percentage-value">{{ item.percentage }}%</span>
              <div class="percentage-bar">
                <div
                  class="percentage-fill"
                  :style="{ width: `${item.percentage}%` }"
                />
              </div>
            </div>
          </template>
        </v-table>

        <!-- Empty State -->
        <v-info
          v-else
          icon="inbox"
          title="Keine Action-Aktivität"
          type="info"
          center
        >
          Keine API-Aktivität für Actions in diesem Zeitraum gefunden.
        </v-info>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useActivityAnalytics } from '../composables/use-activity-analytics';
import ActivityChart from '../components/ActivityChart.vue';
import FilterPanel from '../components/FilterPanel.vue';
import { formatNumber } from '../utils/data-formatters';

// ============================================================================
// Composables
// ============================================================================

const {
  statistics,
  loading,
  error,
  totalRequests,
  uniqueUsers,
  uniqueIPs,
  byCollection,
  byAction,
  dateRange,
  fetchActivity,
  fetchTopIPs,
  fetchActivityByIP,
  refresh,
  clearError,
} = useActivityAnalytics();

// ============================================================================
// State
// ============================================================================

const showTopTen = ref<boolean>(false);
const chartType = ref<'bar' | 'pie'>('bar');
const dataType = ref<'collection' | 'action'>('collection');
const currentDateRange = ref<{ start: string; end: string } | null>(null);
const availableIPs = ref<Array<{ ip: string; count: number; percentage: number }>>([]);
const selectedIP = ref<string | null>(null);

const collectionTableHeaders = [
  { text: 'Collection', value: 'collection', width: 300 },
  { text: 'Requests', value: 'count', width: 150, align: 'right' },
  { text: 'Percentage', value: 'percentage', width: 200 },
];

const actionTableHeaders = [
  { text: 'Action', value: 'action', width: 150 },
  { text: 'Requests', value: 'count', width: 150, align: 'right' },
  { text: 'Percentage', value: 'percentage', width: 200 },
];

// ============================================================================
// Computed
// ============================================================================

const chartTitle = computed(() => {
  if (dataType.value === 'collection') {
    return 'API Requests by Collection';
  } else {
    return 'API Requests by Action';
  }
});

const currentChartData = computed(() => {
  return dataType.value === 'collection' ? byCollection.value : byAction.value;
});

const displayCollectionData = computed(() => {
  if (showTopTen.value) {
    return byCollection.value.slice(0, 10);
  }
  return byCollection.value;
});

const displayActionData = computed(() => {
  if (showTopTen.value) {
    return byAction.value.slice(0, 10);
  }
  return byAction.value;
});

// ============================================================================
// Methods
// ============================================================================

/**
 * Format date range for display
 */
function formatDateRange(start?: string, end?: string): string {
  if (!start || !end) return 'N/A';

  const startDate = new Date(start);
  const endDate = new Date(end);

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };

  return `${startDate.toLocaleDateString(undefined, options)} - ${endDate.toLocaleDateString(undefined, options)}`;
}

/**
 * Get action color
 */
function getActionColor(action: string): string {
  const colors: Record<string, string> = {
    read: 'var(--success)',
    create: 'var(--primary)',
    update: 'var(--warning)',
    delete: 'var(--danger)',
  };

  return colors[action.toLowerCase()] || 'var(--foreground-subdued)';
}

/**
 * Handle date range change
 */
async function handleDateRangeChange(dateRange: { start: string; end: string }): Promise<void> {
  currentDateRange.value = dateRange;
  selectedIP.value = null; // Clear IP filter on date range change

  // Fetch top IPs for the date range
  const topIPs = await fetchTopIPs({
    start_date: dateRange.start,
    end_date: dateRange.end,
    limit: 10,
  });
  availableIPs.value = topIPs;

  // Fetch activity data
  await fetchActivity({
    start_date: dateRange.start,
    end_date: dateRange.end,
    limit: 10,
  });
}

/**
 * Handle Top 10 toggle
 */
function handleTopNChange(enabled: boolean): void {
  showTopTen.value = enabled;
}

/**
 * Handle chart type change
 */
function handleChartTypeChange(type: 'bar' | 'pie'): void {
  chartType.value = type;
}

/**
 * Handle data type change
 */
function handleDataTypeChange(type: 'collection' | 'action'): void {
  dataType.value = type;
}

/**
 * Handle IP filter change
 */
async function handleIPFilterChange(ip: string | null): Promise<void> {
  selectedIP.value = ip;

  if (!currentDateRange.value) return;

  if (ip) {
    // Fetch activity for specific IP
    await fetchActivityByIP(ip, {
      start_date: currentDateRange.value.start,
      end_date: currentDateRange.value.end,
      limit: 10,
    });
  } else {
    // Fetch all activity (no IP filter)
    await fetchActivity({
      start_date: currentDateRange.value.start,
      end_date: currentDateRange.value.end,
      limit: 10,
    });
  }
}

/**
 * Handle refresh button click
 */
async function handleRefresh(): Promise<void> {
  if (currentDateRange.value) {
    await handleDateRangeChange(currentDateRange.value);
  } else {
    await refresh();
  }
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(async () => {
  // Initial fetch will be triggered by FilterPanel emitting date-range-change
});
</script>

<style scoped>
.activity-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: var(--content-padding);
}

/* Error Notice */
.error-notice {
  margin-bottom: 16px;
}

/* IP Filter Indicator */
.ip-filter-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: var(--primary-10);
  border: 1px solid var(--primary-25);
  border-radius: 6px;
  color: var(--primary);
  font-size: 14px;
}

.ip-filter-indicator strong {
  color: var(--primary);
  font-weight: 600;
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

.stat-value-small {
  font-size: 14px;
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

/* Tables Section */
.tables-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.table-group {
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

.count-value {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.percentage-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.percentage-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--foreground);
}

.percentage-bar {
  width: 100%;
  height: 6px;
  background-color: var(--background-subdued);
  border-radius: 3px;
  overflow: hidden;
}

.percentage-fill {
  height: 100%;
  background-color: var(--primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* Loading States */
.stat-card.loading {
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
}

.loading-text {
  font-size: 14px;
  color: var(--foreground-subdued);
  margin: 0;
}

.table-loading {
  min-height: 300px;
}

/* Interactive States */
.v-table :deep(tbody tr) {
  transition: background-color 0.2s ease;
  cursor: default;
}

.v-table :deep(tbody tr:hover) {
  background-color: var(--background-subdued);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .tables-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-container {
    min-height: 300px;
  }
}

@media (max-width: 480px) {
  .stats-summary {
    grid-template-columns: 1fr;
  }
}
</style>
