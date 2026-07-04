<script setup lang="ts">
import { h, reactive, ref, computed, watch } from 'vue';
import { NButton, NInput, NSpace, NSelect } from 'naive-ui';
import { createResizableTable } from '@/utils/table';
import { useRouterPush } from '@/hooks/common/router';

interface Row {
  id: string;
  user: string;
  type: string;
  content: string;
  status: string;
  createdAt: string;
}

const data: Row[] = [
  {
    id: 'F-8001',
    user: '林同学',
    type: '建议',
    content: '希望增加活动搜索筛选',
    status: '待处理',
    createdAt: '2026-06-24 21:18'
  }
];

const { routerPushByKey } = useRouterPush();

const pagination = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  onChange: (page: number) => {
    pagination.page = page;
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
  }
});

const searchVal = ref('');
const selectedType = ref<string | null>(null);
const selectedStatus = ref<string | null>(null);

const typeOptions = [
  { label: '建议', value: '建议' },
  { label: '问题', value: '问题' }
];

const statusOptions = [
  { label: '待处理', value: '待处理' },
  { label: '已处理', value: '已处理' }
];

const filteredData = computed(() => {
  return data.filter(item => {
    const matchesSearch =
      !searchVal.value ||
      item.user.toLowerCase().includes(searchVal.value.trim().toLowerCase()) ||
      item.content.toLowerCase().includes(searchVal.value.trim().toLowerCase());
    const matchesType = !selectedType.value || item.type === selectedType.value;
    const matchesStatus = !selectedStatus.value || item.status === selectedStatus.value;
    return matchesSearch && matchesType && matchesStatus;
  });
});

watch([searchVal, selectedType, selectedStatus], () => {
  pagination.page = 1;
});

function viewFeedback(row: Row) {
  routerPushByKey('content_feedback-detail', {
    params: {
      id: row.id
    }
  });
}

const { columns, tableScrollX, handleColumnResize } = createResizableTable<Row>(
  [
    { title: '反馈用户', key: 'user' },
    { title: '类型', key: 'type' },
    { title: '反馈标题', key: 'content' },
    { title: '状态', key: 'status' },
    { title: '提交时间', key: 'createdAt' },
    {
      title: '操作',
      key: 'actions',
      width: 96,
      resizable: false,
      render: row =>
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            secondary: true,
            onClick: () => viewFeedback(row)
          },
          { default: () => '详情' }
        )
    }
  ],
  data
);
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <div>
        <div class="flex items-baseline gap-16px">
          <h2 class="m-0 text-20px font-semibold">反馈管理</h2>
          <p class="text-13px text-#777">跟进用户提交的问题、建议和内容异常反馈。</p>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-12px mt-16px">
          <NSpace :size="8">
            <NInput v-model:value="searchVal" placeholder="搜索反馈 / 用户" clearable />
            <NSelect
              v-model:value="selectedType"
              :options="typeOptions"
              placeholder="反馈类型"
              clearable
              class="w-140px"
            />
            <NSelect
              v-model:value="selectedStatus"
              :options="statusOptions"
              placeholder="处理状态"
              clearable
              class="w-140px"
            />
          </NSpace>
        </div>
      </div>
    </NCard>
    <NCard :bordered="false" class="card-wrapper">
      <NDataTable
        class="resizable-data-table"
        :style="{ '--table-scroll-x': tableScrollX + 'px' }"
        :columns="columns"
        :data="filteredData"
        :pagination="pagination"
        :scroll-x="tableScrollX"
        :on-unstable-column-resize="handleColumnResize"
        table-layout="fixed"
        :row-key="row => row.id"
      />
    </NCard>
  </NSpace>
</template>
