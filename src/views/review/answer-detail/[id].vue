<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import ReviewCompareDetail from '../components/review-compare-detail.vue';
import { useRouterPush } from '@/hooks/common/router';
import { useTabStore } from '@/store/modules/tab';

function createSceneImage(title: string, accent: string, sky: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 420">
      <rect width="720" height="420" fill="${sky}"/>
      <rect y="270" width="720" height="150" fill="#6f8f72"/>
      <rect x="80" y="118" width="245" height="160" rx="8" fill="#f7f0df"/>
      <rect x="112" y="150" width="52" height="80" fill="#8fb4c8"/>
      <rect x="186" y="150" width="52" height="80" fill="#8fb4c8"/>
      <rect x="260" y="150" width="36" height="128" fill="#9d7454"/>
      <path d="M420 282c45-86 110-86 158 0" fill="${accent}"/>
      <path d="M430 282h138v38H430z" fill="#7a5b48"/>
      <circle cx="562" cy="104" r="44" fill="#f5d26b"/>
      <text x="42" y="382" fill="#243226" font-family="Arial" font-size="32" font-weight="700">${title}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const route = useRoute();
const { routerPushByKey } = useRouterPush();
const tabStore = useTabStore();

const detailMap = {
  'A-2001': {
    id: 'A-2001',
    title: '图书馆西侧台阶机位',
    applicantLabel: '答题人',
    applicantName: '南风',
    submittedAt: '2026-06-24 19:02',
    status: '待审核',
    riskLevel: 'low' as const,
    photos: [
      {
        title: '题目原图',
        url: createSceneImage('Question View', '#7c9d6d', '#dcebf2'),
        description: '系统题目标准机位'
      },
      {
        title: '答题照片',
        url: createSceneImage('Submitted View', '#78996b', '#d7e8f0'),
        description: '用户现场实时拍摄'
      }
    ],
    imageCompare: {
      similarity: 86,
      matched: true,
      reason: '建筑轮廓、台阶角度与主要参照物一致，建议结合定位和拍摄时间通过。'
    },
    locationCompare: {
      target: {
        latitude: 31.23058,
        longitude: 121.47374,
        address: '校图书馆西侧台阶'
      },
      submitted: {
        latitude: 31.23066,
        longitude: 121.47382,
        address: '校图书馆西侧入口附近'
      },
      distanceMeters: 12,
      passed: true,
      thresholdMeters: 50
    },
    note: '图片和定位均在合理范围内。'
  }
};

const reviewId = computed(() => route.params.id as string);
const detail = computed(() => detailMap[reviewId.value as keyof typeof detailMap]);
const pageTitle = computed(() => (detail.value ? `${detail.value.title}审核` : '答题审核详情'));

function backToList() {
  routerPushByKey('review_answer');
}

watchEffect(() => {
  tabStore.setTabLabel(pageTitle.value);
});
</script>

<template>
  <ReviewCompareDetail v-if="detail" :detail="detail" back-route-key="review_answer" />
  <NCard v-else :bordered="false" class="card-wrapper">
    <NEmpty description="未找到答题审核记录">
      <template #extra>
        <NButton @click="backToList">返回列表</NButton>
      </template>
    </NEmpty>
  </NCard>
</template>
