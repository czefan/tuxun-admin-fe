<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toImageVM } from '@/service/contract/types';
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NImage,
  NInput,
  NRadioButton,
  NRadioGroup,
  NSelect,
  NSpace,
  NSpin,
  useMessage
} from 'naive-ui';
import type { UploadFileInfo } from 'naive-ui';
import ImageDragUploader from '@/components/advanced/image-drag-uploader.vue';
import RichTextEditor from '@/components/advanced/rich-text-editor.vue';
import { fetchAdminActivityList, fetchAllPages } from '@/service/api';
import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAdminAnnouncementDetail,
  updateAnnouncement
} from '@/service/api/notice';
import { useTabStore } from '@/store/modules/tab';
import { confirmAction, confirmDelete } from '@/utils/confirm';
import { RICH_TEXT_MAX_TEXT, htmlTextLength, sanitizeHtml, validateRichText } from '@/utils/sanitize';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const tabStore = useTabStore();

const routeId = computed(() => String(route.params.id || 'create'));
const isEdit = computed(() => routeId.value !== '0' && routeId.value !== 'new' && routeId.value !== 'create');

const noticeId = computed(() => (isEdit.value ? Number(routeId.value) : 0));
const tabTitle = computed(() => (isEdit.value ? `编辑通知 #${noticeId.value}` : '新建通知'));

watch(
  tabTitle,
  title => {
    tabStore.setTabLabel(title);
  },
  { immediate: true }
);

const loading = ref(false);
const submitting = ref(false);
const showPreview = ref(true);
const imagePosition = ref<'top' | 'bottom'>('top');

const model = ref({
  title: '',
  content: '',
  image_file: undefined as File | undefined,
  image_src: '' as string | undefined,
  related_id: undefined as number | undefined,
  remove_image: false
});

/** 空正文时展示的占位文案是可信字面量，不需要过滤 */
const CONTENT_PLACEHOLDER =
  '<span class="text-gray-400 italic">通知正文将在这里实时预览，适合检查段落排版、文字长度和弹窗阅读体验。</span>';

const contentLength = computed(() => htmlTextLength(model.value.content));
const contentLimitError = computed(() => validateRichText(model.value.content));

const previewContentHtml = computed(() =>
  model.value.content ? sanitizeHtml(model.value.content) : CONTENT_PLACEHOLDER
);

const activityOptions = ref<{ label: string; value: number }[]>([]);
/** 活动原始数据（id + 标题），用于预览里把 related_id 显示成 #活动名 */
const rawActivities = ref<{ id: number; title: string }[]>([]);
const imageFiles = ref<UploadFileInfo[]>([]);
const localImageBlobUrl = ref('');

watch(
  imageFiles,
  files => {
    if (files.length > 0 && files[0].file) {
      const file = files[0].file;
      model.value.image_file = file;
      model.value.remove_image = false;
      if (localImageBlobUrl.value) {
        URL.revokeObjectURL(localImageBlobUrl.value);
      }
      localImageBlobUrl.value = URL.createObjectURL(file);
    } else if (files.length === 0) {
      model.value.image_file = undefined;
      model.value.remove_image = true;
      if (localImageBlobUrl.value) {
        URL.revokeObjectURL(localImageBlobUrl.value);
        localImageBlobUrl.value = '';
      }
    }
  },
  { deep: true }
);

const previewImageSrc = computed(() => {
  if (model.value.image_file && localImageBlobUrl.value) {
    return localImageBlobUrl.value;
  }
  if (model.value.image_src && !model.value.remove_image) {
    return model.value.image_src;
  }
  return '';
});

/** 预览里关联活动的展示文本：#活动名；未关联时为空（隐藏该行） */
const relatedActivityText = computed(() => {
  const id = model.value.related_id;
  if (!id) return '';
  const activity = rawActivities.value.find(item => item.id === id);
  return activity ? `#${activity.title}` : `#${id}`;
});

async function loadActivities() {
  try {
    // 通知可关联任意活动（含未开始），用管理端接口
    const { list } = await fetchAllPages(params => fetchAdminActivityList(params));
    rawActivities.value = list.map(item => ({ id: item.id, title: item.title }));
    activityOptions.value = list.map(item => ({
      label: `[#${item.id}] ${item.title}`,
      value: item.id
    }));
  } catch {
    console.error('获取活动列表失败');
  }
}

