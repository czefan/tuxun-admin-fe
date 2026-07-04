<script setup lang="ts">
import { useRouterPush } from '@/hooks/common/router';

interface OverviewCard {
  title: string;
  value: string;
  description: string;
}

interface WorkItem {
  title: string;
  description: string;
  tag: string;
  type: 'warning' | 'error' | 'info' | 'success';
}

const overviewCards: OverviewCard[] = [
  { title: '待审核投稿', value: '18', description: '用户投稿题目等待人工确认' },
  { title: '待审核答题', value: '42', description: '现场答题照片与定位待核验' },
  { title: '反馈相关', value: '7', description: '用户意见反馈与纠错' },
  { title: '注册用户', value: '1,284', description: '当前累计注册用户' }
];

const workItems: WorkItem[] = [
  {
    title: '优先处理投稿与答题审核',
    description: '审核流决定前台内容是否能公开，建议作为每日运营第一入口。',
    tag: '审核管理',
    type: 'warning'
  },
  {
    title: '关注用户意见反馈',
    description: '反馈与纠错直接影响用户体验，建议每日定时跟进与回复。',
    tag: '反馈管理',
    type: 'info'
  },
  {
    title: '维护商城库存与核销',
    description: '积分商品库存、上下架和核销状态会直接影响用户兑换体验。',
    tag: '商城管理',
    type: 'success'
  }
];

const { routerPushByKey } = useRouterPush();
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-16px">
        <div>
          <h2 class="m-0 text-22px font-semibold">图寻后台工作台</h2>
          <p class="mt-8px text-14px text-#666">面向机位投稿审核、内容安全、通知运营、商城与奖品核销。</p>
        </div>
        <NSpace>
          <NButton type="primary" @click="routerPushByKey('review_answer')">答题审核</NButton>
          <NButton @click="routerPushByKey('notice_list-create')">发布通知</NButton>
          <NButton @click="routerPushByKey('mall_redemption')">奖品核销</NButton>
        </NSpace>
      </div>
    </NCard>

    <NGrid :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
      <NGi v-for="item in overviewCards" :key="item.title" span="24 s:12 l:6">
        <NCard :bordered="false" class="card-wrapper">
          <NStatistic :label="item.title" :value="item.value" />
          <p class="mb-0 mt-8px text-13px text-#888">{{ item.description }}</p>
        </NCard>
      </NGi>
    </NGrid>

    <NGrid :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
      <NGi span="24 l:14">
        <NCard title="今日处理重点" :bordered="false" class="card-wrapper">
          <NList>
            <NListItem v-for="item in workItems" :key="item.title">
              <NThing :title="item.title" :description="item.description">
                <template #avatar>
                  <NTag :type="item.type" round>{{ item.tag }}</NTag>
                </template>
              </NThing>
            </NListItem>
          </NList>
        </NCard>
      </NGi>
      <NGi span="24 l:10">
        <NCard title="后台模块" :bordered="false" class="card-wrapper">
          <NSpace vertical>
            <NAlert type="warning" title="审核管理">投稿审核、答题照片与定位真实性审核。</NAlert>
            <NAlert type="info" title="官方运营">官方题目、系统通知和活动运营配置。</NAlert>
            <NAlert type="info" title="反馈管理">处理用户意见反馈与纠错内容。</NAlert>
            <NAlert type="success" title="用户管理">查看用户基础信息、积分和账号状态。</NAlert>
            <NAlert type="success" title="商城管理">商城商品和奖品核销。</NAlert>
          </NSpace>
        </NCard>
      </NGi>
    </NGrid>
  </NSpace>
</template>
