<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { NDescriptions, NDescriptionsItem, NInput, NModal, NSelect, NSpace, type DataTableColumns } from 'naive-ui';
import type { CommentReviewItem, ReviewStatus } from '@/service/api';
import { fetchCommentReviews, reviewComment } from '@/service/api';
import { useTableSearch } from '@/hooks/common/table-search';
import { useOperatingKeys } from '@/hooks/common/operating-keys';
import TableSearchBar from '@/components/advanced/table-search-bar.vue';
import DataTableContainer from '@/components/advanced/data-table-container.vue';
import RejectReasonModal from '@/components/advanced/reject-reason-modal.vue';
import {
  createDateTimeColumn,
  createReviewActionsColumn,
  createStatusColumn,
  createUserColumn,
  renderUserInline
} from '@/utils/table-columns';
import { confirmAction } from '@/utils/confirm';

const statusOptions = [
  { label: '待审核', value: 'pending' },
  { label: '已通过 (含机器识别)', value: 'approved' },
  { label: '已驳回', value: 'rejected' }
];

const statusTagMap: Record<string, { type: 'warning' | 'success' | 'error'; label: string }> = {
  pending: { type: 'warning', label: '待审核' },
  approved: { type: 'success', label: '已通过\n(含机器识别)' },
  rejected: { type: 'error', label: '已驳回' }
};

const { isOperating, run } = useOperatingKeys();

const { searchParams, rows, loading, loadError, errorMessage, loadData, handleSearch, handleReset, pagination } =
  useTableSearch<
    CommentReviewItem,
    { status: ReviewStatus | undefined; keyword: string; photo_keyword: string; user_keyword: string }
  >({
    fetchApi: params =>
      fetchCommentReviews({
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
const selected = ref<CommentReviewItem | null>(null);
const submitting = ref(false);

function openDetail(row: CommentReviewItem) {
  selected.value = row;
  detailVisible.value = true;
}

function confirmApprove(row: CommentReviewItem) {
  if (isOperating(row.id)) return;
  confirmAction({
    title: '确认审核通过',
    content: `确认审核通过评论 #${row.id}？`,
    positiveText: '确认通过',
    onConfirm: () => handleQuickApprove(row)
  });
}

function handleQuickApprove(row: CommentReviewItem) {
  return run(row.id, async () => {
    const response = await reviewComment(row.id, { action: 'approve' });
    if (!response.error) {
      window.$message?.success('已审核通过');
      await loadData();
    }
  });
}

function openRejectModal(row: CommentReviewItem) {
  selected.value = row;
  modalVisible.value = true;
}

async function submitReview(reason: string) {
  if (!selected.value || submitting.value) return;

  submitting.value = true;
  const response = await reviewComment(selected.value.id, { action: 'reject', reject_reason: reason });
  submitting.value = false;

  if (response.error) {
    await loadData();
    return;
  }

  modalVisible.value = false;
  window.$message?.success('已成功驳回');
  await loadData();
}

const columns = computed<DataTableColumns<CommentReviewItem>>(() => [
  createUserColumn<CommentReviewItem>(),
  {
    title: '评论信息',
    key: 'info',
    minWidth: 180,
    render(row) {
      return h('div', { class: 'space-y-1 text-12px text-gray-600 dark:text-gray-300' }, [
        h('div', `评论ID：#${row.id}`),
        h('div', { class: 'line-clamp-2' }, `题目：#${row.photo?.id} ${row.photo?.title || ''}`)
      ]);
    }
  },
  {
    title: '评论内容',
    key: 'content',
    minWidth: 200,
    render(row) {
      return h(
        'div',
        { class: 'line-clamp-3 text-13px text-gray-800 dark:text-gray-200 leading-normal' },
        row.content || '-'
      );
    }
  },
  createDateTimeColumn<CommentReviewItem>(),
  createStatusColumn<CommentReviewItem>(statusTagMap),
  createReviewActionsColumn<CommentReviewItem>({
    isPending: row => !row.status || row.status === 'pending',
    isOperating: row => isOperating(row.id),
    allowRejudge: true,
    getStatus: row => row.status,
    onView: openDetail,
    onApprove: confirmApprove,
    onReject: openRejectModal
  })
]);
</script>

<template>
  <NSpace vertical :size="16">
    <TableSearchBar
      title="评论审核"
      description="评论审核支持随时在通过与驳回之间来回切换改判；驳回时须填驳回原因。"
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
          class="w-180px"
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
          placeholder="评论者ID、昵称"
          clearable
          class="w-160px"
          @keyup.enter="handleSearch"
        />
      </template>
      <NInput
        v-model:value="searchParams.keyword"
        maxlength="50"
        placeholder="评论ID、内容"
        clearable
        class="flex-1 w-full"
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

    <RejectReasonModal v-model:show="modalVisible" title="驳回评论审核" :loading="submitting" @submit="submitReview" />

    <NModal v-model:show="detailVisible" preset="card" title="评论与关联题目详情" style="width: 600px">
      <div v-if="selected" class="space-y-4">
        <NDescriptions
          :column="1"
          label-placement="left"
          label-style="font-weight: 500; vertical-align: middle;"
          content-style="vertical-align: middle;"
          bordered
        >
          <NDescriptionsItem label="用户">
            <component :is="renderUserInline(selected.user)" />
          </NDescriptionsItem>
          <NDescriptionsItem label="题目">#{{ selected.photo?.id }} {{ selected.photo?.title }}</NDescriptionsItem>
          <NDescriptionsItem label="评论内容">{{ selected.content }}</NDescriptionsItem>
        </NDescriptions>
      </div>
    </NModal>
  </NSpace>
</template>
