<script setup lang="ts">
import { computed } from 'vue';
import { NAlert, NButton, NCard, NDataTable, type DataTableColumns } from 'naive-ui';

const {
  errorTitle = '列表加载失败',
  errorMessage = '',
  size = 'medium',
  rowKey = undefined,
  pagination = undefined,
  remote = true
} = defineProps<{
  columns: DataTableColumns<any>;
  data: any[];
  loading?: boolean;
  loadError?: boolean;
  rowKey?: (row: any) => any;
  pagination?: any;
  errorTitle?: string;
  errorMessage?: string;
  size?: 'small' | 'medium' | 'large';
  remote?: boolean;
}>();

const emit = defineEmits<{
  (e: 'retry'): void;
}>();

const displayTitle = computed(() => {
  return errorMessage || errorTitle;
});

const isPermissionDenied = computed(() => {
  const t = displayTitle.value;
  return t.includes('权限') || t.includes('无权') || t.includes('403');
});
</script>

<template>
  <NAlert v-if="loadError" type="error" :title="displayTitle" class="mb-16px">
    <NButton v-if="!isPermissionDenied" text type="primary" @click="emit('retry')">点击重试</NButton>
  </NAlert>

  <NCard v-else :bordered="false" class="card-wrapper" content-style="padding: 16px 20px;">
    <NDataTable
      :columns="columns"
      :data="data"
      :loading="loading"
      :row-key="rowKey"
      :pagination="pagination"
      :size="size"
      :remote="remote"
      class="text-14px"
    />
  </NCard>
</template>