async function loadDetail() {
  if (!isEdit.value || !noticeId.value) return;
  loading.value = true;
  try {
    const res = await fetchAdminAnnouncementDetail(noticeId.value);
    if (res.data) {
      const d = res.data;
      model.value = {
        title: d.title,
        content: d.content,
        image_file: undefined,
        image_src: d.image ? toImageVM(d.image, 'origin').url : undefined,
        related_id: d.related_id ?? undefined,
        remove_image: false
      };
    }
  } catch {
    message.error('获取通知详情失败');
  } finally {
    loading.value = false;
  }
}

function backToList() {
  router.push('/operation/notice');
}

function handleSave() {
  if (!model.value.title.trim()) {
    message.warning('请输入通知标题');
    return;
  }
  if (model.value.title.trim().length > 20) {
    message.warning('通知标题不能超过 20 个字');
    return;
  }
  if (!model.value.content.trim()) {
    message.warning('请输入通知正文内容');
    return;
  }
  if (contentLimitError.value) {
    message.error(contentLimitError.value);
    return;
  }

  confirmAction({
    title: isEdit.value ? '确认更新通知' : '确认发布通知',
    content: isEdit.value
      ? `确认更新通知「${model.value.title.trim()}」？`
      : `确认发布通知「${model.value.title.trim()}」？`,
    positiveText: isEdit.value ? '保存修改' : '确认发布',
    onConfirm: doSave
  });
}

async function doSave() {
  if (submitting.value) return false;

  submitting.value = true;
  try {
    const payload = {
      title: model.value.title.trim(),
      content: model.value.content.trim(),
      image_file: model.value.image_file,
      related_type: model.value.related_id ? ('activity' as const) : undefined,
      related_id: model.value.related_id,
      remove_image: model.value.remove_image,
      remove_relation: !model.value.related_id
    };

    if (!isEdit.value) {
      const res = await createAnnouncement(payload);
      if (res.data) {
        message.success('发布通知成功');
        backToList();
        return true;
      }
      if (res.error) {
        message.error(res.error.message || '发布通知失败');
        return false;
      }
      return false;
    }

    const res = await updateAnnouncement(noticeId.value, payload);
    if (res.data) {
      message.success('更新通知成功');
      backToList();
      return true;
    }
    if (res.error) {
      message.error(res.error.message || '更新通知失败');
      return false;
    }
    return false;
  } catch {
    message.error('保存失败');
    return false;
  } finally {
    submitting.value = false;
  }
}

function confirmRemove() {
  if (!isEdit.value || !noticeId.value) return;
  confirmDelete(`通知 #${noticeId.value}`, handleDelete);
}

async function handleDelete() {
  if (!isEdit.value || !noticeId.value) return;
  try {
    const res = await deleteAnnouncement(noticeId.value);
    if (res.data) {
      message.success('删除成功');
      backToList();
    }
  } catch {
    message.error('删除失败');
  }
}

onMounted(() => {
  loadActivities();
  loadDetail();
});
</script>

