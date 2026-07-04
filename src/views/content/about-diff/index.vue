<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { NButton, NCard, NDescriptions, NDescriptionsItem, NPageHeader, NSpace } from 'naive-ui';
import { useRouterPush } from '@/hooks/common/router';

interface AboutSnapshot {
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  contactTitle: string;
  contactContent: string;
  linkTitle: string;
  linkUrl: string;
}

interface Row {
  id: string;
  version: string;
  updater: string;
  summary: string;
  updatedAt: string;
  snapshot: AboutSnapshot;
}

// 模拟历史数据，和主页保持一致
const data: Row[] = [
  {
    id: 'ABOUT-003',
    version: 'v3 (当前)',
    updater: '超级管理员',
    summary: '更新项目介绍与官网链接',
    updatedAt: '2026-06-24 16:30',
    snapshot: {
      heroTitle: '图寻',
      heroSubtitle: '围绕校园地点解密和机位破解设计的小程序活动',
      intro:
        '图寻是围绕校园地点解密和机位破解设计的小程序活动。用户通过题目图片寻找真实地点，并在现场拍摄同机位照片完成挑战。',
      contactTitle: '联系我们',
      contactContent: '如需反馈活动问题，请通过小程序反馈入口提交信息。',
      linkTitle: '活动官网',
      linkUrl: 'https://tuxun.example.com'
    }
  },
  {
    id: 'ABOUT-002',
    version: 'v2',
    updater: '南风',
    summary: '修正了部分介绍错字，补充客服QQ群',
    updatedAt: '2026-06-20 10:15',
    snapshot: {
      heroTitle: '图寻小程序',
      heroSubtitle: '校园解密与寻宝小程序',
      intro: '一个帮助学生探索校园并找到有趣地点的解密应用。',
      contactTitle: '联系反馈',
      contactContent: '反馈请联系 QQ群：12345678',
      linkTitle: '活动官网',
      linkUrl: 'http://test.com'
    }
  },
  {
    id: 'ABOUT-001',
    version: 'v1',
    updater: '系统初始化',
    summary: '首次创建关于我们页面配置',
    updatedAt: '2026-05-20 09:00',
    snapshot: {
      heroTitle: '图寻',
      heroSubtitle: '探索你的学校',
      intro: '寻找有趣的校园打卡地。',
      contactTitle: '联系',
      contactContent: '暂无说明',
      linkTitle: '官网',
      linkUrl: ''
    }
  }
];

const route = useRoute();
const { routerBack } = useRouterPush();

const currentId = computed(() => (route.query.id as string) || 'ABOUT-003');

// 找到当前选中的历史版本以及前一个版本
const currentIndex = computed(() => data.findIndex(item => item.id === currentId.value));
const currentRecord = computed<Row | undefined>(() => data[currentIndex.value]);
const prevRecord = computed<Row | undefined>(() => {
  if (currentIndex.value === -1 || currentIndex.value === data.length - 1) {
    return undefined;
  }
  return data[currentIndex.value + 1];
});

// 计算有变动的字段
function isChanged(field: keyof AboutSnapshot) {
  if (!prevRecord.value) return false;
  return currentRecord.value?.snapshot[field] !== prevRecord.value.snapshot[field];
}
</script>

<template>
  <NSpace vertical :size="16">
    <NCard :bordered="false" class="card-wrapper">
      <NPageHeader title="关于我们修改历史" @back="routerBack">
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
        <NDescriptions :column="1" bordered label-placement="left" label-width="120">
          <NDescriptionsItem
            label="首屏标题"
            :class="{ 'bg-#fee2e2! text-#991b1b line-through': isChanged('heroTitle') }"
          >
            {{ prevRecord ? prevRecord.snapshot.heroTitle : '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="首屏副标题"
            :class="{ 'bg-#fee2e2! text-#991b1b line-through': isChanged('heroSubtitle') }"
          >
            {{ prevRecord ? prevRecord.snapshot.heroSubtitle : '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="项目介绍" :class="{ 'bg-#fee2e2! text-#991b1b line-through': isChanged('intro') }">
            {{ prevRecord ? prevRecord.snapshot.intro : '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="联系区标题"
            :class="{ 'bg-#fee2e2! text-#991b1b line-through': isChanged('contactTitle') }"
          >
            {{ prevRecord ? prevRecord.snapshot.contactTitle : '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="联系说明"
            :class="{ 'bg-#fee2e2! text-#991b1b line-through': isChanged('contactContent') }"
          >
            {{ prevRecord ? prevRecord.snapshot.contactContent : '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="链接标题"
            :class="{ 'bg-#fee2e2! text-#991b1b line-through': isChanged('linkTitle') }"
          >
            {{ prevRecord ? prevRecord.snapshot.linkTitle : '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="外部链接"
            :class="{ 'bg-#fee2e2! text-#991b1b line-through': isChanged('linkUrl') }"
          >
            {{ prevRecord ? prevRecord.snapshot.linkUrl : '-' }}
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>

      <!-- 修改后 (右侧) -->
      <NCard
        :bordered="false"
        title="修改后 (当前版本)"
        class="card-wrapper border border-solid border-#bbf7d0 bg-#f8fff9"
      >
        <NDescriptions :column="1" bordered label-placement="left" label-width="120">
          <NDescriptionsItem
            label="首屏标题"
            :class="{ 'bg-#dcfce7! text-#166534 font-semibold': isChanged('heroTitle') }"
          >
            {{ currentRecord.snapshot.heroTitle }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="首屏副标题"
            :class="{ 'bg-#dcfce7! text-#166534 font-semibold': isChanged('heroSubtitle') }"
          >
            {{ currentRecord.snapshot.heroSubtitle }}
          </NDescriptionsItem>
          <NDescriptionsItem label="项目介绍" :class="{ 'bg-#dcfce7! text-#166534 font-semibold': isChanged('intro') }">
            {{ currentRecord.snapshot.intro }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="联系区标题"
            :class="{ 'bg-#dcfce7! text-#166534 font-semibold': isChanged('contactTitle') }"
          >
            {{ currentRecord.snapshot.contactTitle }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="联系说明"
            :class="{ 'bg-#dcfce7! text-#166534 font-semibold': isChanged('contactContent') }"
          >
            {{ currentRecord.snapshot.contactContent }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="链接标题"
            :class="{ 'bg-#dcfce7! text-#166534 font-semibold': isChanged('linkTitle') }"
          >
            {{ currentRecord.snapshot.linkTitle }}
          </NDescriptionsItem>
          <NDescriptionsItem
            label="外部链接"
            :class="{ 'bg-#dcfce7! text-#166534 font-semibold': isChanged('linkUrl') }"
          >
            {{ currentRecord.snapshot.linkUrl || '无' }}
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>
    </div>
  </NSpace>
</template>
