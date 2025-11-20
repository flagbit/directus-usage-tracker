<template>
  <div class="filter-panel">
    <div class="filter-section">
      <label class="filter-label">Date Range:</label>
      <v-select
        v-model="selectedDateRange"
        :items="dateRangeOptions"
        placeholder="Select date range"
        @update:model-value="handleDateRangeChange"
      />
    </div>

    <div v-if="showTopNToggle" class="filter-section">
      <TopTenToggle
        v-model="topNEnabled"
        :limit="topNLimit"
        :total-count="totalCount"
        @change="handleTopNChange"
      />
    </div>

    <div v-if="showChartType" class="filter-section">
      <label class="filter-label">Chart Type:</label>
      <v-select
        v-model="selectedChartType"
        :items="chartTypeOptions"
        placeholder="Select chart type"
        @update:model-value="handleChartTypeChange"
      />
    </div>

    <div v-if="showDataType" class="filter-section">
      <label class="filter-label">Group By:</label>
      <v-select
        v-model="selectedDataType"
        :items="dataTypeOptions"
        placeholder="Group by"
        @update:model-value="handleDataTypeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import TopTenToggle from './TopTenToggle.vue';

// ============================================================================
// Props & Emits
// ============================================================================

export interface FilterPanelProps {
  totalCount?: number;
  showTopNToggle?: boolean;
  showChartType?: boolean;
  showDataType?: boolean;
  topNLimit?: number;
}

const props = withDefaults(defineProps<FilterPanelProps>(), {
  totalCount: 0,
  showTopNToggle: true,
  showChartType: true,
  showDataType: true,
  topNLimit: 10,
});

const emit = defineEmits<{
  'date-range-change': [dateRange: { start: string; end: string }];
  'top-n-change': [enabled: boolean];
  'chart-type-change': [chartType: 'bar' | 'pie'];
  'data-type-change': [dataType: 'collection' | 'action'];
}>();

// ============================================================================
// State
// ============================================================================

const selectedDateRange = ref<string>('last_7_days');
const topNEnabled = ref<boolean>(false);
const selectedChartType = ref<'bar' | 'pie'>('bar');
const selectedDataType = ref<'collection' | 'action'>('collection');

const dateRangeOptions = [
  { text: 'Last 24 Hours', value: 'last_24_hours' },
  { text: 'Last 7 Days', value: 'last_7_days' },
  { text: 'Last 30 Days', value: 'last_30_days' },
  { text: 'Last 90 Days', value: 'last_90_days' },
];

const chartTypeOptions = [
  { text: 'Bar Chart', value: 'bar' },
  { text: 'Pie Chart', value: 'pie' },
];

const dataTypeOptions = [
  { text: 'By Collection', value: 'collection' },
  { text: 'By Action', value: 'action' },
];

// ============================================================================
// Methods
// ============================================================================

/**
 * Calculate date range from selection
 */
function calculateDateRange(range: string): { start: string; end: string } {
  const now = new Date();
  const endDate = now.toISOString();
  let startDate: string;

  switch (range) {
    case 'last_24_hours':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'last_7_days':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'last_30_days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'last_90_days':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  return { start: startDate, end: endDate };
}

/**
 * Handle date range change
 */
function handleDateRangeChange(value: string): void {
  const dateRange = calculateDateRange(value);
  emit('date-range-change', dateRange);
}

/**
 * Handle Top N toggle change
 */
function handleTopNChange(enabled: boolean): void {
  emit('top-n-change', enabled);
}

/**
 * Handle chart type change
 */
function handleChartTypeChange(value: 'bar' | 'pie'): void {
  emit('chart-type-change', value);
}

/**
 * Handle data type change
 */
function handleDataTypeChange(value: 'collection' | 'action'): void {
  emit('data-type-change', value);
}

// ============================================================================
// Initialization
// ============================================================================

// Emit initial date range on mount
const initialDateRange = calculateDateRange(selectedDateRange.value);
emit('date-range-change', initialDateRange);
</script>

<style scoped>
.filter-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
  padding: 16px;
  background-color: var(--background-subdued);
  border-radius: 8px;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--foreground);
  margin: 0;
  white-space: nowrap;
}
</style>
