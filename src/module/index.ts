/**
 * Directus Usage Analytics Module Entry Point
 *
 * Vue 3 frontend module for displaying usage analytics in Directus admin interface.
 * Provides visual dashboards for collection storage, API activity, and time-series analysis.
 *
 * @module module
 */

import { defineModule } from '@directus/extensions-sdk';
import { MODULE_CONFIG } from '../shared/constants';

/**
 * Usage Analytics Module
 *
 * Displays as a top-level navigation item in Directus admin.
 * Provides tabs for:
 * - Collection Storage Analysis (User Story 1)
 * - API Activity Analysis (User Story 2)
 * - IP-Based Traffic Analysis (User Story 3)
 */
export default defineModule({
  id: MODULE_CONFIG.ID,
  name: MODULE_CONFIG.NAME,
  icon: MODULE_CONFIG.ICON,
  color: MODULE_CONFIG.COLOR,

  routes: [
    {
      path: '',
      redirect: '/usage-analytics/storage',
    },
    {
      path: 'storage',
      component: () => import('./views/AnalyticsDashboard.vue'),
      meta: {
        title: 'Collection Storage',
        description: 'View storage usage for all collections',
      },
    },
    {
      path: 'activity',
      component: () => import('./views/AnalyticsDashboard.vue'),
      meta: {
        title: 'API Activity',
        description: 'Analyze API request patterns',
      },
    },
    {
      path: 'settings',
      component: () => import('./views/AnalyticsDashboard.vue'),
      meta: {
        title: 'Settings',
        description: 'Configure analytics settings',
      },
    },
  ],

  preRegisterCheck(user, permissions) {
    // Only show module to admin users
    // TODO: Make this configurable via module settings
    return user?.role?.admin_access === true;
  },
});
