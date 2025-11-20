<template>
  <div class="top-ten-toggle">
    <v-checkbox
      :model-value="modelValue"
      :label="label"
      :disabled="disabled"
      @update:model-value="handleToggle"
    />

    <div v-if="showCount && modelValue" class="count-info">
      <v-icon name="info" small />
      <span class="count-text">Showing top {{ limit }} of {{ totalCount }} collections</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// ============================================================================
// Props & Emits
// ============================================================================

export interface TopTenToggleProps {
  modelValue: boolean;
  limit?: number;
  totalCount?: number;
  label?: string;
  disabled?: boolean;
  showCount?: boolean;
}

const props = withDefaults(defineProps<TopTenToggleProps>(), {
  limit: 10,
  totalCount: 0,
  label: 'Show Top 10 Only',
  disabled: false,
  showCount: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  change: [value: boolean];
}>();

// ============================================================================
// Methods
// ============================================================================

/**
 * Handle toggle change
 */
function handleToggle(value: boolean): void {
  emit('update:modelValue', value);
  emit('change', value);
}
</script>

<style scoped>
.top-ten-toggle {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.count-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 32px;
  font-size: 13px;
  color: var(--foreground-subdued);
}

.count-text {
  margin: 0;
}
</style>
