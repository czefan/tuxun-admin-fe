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
const isCompressing = defineModel<boolean>('processing', { default: false });
let uploadSequence = 0;
let alive = true;

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
  alive = false;
  uploadSequence += 1;
  isCompressing.value = false;
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
  if (!rawFile || isCompressing.value) return false;
  const sequence = ++uploadSequence;
  isCompressing.value = true;
  try {
    const allowedTypes = props.accept.split(',').map(item => item.trim());
    if (!allowedTypes.includes(rawFile.type)) throw new Error('图片仅支持 jpg/png 格式');
    if (rawFile.size > props.maxSizeMb * 1024 * 1024) {
      throw new Error(`图片大小不能超过 ${props.maxSizeMb}MB，请手动压缩后上传`);
    }
    const { width, height } = await getImageDimensions(rawFile);
    if (width <= 0 || height <= 0) throw new Error('无法读取图片尺寸，请重新选择图片');
    const ratio = width / height;
    if (ratio < props.minAspectRatio || ratio > props.maxAspectRatio) {
      throw new Error(`图片宽高比应在 ${props.minAspectRatio} 到 ${props.maxAspectRatio} 之间`);
    }
    const file = await compressImageToTarget(rawFile, props.targetSizeMb * 1024 * 1024);
    if (!alive || sequence !== uploadSequence) return false;
    data.file.file = file;
    isRemovedExistImage.value = false;
    return true;
  } catch (error) {
    if (alive && sequence === uploadSequence) {
      message.error(error instanceof Error ? error.message : '图片处理失败，请重新选择');
    }
    return false;
  } finally {
    if (alive && sequence === uploadSequence) isCompressing.value = false;
  }
}

function handleRemoveImage(e: Event) {
  e.stopPropagation();
  uploadSequence += 1;
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