<template>
  <NSpace vertical :size="16" class="p-4">
    <!-- 头部卡片 -->
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <h2 class="m-0 text-20px font-semibold">{{ isEdit ? '编辑通知' : '新建通知' }}</h2>
          <p class="mb-0 mt-4px text-13px text-#777">
            通知标题限 20 字，正文限 2000 字（按纯文本计，富文本标签不计入）。
          </p>
        </div>

        <NSpace align="center">
          <NButton @click="backToList">返回列表</NButton>
          <NButton v-if="isEdit" type="error" secondary @click="confirmRemove">删除通知</NButton>
          <NButton type="primary" :loading="submitting" @click="handleSave">保存并发布</NButton>
        </NSpace>
      </div>
    </NCard>

    <!-- 主体左右分栏 (支持右侧折叠) -->
    <NSpin :show="loading">
      <div
        class="transition-all duration-300"
        :class="
          showPreview ? 'grid grid-cols-1 gap-16px lg:grid-cols-[minmax(0,1fr)_360px]' : 'grid grid-cols-1 gap-16px'
        "
      >
        <!-- 左侧编辑表单 -->
        <NCard :title="isEdit ? '编辑通知内容' : '新建通知内容'" :bordered="false" class="card-wrapper">
          <template v-if="!showPreview" #header-extra>
            <ButtonIcon icon="mdi:eye-off-outline" tooltip-content="展开预览" @click="showPreview = true" />
          </template>
          <NForm label-placement="top">
            <!-- 规则设置行 -->
            <NFormItem label="关联活动 (可选)">
              <NSelect
                v-model:value="model.related_id"
                clearable
                filterable
                :options="activityOptions"
                placeholder="不关联活动 (可打字搜索)"
              />
            </NFormItem>

            <!-- 内容发布区：标题与内容紧密归类在一起 -->
            <NFormItem label="通知标题" required>
              <NInput v-model:value="model.title" maxlength="20" show-count placeholder="请输入通知标题 (最多 20 字)" />
            </NFormItem>

            <NFormItem required>
              <template #label>
                <div class="flex items-center gap-2">
                  <span>通知完整正文</span>
                  <span class="text-12px" :class="contentLimitError ? 'text-red-500 font-semibold' : 'text-#888'">
                    ({{ contentLength }}/{{ RICH_TEXT_MAX_TEXT }} 字，按纯文本计)
                    <span v-if="contentLimitError" class="ml-1 text-red-500">(超出限制，禁止保存)</span>
                  </span>
                </div>
              </template>
              <RichTextEditor
                v-model:value="model.content"
                placeholder="请输入通知详细正文内容 (最多 2000 字)..."
                :height="300"
              />
            </NFormItem>

            <NFormItem label="正文配图 (选填)">
              <NSpace vertical class="w-full" :size="12">
                <ImageDragUploader
                  v-model:file-list="imageFiles"
                  :image-url="model.image_src"
                  width="220"
                  height="130"
                />

                <div v-if="previewImageSrc" class="flex items-center gap-12px text-13px text-#666">
                  <span>位置:</span>
                  <NRadioGroup v-model:value="imagePosition" size="small">
                    <NRadioButton value="top">文字上方 (顶部)</NRadioButton>
                    <NRadioButton value="bottom">文字下方 (底部)</NRadioButton>
                  </NRadioGroup>
                </div>
              </NSpace>
            </NFormItem>
          </NForm>
        </NCard>

        <!-- 右侧客户端实时预览 (可折叠) -->
        <NCard v-if="showPreview" :bordered="false" class="card-wrapper">
          <template #header>
            <span class="text-16px font-semibold">预览</span>
          </template>
          <template #header-extra>
            <ButtonIcon icon="mdi:eye-outline" tooltip-content="折叠预览" @click="showPreview = false" />
          </template>

          <div class="rounded-8px border border-#e5e7eb border-solid p-16px bg-white dark:bg-#1e1e22 shadow-sm">
            <p class="m-0 text-17px font-semibold text-#111 dark:text-#eee">
              {{ model.title || '通知标题预览' }}
            </p>

            <!-- 关联活动：标题下方、靠左、展示 #活动名 -->
            <div v-if="relatedActivityText" class="mt-8px text-12px text-#666">
              <span>{{ relatedActivityText }}</span>
            </div>

            <!-- 配图在文字上方 -->
            <div v-if="imagePosition === 'top' && previewImageSrc" class="mt-12px">
              <NImage :src="previewImageSrc" object-fit="cover" class="w-full h-140px rounded-6px" />
            </div>

            <!-- eslint-disable vue/no-v-html -- 内容已过 sanitizeHtml 白名单过滤 -->
            <div
              class="mt-12px text-14px leading-relaxed text-#444 dark:text-#ccc preview-html-box"
              v-html="previewContentHtml"
            ></div>
            <!-- eslint-enable vue/no-v-html -->

            <!-- 配图在文字下方 -->
            <div v-if="imagePosition === 'bottom' && previewImageSrc" class="mt-12px">
              <NImage :src="previewImageSrc" object-fit="cover" class="w-full h-140px rounded-6px" />
            </div>
          </div>
        </NCard>
      </div>
    </NSpin>
  </NSpace>
</template>
