<script setup lang="ts">
import { computed, h } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NInput, NSpace, type DataTableColumns } from 'naive-ui';
import type { AdminAnnouncementListItem } from '@/service/api';
import { fetchAdminAnnouncementList } from '@/service/api';
import { useTableSearch } from '@/hooks/common/table-search';
import TableSearchBar from '@/components/advanced/table-search-bar.vue';
import DataTableContainer from '@/components/advanced/data-table-container.vue';
import { createDateTimeColumn } from '@/utils/table-columns';

const router = useRouter();

const { searchParams, rows, loading, loadError, errorMessage, loadData, handleSearch, handleReset, pagination } =
  useTableSearch<AdminAnnouncementListItem, { keyword: string }>({
    fetchApi: params =>
      fetchAdminAnnouncementList({
        page: params.page,
        page_size: params.page_size,
        keyword: params.keyword?.trim() || undefined
      }),
    initialParams: { keyword: '' }
  });

function goToCreate() {
  router.push('/operation/notice-form/create');
}

function goToDetail(id: number) {
  router.push(`/operation/notice-form/${id}`);
}

const columns = computed<DataTableColumns<AdminAnnouncementListItem>>(() => [
  {
    title: 'ID',
    key: 'id',
    width: 60,
    render(row) {
      return h('div', { class: 'line-clamp-2 break-all' }, `#${row.id}`);
    }
  },
  {
    title: '标题',
    key: 'title',
    minWidth: 180,
    render(row) {
      return h('div', { class: 'font-medium text-14px text-gray-900 dark:text-gray-100 line-clamp-2' }, row.title);
    }
  },
  {
    title: '内容预览',
    key: 'content_preview',
    minWidth: 260,
    render(row) {
      return h(
        'div',
        { class: 'text-13px text-gray-600 dark:text-gray-300 line-clamp-2' },
        row.content_preview || '无内容'
      );
    }
  },
  {
    title: '已读',
    key: 'read_count',
    width: 70,
    render(row) {
      return h('span', { class: 'text-13px text-gray-700 dark:text-gray-200' }, String(row.read_count ?? 0));
    }
  },
  createDateTimeColumn<AdminAnnouncementListItem>(),
  {
    title: '操作',
    key: 'actions',
    width: 75,
    render(row) {
      return h(
        NButton,
        { size: 'small', type: 'primary', secondary: true, onClick: () => goToDetail(row.id) },
        { default: () => '编辑' }
      );
    }
  }
]);
</script>

<template>
  <NSpace vertical :size="16">
    <TableSearchBar
      title="通知管理"
      description="发布后全部已登录用户可见；详情可修改或删除；互动消息不可在此管理。"
      :loading="loading"
      @search="handleSearch"
      @reset="handleReset"
    >
      <NInput
        v-model:value="searchParams.keyword"
        placeholder="通知ID、标题、正文"
        maxlength="50"
        class="flex-1 min-w-0"
        clearable
        @keyup.enter="handleSearch"
      />

      <template #extra>
        <NButton type="primary" @click="goToCreate">新建</NButton>
      </template>
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
