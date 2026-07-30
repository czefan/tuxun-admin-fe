<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { fetchAdminStats } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import { useAuthStore } from '@/store/modules/auth';

interface OverviewCard {
  title: string;
  value: number | null;
  description: string;
  route: 'review_photos' | 'review_attempts' | 'review_comments' | 'operation_feedback' | 'system_users';
}

const authStore = useAuthStore();
const { routerPushByKey } = useRouterPush();
const loading = ref(false);
const error = ref(false);
const alive = ref(true);
const counts = ref({ photos: null, attempts: null, comments: null, feedback: null, users: null } as Record<
  'photos' | 'attempts' | 'comments' | 'feedback' | 'users',
  number | null
>);

const cards = computed<OverviewCard[]>(() => [
  { title: '待审核投稿', value: counts.value.photos, description: '等待人工确认的机位投稿', route: 'review_photos' },
  {
    title: '待审核答题',
    value: counts.value.attempts,
    description: '等待判断答题结果的记录',
    route: 'review_attempts'
  },
  { title: '待审核评论', value: counts.value.comments, description: '等待内容审核的评论', route: 'review_comments' },
  {
    title: '待处理反馈',
    value: counts.value.feedback,
    description: '等待管理员解决的用户反馈',
    route: 'operation_feedback'
  },
  { title: '用户总数', value: counts.value.users, description: '当前可查询到的全部用户', route: 'system_users' }
]);

async function loadOverview() {
  loading.value = true;
  error.value = false;

  const { data: stats, error: err } = await fetchAdminStats();

  if (!alive.value) return;

  if (stats) {
    counts.value = {
      photos: stats.pending_photo_count ?? null,
      attempts: stats.pending_attempt_count ?? null,
      comments: stats.pending_comment_count ?? null,
      feedback: stats.pending_feedback_count ?? null,
      users: stats.user_count ?? null
    };
  }
  error.value = Boolean(err);
  loading.value = false;
}

onMounted(loadOverview);
onBeforeUnmount(() => {
  alive.value = false;
});
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-16px">
        <div>
          <h2 class="m-0 text-22px font-semibold">图寻后台工作台</h2>
          <p class="mb-0 mt-8px text-14px text-#777">
            {{ authStore.userInfo.nickname || authStore.userInfo.username }}，当前权限为 Level
            {{ authStore.userInfo.level }}。
          </p>
        </div>
        <NSpace>
          <NButton :loading="loading" @click="loadOverview">刷新待办</NButton>
          <NButton type="primary" @click="routerPushByKey('operation_notice')">发布通知</NButton>
        </NSpace>
      </div>
    </NCard>

    <NAlert v-if="error" type="warning" title="部分统计加载失败">
      已保留成功返回的统计结果，可点击“刷新待办”重试。
    </NAlert>

    <NGrid :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
      <NGi v-for="card in cards" :key="card.title" span="24 s:12 l:6">
        <NCard :bordered="false" class="card-wrapper cursor-pointer" hoverable @click="routerPushByKey(card.route)">
          <NStatistic :label="card.title" :value="card.value ?? '--'" />
          <p class="mb-0 mt-8px text-13px text-#888">{{ card.description }}</p>
        </NCard>
      </NGi>
    </NGrid>

    <NCard :bordered="false" class="card-wrapper" title="首期后台能力">
      <NGrid :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
        <NGi span="24 m:8">
          <NAlert type="warning" title="审核管理">投稿、答题与评论审核均直接读取待办接口。</NAlert>
        </NGi>
        <NGi span="24 m:8"><NAlert type="info" title="运营管理">活动、通知和反馈只保留后端已有能力。</NAlert></NGi>
        <NGi span="24 m:8">
          <NAlert type="success" title="商城管理">奖品和兑换记录的写操作完成后重新读取后端数据。</NAlert>
        </NGi>
      </NGrid>
    </NCard>
  </NSpace>
</template>
