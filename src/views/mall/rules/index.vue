<script setup lang="ts">
import { computed, h, reactive, ref, watch } from 'vue';
import { NButton, NSpace, NSelect } from 'naive-ui';
import { createResizableTable } from '@/utils/table';
import { useRouterPush } from '@/hooks/common/router';

interface RuleSnapshot {
  answerCorrectPoints: number;
  postApprovedPoints: number;
  dailyCheckInPoints: number;
  status: '启用' | '禁用';
  description: string;
}

interface Row {
  id: string;
  version: string;
  updater: string;
  summary: string;
  updatedAt: string;
  snapshot: RuleSnapshot;
}

// 模拟历史数据，和对比页保持一致
const data: Row[] = [
  {
    id: 'RULE-003',
    version: 'v3 (当前)',
    updater: '超级管理员',
    summary: '提高投稿审核通过奖励积分，上线每日签到功能',
    updatedAt: '2026-06-25 10:00',
    snapshot: {
      answerCorrectPoints: 10,
      postApprovedPoints: 50,
      dailyCheckInPoints: 15,
      status: '启用',
      description:
        '1. 作答正确：每题获得10积分。\n2. 投稿通过：每题获得50积分。\n3. 每日签到：签到获得15积分。积分用于兑换商城奖品。'
    }
  },
  {
    id: 'RULE-002',
    version: 'v2',
    updater: '南风',
    summary: '下调答题正确积分至10',
    updatedAt: '2026-06-15 14:20',
    snapshot: {
      answerCorrectPoints: 10,
      postApprovedPoints: 20,
      dailyCheckInPoints: 0,
      status: '启用',
      description: '作答正确得10积分，投稿通过得20积分。'
    }
  },
  {
    id: 'RULE-001',
    version: 'v1',
    updater: '系统初始化',
    summary: '首次设定积分奖励',
    updatedAt: '2026-06-01 09:00',
    snapshot: {
      answerCorrectPoints: 20,
      postApprovedPoints: 20,
      dailyCheckInPoints: 0,
      status: '启用',
      description: '初始积分规则：答题正确20积分，投稿正确20积分。'
    }
  }
];

const { routerPushByKey } = useRouterPush();

const ruleModalVisible = ref(false);
const ruleModel = reactive<RuleSnapshot>({
  answerCorrectPoints: 10,
  postApprovedPoints: 50,
  dailyCheckInPoints: 15,
  status: '启用',
  description:
    '1. 作答正确：每题获得10积分。\n2. 投稿通过：每题获得50积分。\n3. 每日签到：签到获得15积分。积分用于兑换商城奖品。'
});

function openRuleModal() {
  // 载入当前的 snapshot 进表单
  const current = data[0].snapshot;
  ruleModel.answerCorrectPoints = current.answerCorrectPoints;
  ruleModel.postApprovedPoints = current.postApprovedPoints;
  ruleModel.dailyCheckInPoints = current.dailyCheckInPoints;
  ruleModel.status = current.status;
  ruleModel.description = current.description;
  ruleModalVisible.value = true;
}

function saveRule() {
  ruleModalVisible.value = false;
  window.$message?.success('积分规则已保存');
}

function viewDiff(row: Row) {
  routerPushByKey('mall_rules-diff', { query: { id: row.id } });
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
          <h2 class="m-0 text-20px font-semibold">积分规则</h2>
          <p class="text-13px text-#777">展示积分获取与消耗规则的历史修改记录。右上角可修改当前配置。</p>
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
            <NButton type="primary" @click="openRuleModal">修改</NButton>
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

    <NModal v-model:show="ruleModalVisible" preset="card" title="修改积分规则" class="w-560px max-w-[calc(100vw-32px)]">
      <NForm :model="ruleModel" label-placement="top">
        <NGrid :cols="2" :x-gap="16">
          <NFormItemGi label="答题正确获得积分" path="answerCorrectPoints">
            <NInputNumber v-model:value="ruleModel.answerCorrectPoints" class="w-full" :min="0" />
          </NFormItemGi>
          <NFormItemGi label="投稿审核通过积分" path="postApprovedPoints">
            <NInputNumber v-model:value="ruleModel.postApprovedPoints" class="w-full" :min="0" />
          </NFormItemGi>
          <NFormItemGi label="每日签到积分" path="dailyCheckInPoints">
            <NInputNumber v-model:value="ruleModel.dailyCheckInPoints" class="w-full" :min="0" />
          </NFormItemGi>
          <NFormItemGi label="启用状态" path="status">
            <NRadioGroup v-model:value="ruleModel.status">
              <NSpace>
                <NRadio value="启用">启用</NRadio>
                <NRadio value="禁用">禁用</NRadio>
              </NSpace>
            </NRadioGroup>
          </NFormItemGi>
        </NGrid>
        <NFormItem label="规则整体说明" path="description">
          <NInput
            v-model:value="ruleModel.description"
            type="textarea"
            placeholder="描述积分奖励逻辑"
            :autosize="{ minRows: 4, maxRows: 8 }"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="ruleModalVisible = false">取消</NButton>
          <NButton type="primary" @click="saveRule">保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </NSpace>
</template>
