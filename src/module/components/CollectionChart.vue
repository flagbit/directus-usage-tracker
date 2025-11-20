<template>
  <div class="collection-chart-container">
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
    <div v-else-if="!collections || collections.length === 0" class="chart-empty">
      <v-icon name="inbox" class="empty-icon" />
      <p class="empty-text">No collection data available</p>
    </div>

    <!-- Chart -->
    <div v-else class="chart-wrapper">
      <canvas
        ref="chartCanvas"
        :aria-label="`${chartType} chart showing row counts for ${collections.length} collections`"
        role="img"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';
import type { CollectionUsage } from '@shared/types';
import { createBarChart, createPieChart } from '../utils/chart-helpers';

// Register Chart.js components
Chart.register(...registerables);

// ============================================================================
// Props
// ============================================================================

export interface CollectionChartProps {
  collections: CollectionUsage[];
  chartType?: 'bar' | 'pie';
  topN?: number;
  loading?: boolean;
  error?: string | null;
}

const props = withDefaults(defineProps<CollectionChartProps>(), {
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
 * Initialize Chart.js instance
 */
function initChart(): void {
  if (!chartCanvas.value) return;

  // Destroy existing chart
  destroyChart();

  // Filter to Top N if specified
  const displayCollections = props.topN
    ? [...props.collections]
        .sort((a, b) => b.row_count - a.row_count)
        .slice(0, props.topN)
    : props.collections;

  // Extract data for chart
  const labels = displayCollections.map((c) => c.name);
  const data = displayCollections.map((c) => c.row_count);
  const colors = displayCollections.map((c) => c.color || undefined);

  // Create chart configuration
  const config =
    props.chartType === 'pie'
      ? createPieChart(labels, data, 'Collection Distribution', colors)
      : createBarChart(labels, data, 'Collection Row Counts', colors);

  // Create chart instance
  try {
    chartInstance.value = new Chart(chartCanvas.value, config);
  } catch (error) {
    console.error('[CollectionChart] Failed to create chart:', error);
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
  const displayCollections = props.topN
    ? [...props.collections]
        .sort((a, b) => b.row_count - a.row_count)
        .slice(0, props.topN)
    : props.collections;

  // Update chart data
  const labels = displayCollections.map((c) => c.name);
  const data = displayCollections.map((c) => c.row_count);

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

// Watch for collections changes
watch(
  () => props.collections,
  () => {
    if (props.collections && props.collections.length > 0) {
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
  if (props.collections && props.collections.length > 0) {
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
.collection-chart-container {
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
