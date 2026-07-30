<script setup lang="ts">
import { computed, h } from 'vue';
import { NButton, NInput, NSelect, NSpace, NTag, type DataTableColumns } from 'naive-ui';
import type { FeedbackListItem, FeedbackStatus, FeedbackType } from '@/service/api';
import { fetchFeedbackList } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import { useTableSearch } from '@/hooks/common/table-search';
import TableSearchBar from '@/components/advanced/table-search-bar.vue';
import DataTableContainer from '@/components/advanced/data-table-container.vue';
import { feedbackTypeLabels } from '@/utils/tuxun';
import { createDateTimeColumn, createStatusColumn, createUserColumn } from '@/utils/table-columns';

const { routerPushByKey } = useRouterPush();

const feedbackTypeTagMap: Record<number, { label: string; type: 'warning' | 'info' | 'error' | 'default' }> = {
  1: { label: '内容问题', type: 'warning' },
  2: { label: '玩法建议', type: 'info' },
  3: { label: '技术问题', type: 'error' },
  4: { label: '其他', type: 'default' }
};

const typeOptions = Object.entries(feedbackTypeLabels).map(([value, label]) => ({ label, value: Number(value) }));
const statusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '已解决', value: 'resolved' }
];

const statusTagMap: Record<string, { type: 'warning' | 'success'; label: string }> = {
  pending: { type: 'warning', label: '待处理' },
  resolved: { type: 'success', label: '已解决' }
};

const { searchParams, rows, loading, loadError, errorMessage, loadData, handleSearch, handleReset, pagination } =
  useTableSearch<
    FeedbackListItem,
    { type?: FeedbackType; status?: FeedbackStatus; keyword?: string; user_keyword?: string }
  >({
    fetchApi: params =>
      fetchFeedbackList({
        page: params.page,
        page_size: params.page_size,
        type: params.type || undefined,
        status: params.status || undefined,
        keyword: params.keyword?.trim() || undefined,
        user_keyword: params.user_keyword?.trim() || undefined
      }),
    initialParams: { type: undefined, status: undefined, keyword: '', user_keyword: '' }
  });

function openDetail(id: number) {
  routerPushByKey('operation_feedback-detail', { params: { id: String(id) } });
}

const columns = computed<DataTableColumns<FeedbackListItem>>(() => [
  {
    title: '反馈信息',
    key: 'info',
    minWidth: 240,
    render(row) {
      return h(
        'div',
        {
          class: 'font-medium text-14px text-gray-900 dark:text-gray-100 line-clamp-2 break-all py-2px',
          title: `#${row.id} ${row.title}`
        },
        `#${row.id} ${row.title}`
      );
    }
  },
  createUserColumn<FeedbackListItem>({
    getUser: row => row.user
  }),
  {
    title: '类型',
    key: 'type',
    width: 110,
    render(row) {
      const conf = feedbackTypeTagMap[row.type] || { label: '未知', type: 'default' };
      return h(NTag, { type: conf.type, size: 'medium' }, { default: () => conf.label });
    }
  },

  createStatusColumn<FeedbackListItem>(statusTagMap),
  createDateTimeColumn<FeedbackListItem>(),
  {
    title: '操作',
    key: 'actions',
    width: 75,
    render(row) {
      return h(
        NButton,
        { size: 'small', type: 'info', secondary: true, onClick: () => openDetail(row.id) },
        { default: () => '查看' }
      );
    }
  }
]);
</script>

<template>
  <NSpace vertical :size="16">
    <TableSearchBar title="反馈管理" :loading="loading" @search="handleSearch" @reset="handleReset">
      <template #filters>
        <NSelect
          v-model:value="searchParams.type"
          :options="typeOptions"
          clearable
          placeholder="全部 (反馈类型)"
          style="width: 160px"
          @update:value="handleSearch"
        />
        <NSelect
          v-model:value="searchParams.status"
          :options="statusOptions"
          clearable
          placeholder="全部 (处理状态)"
          style="width: 160px"
          @update:value="handleSearch"
        />
        <div class="w-full">
          <NInput
            v-model:value="searchParams.user_keyword"
            maxlength="50"
            placeholder="提交者ID、昵称"
            clearable
            @keyup.enter="handleSearch"
          />
        </div>
      </template>

      <NInput
        v-model:value="searchParams.keyword"
        maxlength="50"
        placeholder="反馈ID、标题、内容"
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
  </NSpace>
</template>
