<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { NImage, NSpin, NUpload, NUploadDragger, useMessage } from 'naive-ui';
import type { UploadFileInfo } from 'naive-ui';
import { compressImageToTarget, getImageDimensions } from '@/utils/image-compress';

const props = withDefaults(
  defineProps<{
    imageUrl?: string | null;
    max?: number;
    accept?: string;
    /** 拦截硬上限（MB），超过直接拒绝上传，默认 20MB */
    maxSizeMb?: number;
    /** 触发智能压缩的目标大小（MB），默认 2MB */
    targetSizeMb?: number;
    /** 最小宽高比（宽/高），默认 0.33 (即 1:3)，低于此比例判定为过于修长 */
    minAspectRatio?: number;
    /** 最大宽高比（宽/高），默认 3.0 (即 3:1)，高于此比例判定为过于扁平 */
    maxAspectRatio?: number;
    width?: number | string;
    height?: number | string;
    tip?: string;
  }>(),
  {
    imageUrl: null,
    max: 1,
    accept: 'image/jpeg,image/png',
    maxSizeMb: 20,
    targetSizeMb: 2,
    minAspectRatio: 0.33,
    maxAspectRatio: 3.0,
    width: 220,
    height: 140,
    tip: '点击或拖拽上传 jpg/png，超过 2MB 自动压缩'
  }
);

const emit = defineEmits<{
  (e: 'remove'): void;
}>();

const fileListModel = defineModel<UploadFileInfo[]>('fileList', { required: true });
const message = useMessage();
const isRemovedExistImage = ref(false);
const isCompressing = ref(false);

watch(
  () => props.imageUrl,
  () => {
    isRemovedExistImage.value = false;
  }
);

const objectUrl = ref<string | null>(null);

watch(
  fileListModel,
  files => {
    if (objectUrl.value) {
      URL.revokeObjectURL(objectUrl.value);
      objectUrl.value = null;
    }
    if (files && files.length > 0 && files[0].file) {
      objectUrl.value = URL.createObjectURL(files[0].file);
    }
  },
  { deep: true, immediate: true }
);

onUnmounted(() => {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = null;
  }
});

const displayUrl = computed(() => {
  if (objectUrl.value) return objectUrl.value;
  if (!isRemovedExistImage.value && props.imageUrl) return props.imageUrl;
  return null;
});

async function handleBeforeUpload(data: { file: UploadFileInfo }) {
  const rawFile = data.file.file;
  if (!rawFile) return true;

  // 1. 格式校验
  const allowedTypes = props.accept.split(',').map(item => item.trim());
  if (allowedTypes.length > 0 && !allowedTypes.includes(rawFile.type)) {
    message.error('图片仅支持 jpg/png 格式');
    return false;
  }

  // 2. 超大文件硬上限拦截（避免前端大图解码造成 OOM 卡死）
  if (rawFile.size > props.maxSizeMb * 1024 * 1024) {
    message.error(`图片大小不能超过 ${props.maxSizeMb}MB，请手动压缩后上传`);
    return false;
  }

  // 3. 尺寸比例校验（过滤过于修长或过于扁平的畸形图片）
  try {
    const { width, height } = await getImageDimensions(rawFile);
    if (width > 0 && height > 0) {
      const ratio = width / height;
      if (ratio < props.minAspectRatio) {
        message.error('图片比例过于修长（宽高比不能低于 1:3），请调整后上传');
        return false;
      }
      if (ratio > props.maxAspectRatio) {
        message.error('图片比例过于扁平（宽高比不能高于 3:1），请调整后上传');
        return false;
      }
    }
  } catch (err) {
    console.warn('获取图片尺寸失败，跳过比例校验:', err);
  }

  // 4. 智能逼近压缩（在不超过 targetSizeMb 限制下获得最高画质与分辨率）
  const targetBytes = props.targetSizeMb * 1024 * 1024;
  if (rawFile.size > targetBytes) {
    isCompressing.value = true;
    try {
      const compressedFile = await compressImageToTarget(rawFile, targetBytes);
      data.file.file = compressedFile;
    } finally {
      isCompressing.value = false;
    }
  }

  isRemovedExistImage.value = false;
  return true;
}

function handleRemoveImage(e: Event) {
  e.stopPropagation();
  fileListModel.value = [];
  isRemovedExistImage.value = true;
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = null;
  }
  emit('remove');
}

const numWidth = computed(() => (typeof props.width === 'number' ? `${props.width}px` : props.width));
const numHeight = computed(() => (typeof props.height === 'number' ? `${props.height}px` : props.height));
</script>

<template>
  <div class="inline-block relative">
    <div
      v-if="displayUrl"
      class="relative group rounded-8px border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm flex items-center justify-center bg-gray-50 dark:bg-gray-800"
      :style="{ width: numWidth, height: numHeight }"
    >
      <NImage
        :src="displayUrl"
        :width="numWidth"
        :height="numHeight"
        object-fit="cover"
        class="w-full h-full block cursor-pointer"
      />
      <button
        type="button"
        title="移除图片"
        class="absolute top-6px right-6px z-20 w-22px h-22px rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md border-0 outline-none"
        @click="handleRemoveImage"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-14px h-14px"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <NUpload
      v-else
      v-model:file-list="fileListModel"
      :default-upload="false"
      :max="max"
      :accept="accept"
      :show-file-list="false"
      :disabled="isCompressing"
      @before-upload="handleBeforeUpload"
    >
      <NUploadDragger
        :style="{ width: numWidth, height: numHeight }"
        class="relative flex items-center justify-center p-12px"
      >
        <NSpin v-if="isCompressing" size="medium" description="正在压缩图片..." />
        <div v-else class="text-12px text-#666 text-center leading-relaxed">
          <div class="text-18px mb-4px text-gray-400">📷</div>
          {{ tip }}
        </div>
      </NUploadDragger>
    </NUpload>
  </div>
</template>
