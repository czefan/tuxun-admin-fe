<script setup lang="ts">
import { computed, h, watchEffect, reactive } from 'vue';
import { NButton } from 'naive-ui';
import { useRoute } from 'vue-router';
import { createResizableTable } from '@/utils/table';
import { useRouterPush } from '@/hooks/common/router';
import { useTabStore } from '@/store/modules/tab';

interface Activity {
  id: string;
  title: string;
  period: string;
  questionCount: number;
  status: string;
}

interface Row {
  id: string;
  title: string;
  location: string;
  status: string;
  answerCount: number;
  updatedAt: string;
}

const route = useRoute();
const { routerPushByKey } = useRouterPush();
const tabStore = useTabStore();

const activityMap: Record<string, Activity> = {
  'ACT-001': {
    id: 'ACT-001',
    title: '第 1 期校园机位挑战',
    period: '2026-06-01 至 2026-06-20',
    questionCount: 24,
    status: '已结束'
  },
  'ACT-002': {
    id: 'ACT-002',
    title: '第 2 期夏日寻景',
    period: '2026-06-21 至 2026-07-10',
    questionCount: 18,
    status: '已结束'
  }
};

const questionMap: Record<string, Row[]> = {
  'ACT-001': [
    {
      id: 'Q-6101',
      title: '图书馆西侧台阶机位',
      location: '校图书馆附近',
      status: '已归档',
      answerCount: 126,
      updatedAt: '2026-06-20 21:40'
    },
    {
      id: 'Q-6102',
      title: '湖边长椅倒影',
      location: '校园湖区',
      status: '已归档',
      answerCount: 98,
      updatedAt: '2026-06-20 21:32'
    }
  ],
  'ACT-002': [
    {
      id: 'Q-7001',
      title: '校园门口机位',
      location: '校园主入口',
      status: '已归档',
      answerCount: 88,
      updatedAt: '2026-06-24 16:00'
    }
  ]
};

const activityId = computed(() => route.params.id as string);
const activity = computed(() => activityMap[activityId.value]);
const data = computed<Row[]>(() => questionMap[activityId.value] ?? []);

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
const pageTitle = computed(() => {
  const matchedPeriod = activity.value?.title.match(/第\s*(\d+)\s*期/u);
  const matchedIdPeriod = activityId.value.match(/ACT-(\d+)/u);

  if (matchedPeriod) return `第 ${matchedPeriod[1]} 期题目`;
  if (matchedIdPeriod) return `第 ${Number(matchedIdPeriod[1])} 期题目`;

  return '第 N 期题目';
});

function viewQuestion(row: Row) {
  routerPushByKey('activity_list-question-detail', {
    params: {
      id: row.id
    },
    query: {
      activityId: activityId.value
    }
  });
}

const { columns, tableScrollX, handleColumnResize } = createResizableTable<Row>(
  [
    { title: '题目', key: 'title' },
    { title: '机位位置', key: 'location' },
    { title: '状态', key: 'status' },
    { title: '答题数', key: 'answerCount' },
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
  data.value
);

function backToList() {
  routerPushByKey('activity_list');
}

watchEffect(() => {
  tabStore.setTabLabel(pageTitle.value);
});
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <h2 class="m-0 text-20px font-semibold">{{ pageTitle }}</h2>
          <p class="mt-6px text-13px text-#777">
            {{ activity?.title || activityId }} · {{ activity?.period || '活动信息待同步' }}
          </p>
        </div>
        <NButton @click="backToList">返回列表</NButton>
      </div>
    </NCard>

    <NCard v-if="activity" :bordered="false" class="card-wrapper">
      <NDescriptions :column="3" label-placement="left" bordered>
        <NDescriptionsItem label="活动编号">{{ activity.id }}</NDescriptionsItem>
        <NDescriptionsItem label="活动状态">{{ activity.status }}</NDescriptionsItem>
        <NDescriptionsItem label="题目数">{{ activity.questionCount }}</NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <NDataTable
        class="resizable-data-table"
        :style="{ '--table-scroll-x': tableScrollX + 'px' }"
        :columns="columns"
        :data="data"
        :pagination="pagination"
        :scroll-x="tableScrollX"
        :on-unstable-column-resize="handleColumnResize"
        table-layout="fixed"
        :row-key="row => row.id"
      />
    </NCard>
  </NSpace>
</template>
