<script setup lang="ts">
import { computed, h, ref, reactive, watch } from 'vue';
import { NButton, NInput, NSpace, NSelect } from 'naive-ui';
import { createResizableTable } from '@/utils/table';
import { useRouterPush } from '@/hooks/common/router';

interface Row {
  id: string;
  name: string;
  points: number;
  stock: number;
  status: string;
  updatedAt: string;
}

const data: Row[] = [
  { id: 'P-5001', name: '挑战钥匙扣', points: 2800, stock: 20, status: '上架', updatedAt: '2026-06-24 12:30' },
  { id: 'P-5002', name: '纪念小卡片', points: 1200, stock: 50, status: '上架', updatedAt: '2026-06-23 18:10' }
];

const { routerPushByKey } = useRouterPush();

function createProduct() {
  routerPushByKey('mall_product-create');
}

function viewProduct(row: Row) {
  routerPushByKey('mall_product-detail', {
    params: {
      id: row.id
    }
  });
}

const searchVal = ref('');
const statusVal = ref<string | null>(null);
const statusOptions = [
  { label: '上架', value: '上架' },
  { label: '下架', value: '下架' }
];

const filteredData = computed(() => {
  return data.filter(item => {
    const matchesSearch = !searchVal.value || item.name.toLowerCase().includes(searchVal.value.trim().toLowerCase());
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
    { title: '商品', key: 'name' },
    { title: '所需积分', key: 'points' },
    { title: '库存', key: 'stock' },
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
            onClick: () => viewProduct(row)
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
          <h2 class="m-0 text-20px font-semibold">商城商品</h2>
          <p class="text-13px text-#777">维护商品图片、说明、积分价格、库存和上下架状态。</p>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-12px mt-16px">
          <NSpace :size="8">
            <NInput v-model:value="searchVal" placeholder="搜索商品名称" clearable />
            <NSelect
              v-model:value="statusVal"
              :options="statusOptions"
              placeholder="选择状态"
              clearable
              class="w-140px"
            />
          </NSpace>
          <NSpace :size="8">
            <NButton type="primary" @click="createProduct">新增</NButton>
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
