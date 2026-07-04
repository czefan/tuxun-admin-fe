<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import ReviewCompareDetail from '../components/review-compare-detail.vue';
import { useRouterPush } from '@/hooks/common/router';
import { useTabStore } from '@/store/modules/tab';

function createSceneImage(title: string, accent: string, water: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 420">
      <rect width="720" height="420" fill="#dbeef0"/>
      <rect y="250" width="720" height="170" fill="${water}"/>
      <path d="M0 260c95-32 152-32 244 0s148 32 244 0 148-32 232 0v160H0z" fill="#9cc7c6"/>
      <rect x="78" y="196" width="222" height="28" rx="8" fill="#6b5848"/>
      <rect x="98" y="224" width="18" height="72" fill="#5d493c"/>
      <rect x="262" y="224" width="18" height="72" fill="#5d493c"/>
      <circle cx="492" cy="132" r="58" fill="${accent}"/>
      <path d="M390 214c62-94 144-94 206 0" fill="#57836a"/>
      <text x="42" y="382" fill="#1e3739" font-family="Arial" font-size="32" font-weight="700">${title}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const route = useRoute();
const { routerPushByKey } = useRouterPush();
const tabStore = useTabStore();

const detailMap = {
  'Q-1001': {
    id: 'Q-1001',
    title: '图书馆西侧台阶机位',
    applicantLabel: '投稿人',
    applicantName: '林同学',
    submittedAt: '2026-06-24 18:20',
    status: '待审核',
    riskLevel: 'medium' as const,
    photos: [
      {
        title: '投稿图片',
        url: createSceneImage('Submission', '#f1ca68', '#88b6bb'),
        description: '用户上传的题目图片'
      },
      {
        title: '参考机位',
        url: createSceneImage('Reference', '#eec762', '#83b0b6'),
        description: '系统历史机位参考'
      }
    ],
    imageCompare: {
      similarity: 74,
      matched: false,
      reason: '主体场景接近，但边缘参照物缺失，建议人工确认题目描述和机位角度。'
    },
    locationCompare: {
      target: {
        latitude: 31.23058,
        longitude: 121.47374,
        address: '校图书馆西侧台阶'
      },
      submitted: {
        latitude: 31.23091,
        longitude: 121.4739,
        address: '校图书馆西侧绿地'
      },
      distanceMeters: 39,
      passed: true,
      thresholdMeters: 80
    },
    note: '图片需要复核，定位在允许范围内。'
  },
  'Q-1002': {
    id: 'Q-1002',
    title: '湖边长椅倒影',
    applicantLabel: '投稿人',
    applicantName: 'Czefan',
    submittedAt: '2026-06-24 17:42',
    status: '待审核',
    riskLevel: 'low' as const,
    photos: [
      {
        title: '投稿图片',
        url: createSceneImage('Bench View', '#efc25f', '#80b8c2'),
        description: '用户上传的题目图片'
      },
      {
        title: '参考机位',
        url: createSceneImage('Lake Ref', '#f0c96a', '#7db2bd'),
        description: '系统历史机位参考'
      }
    ],
    imageCompare: {
      similarity: 91,
      matched: true,
      reason: '长椅、湖面边线和背景轮廓一致，图片可信度较高。'
    },
    locationCompare: {
      target: {
        latitude: 31.23118,
        longitude: 121.47438,
        address: '校园湖区北侧长椅'
      },
      submitted: {
        latitude: 31.23123,
        longitude: 121.47431,
        address: '校园湖区步道'
      },
      distanceMeters: 9,
      passed: true,
      thresholdMeters: 80
    },
    note: '图片和定位均可通过。'
  }
};

const reviewId = computed(() => route.params.id as string);
const detail = computed(() => detailMap[reviewId.value as keyof typeof detailMap]);
const pageTitle = computed(() => (detail.value ? `${detail.value.title}审核` : '投稿审核详情'));

function backToList() {
  routerPushByKey('review_question');
}

watchEffect(() => {
  tabStore.setTabLabel(pageTitle.value);
});
</script>

<template>
  <ReviewCompareDetail v-if="detail" :detail="detail" back-route-key="review_question" />
  <NCard v-else :bordered="false" class="card-wrapper">
    <NEmpty description="未找到投稿审核记录">
      <template #extra>
        <NButton @click="backToList">返回列表</NButton>
      </template>
    </NEmpty>
  </NCard>
</template>
