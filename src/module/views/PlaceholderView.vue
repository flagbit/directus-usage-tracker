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
      <v-button v-tooltip.bottom="'Refresh Data'" rounded icon @click="handleRefresh">
        <v-icon name="refresh" />
      </v-button>
    </template>

    <div class="placeholder-container">
      <div class="placeholder-content">
        <v-icon name="analytics" class="placeholder-icon" />
        <h2 class="placeholder-title">Usage Analytics Module</h2>
        <p class="placeholder-description">
          This module is currently in development. Views will be implemented in the following
          phases:
        </p>

        <div class="phase-list">
          <div class="phase-item">
            <v-icon name="folder" class="phase-icon" />
            <div class="phase-details">
              <h3>Phase 3: Collection Storage (MVP)</h3>
              <p>View row counts and storage usage for all collections</p>
            </div>
          </div>

          <div class="phase-item">
            <v-icon name="bolt" class="phase-icon" />
            <div class="phase-details">
              <h3>Phase 4: API Activity Analysis</h3>
              <p>Analyze API request patterns and activity logs</p>
            </div>
          </div>

          <div class="phase-item">
            <v-icon name="language" class="phase-icon" />
            <div class="phase-details">
              <h3>Phase 5: IP-Based Traffic Analysis</h3>
              <p>Filter and analyze traffic by IP address</p>
            </div>
          </div>
        </div>

        <div class="status-card">
          <v-icon name="check_circle" class="status-icon success" />
          <div class="status-details">
            <h4>Infrastructure Status</h4>
            <p><strong>Phase 1:</strong> Setup complete ✓</p>
            <p><strong>Phase 2:</strong> Foundational infrastructure complete ✓</p>
            <p><strong>API Endpoint:</strong> {{ apiStatus }}</p>
          </div>
        </div>
      </div>
    </div>
  </private-view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useApi } from '@directus/extensions-sdk';

// ============================================================================
// Composables
// ============================================================================

const api = useApi();

// ============================================================================
// State
// ============================================================================

const apiStatus = ref<string>('Checking...');

// ============================================================================
// Computed
// ============================================================================

const breadcrumb = computed(() => [
  {
    name: 'Usage Analytics',
    to: '/usage-analytics',
  },
]);

// ============================================================================
// Methods
// ============================================================================

/**
 * Check API endpoint health
 */
async function checkApiHealth(): Promise<void> {
  try {
    const response = await api.get('/usage-analytics-api/health');
    if (response.status === 'ok') {
      apiStatus.value = 'Healthy ✓';
    } else {
      apiStatus.value = 'Unknown';
    }
  } catch (error) {
    apiStatus.value = 'Not responding';
    console.error('API health check failed:', error);
  }
}

/**
 * Handle refresh button click
 */
function handleRefresh(): void {
  checkApiHealth();
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  checkApiHealth();
});
</script>

<style scoped>
.placeholder-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 600px;
  padding: var(--content-padding);
}

.placeholder-content {
  max-width: 800px;
  text-align: center;
}

.placeholder-icon {
  font-size: 80px;
  color: var(--primary);
  margin-bottom: 24px;
}

.placeholder-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 16px;
}

.placeholder-description {
  font-size: 16px;
  color: var(--foreground-subdued);
  margin-bottom: 32px;
  line-height: 1.6;
}

.phase-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
  text-align: left;
}

.phase-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background-color: var(--background-subdued);
  border-radius: 8px;
  border: 1px solid var(--border-normal);
}

.phase-icon {
  font-size: 32px;
  color: var(--primary);
  flex-shrink: 0;
}

.phase-details h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 4px;
}

.phase-details p {
  font-size: 14px;
  color: var(--foreground-subdued);
  margin: 0;
}

.status-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  background-color: var(--background-normal);
  border-radius: 8px;
  border: 2px solid var(--primary);
  text-align: left;
}

.status-icon {
  font-size: 40px;
  flex-shrink: 0;
}

.status-icon.success {
  color: var(--success);
}

.status-details h4 {
  font-size: 18px;
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 12px;
}

.status-details p {
  font-size: 14px;
  color: var(--foreground-subdued);
  margin: 4px 0;
}

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
