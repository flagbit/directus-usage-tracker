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
        v-tooltip.bottom="'Clear Cache'"
        rounded
        icon
        secondary
        @click="handleClearCache"
      >
        <v-icon name="delete_sweep" />
      </v-button>

      <v-button
        v-tooltip.bottom="'Settings'"
        rounded
        icon
        secondary
        @click="handleSettings"
      >
        <v-icon name="settings" />
      </v-button>
    </template>

    <template #navigation>
      <v-tabs v-model="activeTab" :items="tabs" />
    </template>

    <div class="dashboard-content">
      <!-- Collection Storage Tab (User Story 1) -->
      <div v-if="activeTab === 'storage'" class="tab-content">
        <CollectionView />
      </div>

      <!-- Activity Tab (User Story 2) - Placeholder -->
      <div v-else-if="activeTab === 'activity'" class="tab-content">
        <div class="placeholder-content">
          <v-icon name="bolt" class="placeholder-icon" />
          <h3 class="placeholder-title">API Activity Analysis</h3>
          <p class="placeholder-description">
            Coming in Phase 4 (User Story 2): Analyze API request patterns and activity logs
          </p>
        </div>
      </div>

      <!-- Settings Tab -->
      <div v-else-if="activeTab === 'settings'" class="tab-content">
        <div class="settings-content">
          <h3 class="section-title">Analytics Settings</h3>

          <div class="settings-section">
            <h4 class="subsection-title">Cache Settings</h4>
            <p class="subsection-description">
              Data is cached for 5 minutes to improve performance.
            </p>
            <v-button @click="handleClearCache">
              <v-icon name="delete_sweep" left />
              Clear All Cache
            </v-button>
          </div>

          <div class="settings-section">
            <h4 class="subsection-title">About</h4>
            <p class="subsection-description">
              <strong>Version:</strong> 1.0.0<br />
              <strong>Extension Type:</strong> Bundle (Module + Endpoint)<br />
              <strong>Repository:</strong>
              <a
                href="https://github.com/directus-community/directus-extension-usage-analytics"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </private-view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import CollectionView from './CollectionView.vue';

// ============================================================================
// Composables
// ============================================================================

const api = useApi();

// ============================================================================
// State
// ============================================================================

const activeTab = ref<string>('storage');

// ============================================================================
// Computed
// ============================================================================

const breadcrumb = computed(() => [
  {
    name: 'Usage Analytics',
    to: '/usage-analytics',
  },
]);

const tabs = computed(() => [
  {
    text: 'Collection Storage',
    value: 'storage',
    icon: 'folder',
  },
  {
    text: 'API Activity',
    value: 'activity',
    icon: 'bolt',
    disabled: true, // Phase 4
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
 * Clear all analytics cache
 */
async function handleClearCache(): Promise<void> {
  try {
    await api.delete('/usage-analytics-api/cache');

    // Show success notification
    console.log('[Analytics] Cache cleared successfully');

    // Reload current view
    window.location.reload();
  } catch (error) {
    console.error('[Analytics] Failed to clear cache:', error);
  }
}

/**
 * Navigate to settings tab
 */
function handleSettings(): void {
  activeTab.value = 'settings';
}
</script>

<style scoped>
.dashboard-content {
  padding: var(--content-padding);
  padding-top: var(--content-padding-bottom);
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
</style>
