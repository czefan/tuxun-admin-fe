<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NImage, NUpload, NUploadDragger, useMessage } from 'naive-ui';
import type { UploadFileInfo } from 'naive-ui';

const props = withDefaults(
  defineProps<{
    imageUrl?: string | null;
    max?: number;
    accept?: string;
    maxSizeMb?: number;
    width?: number | string;
    height?: number | string;
    tip?: string;
  }>(),
  {
    imageUrl: null,
    max: 1,
    accept: 'image/jpeg,image/png',
    maxSizeMb: 20,
    width: 220,
    height: 140,
    tip: '点击或拖拽上传 jpg/png，最大 20MB'
  }
);

const emit = defineEmits<{
  (e: 'remove'): void;
}>();

const fileListModel = defineModel<UploadFileInfo[]>('fileList', { required: true });
const message = useMessage();
const isRemovedExistImage = ref(false);

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

const displayUrl = computed(() => {
  if (objectUrl.value) return objectUrl.value;
  if (!isRemovedExistImage.value && props.imageUrl) return props.imageUrl;
  return null;
});

function handleBeforeUpload(data: { file: UploadFileInfo }) {
  const file = data.file.file;
  if (!file) return true;

  // accept 只是文件选择器的过滤条件，拖拽进来的文件绕得过去，必须在这里兜住
  const allowedTypes = props.accept.split(',').map(item => item.trim());
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    message.error('图片仅支持 jpg/png 格式');
    return false;
  }
  if (file.size > props.maxSizeMb * 1024 * 1024) {
    message.error(`图片大小不能超过 ${props.maxSizeMb}MB`);
    return false;
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
      @before-upload="handleBeforeUpload"
    >
      <NUploadDragger :style="{ width: numWidth, height: numHeight }" class="flex items-center justify-center p-12px">
        <div class="text-12px text-#666 text-center leading-relaxed">
          <div class="text-18px mb-4px text-gray-400">📷</div>
          {{ tip }}
        </div>
      </NUploadDragger>
    </NUpload>
  </div>
</template>
