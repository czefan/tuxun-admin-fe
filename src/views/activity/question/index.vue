<script setup lang="ts">
import { computed, h, ref, reactive, watch } from 'vue';
import { NButton, NInput, NSpace, NSelect } from 'naive-ui';
import { createResizableTable } from '@/utils/table';
import { useRouterPush } from '@/hooks/common/router';

interface Row {
  id: string;
  title: string;
  author: string;
  answerCount: number;
  location: string;
  status: string;
  updatedAt: string;
}

const data: Row[] = [
  {
    id: 'Q-7001',
    title: '校园门口机位',
    author: '官方管理员',
    answerCount: 0,
    location: '校园主入口',
    status: '草稿',
    updatedAt: '2026-06-24 16:00'
  }
];

const { routerPushByKey } = useRouterPush();

function createQuestion() {
  routerPushByKey('activity_question-create');
}

function viewQuestion(row: Row) {
  routerPushByKey('activity_question-detail', {
    params: {
      id: row.id
    },
    query: {
      from: 'activity_question'
    }
  });
}

const searchVal = ref('');
const statusVal = ref<string | null>(null);
const statusOptions = [
  { label: '草稿', value: '草稿' },
  { label: '已发布', value: '已发布' }
];

const filteredData = computed(() => {
  return data.filter(item => {
    const matchesSearch =
      !searchVal.value ||
      item.title.toLowerCase().includes(searchVal.value.trim().toLowerCase()) ||
      item.location.toLowerCase().includes(searchVal.value.trim().toLowerCase());
    const matchesStatus = !statusVal.value || item.status === statusVal.value;
    return matchesSearch && matchesStatus;
  });
});

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

watch([searchVal, statusVal], () => {
  pagination.page = 1;
});

const { columns, tableScrollX, handleColumnResize } = createResizableTable<Row>(
  [
    { title: '题目', key: 'title' },
    { title: '作者', key: 'author' },
    { title: '答题人数', key: 'answerCount' },
    { title: '机位位置', key: 'location' },
    { title: '状态', key: 'status' },
    { title: '更新时间', key: 'updatedAt' },
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
            onClick: () => viewQuestion(row)
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
          <h2 class="m-0 text-20px font-semibold">当期题目</h2>
          <p class="text-13px text-#777">维护官方题目、作者、答题人数和机位坐标。</p>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-12px mt-16px">
          <NSpace :size="8">
            <NInput v-model:value="searchVal" placeholder="搜索题目 / 位置" clearable />
            <NSelect
              v-model:value="statusVal"
              :options="statusOptions"
              placeholder="选择状态"
              clearable
              class="w-140px"
            />
          </NSpace>
          <NSpace :size="8">
            <NButton type="primary" @click="createQuestion">新建</NButton>
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
