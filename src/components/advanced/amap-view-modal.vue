<script setup lang="ts">
import { computed, ref } from 'vue';
import { NButton, NImage, NModal } from 'naive-ui';
import AmapPicker from './amap-picker.vue';

/**
 * 「地图/图片查看」通用对比与弹窗组件。
 */
defineOptions({ name: 'AmapViewModal' });

const {
  longitude = null,
  latitude = null,
  markerName = '标记位置',
  title = '位置',
  text = '地图查看',
  imageUrl = '',
  inline = false,
  height = 260
} = defineProps<{
  longitude?: number | null;
  latitude?: number | null;
  /** 地图标记名称 */
  markerName?: string;
  /** 弹窗标题 */
  title?: string;
  /** 按钮文案 */
  text?: string;
  /** 图片 URL */
  imageUrl?: string;
  /** 是否内联直接渲染 */
  inline?: boolean;
  /** 容器高度 */
  height?: number;
}>();

const show = ref(false);
const hasCoords = computed(() => longitude != null && latitude != null);
/** 由 AmapPicker 逆地理编码回填的地址 */
const address = ref('');
function formatCoord(val: number | null | undefined): string {
  if (val == null || Number.isNaN(Number(val))) return '-';
  return Number(val).toFixed(6);
}
</script>

<template>
  <!-- 1. 内联对比模式 -->
  <div v-if="inline" :class="imageUrl ? 'grid grid-cols-1 md:grid-cols-2 gap-4 items-start' : ''">
    <div
      v-if="imageUrl"
      class="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-2 overflow-hidden"
      :style="{ height: `${height}px` }"
    >
      <NImage :src="imageUrl" class="max-h-full max-w-full object-contain rounded-md" />
    </div>

    <div class="flex flex-col">
      <div
        class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
        :style="{ height: imageUrl ? `${height - 25}px` : `${height}px` }"
      >
        <AmapPicker
          v-model:address="address"
          readonly
          :longitude="longitude"
          :latitude="latitude"
          :marker-name="markerName"
          :height="imageUrl ? height - 25 : height"
        />
      </div>
      <div class="mt-1.5 text-12px text-gray-400 dark:text-gray-500 text-center">
        <span v-if="hasCoords">
          <template v-if="address">{{ address }}　·　</template>
          经 {{ formatCoord(longitude) }}, 纬 {{ formatCoord(latitude) }}
        </span>
        <span v-else>无坐标信息</span>
      </div>
    </div>
  </div>

  <!-- 2. 独立按钮 + 弹窗模式：复用内联模式 -->
  <template v-else>
    <NButton v-if="hasCoords" size="small" type="primary" secondary @click="show = true">{{ text }} 📍</NButton>
    <span v-else class="text-13px text-gray-400">无坐标信息</span>

    <NModal
      v-model:show="show"
      preset="card"
      :title="title"
      :class="imageUrl ? 'w-840px max-w-92vw' : 'w-720px max-w-92vw'"
    >
      <AmapViewModal
        inline
        :image-url="imageUrl"
        :longitude="longitude"
        :latitude="latitude"
        :marker-name="markerName"
        :height="imageUrl ? 260 : 440"
      />
    </NModal>
  </template>
</template>
