<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { useRouterPush } from '@/hooks/common/router';
import { useTabStore } from '@/store/modules/tab';

const route = useRoute();
const { routerPushByKey } = useRouterPush();
const tabStore = useTabStore();

interface UserDetail {
  id: string;
  nickname: string;
  studentId: string;
  points: number;
  status: string;
  role: string;
  registeredAt: string;
  permissions: string[];
}

const usersMap: Record<string, UserDetail> = {
  'U-0001': {
    id: 'U-0001',
    nickname: '超级管理员',
    studentId: '20260001',
    points: 0,
    status: '正常',
    role: 'super',
    registeredAt: '2026-05-20 09:00',
    permissions: [
      '投稿审核',
      '答题审核',
      '当期题目',
      '往期活动',
      '商品管理',
      '奖品核销',
      '积分规则',
      '通知列表',
      '反馈管理',
      '帮助中心',
      '关于我们',
      '用户列表'
    ]
  },
  'U-1001': {
    id: 'U-1001',
    nickname: '南风',
    studentId: '20261024',
    points: 3200,
    status: '正常',
    role: 'admin',
    registeredAt: '2026-06-01 09:12',
    permissions: ['投稿审核', '答题审核', '当期题目', '往期活动']
  },
  'U-1002': {
    id: 'U-1002',
    nickname: '林同学',
    studentId: '20262048',
    points: 1800,
    status: '正常',
    role: 'user',
    registeredAt: '2026-06-10 14:30',
    permissions: []
  }
};

const userId = computed(() => route.params.id as string);
const detail = computed(() => usersMap[userId.value]);
const pageTitle = computed(() => (detail.value ? `用户详情 - ${detail.value.nickname}` : '用户详情'));

function getRoleLabel(role: string) {
  const roleMap: Record<string, string> = {
    super: '超级管理员',
    admin: '管理员',
    user: '普通用户'
  };
  return roleMap[role] || role;
}

function getRoleTagType(role: string) {
  const typeMap: Record<string, 'error' | 'warning' | 'default'> = {
    super: 'error',
    admin: 'warning',
    user: 'default'
  };
  return typeMap[role] || 'default';
}

function backToList() {
  routerPushByKey('user_list');
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
            {{ detail.id }} · {{ getRoleLabel(detail.role) }} · 注册于 {{ detail.registeredAt }}
          </p>
        </div>
        <NButton @click="backToList">返回列表</NButton>
      </div>
    </NCard>

    <template v-if="detail">
      <div class="grid grid-cols-1 gap-16px lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)]">
        <NCard title="基本资料" :bordered="false" class="card-wrapper">
          <NDescriptions :column="1" label-placement="left" bordered>
            <NDescriptionsItem label="用户 ID">{{ detail.id }}</NDescriptionsItem>
            <NDescriptionsItem label="姓名">{{ detail.nickname }}</NDescriptionsItem>
            <NDescriptionsItem label="学号">{{ detail.studentId }}</NDescriptionsItem>
            <NDescriptionsItem label="当前积分">{{ detail.points }}</NDescriptionsItem>
            <NDescriptionsItem label="账号状态">
              <NTag :type="detail.status === '正常' ? 'success' : 'error'" size="small">
                {{ detail.status }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem label="注册时间">{{ detail.registeredAt }}</NDescriptionsItem>
          </NDescriptions>
        </NCard>

        <NCard title="权限配置信息" :bordered="false" class="card-wrapper">
          <div class="mb-12px flex items-center justify-between">
            <h3 class="m-0 text-15px font-semibold">角色身份</h3>
            <NTag :type="getRoleTagType(detail.role)">{{ getRoleLabel(detail.role) }}</NTag>
          </div>
          <p class="text-13px text-#888 mb-16px">拥有该身份赋予的可视化系统页面及接口操作权限。</p>
          <h3 class="m-0 mb-12px text-15px font-semibold">已配置权限项 ({{ detail.permissions.length }})</h3>
          <div v-if="detail.permissions.length > 0" class="flex flex-wrap gap-8px">
            <NTag v-for="perm in detail.permissions" :key="perm" type="info" size="small" round>
              {{ perm }}
            </NTag>
          </div>
          <NEmpty v-else description="暂无分配任何管理员权限" />
        </NCard>
      </div>
    </template>

    <NCard v-else :bordered="false" class="card-wrapper">
      <NEmpty description="未找到该用户">
        <template #extra>
          <NButton @click="backToList">返回列表</NButton>
        </template>
      </NEmpty>
    </NCard>
  </NSpace>
</template>
