/**
 * Directus Usage Analytics Module Entry Point
 *
 * Vue 3 frontend module for displaying usage analytics in Directus admin interface.
 * Provides visual dashboards for collection storage, API activity, and time-series analysis.
 *
 * @module module
 */

import { defineModule } from '@directus/extensions-sdk';
import AnalyticsDashboard from './views/AnalyticsDashboard.vue';

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
  id: 'usage-analytics',
  name: 'Usage Analytics',
  icon: 'analytics',

  routes: [
    {
      name: 'usage-analytics',
      path: '',
      component: AnalyticsDashboard,
      beforeEnter() {
        return '/usage-analytics/storage';
      },
    },
    {
      path: 'storage',
      component: AnalyticsDashboard,
    },
    {
      path: 'activity',
      component: AnalyticsDashboard,
    },
    {
      path: 'settings',
      component: AnalyticsDashboard,
    },
  ],

  preRegisterCheck(user) {
    return user.admin_access === true;
  },
});
