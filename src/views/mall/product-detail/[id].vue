<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { useRouterPush } from '@/hooks/common/router';
import { useTabStore } from '@/store/modules/tab';

interface ProductDetail {
  id: string;
  name: string;
  category: string;
  points: number;
  stock: number;
  status: string;
  imageUrl: string;
  description: string;
  exchangeLimit: string;
  updatedAt: string;
  specs: {
    label: string;
    value: string;
  }[];
}

function createProductImage(title: string, variant: 'keychain' | 'card') {
  const variantSvgMap = {
    keychain: `
      <rect width="720" height="420" fill="#eef4f8"/>
      <circle cx="360" cy="172" r="88" fill="#5a8bb8"/>
      <circle cx="360" cy="172" r="40" fill="#eef4f8"/>
      <rect x="315" y="238" width="90" height="112" rx="18" fill="#f2c76d"/>
      <path d="M328 278h64M328 306h64" stroke="#7e6440" stroke-width="12" stroke-linecap="round"/>
      <circle cx="482" cy="146" r="34" fill="#7cbf8f"/>
      <path d="M406 220c40-44 68-56 104-72" stroke="#7a8b98" stroke-width="18" stroke-linecap="round"/>
    `,
    card: `
      <rect width="720" height="420" fill="#f4f2ea"/>
      <rect x="196" y="92" width="328" height="220" rx="18" fill="#fff" stroke="#d4c49b" stroke-width="10"/>
      <rect x="226" y="124" width="268" height="86" rx="12" fill="#8ab6c9"/>
      <rect x="226" y="232" width="118" height="18" rx="9" fill="#d5c086"/>
      <rect x="226" y="266" width="206" height="16" rx="8" fill="#d9d1bd"/>
      <circle cx="474" cy="260" r="34" fill="#f0c765"/>
      <path d="M268 188c38-52 88-52 126 0" fill="#6f966a"/>
    `
  };

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 420">
      ${variantSvgMap[variant]}
      <rect x="36" y="342" width="420" height="48" rx="8" fill="rgba(255,255,255,.82)"/>
      <text x="56" y="374" fill="#263238" font-family="Arial" font-size="28" font-weight="700">${title}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const route = useRoute();
const { routerPushByKey } = useRouterPush();
const tabStore = useTabStore();

const detailMap: Record<string, ProductDetail> = {
  'P-5001': {
    id: 'P-5001',
    name: '挑战钥匙扣',
    category: '活动周边',
    points: 2800,
    stock: 20,
    status: '上架',
    imageUrl: createProductImage('挑战钥匙扣', 'keychain'),
    description: '完成活动挑战后可兑换的纪念钥匙扣，适合作为阶段性活动奖励。',
    exchangeLimit: '每位用户每期最多兑换 1 件',
    updatedAt: '2026-06-24 12:30',
    specs: [
      { label: '材质', value: '金属挂件 + 亚克力牌' },
      { label: '尺寸', value: '约 45mm x 70mm' },
      { label: '发放方式', value: '线下核销领取' }
    ]
  },
  'P-5002': {
    id: 'P-5002',
    name: '纪念小卡片',
    category: '活动周边',
    points: 1200,
    stock: 50,
    status: '上架',
    imageUrl: createProductImage('纪念小卡片', 'card'),
    description: '活动主题纪念卡片，可作为低积分兑换奖品，用于提升积分消耗频次。',
    exchangeLimit: '每位用户每月最多兑换 3 件',
    updatedAt: '2026-06-23 18:10',
    specs: [
      { label: '材质', value: '300g 铜版纸' },
      { label: '尺寸', value: '90mm x 54mm' },
      { label: '发放方式', value: '线下核销领取' }
    ]
  }
};

const productId = computed(() => route.params.id as string);
const detail = computed(() => detailMap[productId.value]);
const pageTitle = computed(() => (detail.value ? `${detail.value.name}详情` : '商品详情'));

function backToList() {
  routerPushByKey('mall_product');
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
            {{ detail.id }} · {{ detail.category }} · {{ detail.updatedAt }}
          </p>
        </div>
        <NButton @click="backToList">返回列表</NButton>
      </div>
    </NCard>

    <template v-if="detail">
      <div class="grid grid-cols-1 gap-16px lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)]">
        <NCard :bordered="false" class="card-wrapper">
          <div class="mb-12px flex items-center justify-between">
            <h3 class="m-0 text-16px font-semibold">商品图片</h3>
            <NTag type="success">{{ detail.status }}</NTag>
          </div>
          <NImage
            :src="detail.imageUrl"
            object-fit="cover"
            class="h-360px w-full overflow-hidden rounded-6px border border-#eee border-solid"
          />
        </NCard>

        <NCard :bordered="false" class="card-wrapper">
          <NDescriptions :column="1" label-placement="left" bordered>
            <NDescriptionsItem label="商品编号">{{ detail.id }}</NDescriptionsItem>
            <NDescriptionsItem label="商品名称">{{ detail.name }}</NDescriptionsItem>
            <NDescriptionsItem label="所需积分">{{ detail.points }}</NDescriptionsItem>
            <NDescriptionsItem label="库存">{{ detail.stock }}</NDescriptionsItem>
            <NDescriptionsItem label="兑换限制">{{ detail.exchangeLimit }}</NDescriptionsItem>
            <NDescriptionsItem label="更新时间">{{ detail.updatedAt }}</NDescriptionsItem>
          </NDescriptions>
        </NCard>
      </div>

      <NCard :bordered="false" class="card-wrapper">
        <h3 class="m-0 mb-12px text-16px font-semibold">商品说明</h3>
        <NAlert type="info" :show-icon="false">{{ detail.description }}</NAlert>
        <NDescriptions class="mt-14px" :column="3" label-placement="left" bordered>
          <NDescriptionsItem v-for="item in detail.specs" :key="item.label" :label="item.label">
            {{ item.value }}
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>
    </template>

    <NCard v-else :bordered="false" class="card-wrapper">
      <NEmpty description="未找到商品">
        <template #extra>
          <NButton @click="backToList">返回列表</NButton>
        </template>
      </NEmpty>
    </NCard>
  </NSpace>
</template>
