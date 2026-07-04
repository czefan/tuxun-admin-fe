<script setup lang="ts">
import { computed, ref, reactive, h, watch } from 'vue';
import { NButton, NTag, NInput, NSpace, NSelect } from 'naive-ui';
import { createResizableTable } from '@/utils/table';

interface Row {
  id: string;
  product: string;
  user: string;
  code: string;
  status: string;
  count: number;
  exchangedAt: string;
  operator: string;
  redeemedAt: string;
}

const data = reactive<Row[]>([
  {
    id: 'R-6001',
    product: '挑战钥匙扣',
    user: '南风',
    code: 'TX-824913',
    status: '待核销',
    count: 2,
    exchangedAt: '2026-06-24 15:30',
    operator: '-',
    redeemedAt: '-'
  },
  {
    id: 'R-6002',
    product: '纪念小卡片',
    user: '林同学',
    code: 'TX-824914',
    status: '已核销',
    count: 1,
    exchangedAt: '2026-06-23 11:20',
    operator: '超级管理员',
    redeemedAt: '2026-06-23 14:15'
  }
]);

const redeemCode = ref('');
const redeemModalVisible = ref(false);
const viewModalVisible = ref(false);
const selectedRecord = ref<Row | null>(null);

function viewRedeem(row: Row) {
  selectedRecord.value = row;
  viewModalVisible.value = true;
}
const matchedRecord = computed(() => data.find(item => item.code === redeemCode.value.trim()));

const searchVal = ref('');
const statusVal = ref<string | null>(null);
const statusOptions = [
  { label: '待核销', value: '待核销' },
  { label: '已核销', value: '已核销' }
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
      item.product.toLowerCase().includes(searchVal.value.trim().toLowerCase()) ||
      item.user.toLowerCase().includes(searchVal.value.trim().toLowerCase()) ||
      item.code.toLowerCase().includes(searchVal.value.trim().toLowerCase());
    const matchesStatus = !statusVal.value || item.status === statusVal.value;
    return matchesSearch && matchesStatus;
  });
});

watch([searchVal, statusVal], () => {
  pagination.page = 1;
});

function openRedeemModal() {
  if (!redeemCode.value.trim()) {
    window.$message?.warning('请输入核销码');

    return;
  }
  if (matchedRecord.value && matchedRecord.value.status === '已核销') {
    window.$message?.error('该核销码已被核销，不可重复核销');
    return;
  }

  redeemModalVisible.value = true;
}

function confirmRedeem() {
  if (matchedRecord.value) {
    if (matchedRecord.value.status === '已核销') {
      window.$message?.error('该核销码已被核销，不可重复核销');
      return;
    }
    matchedRecord.value.status = '已核销';
    matchedRecord.value.operator = '超级管理员';
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    matchedRecord.value.redeemedAt = formattedDate;
  }
  redeemModalVisible.value = false;
  window.$message?.success('奖品已核销');
}

const { columns, tableScrollX, handleColumnResize } = createResizableTable<Row>(
  [
    { title: '兑换用户', key: 'user' },
    { title: '奖品', key: 'product' },
    { title: '兑换数', key: 'count', width: 80 },
    { title: '核销码', key: 'code' },
    {
      title: '状态',
      key: 'status',
      render: row =>
        h(
          NTag,
          {
            type: row.status === '已核销' ? 'success' : 'warning',
            bordered: false
          },
          { default: () => row.status }
        )
    },
    { title: '核销时间', key: 'redeemedAt' },
    {
      title: '操作',
      key: 'actions',
      width: 88,
      resizable: false,
      render: row =>
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            secondary: true,
            onClick: () => viewRedeem(row)
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
          <h2 class="m-0 text-20px font-semibold">奖品核销</h2>
          <p class="text-13px text-#777">输入核销码或扫码确认线下奖品已发放。</p>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-12px mt-16px">
          <NSpace :size="8">
            <NInput v-model:value="searchVal" placeholder="搜索奖品 / 用户" clearable />
            <NSelect
              v-model:value="statusVal"
              :options="statusOptions"
              placeholder="选择状态"
              clearable
              class="w-140px"
            />
          </NSpace>
          <NSpace :size="8">
            <NInput v-model:value="redeemCode" placeholder="输入核销码" clearable />
            <NButton type="primary" @click="openRedeemModal">核销</NButton>
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

    <NModal v-model:show="redeemModalVisible" preset="card" title="核销确认" class="w-520px max-w-[calc(100vw-32px)]">
      <template v-if="matchedRecord">
        <NDescriptions :column="1" bordered label-placement="left">
          <NDescriptionsItem label="兑换用户">{{ matchedRecord.user }}</NDescriptionsItem>
          <NDescriptionsItem label="奖品">{{ matchedRecord.product }}</NDescriptionsItem>
          <NDescriptionsItem label="兑换数">{{ matchedRecord.count }}</NDescriptionsItem>
          <NDescriptionsItem label="核销码">{{ matchedRecord.code }}</NDescriptionsItem>
          <NDescriptionsItem label="状态">
            <NTag :type="matchedRecord.status === '已核销' ? 'success' : 'warning'" :bordered="false">
              {{ matchedRecord.status }}
            </NTag>
          </NDescriptionsItem>
        </NDescriptions>
        <NAlert class="mt-14px" type="warning" :show-icon="false">确认后将标记为已发放，前台不可重复核销。</NAlert>
      </template>
      <NEmpty v-else description="未找到该核销码" />
      <template #footer>
        <NSpace justify="end">
          <NButton @click="redeemModalVisible = false">取消</NButton>
          <NButton
            type="primary"
            :disabled="!matchedRecord || matchedRecord.status === '已核销'"
            @click="confirmRedeem"
          >
            确认核销
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <NModal v-model:show="viewModalVisible" preset="card" title="核销详情" class="w-520px max-w-[calc(100vw-32px)]">
      <template v-if="selectedRecord">
        <NDescriptions :column="1" bordered label-placement="left">
          <NDescriptionsItem label="核销编号">{{ selectedRecord.id }}</NDescriptionsItem>
          <NDescriptionsItem label="兑换用户">{{ selectedRecord.user }}</NDescriptionsItem>
          <NDescriptionsItem label="奖品">{{ selectedRecord.product }}</NDescriptionsItem>
          <NDescriptionsItem label="兑换数">{{ selectedRecord.count }}</NDescriptionsItem>
          <NDescriptionsItem label="兑换时间">{{ selectedRecord.exchangedAt }}</NDescriptionsItem>
          <NDescriptionsItem label="核销码">{{ selectedRecord.code }}</NDescriptionsItem>
          <NDescriptionsItem label="状态">
            <NTag :type="selectedRecord.status === '已核销' ? 'success' : 'warning'" :bordered="false">
              {{ selectedRecord.status }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem label="核销人">{{ selectedRecord.operator }}</NDescriptionsItem>
          <NDescriptionsItem label="核销时间">{{ selectedRecord.redeemedAt }}</NDescriptionsItem>
        </NDescriptions>
      </template>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="viewModalVisible = false">关闭</NButton>
        </NSpace>
      </template>
    </NModal>
  </NSpace>
</template>
