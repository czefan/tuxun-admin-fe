<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue';
import { NDescriptions, NDescriptionsItem, NInput, NModal, NSelect, NSpace, type DataTableColumns } from 'naive-ui';

import type { PhotoReviewItem, ReviewStatus } from '@/service/api';
import { fetchActivityList, fetchPhotoReviews, reviewPhoto } from '@/service/api';
import { useTableSearch } from '@/hooks/common/table-search';
import { useOperatingKeys } from '@/hooks/common/operating-keys';
import TableSearchBar from '@/components/advanced/table-search-bar.vue';
import DataTableContainer from '@/components/advanced/data-table-container.vue';
import AmapViewModal from '@/components/advanced/amap-view-modal.vue';
import RejectReasonModal from '@/components/advanced/reject-reason-modal.vue';
import {
  createDateTimeColumn,
  createReviewActionsColumn,
  createStatusColumn,
  createThumbColumn,
  renderUserInline
} from '@/utils/table-columns';
import { confirmAction } from '@/utils/confirm';

const { isOperating, run } = useOperatingKeys();

const statusOptions = [
  { label: '待审核', value: 'pending' },
  { label: '已驳回', value: 'rejected' }
];

const statusTagMap: Record<string, { type: 'warning' | 'success' | 'error'; label: string }> = {
  pending: { type: 'warning', label: '待审核' },
  approved: { type: 'success', label: '已通过\n(含机器识别)' },
  rejected: { type: 'error', label: '已驳回' }
};

const activityOptions = ref<{ label: string; value: number }[]>([]);

async function loadActivities() {
  try {
    const res = await fetchActivityList({ page: 1, page_size: 100 });
    if (res.data?.list) {
      activityOptions.value = res.data.list.map(item => ({
        label: `[#${item.id}] ${item.title}`,
        value: item.id
      }));
    }
  } catch {
    console.error('获取活动列表失败');
  }
}

const { searchParams, rows, loading, loadError, errorMessage, loadData, handleSearch, handleReset, pagination } =
  useTableSearch<
    PhotoReviewItem,
    { status: ReviewStatus | undefined; activity_ids: number[]; keyword: string; user_keyword: string }
  >({
    fetchApi: params =>
      fetchPhotoReviews({
        page: params.page,
        page_size: params.page_size,
        status: params.status,
        activity_ids: params.activity_ids.length > 0 ? params.activity_ids : undefined,
        keyword: params.keyword.trim() || undefined,
        user_keyword: params.user_keyword.trim() || undefined
      }),
    initialParams: { status: 'pending', activity_ids: [], keyword: '', user_keyword: '' }
  });

const reviewVisible = ref(false);
const detailVisible = ref(false);
const selected = ref<PhotoReviewItem | null>(null);
const submitting = ref(false);

function openPreview(row: PhotoReviewItem) {
  selected.value = row;
  detailVisible.value = true;
}

function confirmApprove(row: PhotoReviewItem) {
  if (isOperating(row.id)) return;
  confirmAction({
    title: '确认审核通过',
    content: `确认审核通过投稿 #${row.id}「${row.title || '无标题'}」？`,
    positiveText: '确认通过',
    onConfirm: () => handleQuickApprove(row)
  });
}

function handleQuickApprove(row: PhotoReviewItem) {
  return run(row.id, async () => {
    const response = await reviewPhoto(row.id, { action: 'approve' });
    if (!response.error) {
      window.$message?.success('审核通过成功');
      await loadData();
    }
  });
}

function openRejectModal(row: PhotoReviewItem) {
  selected.value = row;
  reviewVisible.value = true;
}

async function submitReview(reason: string) {
  if (!selected.value || submitting.value) return;

  submitting.value = true;
  try {
    const response = await reviewPhoto(selected.value.id, { action: 'reject', reject_reason: reason });

    if (response.error) {
      await loadData();
      return;
    }

    window.$message?.success('已成功驳回');
    reviewVisible.value = false;
    await loadData();
  } catch {
    window.$message?.error('审核处理出错，请重试');
  } finally {
    submitting.value = false;
  }
}

