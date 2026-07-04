<script setup lang="ts">
import { computed, h, ref, reactive, watch } from 'vue';
import { NButton, NInput, NSpace, NSelect } from 'naive-ui';
import { createResizableTable } from '@/utils/table';
import { useRouterPush } from '@/hooks/common/router';

interface Row {
  id: string;
  title: string;
  period: string;
  questionCount: number;
  status: string;
  updatedAt: string;
}

const { routerPushByKey } = useRouterPush();

function createActivity() {
  routerPushByKey('activity_list-create');
}

const data: Row[] = [
  {
    id: 'ACT-001',
    title: '第 1 期校园机位挑战',
    period: '2026-06-01 至 2026-06-20',
    questionCount: 24,
    status: '已发布',
    updatedAt: '2026-06-20 22:00'
  },
  {
    id: 'ACT-002',
    title: '第 2 期夏日寻景',
    period: '2026-06-21 至 2026-07-10',
    questionCount: 18,
    status: '草稿',
    updatedAt: '2026-06-24 18:30'
  }
];

function openActivityQuestions(row: Row) {
  routerPushByKey('activity_list-question', {
    params: {
      id: row.id
    }
  });
}

const searchVal = ref('');
const statusVal = ref<string | null>(null);
const statusOptions = [
  { label: '草稿', value: '草稿' },
  { label: '已发布', value: '已发布' }
];

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

const filteredData = computed(() => {
  return data.filter(item => {
    const matchesSearch = !searchVal.value || item.title.toLowerCase().includes(searchVal.value.trim().toLowerCase());
    const matchesStatus = !statusVal.value || item.status === statusVal.value;
    return matchesSearch && matchesStatus;
  });
});

watch([searchVal, statusVal], () => {
  pagination.page = 1;
});

const { columns, tableScrollX, handleColumnResize } = createResizableTable<Row>(
  [
    { title: '活动名称', key: 'title' },
    { title: '活动周期', key: 'period' },
    { title: '题目数', key: 'questionCount' },
    { title: '状态', key: 'status' },
    { title: '更新时间', key: 'updatedAt' },
    {
      title: '操作',
      key: 'actions',
      width: 112,
      minWidth: 112,
      resizable: false,
      render: row =>
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            secondary: true,
            onClick: () => openActivityQuestions(row)
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
          <h2 class="m-0 text-20px font-semibold">往期活动列表</h2>
          <p class="text-13px text-#777">查看已结束活动的周期、状态和题目数量。</p>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-12px mt-16px">
          <NSpace :size="8">
            <NInput v-model:value="searchVal" placeholder="搜索活动名称" clearable />
            <NSelect
              v-model:value="statusVal"
              :options="statusOptions"
              placeholder="选择状态"
              clearable
              class="w-140px"
            />
          </NSpace>
          <NSpace :size="8">
            <NButton type="primary" @click="createActivity">新建</NButton>
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
