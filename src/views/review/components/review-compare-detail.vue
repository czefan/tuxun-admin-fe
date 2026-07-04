<script setup lang="ts">
import { computed } from 'vue';
import type { RouteKey } from '@elegant-router/types';
import { useRouterPush } from '@/hooks/common/router';

interface ReviewPhoto {
  title: string;
  url: string;
  description: string;
}

interface LocationPoint {
  latitude: number;
  longitude: number;
  address: string;
}

interface ReviewCompareDetail {
  id: string;
  title: string;
  applicantLabel: string;
  applicantName: string;
  submittedAt: string;
  status: string;
  riskLevel: 'low' | 'medium' | 'high';
  photos: ReviewPhoto[];
  imageCompare: {
    similarity: number;
    matched: boolean;
    reason: string;
  };
  locationCompare: {
    target: LocationPoint;
    submitted: LocationPoint;
    distanceMeters: number;
    passed: boolean;
    thresholdMeters: number;
  };
  note: string;
}

const props = defineProps<{
  detail: ReviewCompareDetail;
  backRouteKey: RouteKey;
}>();

const { routerPushByKey } = useRouterPush();

const riskType = computed(() => {
  const typeMap = {
    low: 'success',
    medium: 'warning',
    high: 'error'
  } as const;

  return typeMap[props.detail.riskLevel];
});

function backToList() {
  routerPushByKey(props.backRouteKey);
}
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <div class="flex flex-wrap items-center justify-between gap-12px">
        <div>
          <h2 class="m-0 text-20px font-semibold">{{ detail.title }}</h2>
          <p class="mt-6px text-13px text-#777">
            {{ detail.id }} · {{ detail.applicantLabel }}：{{ detail.applicantName }} · {{ detail.submittedAt }}
          </p>
        </div>
        <NSpace>
          <NButton @click="backToList">返回列表</NButton>
          <NButton type="error" secondary>驳回</NButton>
          <NButton type="primary">通过</NButton>
        </NSpace>
      </div>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <NDescriptions :column="4" label-placement="left" bordered>
        <NDescriptionsItem label="审核状态">{{ detail.status }}</NDescriptionsItem>
        <NDescriptionsItem label="风险等级">
          <NTag :type="riskType">{{ detail.riskLevel }}</NTag>
        </NDescriptionsItem>
        <NDescriptionsItem label="图片相似度">{{ detail.imageCompare.similarity }}%</NDescriptionsItem>
        <NDescriptionsItem label="定位偏差">{{ detail.locationCompare.distanceMeters }}m</NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <div class="mb-12px flex items-center justify-between">
        <h3 class="m-0 text-16px font-semibold">图片查看</h3>
        <NTag :type="detail.imageCompare.matched ? 'success' : 'warning'">
          {{ detail.imageCompare.matched ? '图片匹配' : '需人工复核' }}
        </NTag>
      </div>
      <NImageGroup>
        <div class="grid grid-cols-1 gap-16px lg:grid-cols-2">
          <div v-for="photo in detail.photos" :key="photo.title" class="min-w-0">
            <div class="mb-8px flex items-center justify-between gap-8px">
              <span class="text-14px font-medium">{{ photo.title }}</span>
              <span class="truncate text-12px text-#888">{{ photo.description }}</span>
            </div>
            <NImage
              :src="photo.url"
              object-fit="cover"
              class="h-260px w-full overflow-hidden rounded-6px border border-#eee border-solid"
            />
          </div>
        </div>
      </NImageGroup>
      <NAlert class="mt-14px" type="info" :show-icon="false">
        {{ detail.imageCompare.reason }}
      </NAlert>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <div class="mb-12px flex items-center justify-between">
        <h3 class="m-0 text-16px font-semibold">定位对比</h3>
        <NTag :type="detail.locationCompare.passed ? 'success' : 'error'">
          {{ detail.locationCompare.passed ? '范围内' : '超出范围' }}
        </NTag>
      </div>
      <NDescriptions :column="2" label-placement="left" bordered>
        <NDescriptionsItem label="目标位置">{{ detail.locationCompare.target.address }}</NDescriptionsItem>
        <NDescriptionsItem label="提交位置">{{ detail.locationCompare.submitted.address }}</NDescriptionsItem>
        <NDescriptionsItem label="目标坐标">
          {{ detail.locationCompare.target.latitude }}, {{ detail.locationCompare.target.longitude }}
        </NDescriptionsItem>
        <NDescriptionsItem label="提交坐标">
          {{ detail.locationCompare.submitted.latitude }}, {{ detail.locationCompare.submitted.longitude }}
        </NDescriptionsItem>
        <NDescriptionsItem label="允许范围">{{ detail.locationCompare.thresholdMeters }}m</NDescriptionsItem>
        <NDescriptionsItem label="实际偏差">{{ detail.locationCompare.distanceMeters }}m</NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <NCard :bordered="false" class="card-wrapper">
      <h3 class="m-0 mb-12px text-16px font-semibold">审核备注</h3>
      <NInput type="textarea" :default-value="detail.note" :autosize="{ minRows: 3, maxRows: 5 }" />
    </NCard>
  </NSpace>
</template>
