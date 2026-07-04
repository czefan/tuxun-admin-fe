<script setup lang="ts">
import { computed, h, ref, reactive, watch } from 'vue';
import { NButton, NInput, NSpace, NSelect } from 'naive-ui';
import { createResizableTable } from '@/utils/table';
import { useRouterPush } from '@/hooks/common/router';

interface HelpSnapshot {
  title: string;
  category: string;
  status: string;
  summary: string;
  content: string;
}

interface Row {
  id: string;
  version: string;
  updater: string;
  summary: string;
  updatedAt: string;
  snapshot: HelpSnapshot;
}

// 模拟历史数据，和对比页面保持一致
const data: Row[] = [
  {
    id: 'HELP-003',
    version: 'v3 (当前)',
    updater: '超级管理员',
    summary: '完善答题注意事项，增加防作弊说明',
    updatedAt: '2026-06-25 15:40',
    snapshot: {
      title: '浏览题目与现场答题',
      category: '玩法说明',
      status: '已发布',
      summary: '浏览题目后，前往现场寻找相同机位，并使用实时拍摄照片提交答案。',
      content:
        '1. 玩家需在地图或列表中选择题目查看详情。\n2. 前往题目对应的实际地点，寻找相同的拍摄角度与机位。\n3. 使用小程序内的相机进行现场实时拍摄并提交。\n4. 系统将根据图像比对和 GPS 定位共同校验答案。请勿上传相册历史照片，否则无法通过审核。'
    }
  },
  {
    id: 'HELP-002',
    version: 'v2',
    updater: '南风',
    summary: '补充GPS定位审核说明',
    updatedAt: '2026-06-24 16:20',
    snapshot: {
      title: '浏览题目与现场答题规则',
      category: '玩法说明',
      status: '已发布',
      summary: '在现场寻找相同机位拍照提交答案。',
      content:
        '1. 浏览题目查看线索。\n2. 寻找现场机位。\n3. 必须现场实时拍摄照片提交。\n4. 提交时会验证手机的 GPS 定位是否在题目允许的误差范围内。'
    }
  },
  {
    id: 'HELP-001',
    version: 'v1',
    updater: '系统初始化',
    summary: '首次创建玩法说明',
    updatedAt: '2026-05-20 09:00',
    snapshot: {
      title: '如何答题',
      category: '玩法说明',
      status: '已发布',
      summary: '简要说明如何答题',
      content: '在现场拍摄同机位照片提交即可。'
    }
  }
];

const { routerPushByKey } = useRouterPush();

function editHelp() {
  routerPushByKey('content_help-create');
}

function viewDiff(row: Row) {
  // 我们跳转到 help-diff 页面，并将当前行 id 传过去
  routerPushByKey('content_help-diff', { query: { id: row.id } });
}

const searchVal = ref('');
const updaterVal = ref<string | null>(null);
const updaterOptions = [
  { label: '超级管理员', value: '超级管理员' },
  { label: '南风', value: '南风' },
  { label: '系统初始化', value: '系统初始化' }
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
      item.updater.toLowerCase().includes(searchVal.value.trim().toLowerCase()) ||
      item.summary.toLowerCase().includes(searchVal.value.trim().toLowerCase());
    const matchesUpdater = !updaterVal.value || item.updater === updaterVal.value;
    return matchesSearch && matchesUpdater;
  });
});

watch([searchVal, updaterVal], () => {
  pagination.page = 1;
});

const { columns, tableScrollX, handleColumnResize } = createResizableTable<Row>(
  [
    { title: '修改人', key: 'updater' },
    { title: '修改说明', key: 'summary' },
    { title: '更新时间', key: 'updatedAt' },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: row =>
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            secondary: true,
            onClick: () => viewDiff(row)
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
          <h2 class="m-0 text-20px font-semibold">帮助中心</h2>
          <p class="text-13px text-#777">展示前台“帮助中心”玩法说明的历史修改记录。右上角可修改当前配置。</p>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-12px mt-16px">
          <NSpace :size="8">
            <NInput v-model:value="searchVal" placeholder="搜索修改人 / 说明" clearable />
            <NSelect
              v-model:value="updaterVal"
              :options="updaterOptions"
              placeholder="选择修改人"
              clearable
              class="w-140px"
            />
          </NSpace>
          <NSpace :size="8">
            <NButton type="primary" @click="editHelp">修改</NButton>
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
