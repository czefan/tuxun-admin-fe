<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { NButton, NCard, NDescriptions, NDescriptionsItem, NPageHeader, NSpace } from 'naive-ui';
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

// 模拟历史数据，和积分规则列表页保持一致
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

const route = useRoute();
const { routerBack } = useRouterPush();

const currentId = computed(() => (route.query.id as string) || 'RULE-003');

const currentIndex = computed(() => data.findIndex(item => item.id === currentId.value));
const currentRecord = computed<Row | undefined>(() => data[currentIndex.value]);
const prevRecord = computed<Row | undefined>(() => {
  if (currentIndex.value === -1 || currentIndex.value === data.length - 1) {
    return undefined;
  }
  return data[currentIndex.value + 1];
});

// 计算字段是否变动
function isChanged(field: keyof RuleSnapshot) {
  if (!prevRecord.value) return false;
  return currentRecord.value?.snapshot[field] !== prevRecord.value.snapshot[field];
}
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <NPageHeader title="积分规则修改历史" @back="routerBack">
        <template #subtitle>
          <span v-if="currentRecord">
            修改人：{{ currentRecord.updater }} | 修改时间：{{ currentRecord.updatedAt }}
          </span>
        </template>
        <template #extra>
          <NButton @click="routerBack">返回列表</NButton>
        </template>
      </NPageHeader>
    </NCard>

    <div v-if="currentRecord" class="grid grid-cols-1 gap-16px lg:grid-cols-2">
      <!-- 修改前 (左侧) -->
      <NCard
        :bordered="false"
        title="修改前 (旧版本)"
        class="card-wrapper border border-solid border-#fecaca bg-#fffafb"
      >
        <NDescriptions :column="1" bordered label-placement="left" label-width="140">
          <NDescriptionsItem
            label="答题正确获得积分"
            :class="{ 'bg-#fee2e2! text-#991b1b line-through': isChanged('answerCorrectPoints') }"
          >
            {{ prevRecord ? prevRecord.snapshot.answerCorrectPoints : '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="投稿审核通过积分"
            :class="{ 'bg-#fee2e2! text-#991b1b line-through': isChanged('postApprovedPoints') }"
          >
            {{ prevRecord ? prevRecord.snapshot.postApprovedPoints : '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="每日签到积分"
            :class="{ 'bg-#fee2e2! text-#991b1b line-through': isChanged('dailyCheckInPoints') }"
          >
            {{ prevRecord ? prevRecord.snapshot.dailyCheckInPoints : '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="规则启用状态"
            :class="{ 'bg-#fee2e2! text-#991b1b line-through': isChanged('status') }"
          >
            {{ prevRecord ? prevRecord.snapshot.status : '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="规则整体说明"
            :class="{ 'bg-#fee2e2! text-#991b1b line-through': isChanged('description') }"
          >
            <div class="whitespace-pre-wrap">{{ prevRecord ? prevRecord.snapshot.description : '-' }}</div>
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>

      <!-- 修改后 (右侧) -->
      <NCard
        :bordered="false"
        title="修改后 (当前版本)"
        class="card-wrapper border border-solid border-#bbf7d0 bg-#f8fff9"
      >
        <NDescriptions :column="1" bordered label-placement="left" label-width="140">
          <NDescriptionsItem
            label="答题正确获得积分"
            :class="{ 'bg-#dcfce7! text-#166534 font-semibold': isChanged('answerCorrectPoints') }"
          >
            {{ currentRecord.snapshot.answerCorrectPoints }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="投稿审核通过积分"
            :class="{ 'bg-#dcfce7! text-#166534 font-semibold': isChanged('postApprovedPoints') }"
          >
            {{ currentRecord.snapshot.postApprovedPoints }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="每日签到积分"
            :class="{ 'bg-#dcfce7! text-#166534 font-semibold': isChanged('dailyCheckInPoints') }"
          >
            {{ currentRecord.snapshot.dailyCheckInPoints }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="规则启用状态"
            :class="{ 'bg-#dcfce7! text-#166534 font-semibold': isChanged('status') }"
          >
            {{ currentRecord.snapshot.status }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="规则整体说明"
            :class="{ 'bg-#dcfce7! text-#166534 font-semibold': isChanged('description') }"
          >
            <div class="whitespace-pre-wrap">{{ currentRecord.snapshot.description }}</div>
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>
    </div>
  </NSpace>
</template>
