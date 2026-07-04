<script setup lang="ts">
import { computed, h, ref, reactive, watch } from 'vue';
import { NButton, NInput, NSpace, NSelect } from 'naive-ui';
import { createResizableTable } from '@/utils/table';
import { useRouterPush } from '@/hooks/common/router';

interface Row {
  id: string;
  title: string;
  type: string;
  target: string;
  status: string;
  sender: string;
  sentAt: string;
}

const data: Row[] = [
  {
    id: 'N-4001',
    title: '本期活动已结束，玩法功能关闭',
    type: '活动',
    target: '全体用户',
    status: '已发送',
    sender: '运营管理员',
    sentAt: '2026-06-20 10:00'
  }
];

const { routerPushByKey } = useRouterPush();

function createNotice() {
  routerPushByKey('notice_list-create');
}

function viewNotice(row: Row) {
  routerPushByKey('notice_list-detail', {
    params: {
      id: row.id
    }
  });
}

const searchVal = ref('');
const statusVal = ref<string | null>(null);
const statusOptions = [
  { label: '草稿', value: '草稿' },
  { label: '已发送', value: '已发送' }
];

const filteredData = computed(() => {
  return data.filter(item => {
    const matchesSearch =
      !searchVal.value ||
      item.title.toLowerCase().includes(searchVal.value.trim().toLowerCase()) ||
      item.type.toLowerCase().includes(searchVal.value.trim().toLowerCase());
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
    {
      title: '标题',
      key: 'title',
      width: 220,
      ellipsis: {
        tooltip: true
      }
    },
    { title: '类型', key: 'type', width: 76 },
    { title: '发送者', key: 'sender' },
    { title: '发送对象', key: 'target' },
    { title: '状态', key: 'status', width: 80 },
    { title: '发送时间', key: 'sentAt' },
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
            onClick: () => viewNotice(row)
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
          <h2 class="m-0 text-20px font-semibold">通知列表</h2>
          <p class="text-13px text-#777">创建系统、活动、审核和积分通知，并发送给用户。</p>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-12px mt-16px">
          <NSpace :size="8">
            <NInput v-model:value="searchVal" placeholder="搜索通知标题" clearable />
            <NSelect
              v-model:value="statusVal"
              :options="statusOptions"
              placeholder="选择状态"
              clearable
              class="w-140px"
            />
          </NSpace>
          <NSpace :size="8">
            <NButton type="primary" @click="createNotice">新建</NButton>
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
