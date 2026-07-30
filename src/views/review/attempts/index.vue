<script setup lang="ts">
import { computed, h, ref } from 'vue';
import {
  NDescriptions,
  NDescriptionsItem,
  NImage,
  NInput,
  NModal,
  NSelect,
  NSpace,
  type DataTableColumns
} from 'naive-ui';
import type { AttemptReviewItem, AttemptStatus } from '@/service/api';
import { fetchAttemptReviews, reviewAttempt } from '@/service/api';
import { useTableSearch } from '@/hooks/common/table-search';
import { useOperatingKeys } from '@/hooks/common/operating-keys';
import TableSearchBar from '@/components/advanced/table-search-bar.vue';
import DataTableContainer from '@/components/advanced/data-table-container.vue';
import AmapViewModal from '@/components/advanced/amap-view-modal.vue';
import RejectReasonModal from '@/components/advanced/reject-reason-modal.vue';
import { formatDistance, getDistanceMeters } from '@/utils/tuxun';
import {
  createDateTimeColumn,
  createReviewActionsColumn,
  createStatusColumn,
  createThumbColumn,
  renderUserInline
} from '@/utils/table-columns';
import { confirmAction } from '@/utils/confirm';

const statusOptions = [
  { label: '待审核', value: 'pending' },
  { label: '答对', value: 'solved' },
  { label: '未答对', value: 'unsolved' }
];

const statusTagMap: Record<string, { type: 'warning' | 'success' | 'error'; label: string }> = {
  pending: { type: 'warning', label: '待审核' },
  solved: { type: 'success', label: '答对' },
  unsolved: { type: 'error', label: '未答对' }
};

const { isOperating, run } = useOperatingKeys();

const { searchParams, rows, loading, loadError, errorMessage, loadData, handleSearch, handleReset, pagination } =
  useTableSearch<
    AttemptReviewItem,
    { status: AttemptStatus | undefined; keyword: string; photo_keyword: string; user_keyword: string }
  >({
    fetchApi: params =>
      fetchAttemptReviews({
        page: params.page,
        page_size: params.page_size,
        status: params.status,
        keyword: params.keyword.trim() || undefined,
        photo_keyword: params.photo_keyword.trim() || undefined,
        user_keyword: params.user_keyword.trim() || undefined
      }),
    initialParams: { status: 'pending', keyword: '', photo_keyword: '', user_keyword: '' }
  });

const modalVisible = ref(false);
const detailVisible = ref(false);
const selected = ref<AttemptReviewItem | null>(null);
const submitting = ref(false);

function distanceOf(row: AttemptReviewItem) {
  const lon1 = row.photo?.location?.longitude ?? 0;
  const lat1 = row.photo?.location?.latitude ?? 0;
  const lon2 = row.guess_location?.longitude ?? 0;
  const lat2 = row.guess_location?.latitude ?? 0;
  return formatDistance(getDistanceMeters(lon1, lat1, lon2, lat2));
}

function openDetail(row: AttemptReviewItem) {
  selected.value = row;
  detailVisible.value = true;
}

function confirmSolve(row: AttemptReviewItem) {
  if (isOperating(row.id)) return;
  confirmAction({
    title: '确认判定为正确',
    content: `确认将答题记录 #${row.id} 判定为正确？`,
    positiveText: '确认正确',
    onConfirm: () => handleQuickSolve(row)
  });
}

function handleQuickSolve(row: AttemptReviewItem) {
  return run(row.id, async () => {
    const response = await reviewAttempt(row.id, 'solved');
    if (!response.error) {
      window.$message?.success('已标记为正确');
      await loadData();
    }
  });
}

function openRejectModal(row: AttemptReviewItem) {
  selected.value = row;
  modalVisible.value = true;
}

async function submitReview(reason: string) {
  if (!selected.value || submitting.value) return;

  submitting.value = true;
  const response = await reviewAttempt(selected.value.id, 'unsolved', reason || undefined);
  submitting.value = false;

  if (response.error) {
    await loadData();
    return;
  }

  modalVisible.value = false;
  window.$message?.success('已标记为错误');
  await loadData();
}

