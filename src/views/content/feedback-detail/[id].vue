<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { useRouterPush } from '@/hooks/common/router';
import { useTabStore } from '@/store/modules/tab';

interface FeedbackDetail {
  id: string;
  user: string;
  phone: string;
  type: string;
  status: string;
  createdAt: string;
  sourcePage: string;
  content: string;
  imageUrl: string;
  device: string;
  handler: string;
  records: {
    time: string;
    operator: string;
    content: string;
  }[];
}

function createFeedbackImage(title: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 420">
      <rect width="720" height="420" fill="#eef4f8"/>
      <rect x="72" y="62" width="576" height="296" rx="22" fill="#fff" stroke="#d7e1e8" stroke-width="8"/>
      <rect x="110" y="106" width="250" height="24" rx="12" fill="#8ab6c9"/>
      <rect x="110" y="158" width="500" height="18" rx="9" fill="#d8e2e8"/>
      <rect x="110" y="198" width="430" height="18" rx="9" fill="#d8e2e8"/>
      <rect x="110" y="238" width="470" height="18" rx="9" fill="#d8e2e8"/>
      <rect x="110" y="296" width="142" height="38" rx="8" fill="#5a8bb8"/>
      <text x="286" y="324" fill="#53616a" font-family="Arial" font-size="22">${title}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const route = useRoute();
const { routerPushByKey } = useRouterPush();
const tabStore = useTabStore();

const detailMap: Record<string, FeedbackDetail> = {
  'F-8001': {
    id: 'F-8001',
    user: '林同学',
    phone: '139****2048',
    type: '建议',
    status: '待处理',
    createdAt: '2026-06-24 21:18',
    sourcePage: '活动列表',
    content: '希望增加活动搜索筛选。现在往期活动多了以后，只能一页页找，建议支持按活动名称、状态和时间范围筛选。',
    imageUrl: createFeedbackImage('活动筛选建议'),
    device: 'iPhone 15 / iOS 19.1 / 小程序 2.4.0',
    handler: '未分配',
    records: [
      {
        time: '2026-06-24 21:18',
        operator: '系统',
        content: '用户提交反馈'
      }
    ]
  }
};

const feedbackId = computed(() => route.params.id as string);
const detail = computed(() => detailMap[feedbackId.value]);
const pageTitle = computed(() => (detail.value ? `${detail.value.id} 反馈详情` : '反馈详情'));

function backToList() {
  routerPushByKey('content_feedback');
}

function markProcessing() {
  window.$message?.success('反馈已标记为处理中');
}

function closeFeedback() {
  window.$message?.success('反馈已关闭');
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
          <p v-if="detail" class="mt-6px text-13px text-#777">
            {{ detail.user }} · {{ detail.type }} · {{ detail.createdAt }}
          </p>
        </div>
        <NSpace>
          <NButton @click="backToList">返回列表</NButton>
          <NButton v-if="detail" secondary type="primary" @click="markProcessing">标记处理中</NButton>
          <NButton v-if="detail" type="primary" @click="closeFeedback">关闭反馈</NButton>
        </NSpace>
      </div>
    </NCard>

    <template v-if="detail">
      <NCard :bordered="false" class="card-wrapper">
        <NDescriptions :column="4" label-placement="left" bordered>
          <NDescriptionsItem label="反馈编号">{{ detail.id }}</NDescriptionsItem>
          <NDescriptionsItem label="反馈类型">{{ detail.type }}</NDescriptionsItem>
          <NDescriptionsItem label="状态">{{ detail.status }}</NDescriptionsItem>
          <NDescriptionsItem label="处理人">{{ detail.handler }}</NDescriptionsItem>
          <NDescriptionsItem label="反馈用户">{{ detail.user }}</NDescriptionsItem>
          <NDescriptionsItem label="手机号">{{ detail.phone }}</NDescriptionsItem>
          <NDescriptionsItem label="来源页面">{{ detail.sourcePage }}</NDescriptionsItem>
          <NDescriptionsItem label="提交时间">{{ detail.createdAt }}</NDescriptionsItem>
        </NDescriptions>
      </NCard>

      <div class="grid grid-cols-1 gap-16px lg:grid-cols-[minmax(0,1fr)_420px]">
        <NCard :bordered="false" class="card-wrapper">
          <h3 class="m-0 mb-12px text-16px font-semibold">反馈内容</h3>
          <NAlert type="info" :show-icon="false">
            <p class="m-0 whitespace-pre-line leading-7">{{ detail.content }}</p>
          </NAlert>
          <NDescriptions class="mt-14px" :column="1" label-placement="left" bordered>
            <NDescriptionsItem label="设备环境">{{ detail.device }}</NDescriptionsItem>
          </NDescriptions>
        </NCard>

        <NCard :bordered="false" class="card-wrapper">
          <div class="mb-12px flex items-center justify-between">
            <h3 class="m-0 text-16px font-semibold">附件截图</h3>
            <NTag type="info">1 张</NTag>
          </div>
          <NImage
            :src="detail.imageUrl"
            object-fit="cover"
            class="h-240px w-full overflow-hidden rounded-6px border border-#eee border-solid"
          />
        </NCard>
      </div>

      <NCard :bordered="false" class="card-wrapper">
        <h3 class="m-0 mb-12px text-16px font-semibold">处理记录</h3>
        <NTimeline>
          <NTimelineItem
            v-for="record in detail.records"
            :key="`${record.time}-${record.operator}`"
            type="info"
            :time="record.time"
            :title="record.operator"
          >
            {{ record.content }}
          </NTimelineItem>
        </NTimeline>
      </NCard>
    </template>

    <NCard v-else :bordered="false" class="card-wrapper">
      <NEmpty description="未找到反馈">
        <template #extra>
          <NButton @click="backToList">返回列表</NButton>
        </template>
      </NEmpty>
    </NCard>
  </NSpace>
</template>
