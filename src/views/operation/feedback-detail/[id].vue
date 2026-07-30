<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { useRoute } from 'vue-router';
import {
  NAlert,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NImage,
  NImageGroup,
  NSpace,
  NSpin,
  NTag
} from 'naive-ui';

import type { FeedbackDetail } from '@/service/api';
import { fetchFeedbackDetail, updateFeedbackStatus } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import { formatDateTime } from '@/utils/tuxun';
import { renderUserInline } from '@/utils/table-columns';
import { confirmAction } from '@/utils/confirm';

const feedbackTypeTagMap: Record<number, { label: string; type: 'warning' | 'info' | 'error' | 'default' }> = {
  1: { label: '内容问题', type: 'warning' },
  2: { label: '玩法建议', type: 'info' },
  3: { label: '技术问题', type: 'error' },
  4: { label: '其他', type: 'default' }
};

const route = useRoute();

const { routerPushByKey } = useRouterPush();
const feedbackId = computed(() => Number(route.params.id));
const detail = ref<FeedbackDetail | null>(null);
const loading = ref(false);
const loadError = ref(false);
const submitting = ref(false);
let requestSequence = 0;
let alive = true;

async function loadDetail() {
  const sequence = ++requestSequence;
  detail.value = null;
  loadError.value = false;
  if (!Number.isInteger(feedbackId.value) || feedbackId.value <= 0) {
    loadError.value = true;
    loading.value = false;
    return;
  }

  loading.value = true;
  const response = await fetchFeedbackDetail(feedbackId.value);
  if (!alive || sequence !== requestSequence) return;

  if (response.error) {
    loadError.value = true;
  } else {
    detail.value = response.data;
  }
  loading.value = false;
}

function confirmResolve() {
  if (!detail.value || detail.value.status === 'resolved') return;
  const targetId = detail.value.id;
  confirmAction({
    title: '确认解决反馈',
    content: `确认将反馈 #${targetId} 标记为已解决？该操作会真实更新后端状态。`,
    positiveText: '标记为已解决',
    onConfirm: () => resolveFeedback(targetId)
  });
}

async function resolveFeedback(targetId: number) {
  if (!detail.value || detail.value.id !== targetId) return false;
  submitting.value = true;
  const response = await updateFeedbackStatus(targetId, 'resolved');
  submitting.value = false;
  if (!alive || !detail.value || detail.value.id !== targetId) return false;
  if (response.error) return false;

  const msg = response.response?.data?.message || '反馈已标记为解决';
  window.$message?.success(msg);
  await loadDetail();
  return true;
}

watch(feedbackId, loadDetail, { immediate: true });
onBeforeUnmount(() => {
  alive = false;
  requestSequence += 1;
});
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex items-center justify-between gap-12px">
        <div>
          <h2 class="m-0 text-20px font-semibold">反馈详情 #{{ route.params.id }}</h2>
          <p class="mb-0 mt-6px text-13px text-#777">标记为已解决后无法撤销。</p>
        </div>
        <NButton @click="routerPushByKey('operation_feedback')">返回列表</NButton>
      </div>
    </NCard>

    <NAlert v-if="loadError" type="error" title="反馈详情加载失败">
      <NButton text type="primary" @click="loadDetail">点击重试</NButton>
    </NAlert>

    <NSpin :show="loading">
      <template v-if="detail">
        <NCard :bordered="false" class="card-wrapper">
          <NDescriptions
            :column="2"
            bordered
            label-placement="left"
            label-style="vertical-align: middle; font-weight: 500;"
            content-style="vertical-align: middle;"
          >
            <NDescriptionsItem label="标题" :span="2">{{ detail.title }}</NDescriptionsItem>
            <NDescriptionsItem label="用户">
              <component :is="renderUserInline(detail.user, detail.user_id)" />
            </NDescriptionsItem>
            <NDescriptionsItem label="联系方式">{{ detail.phone || '-' }}</NDescriptionsItem>

            <NDescriptionsItem label="类型">
              <NTag :type="feedbackTypeTagMap[detail.type]?.type || 'default'" size="medium">
                {{ feedbackTypeTagMap[detail.type]?.label || detail.type }}
              </NTag>
            </NDescriptionsItem>

            <NDescriptionsItem label="状态">
              <NTag :type="detail.status === 'pending' ? 'warning' : 'success'">
                {{ detail.status === 'pending' ? '待处理' : '已解决' }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem label="创建时间" :span="2">{{ formatDateTime(detail.created_at) }}</NDescriptionsItem>
            <NDescriptionsItem label="内容" :span="2">
              <div class="whitespace-pre-wrap leading-7">{{ detail.content }}</div>
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>

        <NCard :bordered="false" class="card-wrapper" title="反馈附件">
          <NEmpty v-if="!detail.medias.length" description="暂无图片附件" />
          <NImageGroup v-else>
            <NSpace :size="16">
              <NImage
                v-for="media in detail.medias"
                :key="media.id"
                :src="media.url"
                width="180"
                height="130"
                object-fit="cover"
                class="rounded-8px border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              />
            </NSpace>
          </NImageGroup>
        </NCard>

        <NCard :bordered="false" class="card-wrapper">
          <NSpace justify="end">
            <NButton v-if="detail.status === 'pending'" type="primary" :loading="submitting" @click="confirmResolve">
              标记为已解决
            </NButton>
            <NTag v-else type="success">该反馈已解决</NTag>
          </NSpace>
        </NCard>
      </template>
    </NSpin>
  </NSpace>
</template>
