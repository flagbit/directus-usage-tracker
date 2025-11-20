/**
 * Module Routes Configuration
 *
 * Defines Vue Router routes for the Usage Analytics module.
 * Maps URLs to components and configures route metadata.
 *
 * @module module/routes
 */

import type { RouteRecordRaw } from 'vue-router';

/**
 * Usage Analytics module routes
 *
 * Routes are relative to the module base path (/usage-analytics)
 */
export const routes: RouteRecordRaw[] = [
  {
    path: '',
    redirect: 'storage',
  },
  {
    path: 'storage',
    name: 'usage-analytics-storage',
    component: () => import('./views/AnalyticsDashboard.vue'),
    meta: {
      title: 'Collection Storage',
      description: 'View storage usage for all collections',
    },
  },
  {
    path: 'activity',
    name: 'usage-analytics-activity',
    component: () => import('./views/AnalyticsDashboard.vue'),
    meta: {
      title: 'API Activity',
      description: 'Analyze API request patterns',
    },
  },
  {
    path: 'settings',
    name: 'usage-analytics-settings',
    component: () => import('./views/AnalyticsDashboard.vue'),
    meta: {
      title: 'Settings',
      description: 'Configure analytics settings',
    },
  },
];
