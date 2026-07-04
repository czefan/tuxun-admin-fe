<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { NButton, NCard, NDescriptions, NDescriptionsItem, NPageHeader, NSpace } from 'naive-ui';
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

// 模拟历史数据，和帮助中心列表页保持一致
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

const route = useRoute();
const { routerBack } = useRouterPush();

const currentId = computed(() => (route.query.id as string) || 'HELP-003');

const currentIndex = computed(() => data.findIndex(item => item.id === currentId.value));
const currentRecord = computed<Row | undefined>(() => data[currentIndex.value]);
const prevRecord = computed<Row | undefined>(() => {
  if (currentIndex.value === -1 || currentIndex.value === data.length - 1) {
    return undefined;
  }
  return data[currentIndex.value + 1];
});

// 计算字段是否变动
function isChanged(field: keyof HelpSnapshot) {
  if (!prevRecord.value) return false;
  return currentRecord.value?.snapshot[field] !== prevRecord.value.snapshot[field];
}
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <NPageHeader title="帮助内容修改历史" @back="routerBack">
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
        <NDescriptions :column="1" bordered label-placement="left" label-width="100">
          <NDescriptionsItem label="标题" :class="{ 'bg-#fee2e2! text-#991b1b line-through': isChanged('title') }">
            {{ prevRecord ? prevRecord.snapshot.title : '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="分类" :class="{ 'bg-#fee2e2! text-#991b1b line-through': isChanged('category') }">
            {{ prevRecord ? prevRecord.snapshot.category : '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="发布状态" :class="{ 'bg-#fee2e2! text-#991b1b line-through': isChanged('status') }">
            {{ prevRecord ? prevRecord.snapshot.status : '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="摘要" :class="{ 'bg-#fee2e2! text-#991b1b line-through': isChanged('summary') }">
            {{ prevRecord ? prevRecord.snapshot.summary : '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="正文内容"
            :class="{ 'bg-#fee2e2! text-#991b1b line-through': isChanged('content') }"
          >
            <div class="whitespace-pre-wrap">{{ prevRecord ? prevRecord.snapshot.content : '-' }}</div>
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>

      <!-- 修改后 (右侧) -->
      <NCard
        :bordered="false"
        title="修改后 (当前版本)"
        class="card-wrapper border border-solid border-#bbf7d0 bg-#f8fff9"
      >
        <NDescriptions :column="1" bordered label-placement="left" label-width="100">
          <NDescriptionsItem label="标题" :class="{ 'bg-#dcfce7! text-#166534 font-semibold': isChanged('title') }">
            {{ currentRecord.snapshot.title }}
          </NDescriptionsItem>
          <NDescriptionsItem label="分类" :class="{ 'bg-#dcfce7! text-#166534 font-semibold': isChanged('category') }">
            {{ currentRecord.snapshot.category }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="发布状态"
            :class="{ 'bg-#dcfce7! text-#166534 font-semibold': isChanged('status') }"
          >
            {{ currentRecord.snapshot.status }}
          </NDescriptionsItem>
          <NDescriptionsItem label="摘要" :class="{ 'bg-#dcfce7! text-#166534 font-semibold': isChanged('summary') }">
            {{ currentRecord.snapshot.summary }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="正文内容"
            :class="{ 'bg-#dcfce7! text-#166534 font-semibold': isChanged('content') }"
          >
            <div class="whitespace-pre-wrap">{{ currentRecord.snapshot.content }}</div>
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>
    </div>
  </NSpace>
</template>
