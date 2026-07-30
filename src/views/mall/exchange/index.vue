<script setup lang="ts">
import { h } from 'vue';
import { NButton, NImage, NInput, NSelect, NSpace } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { fetchExchanges, verifyExchange } from '@/service/api/mall';
import type { ExchangeItem, ExchangeStatus } from '@/service/api/mall';
import { useTableSearch } from '@/hooks/common/table-search';
import { useOperatingKeys } from '@/hooks/common/operating-keys';
import TableSearchBar from '@/components/advanced/table-search-bar.vue';
import DataTableContainer from '@/components/advanced/data-table-container.vue';
import { createDateTimeColumn, createStatusColumn } from '@/utils/table-columns';
import { confirmAction } from '@/utils/confirm';

const { isOperating, run } = useOperatingKeys();

const statusOptions: { label: string; value: ExchangeStatus }[] = [
  { label: '待核销', value: 'pending' },
  { label: '已核销', value: 'verified' },
  { label: '已取消', value: 'cancelled' }
];

const statusTagMap: Record<string, { type: 'warning' | 'success' | 'error'; label: string }> = {
  pending: { type: 'warning', label: '待核销' },
  verified: { type: 'success', label: '已核销' },
  cancelled: { type: 'error', label: '已取消' }
};

const {
  searchParams,
  rows: data,
  loading,
  loadError,
  errorMessage,
  loadData,
  handleSearch,
  handleReset,
  pagination
} = useTableSearch<
  ExchangeItem,
  { status: ExchangeStatus | null; exchange_id_str: string; good_keyword: string; user_keyword: string }
>({
  fetchApi: async params => {
    const exId = params.exchange_id_str.trim();
    const { data: res, error } = await fetchExchanges({
      page: params.page,
      page_size: params.page_size,
      status: params.status || undefined,
      keyword: exId || undefined,
      good_keyword: params.good_keyword.trim() || undefined,
      user_keyword: params.user_keyword.trim() || undefined
    });
    return { data: res ? { list: res.list || [], total: res.total || 0 } : null, error };
  },
  initialParams: { status: null, exchange_id_str: '', good_keyword: '', user_keyword: '' }
});

function confirmAct(row: ExchangeItem, action: 'verify' | 'cancel') {
  if (isOperating(row.id)) return;
  const isVerify = action === 'verify';
  confirmAction({
    title: isVerify ? '确认核销兑换' : '确认取消兑换',
    content: isVerify ? `确认核销兑换单 #${row.id} 并发货给该用户？` : `确认取消兑换单 #${row.id}？`,
    tone: isVerify ? 'warning' : 'error',
    positiveText: isVerify ? '确认核销' : '确认取消兑换',
    negativeText: '返回',
    onConfirm: () => handleAction(row.id, action)
  });
}

function handleAction(id: number, action: 'verify' | 'cancel') {
  return run(id, async () => {
    try {
      const res = await verifyExchange(id, action);
      if (res.error) {
        window.$message?.error(res.error.message || '操作失败');
        return;
      }
      window.$message?.success(action === 'verify' ? '核销成功' : '已取消该兑换');
      await loadData();
    } catch {
      window.$message?.error('请求出错，请重试');
    }
  });
}

const columns: DataTableColumns<ExchangeItem> = [
  { title: '兑换 ID', key: 'id', width: 70 },
  {
    title: '用户',
    key: 'user',
    width: 100,
    maxWidth: 120,
    render(row) {
      return h('div', { class: 'space-y-0.5' }, [
        h(
          'div',
          { class: 'line-clamp-2 font-medium text-13px text-gray-900 dark:text-gray-100 leading-snug' },
          row.user.nickname || '-'
        ),
        h('div', { class: 'text-12px text-gray-400' }, `ID: ${row.user.id}`)
      ]);
    }
  },
  {
    title: '奖品信息',
    key: 'good',
    minWidth: 180,
    render(row) {
      return h('div', { class: 'flex items-center gap-8px' }, [
        row.good.thumb_url
          ? h(NImage, { src: row.good.thumb_url, width: 36, height: 36, class: 'rounded object-cover' })
          : null,
        h('div', { class: 'font-medium line-clamp-2' }, `#${row.good.id} ${row.good.name}`)
      ]);
    }
  },

  {
    title: '扣除积分',
    key: 'score_cost',
    width: 110,
    render(row) {
      const unitScore = row.good?.score_price || 0;
      const qty = row.quantity || 1;
      const totalCost = row.score_cost ?? unitScore * qty;
      return h('div', { class: 'leading-snug' }, [
        h('div', { class: 'font-medium text-gray-900 dark:text-gray-100' }, `${totalCost} 积分`),
        h('div', { class: 'text-12px text-gray-400 font-normal mt-1px' }, `${unitScore} × ${qty}`)
      ]);
    }
  },

  createStatusColumn<ExchangeItem>(statusTagMap),
  createDateTimeColumn<ExchangeItem>({ title: '创建时间', key: 'created_at' }),
  createDateTimeColumn<ExchangeItem>({ title: '核销时间', key: 'exchange_at' }),

  {
    title: '操作',
    key: 'actions',
    width: 130,
    fixed: 'right',
    render(row) {
      if (row.status !== 'pending') {
        return h('span', { class: 'text-12px text-gray-400' }, '-');
      }
      const operating = isOperating(row.id);
      return h(
        NSpace,
        { size: 'small' },
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                type: 'primary',
                secondary: true,
                loading: operating,
                disabled: operating,
                onClick: () => confirmAct(row, 'verify')
              },
              { default: () => '核销' }
            ),
            h(
              NButton,
              {
                size: 'small',
                type: 'error',
                secondary: true,
                loading: operating,
                disabled: operating,
                onClick: () => confirmAct(row, 'cancel')
              },
              { default: () => '取消' }
            )
          ]
        }
      );
    }
  }
];
</script>

<template>
  <NSpace vertical :size="16">
    <TableSearchBar
      title="兑换管理"
      description="取消兑换会自动退还用户消耗的积分并恢复奖品库存；核销与取消均为终态。"
      :loading="loading"
      @search="handleSearch"
      @reset="handleReset"
    >
      <template #filters>
        <NSelect
          v-model:value="searchParams.status"
          :options="statusOptions"
          placeholder="全部 (兑换状态)"
          clearable
          class="w-160px"
          @update:value="handleSearch"
        />
        <NInput
          v-model:value="searchParams.good_keyword"
          maxlength="50"
          placeholder="奖品ID、名称"
          clearable
          class="w-160px"
          @keyup.enter="handleSearch"
        />
        <NInput
          v-model:value="searchParams.user_keyword"
          maxlength="50"
          placeholder="兑换用户ID、学号、姓名、昵称"
          clearable
          class="w-200px"
          @keyup.enter="handleSearch"
        />
      </template>
      <NInput
        v-model:value="searchParams.exchange_id_str"
        maxlength="50"
        placeholder="兑换记录ID"
        clearable
        class="flex-1 w-full"
        @keyup.enter="handleSearch"
      />
    </TableSearchBar>

    <DataTableContainer
      :columns="columns"
      :data="data"
      :loading="loading"
      :load-error="loadError"
      :error-message="errorMessage"
      :row-key="row => row.id"
      :pagination="pagination"
      @retry="loadData"
    />
  </NSpace>
</template>
