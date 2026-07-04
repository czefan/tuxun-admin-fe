<script setup lang="ts">
import { computed, h, ref, reactive, watch } from 'vue';
import { NButton, NInput, NSpace, NSelect } from 'naive-ui';
import { createResizableTable } from '@/utils/table';
import { useRouterPush } from '@/hooks/common/router';

interface AboutSnapshot {
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  contactTitle: string;
  contactContent: string;
  linkTitle: string;
  linkUrl: string;
}

interface Row {
  id: string;
  version: string;
  updater: string;
  summary: string;
  updatedAt: string;
  snapshot: AboutSnapshot;
}

// 模拟历史记录数据
const data: Row[] = [
  {
    id: 'ABOUT-003',
    version: 'v3 (当前)',
    updater: '超级管理员',
    summary: '更新项目介绍与官网链接',
    updatedAt: '2026-06-24 16:30',
    snapshot: {
      heroTitle: '图寻',
      heroSubtitle: '围绕校园地点解密和机位破解设计的小程序 activity',
      intro:
        '图寻是围绕校园地点解密和机位破解设计的小程序活动。用户通过题目图片寻找真实地点，并在现场拍摄同机位照片完成挑战。',
      contactTitle: '联系我们',
      contactContent: '如需反馈活动问题，请通过小程序反馈入口提交信息。',
      linkTitle: '活动官网',
      linkUrl: 'https://tuxun.example.com'
    }
  },
  {
    id: 'ABOUT-002',
    version: 'v2',
    updater: '南风',
    summary: '修正了部分介绍错字，补充客服QQ群',
    updatedAt: '2026-06-20 10:15',
    snapshot: {
      heroTitle: '图寻小程序',
      heroSubtitle: '校园解密与寻宝小程序',
      intro: '一个帮助学生探索校园并找到有趣地点的解密应用。',
      contactTitle: '联系反馈',
      contactContent: '反馈请联系 QQ群：12345678',
      linkTitle: '活动官网',
      linkUrl: 'http://test.com'
    }
  },
  {
    id: 'ABOUT-001',
    version: 'v1',
    updater: '系统初始化',
    summary: '首次创建关于我们页面配置',
    updatedAt: '2026-05-20 09:00',
    snapshot: {
      heroTitle: '图寻',
      heroSubtitle: '探索你的学校',
      intro: '寻找有趣的校园打卡地。',
      contactTitle: '联系',
      contactContent: '暂无说明',
      linkTitle: '官网',
      linkUrl: ''
    }
  }
];

const { routerPushByKey } = useRouterPush();

function editAbout() {
  routerPushByKey('content_about-edit');
}

function viewDiff(row: Row) {
  // 我们跳转到 about-diff 页面，并将当前行 id 传过去
  routerPushByKey('content_about-diff', { query: { id: row.id } });
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
          <h2 class="m-0 text-20px font-semibold">关于我们</h2>
          <p class="text-13px text-#777">展示前台“关于我们”的历史修改记录。右上角可修改当前配置。</p>
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
            <NButton type="primary" @click="editAbout">修改</NButton>
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
