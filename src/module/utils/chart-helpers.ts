/**
 * Chart.js configuration helpers for usage analytics visualizations
 *
 * Provides functions to generate Chart.js configurations for various chart types
 * @module chart-helpers
 */

import type { ChartConfiguration, ChartDataset } from '@shared/types';
import { CHART_COLORS, CHART_PALETTE, DEFAULT_CHART_OPTIONS } from '@shared/constants';

// ============================================================================
// Chart Configuration Generators
// ============================================================================

/**
 * Create a bar chart configuration for collection usage.
 *
 * @param labels - Array of collection names
 * @param data - Array of row counts
 * @param title - Chart title
 * @returns Chart.js configuration object
 *
 * @example
 * ```typescript
 * const config = createBarChart(
 *   ['articles', 'users', 'products'],
 *   [1000, 500, 300],
 *   'Top Collections by Row Count'
 * );
 * ```
 */
export function createBarChart(
  labels: string[],
  data: number[],
  title: string
): ChartConfiguration {
  const colors = generateChartColors(data.length);

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Row Count',
          data,
          backgroundColor: colors,
          borderColor: colors.map((c) => c.replace('0.6', '1')),
          borderWidth: 1,
        },
      ],
    },
    options: {
      ...DEFAULT_CHART_OPTIONS,
      plugins: {
        ...DEFAULT_CHART_OPTIONS.plugins,
        title: {
          display: true,
          text: title,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Collection',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Rows',
          },
          beginAtZero: true,
        },
      },
    },
  };
}

/**
 * Create a horizontal bar chart configuration (useful for long labels).
 *
 * @param labels - Array of labels
 * @param data - Array of values
 * @param title - Chart title
 * @returns Chart.js configuration object
 */
export function createHorizontalBarChart(
  labels: string[],
  data: number[],
  title: string
): ChartConfiguration {
  const colors = generateChartColors(data.length);

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Count',
          data,
          backgroundColor: colors,
          borderColor: colors.map((c) => c.replace('0.6', '1')),
          borderWidth: 1,
        },
      ],
    },
    options: {
      ...DEFAULT_CHART_OPTIONS,
      indexAxis: 'y' as const,
      plugins: {
        ...DEFAULT_CHART_OPTIONS.plugins,
        title: {
          display: true,
          text: title,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Count',
          },
          beginAtZero: true,
        },
        y: {
          title: {
            display: false,
            text: '',
          },
        },
      },
    },
  };
}

/**
 * Create a line chart configuration for time-series data.
 *
 * @param labels - Array of time labels
 * @param datasets - Array of dataset configurations
 * @param title - Chart title
 * @returns Chart.js configuration object
 *
 * @example
 * ```typescript
 * const config = createLineChart(
 *   ['Jan', 'Feb', 'Mar'],
 *   [
 *     { label: 'Requests', data: [100, 150, 200] },
 *     { label: 'Users', data: [10, 15, 20] }
 *   ],
 *   'API Activity Over Time'
 * );
 * ```
 */
export function createLineChart(
  labels: string[],
  datasets: Array<{ label: string; data: number[] }>,
  title: string
): ChartConfiguration {
  const chartDatasets: ChartDataset[] = datasets.map((dataset, index) => {
    const color = CHART_PALETTE[index % CHART_PALETTE.length];
    return {
      label: dataset.label,
      data: dataset.data,
      backgroundColor: color.replace(')', ', 0.2)').replace('#', 'rgba('),
      borderColor: color,
      borderWidth: 2,
    };
  });

  return {
    type: 'line',
    data: {
      labels,
      datasets: chartDatasets,
    },
    options: {
      ...DEFAULT_CHART_OPTIONS,
      plugins: {
        ...DEFAULT_CHART_OPTIONS.plugins,
        title: {
          display: true,
          text: title,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Count',
          },
          beginAtZero: true,
        },
      },
    },
  };
}

/**
 * Create a pie chart configuration for proportional data.
 *
 * @param labels - Array of labels
 * @param data - Array of values
 * @param title - Chart title
 * @returns Chart.js configuration object
 */
export function createPieChart(
  labels: string[],
  data: number[],
  title: string
): ChartConfiguration {
  const colors = generateChartColors(data.length);

  return {
    type: 'pie',
    data: {
      labels,
      datasets: [
        {
          label: 'Distribution',
          data,
          backgroundColor: colors,
          borderColor: colors.map((c) => c.replace('0.6', '1')),
          borderWidth: 1,
        },
      ],
    },
    options: {
      ...DEFAULT_CHART_OPTIONS,
      plugins: {
        ...DEFAULT_CHART_OPTIONS.plugins,
        title: {
          display: true,
          text: title,
        },
        legend: {
          display: true,
          position: 'right',
        },
      },
    },
  };
}

/**
 * Create a doughnut chart configuration (pie chart with center hole).
 *
 * @param labels - Array of labels
 * @param data - Array of values
 * @param title - Chart title
 * @returns Chart.js configuration object
 */
export function createDoughnutChart(
  labels: string[],
  data: number[],
  title: string
): ChartConfiguration {
  const colors = generateChartColors(data.length);

  return {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          label: 'Distribution',
          data,
          backgroundColor: colors,
          borderColor: colors.map((c) => c.replace('0.6', '1')),
          borderWidth: 1,
        },
      ],
    },
    options: {
      ...DEFAULT_CHART_OPTIONS,
      plugins: {
        ...DEFAULT_CHART_OPTIONS.plugins,
        title: {
          display: true,
          text: title,
        },
        legend: {
          display: true,
          position: 'right',
        },
      },
    },
  };
}