const columns = computed<DataTableColumns<PhotoReviewItem>>(() => [
  createThumbColumn<PhotoReviewItem>(),

  {
    title: '题目信息',
    key: 'info',
    minWidth: 180,
    maxWidth: 300,
    render(row) {
      const titleText = `#${row.id} ${row.title || '无标题'}`;
      return h('div', { class: 'space-y-1 max-w-280px' }, [
        h(
          'div',
          { class: 'font-medium text-14px text-gray-900 dark:text-gray-100 truncate', title: titleText },
          titleText
        ),
        h(
          'div',
          { class: 'text-12px text-gray-500 line-clamp-2 leading-snug', title: row.description },
          row.description || '无描述'
        ),
        h('div', { class: 'text-12px text-gray-400' }, `用户ID：${row.author?.id ?? '-'}`)
      ]);
    }
  },

  {
    title: '所属活动',
    key: 'activity',
    width: 150,
    render(row) {
      const actId = row.activity?.id ?? 0;
      const actTitle = row.activity?.title ?? '未关联活动';
      const fullText = `#${actId} ${actTitle}`;
      return h(
        'div',
        { class: 'text-13px text-gray-900 dark:text-gray-100 font-medium leading-snug line-clamp-2', title: fullText },
        fullText
      );
    }
  },

  createDateTimeColumn<PhotoReviewItem>({ title: '提交时间' }),
  createStatusColumn<PhotoReviewItem>(statusTagMap),
  createReviewActionsColumn<PhotoReviewItem>({
    isPending: row => !row.status || row.status === 'pending',
    isOperating: row => isOperating(row.id),
    onView: openPreview,
    onApprove: confirmApprove,
    onReject: openRejectModal
  })
]);

onMounted(() => {
  loadActivities();
});
</script>

<template>
  <NSpace vertical :size="16">
    <TableSearchBar
      title="投稿审核"
      description="审核通过或驳回后即为终态，不可更改或改判；驳回时必须填写驳回原因。"
      :loading="loading"
      @search="handleSearch"
      @reset="handleReset"
    >
      <template #filters>
        <NSelect
          v-model:value="searchParams.status"
          :options="statusOptions"
          placeholder="审核状态"
          class="w-120px"
          @update:value="handleSearch"
        />
        <NSelect
          v-model:value="searchParams.activity_ids"
          multiple
          clearable
          filterable
          placeholder="选择或搜索所属活动"
          :options="activityOptions"
          class="w-220px"
          @update:value="handleSearch"
        />
        <div class="w-full">
          <NInput
            v-model:value="searchParams.user_keyword"
            maxlength="50"
            placeholder="作者ID、昵称"
            clearable
            @keyup.enter="handleSearch"
          />
        </div>
      </template>

      <NInput
        v-model:value="searchParams.keyword"
        maxlength="50"
        placeholder="题目ID、标题、描述"
        clearable
        style="width: 100%"
        @keyup.enter="handleSearch"
      />
    </TableSearchBar>

    <DataTableContainer
      :columns="columns"
      :data="rows"
      :loading="loading"
      :load-error="loadError"
      :error-message="errorMessage"
      :row-key="row => row.id"
      :pagination="pagination"
      @retry="loadData"
    />

    <RejectReasonModal v-model:show="reviewVisible" title="驳回投稿审核" :loading="submitting" @submit="submitReview" />

    <NModal v-model:show="detailVisible" preset="card" title="题目详情" class="w-840px max-w-92vw">
      <div v-if="selected" class="space-y-4">
        <AmapViewModal
          inline
          :image-url="selected.image_url || selected.thumb_url"
          :longitude="selected.location?.longitude"
          :latitude="selected.location?.latitude"
          marker-name="投稿位置"
        />
        <NDescriptions
          :column="2"
          label-placement="left"
          label-style="font-weight: 500; vertical-align: middle;"
          content-style="vertical-align: middle;"
          bordered
        >
          <NDescriptionsItem label="标题" :span="2">{{ selected.title || '无标题' }}</NDescriptionsItem>
          <NDescriptionsItem label="描述" :span="2">{{ selected.description || '无描述' }}</NDescriptionsItem>
          <NDescriptionsItem label="用户" :span="2">
            <div class="flex items-center">
              <component :is="renderUserInline((selected as any).author)" />
            </div>
          </NDescriptionsItem>
        </NDescriptions>
      </div>
    </NModal>
  </NSpace>
</template>
