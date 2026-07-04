<script setup lang="ts">
import { computed, h, ref, reactive, watch } from 'vue';
import { NButton, NInput, NSpace, NTag, NSelect } from 'naive-ui';
import { createResizableTable } from '@/utils/table';
import { useRouterPush } from '@/hooks/common/router';

interface Row {
  id: string;
  question: string;
  user: string;
  distance: string;
  submittedAt: string;
  status: string;
  reviewer: string;
}

const data: Row[] = [
  {
    id: 'A-2001',
    question: '图书馆西侧台阶机位',
    user: '南风',
    distance: '12m',
    submittedAt: '2026-06-24 19:02',
    status: '待审核',
    reviewer: '-'
  },
  {
    id: 'A-2002',
    question: '湖边长椅倒影',
    user: '林同学',
    distance: '3m',
    submittedAt: '2026-06-23 15:10',
    status: '通过',
    reviewer: '运营管理员'
  }
];

const { routerPushByKey } = useRouterPush();

const searchVal = ref('');
const statusVal = ref<string | null>(null);
const statusOptions = [
  { label: '待审核', value: '待审核' },
  { label: '通过', value: '通过' },
  { label: '拒绝', value: '拒绝' }
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
    const matchesSearch =
      !searchVal.value ||
      item.question.toLowerCase().includes(searchVal.value.trim().toLowerCase()) ||
      item.user.toLowerCase().includes(searchVal.value.trim().toLowerCase());
    const matchesStatus = !statusVal.value || item.status === statusVal.value;
    return matchesSearch && matchesStatus;
  });
});

watch([searchVal, statusVal], () => {
  pagination.page = 1;
});

function viewDetail(row: Row) {
  routerPushByKey('review_answer-detail', {
    params: {
      id: row.id
    }
  });
}

const { columns, tableScrollX, handleColumnResize } = createResizableTable<Row>(
  [
    { title: '题目', key: 'question' },
    { title: '答题人', key: 'user' },
    { title: '提交时间', key: 'submittedAt' },
    {
      title: '状态',
      key: 'status',
      render: row => {
        const typeMap: Record<string, 'default' | 'error' | 'primary' | 'info' | 'success' | 'warning'> = {
          待审核: 'warning',
          通过: 'success',
          拒绝: 'error',
          审核通过: 'success',
          审核拒绝: 'error'
        };
        return h(
          NTag,
          {
            type: typeMap[row.status] || 'default',
            bordered: false
          },
          { default: () => row.status }
        );
      }
    },
    { title: '审核人', key: 'reviewer' },
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
            onClick: () => viewDetail(row)
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
          <h2 class="m-0 text-20px font-semibold">答题审核</h2>
          <p class="text-13px text-#777">核验答题照片、拍摄现场和 GPS 定位是否真实有效。</p>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-12px mt-16px">
          <NSpace :size="8">
            <NInput v-model:value="searchVal" placeholder="搜索题目 / 答题人" clearable />
            <NSelect
              v-model:value="statusVal"
              :options="statusOptions"
              placeholder="审核状态"
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