const columns = computed<DataTableColumns<AttemptReviewItem>>(() => [
  {
    title: '原题',
    key: 'photo_thumb_url',
    width: 68,
    render(row: AttemptReviewItem) {
      const src = row.photo?.thumb_url;
      return src
        ? h(NImage, { src, width: 52, height: 52, objectFit: 'cover', class: 'rounded-6px cursor-pointer shadow-xs' })
        : '-';
    }
  },
  createThumbColumn<AttemptReviewItem>({ title: '答题图', key: 'guess_image_url' }),
  {
    title: '答题信息',
    key: 'info',
    minWidth: 180,
    render(row) {
      const userId = row.user?.id || '未知';
      return h('div', { class: 'space-y-1 text-12px text-gray-600 dark:text-gray-300' }, [
        h('div', `答题ID：#${row.id}`),
        h('div', { class: 'line-clamp-2' }, `题目：#${row.photo?.id} ${row.photo?.title || '未知题目'}`),
        h('div', `用户ID：${userId}`)
      ]);
    }
  },
  {
    title: '定位差距',
    key: 'coords',
    width: 85,
    render(row) {
      const dist = distanceOf(row);
      return h('div', { class: 'text-14px text-gray-600 dark:text-gray-400 font-normal' }, dist);
    }
  },
  createDateTimeColumn<AttemptReviewItem>({ title: '提交时间', key: 'created_at' }),
  createStatusColumn<AttemptReviewItem>(statusTagMap),
  createReviewActionsColumn<AttemptReviewItem>({
    isPending: row => row.status === 'pending',
    isOperating: row => isOperating(row.id),
    onView: openDetail,
    onApprove: confirmSolve,
    onReject: openRejectModal,
    approveText: '正确',
    rejectText: '错误'
  })
]);
</script>

<template>
  <NSpace vertical :size="16">
    <TableSearchBar
      title="答题审核"
      description="判定正确或错误后即为终态，不可改判；判定正确将自动发放积分并更新破解数。"
      :loading="loading"
      @search="handleSearch"
      @reset="handleReset"
    >
      <template #filters>
        <NSelect
          v-model:value="searchParams.status"
          :options="statusOptions"
          placeholder="全部 (审核状态)"
          clearable
          class="w-150px"
          @update:value="handleSearch"
        />
        <NInput
          v-model:value="searchParams.photo_keyword"
          maxlength="50"
          placeholder="题目ID、标题"
          clearable
          class="w-160px"
          @keyup.enter="handleSearch"
        />
        <NInput
          v-model:value="searchParams.user_keyword"
          maxlength="50"
          placeholder="答题者ID、昵称"
          clearable
          class="w-160px"
          @keyup.enter="handleSearch"
        />
      </template>

      <NInput
        v-model:value="searchParams.keyword"
        maxlength="50"
        placeholder="答题ID"
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

    <RejectReasonModal
      v-model:show="modalVisible"
      title="驳回答题审核"
      label="错误说明 (选填)"
      placeholder="选填错误说明或驳回备注"
      :required="false"
      :label-width="120"
      :loading="submitting"
      @submit="submitReview"
    />

    <NModal v-model:show="detailVisible" preset="card" title="答题坐标与图片对比详情" class="w-960px max-w-92vw">
      <div v-if="selected" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            class="flex flex-col bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
          >
            <div class="mb-2 font-medium text-13px text-gray-700 dark:text-gray-200">原题位置与图片</div>
            <AmapViewModal
              inline
              :image-url="selected.photo?.thumb_url"
              :longitude="selected.photo?.location?.longitude"
              :latitude="selected.photo?.location?.latitude"
              marker-name="原题位置"
              :height="240"
            />
          </div>

          <div
            class="flex flex-col bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
          >
            <div class="mb-2 font-medium text-13px text-gray-700 dark:text-gray-200">答题提交位置与图片</div>
            <AmapViewModal
              inline
              :image-url="selected.guess_image_url"
              :longitude="selected.guess_location?.longitude"
              :latitude="selected.guess_location?.latitude"
              marker-name="答题位置"
              :height="240"
            />
          </div>
        </div>

        <NDescriptions
          :column="1"
          label-placement="left"
          label-style="font-weight: 500; vertical-align: middle;"
          content-style="vertical-align: middle;"
          bordered
        >
          <NDescriptionsItem label="用户">
            <div class="flex items-center">
              <component :is="renderUserInline(selected.user)" />
            </div>
          </NDescriptionsItem>
          <NDescriptionsItem label="题目">#{{ selected.photo?.id }} {{ selected.photo?.title }}</NDescriptionsItem>
          <NDescriptionsItem v-if="selected.reject_reason" label="未破解说明">
            <span class="text-red-500">{{ selected.reject_reason }}</span>
          </NDescriptionsItem>
        </NDescriptions>
      </div>
    </NModal>
  </NSpace>
</template>
