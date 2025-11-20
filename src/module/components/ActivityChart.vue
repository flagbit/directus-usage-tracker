<template>
  <div class="activity-chart-container">
    <!-- Loading State -->
    <div v-if="loading" class="chart-loading">
      <v-progress-circular indeterminate />
      <p class="loading-text">Loading chart data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="chart-error">
      <v-icon name="error" class="error-icon" />
      <p class="error-text">{{ error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!activityData || activityData.length === 0" class="chart-empty">
      <v-icon name="inbox" class="empty-icon" />
      <p class="empty-text">No activity data available</p>
    </div>

    <!-- Chart -->
    <div v-else class="chart-wrapper">
      <canvas
        ref="chartCanvas"
        :aria-label="`${chartType} chart showing ${dataType} activity counts`"
        role="img"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';
import type { ActivityByCollection, ActivityByAction } from '@shared/types';
import { createBarChart, createPieChart } from '../utils/chart-helpers';

// Register Chart.js components
Chart.register(...registerables);

// ============================================================================
// Props
// ============================================================================

export interface ActivityChartProps {
  activityData: ActivityByCollection[] | ActivityByAction[];
  dataType?: 'collection' | 'action';
  chartType?: 'bar' | 'pie';
  topN?: number;
  loading?: boolean;
  error?: string | null;
}

const props = withDefaults(defineProps<ActivityChartProps>(), {
  dataType: 'collection',
  chartType: 'bar',
  topN: undefined,
  loading: false,
  error: null,
});

// ============================================================================
// State
// ============================================================================

const chartCanvas = ref<HTMLCanvasElement | null>(null);
const chartInstance = ref<Chart | null>(null);

// ============================================================================
// Chart Management
// ============================================================================

/**
 * Get action-specific colors
 */
function getActionColor(action: string): string {
  const actionColors: Record<string, string> = {
    read: '#4CAF50', // Green
    create: '#2196F3', // Blue
    update: '#FF9800', // Orange
    delete: '#F44336', // Red
    login: '#9C27B0', // Purple
    comment: '#00BCD4', // Cyan
  };

  return actionColors[action.toLowerCase()] || '#6644FF';
}

/**
 * Initialize Chart.js instance
 */
function initChart(): void {
  if (!chartCanvas.value) return;

  // Destroy existing chart
  destroyChart();

  // Filter to Top N if specified
  const displayData = props.topN
    ? props.activityData.slice(0, props.topN)
    : props.activityData;

  // Extract data based on type
  let labels: string[];
  let data: number[];
  let colors: (string | undefined)[];

  if (props.dataType === 'collection') {
    const collectionData = displayData as ActivityByCollection[];
    labels = collectionData.map((item) => item.collection);
    data = collectionData.map((item) => item.count);
    colors = collectionData.map(() => undefined); // Use default colors
  } else {
    const actionData = displayData as ActivityByAction[];
    labels = actionData.map((item) => item.action.charAt(0).toUpperCase() + item.action.slice(1));
    data = actionData.map((item) => item.count);
    colors = actionData.map((item) => getActionColor(item.action));
  }

  // Create chart configuration
  const title =
    props.dataType === 'collection' ? 'Activity by Collection' : 'Activity by Action';
  const config =
    props.chartType === 'pie'
      ? createPieChart(labels, data, title, colors)
      : createBarChart(labels, data, title, colors);

  // Create chart instance
  try {
    chartInstance.value = new Chart(chartCanvas.value, config);
  } catch (error) {
    console.error('[ActivityChart] Failed to create chart:', error);
  }
}

/**
 * Update existing chart with new data
 */
function updateChart(): void {
  if (!chartInstance.value) {
    initChart();
    return;
  }

  // Filter to Top N if specified
  const displayData = props.topN
    ? props.activityData.slice(0, props.topN)
    : props.activityData;

  // Update chart data
  let labels: string[];
  let data: number[];

  if (props.dataType === 'collection') {
    const collectionData = displayData as ActivityByCollection[];
    labels = collectionData.map((item) => item.collection);
    data = collectionData.map((item) => item.count);
  } else {
    const actionData = displayData as ActivityByAction[];
    labels = actionData.map((item) => item.action.charAt(0).toUpperCase() + item.action.slice(1));
    data = actionData.map((item) => item.count);
  }

  chartInstance.value.data.labels = labels;
  chartInstance.value.data.datasets[0].data = data;

  // Update chart
  chartInstance.value.update();
}

/**
 * Destroy chart instance
 */
function destroyChart(): void {
  if (chartInstance.value) {
    chartInstance.value.destroy();
    chartInstance.value = null;
  }
}

// ============================================================================
// Watchers
// ============================================================================

// Watch for activity data changes
watch(
  () => props.activityData,
  () => {
    if (props.activityData && props.activityData.length > 0) {
      nextTick(() => {
        updateChart();
      });
    }
  },
  { deep: true }
);

// Watch for chart type changes
watch(
  () => props.chartType,
  () => {
    nextTick(() => {
      initChart();
    });
  }
);

// Watch for data type changes
watch(
  () => props.dataType,
  () => {
    nextTick(() => {
      initChart();
    });
  }
);

// Watch for topN changes
watch(
  () => props.topN,
  () => {
    nextTick(() => {
      updateChart();
    });
  }
);

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  if (props.activityData && props.activityData.length > 0) {
    nextTick(() => {
      initChart();
    });
  }
});

onUnmounted(() => {
  destroyChart();
});
</script>

<style scoped>
.activity-chart-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 16px;
}

canvas {
  max-width: 100%;
  max-height: 100%;
}

/* Loading State */
.chart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--foreground-subdued);
}

.loading-text {
  font-size: 14px;
  margin: 0;
}

/* Error State */
.chart-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
  color: var(--danger);
}

.error-text {
  font-size: 14px;
  color: var(--danger);
  margin: 0;
}

/* Empty State */
.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: var(--foreground-subdued);
}

.empty-text {
  font-size: 14px;
  color: var(--foreground-subdued);
  margin: 0;
}
</style>
