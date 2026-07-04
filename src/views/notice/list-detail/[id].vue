<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { useRouterPush } from '@/hooks/common/router';
import { useTabStore } from '@/store/modules/tab';

interface NoticeDetail {
  id: string;
  title: string;
  type: string;
  target: string;
  status: string;
  sentAt: string;
  createdBy: string;
  content: string;
  channels: string[];
  delivery: {
    total: number;
    delivered: number;
    read: number;
  };
}

const route = useRoute();
const { routerPushByKey } = useRouterPush();
const tabStore = useTabStore();

const detailMap: Record<string, NoticeDetail> = {
  'N-4001': {
    id: 'N-4001',
    title: '本期活动已结束，玩法功能关闭',
    type: '活动',
    target: '全体用户',
    status: '已发送',
    sentAt: '2026-06-20 10:00',
    createdBy: '运营管理员',
    content:
      '第 1 期校园机位挑战已结束，活动题目、现场答题和积分发放入口将关闭。已提交的答题记录仍可在审核完成后查看结果。',
    channels: ['站内通知', '系统弹窗', '消息中心'],
    delivery: {
      total: 1286,
      delivered: 1286,
      read: 942
    }
  }
};

const noticeId = computed(() => route.params.id as string);
const detail = computed(() => detailMap[noticeId.value]);
const pageTitle = computed(() => (detail.value ? `${detail.value.title}详情` : '通知详情'));
const readRate = computed(() => {
  if (!detail.value || detail.value.delivery.total === 0) return 0;

  return Math.round((detail.value.delivery.read / detail.value.delivery.total) * 100);
});

function backToList() {
  routerPushByKey('notice_list');
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
            {{ detail.id }} · {{ detail.type }} · {{ detail.sentAt }}
          </p>
        </div>
        <NButton @click="backToList">返回列表</NButton>
      </div>
    </NCard>

    <template v-if="detail">
      <NCard :bordered="false" class="card-wrapper">
        <NDescriptions :column="4" label-placement="left" bordered>
          <NDescriptionsItem label="通知编号">{{ detail.id }}</NDescriptionsItem>
          <NDescriptionsItem label="通知类型">{{ detail.type }}</NDescriptionsItem>
          <NDescriptionsItem label="发送对象">{{ detail.target }}</NDescriptionsItem>
          <NDescriptionsItem label="状态">{{ detail.status }}</NDescriptionsItem>
          <NDescriptionsItem label="发送者">{{ detail.createdBy }}</NDescriptionsItem>
          <NDescriptionsItem label="发送时间">{{ detail.sentAt }}</NDescriptionsItem>
          <NDescriptionsItem label="发送渠道">
            <NSpace :size="6">
              <NTag v-for="channel in detail.channels" :key="channel" size="small" type="info">
                {{ channel }}
              </NTag>
            </NSpace>
          </NDescriptionsItem>
          <NDescriptionsItem label="阅读率">{{ readRate }}%</NDescriptionsItem>
        </NDescriptions>
      </NCard>

      <NCard :bordered="false" class="card-wrapper">
        <h3 class="m-0 mb-12px text-16px font-semibold">通知正文</h3>
        <NAlert type="info" :show-icon="false">
          {{ detail.content }}
        </NAlert>
      </NCard>

      <NCard :bordered="false" class="card-wrapper">
        <h3 class="m-0 mb-12px text-16px font-semibold">投递结果</h3>
        <div class="grid grid-cols-1 gap-12px md:grid-cols-3">
          <NStatistic label="目标用户" :value="detail.delivery.total" />
          <NStatistic label="已送达" :value="detail.delivery.delivered" />
          <NStatistic label="已阅读" :value="detail.delivery.read" />
        </div>
      </NCard>
    </template>

    <NCard v-else :bordered="false" class="card-wrapper">
      <NEmpty description="未找到通知">
        <template #extra>
          <NButton @click="backToList">返回列表</NButton>
        </template>
      </NEmpty>
    </NCard>
  </NSpace>
</template>
