<template>
  <private-view title="Usage Analytics">
    <template #headline>
      <v-breadcrumb :items="breadcrumb" />
    </template>

    <template #title-outer:prepend>
      <v-button class="header-icon" rounded disabled icon secondary>
        <v-icon name="analytics" />
      </v-button>
    </template>

    <template #actions>
      <v-button
        v-tooltip.bottom="'Settings'"
        rounded
        icon
        secondary
        aria-label="Open settings"
        @click="handleSettings"
      >
        <v-icon name="settings" />
      </v-button>
    </template>

    <template #navigation>
      <v-list nav aria-label="Module navigation">
        <v-list-item
          v-for="tab in tabs"
          :key="tab.value"
          :active="activeTab === tab.value"
          :to="`/usage-analytics/${tab.value}`"
          :aria-label="`Navigate to ${tab.text}`"
          :aria-current="activeTab === tab.value ? 'page' : undefined"
        >
          <v-list-item-icon>
            <v-icon :name="tab.icon" />
          </v-list-item-icon>
          <v-list-item-content>
            <v-text-overflow :text="tab.text" />
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </template>

    <div class="dashboard-content">
      <!-- Debug Info -->
      <div v-if="!activeTab" class="debug-info">
        <v-notice type="warning">
          <p><strong>Debug:</strong> activeTab is not set. Tabs: {{ tabs.length }}</p>
        </v-notice>
      </div>

      <!-- Collection Storage Tab (User Story 1) -->
      <div v-if="activeTab === 'storage'" class="tab-content">
        <CollectionView />
      </div>

      <!-- Activity Tab (User Story 2) -->
      <div v-else-if="activeTab === 'activity'" class="tab-content">
        <ActivityView />
      </div>

      <!-- Settings Tab -->
      <div v-else-if="activeTab === 'settings'" class="tab-content">
        <div class="settings-content">
          <h3 class="section-title">Analytics Settings</h3>

          <div class="settings-section">
            <h4 class="subsection-title">About</h4>
            <p class="subsection-description">
              <strong>Version:</strong> 1.0.0<br />
              <strong>Extension Type:</strong> Bundle (Module + Endpoint)<br />
              <strong>Status:</strong> ✅ Module successfully loaded!<br />
              <strong>Active Tab:</strong> {{ activeTab }}
            </p>
          </div>

          <div class="settings-section">
            <h4 class="subsection-title">Manual Tab Navigation</h4>
            <div class="tab-buttons">
              <v-button @click="activeTab = 'storage'">Go to Storage</v-button>
              <v-button @click="activeTab = 'activity'">Go to Activity</v-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </private-view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { useRouter, useRoute } from 'vue-router';
import CollectionView from './CollectionView.vue';
import ActivityView from './ActivityView.vue';

// ============================================================================
// Composables
// ============================================================================

const api = useApi();
const router = useRouter();
const route = useRoute();

// ============================================================================
// State & Computed
// ============================================================================

/**
 * Active tab computed from current route path
 * Maps route paths to tab values:
 * /usage-analytics/storage -> 'storage'
 * /usage-analytics/activity -> 'activity'
 * /usage-analytics/settings -> 'settings'
 */
const activeTab = computed({
  get() {
    const path = route.path;
    if (path.includes('/activity')) return 'activity';
    if (path.includes('/settings')) return 'settings';
    return 'storage'; // default
  },
  set(newTab: string) {
    // Navigate to the corresponding route when tab changes
    router.push(`/usage-analytics/${newTab}`);
  },
});

// ============================================================================
// Computed
// ============================================================================

const breadcrumb = computed(() => [
  {
    name: 'Usage Analytics',
    to: '/usage-analytics',
  },
]);

// Tab configuration for v-tabs component
const tabs = ref([
  {
    text: 'Collection Storage',
    value: 'storage',
    icon: 'folder',
  },
  {
    text: 'API Activity',
    value: 'activity',
    icon: 'bolt',
  },
  {
    text: 'Settings',
    value: 'settings',
    icon: 'settings',
  },
]);

// ============================================================================
// Methods
// ============================================================================

/**
 * Navigate to settings tab
 */
function handleSettings(): void {
  console.log('[AnalyticsDashboard] Navigating to settings tab');
  router.push('/usage-analytics/settings');
}

// ============================================================================
// Lifecycle & Watchers
// ============================================================================

onMounted(() => {
  console.log('[AnalyticsDashboard] Component mounted');
  console.log('[AnalyticsDashboard] Current route:', route.path);
  console.log('[AnalyticsDashboard] Active tab:', activeTab.value);
  console.log('[AnalyticsDashboard] Tabs:', tabs.value);
});

watch(() => route.path, (newPath) => {
  console.log('[AnalyticsDashboard] Route changed to:', newPath);
  console.log('[AnalyticsDashboard] Active tab now:', activeTab.value);
});
</script>

<style scoped>
.dashboard-content {
  padding: var(--content-padding);
}

.tab-content {
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Placeholder Content */
.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 64px;
  text-align: center;
}

.placeholder-icon {
  font-size: 80px;
  color: var(--primary);
  margin-bottom: 24px;
}

.placeholder-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--foreground);
  margin: 0 0 12px 0;
}

.placeholder-description {
  font-size: 16px;
  color: var(--foreground-subdued);
  margin: 0;
  max-width: 600px;
}

/* Settings Content */
.settings-content {
  max-width: 800px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--foreground);
  margin: 0 0 24px 0;
}

.settings-section {
  padding: 24px;
  background-color: var(--background-normal);
  border: 1px solid var(--border-normal);
  border-radius: 8px;
  margin-bottom: 16px;
}

.subsection-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--foreground);
  margin: 0 0 8px 0;
}

.subsection-description {
  font-size: 14px;
  color: var(--foreground-subdued);
  margin: 0 0 16px 0;
  line-height: 1.6;
}

.subsection-description a {
  color: var(--primary);
  text-decoration: none;
}

.subsection-description a:hover {
  text-decoration: underline;
}

/* Header Icon */
.header-icon {
  --v-button-width: 60px;
  --v-button-height: 60px;
  --v-button-border-radius: 50%;
  --v-button-background-color: var(--primary-10);
  --v-button-color: var(--primary);
  --v-button-background-color-hover: var(--primary-25);
  --v-button-color-hover: var(--primary);
}

/* Debug Info */
.debug-info {
  margin-bottom: 24px;
}

/* Tab Buttons */
.tab-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