// ============================================================================
// Action Breakdown Chart
// ============================================================================

/**
 * Create a stacked bar chart for action breakdown (create, read, update, delete).
 *
 * @param collections - Array of collection names
 * @param actionData - Action breakdown data per collection
 * @param title - Chart title
 * @returns Chart.js configuration object
 */
export function createActionBreakdownChart(
  collections: string[],
  actionData: Array<{
    create: number;
    read: number;
    update: number;
    delete: number;
    other: number;
  }>,
  title: string
): ChartConfiguration {
  const datasets: ChartDataset[] = [
    {
      label: 'Create',
      data: actionData.map((d) => d.create),
      backgroundColor: 'rgba(16, 185, 129, 0.6)', // Green
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 1,
    },
    {
      label: 'Read',
      data: actionData.map((d) => d.read),
      backgroundColor: 'rgba(59, 130, 246, 0.6)', // Blue
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
    },
    {
      label: 'Update',
      data: actionData.map((d) => d.update),
      backgroundColor: 'rgba(245, 158, 11, 0.6)', // Amber
      borderColor: 'rgba(245, 158, 11, 1)',
      borderWidth: 1,
    },
    {
      label: 'Delete',
      data: actionData.map((d) => d.delete),
      backgroundColor: 'rgba(239, 68, 68, 0.6)', // Red
      borderColor: 'rgba(239, 68, 68, 1)',
      borderWidth: 1,
    },
    {
      label: 'Other',
      data: actionData.map((d) => d.other),
      backgroundColor: 'rgba(107, 114, 128, 0.6)', // Gray
      borderColor: 'rgba(107, 114, 128, 1)',
      borderWidth: 1,
    },
  ];

  return {
    type: 'bar',
    data: {
      labels: collections,
      datasets,
    },
    options: {
      ...DEFAULT_CHART_OPTIONS,
      plugins: {
        ...DEFAULT_CHART_OPTIONS.plugins,
        title: {
          display: true,
          text: title,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Collection',
          },
          stacked: true,
        },
        y: {
          title: {
            display: true,
            text: 'Request Count',
          },
          beginAtZero: true,
          stacked: true,
        },
      },
    },
  };
}

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Generate an array of colors for chart datasets.
 *
 * @param count - Number of colors needed
 * @param opacity - Opacity value (0-1, default: 0.6)
 * @returns Array of rgba color strings
 */
export function generateChartColors(count: number, opacity: number = 0.6): string[] {
  return Array.from({ length: count }, (_, i) => {
    const color = CHART_PALETTE[i % CHART_PALETTE.length];
    // Convert hex to rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  });
}

/**
 * Get a semantic color based on value type (success, warning, danger).
 *
 * @param type - Color type
 * @param opacity - Opacity value (0-1, default: 0.6)
 * @returns rgba color string
 */
export function getSemanticColor(
  type: 'success' | 'warning' | 'danger' | 'info' | 'primary',
  opacity: number = 0.6
): string {
  const colorMap = {
    success: CHART_COLORS.SUCCESS,
    warning: CHART_COLORS.WARNING,
    danger: CHART_COLORS.DANGER,
    info: CHART_COLORS.INFO,
    primary: CHART_COLORS.PRIMARY,
  };

  const color = colorMap[type];
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// ============================================================================
// Chart Data Transformers
// ============================================================================

/**
 * Transform collection usage data for chart display.
 *
 * @param data - Array of collection usage objects
 * @param limit - Maximum number of items to display (default: 10)
 * @returns Object with labels and data arrays
 */
export function transformCollectionData(
  data: Array<{ name: string; row_count: number }>,
  limit: number = 10
): { labels: string[]; data: number[] } {
  const sorted = [...data].sort((a, b) => b.row_count - a.row_count).slice(0, limit);

  return {
    labels: sorted.map((item) => item.name),
    data: sorted.map((item) => item.row_count),
  };
}

/**
 * Transform time-series data for chart display.
 *
 * @param data - Array of time-series data points
 * @returns Object with labels and data arrays
 */
export function transformTimeSeriesData(
  data: Array<{ timestamp: string; value: number; label: string }>
): { labels: string[]; data: number[] } {
  return {
    labels: data.map((point) => point.label),
    data: data.map((point) => point.value),
  };
}

// ============================================================================
// Chart Update Helpers
// ============================================================================

/**
 * Update chart data without recreating the entire chart.
 * Useful for real-time updates.
 *
 * @param chart - Chart.js chart instance
 * @param newLabels - New labels array
 * @param newData - New data array
 */
export function updateChartData(
  chart: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  newLabels: string[],
  newData: number[]
): void {
  chart.data.labels = newLabels;
  chart.data.datasets[0].data = newData;
  chart.update();
}

/**
 * Add a new data point to an existing chart.
 *
 * @param chart - Chart.js chart instance
 * @param label - New label
 * @param value - New value
 */
export function addChartDataPoint(
  chart: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  label: string,
  value: number
): void {
  chart.data.labels.push(label);
  chart.data.datasets.forEach((dataset: any) => {
    dataset.data.push(value);
  });
  chart.update();
}

/**
 * Remove the oldest data point from a chart (useful for sliding window).
 *
 * @param chart - Chart.js chart instance
 */
export function removeOldestDataPoint(chart: any): void {
  // eslint-disable-line @typescript-eslint/no-explicit-any
  chart.data.labels.shift();
  chart.data.datasets.forEach((dataset: any) => {
    dataset.data.shift();
  });
  chart.update();
}
