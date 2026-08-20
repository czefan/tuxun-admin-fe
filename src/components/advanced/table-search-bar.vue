<script setup lang="ts">
import { NButton, NCard } from 'naive-ui';

const {
  title = '',
  description = '',
  showActionButtons = true
} = defineProps<{
  title?: string;
  description?: string;
  loading?: boolean;
  /** 是否展示右侧「查询 / 重置」按钮组，默认展示 */
  showActionButtons?: boolean;
}>();

const emit = defineEmits<{
  (e: 'search'): void;
  (e: 'reset'): void;
}>();
</script>

<template>
  <NCard :bordered="false" class="card-wrapper">
    <!-- 头部区域：左侧标题说明，右侧操作按钮插槽 -->
    <div
      v-if="title || description || $slots.extra"
      class="flex flex-wrap items-start justify-between gap-12px mb-16px"
    >
      <div v-if="title || description">
        <h2 v-if="title" class="m-0 text-20px font-semibold">{{ title }}</h2>
        <p v-if="description" class="mb-0 mt-6px text-13px text-#777">{{ description }}</p>
      </div>
      <div v-if="$slots.extra">
        <slot name="extra"></slot>
      </div>
    </div>

    <!-- 条件控制区 -->
    <div class="flex flex-col gap-12px">
      <!-- 1. 双行模式：上一行筛选条件，下一行搜索框 + 按钮 -->
      <template v-if="$slots.filters">
        <div class="flex flex-wrap items-center gap-12px">
          <slot name="filters"></slot>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-12px w-full">
          <div class="search-input-slot flex-1 min-w-200px">
            <slot></slot>
          </div>
          <div v-if="showActionButtons" class="flex items-center gap-12px flex-shrink-0 ml-auto">
            <NButton type="primary" secondary :disabled="loading" @click="emit('search')">查询</NButton>
            <NButton @click="emit('reset')">重置</NButton>
          </div>
        </div>
      </template>

      <!-- 2. 单行模式：控件 + 查询重置按钮 -->
      <template v-else>
        <div class="flex flex-wrap items-center justify-between gap-12px w-full">
          <div class="search-input-slot flex-1 min-w-200px flex flex-wrap items-center gap-12px">
            <slot></slot>
          </div>
          <div v-if="showActionButtons" class="flex items-center gap-12px flex-shrink-0 ml-auto">
            <NButton type="primary" secondary :disabled="loading" @click="emit('search')">查询</NButton>
            <NButton @click="emit('reset')">重置</NButton>
          </div>
        </div>
      </template>
    </div>
  </NCard>
</template>

<style scoped>
.search-input-slot :deep(.n-input) {
  width: 100% !important;
}
</style>
