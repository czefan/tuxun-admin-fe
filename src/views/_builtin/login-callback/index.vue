<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/modules/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const errorMessage = ref('');

const guidConsumed = ref(false);

async function completeAuthentication() {
  errorMessage.value = '';
  const guid = typeof route.query.guid === 'string' ? route.query.guid : '';

  if (!guid && !guidConsumed.value) {
    errorMessage.value = '登录回调缺少 guid，请重新发起认证。';
    return;
  }

  const currentGuid = guidConsumed.value ? '' : guid;
  const success = await authStore.completeLogin(currentGuid);
  if (!success) {
    if (authStore.sessionStatus === 'forbidden') {
      errorMessage.value = '当前账号无后台管理权限（Level 2+）。';
    } else {
      errorMessage.value = '认证未载入，请重试或重新登录。';
    }
    return;
  }

  guidConsumed.value = true;
  if (route.query.guid) {
    await router.replace({ query: {} });
  }

  await router.replace(authStore.consumeLoginRedirect());
}

function backToLogin() {
  router.replace({ name: 'login' });
}

onMounted(completeAuthentication);
</script>

<template>
  <div class="size-full flex-center bg-layout">
    <NCard :bordered="false" class="w-420px text-center lt-sm:w-320px">
      <NSpin v-if="authStore.loginLoading" size="large" />
      <template v-if="authStore.loginLoading">
        <h2 class="mb-0 mt-18px">正在建立后台会话</h2>
        <p class="mb-0 mt-8px text-#888">请稍候，不要关闭此页面。</p>
      </template>
      <template v-else-if="errorMessage">
        <NResult status="error" title="登录失败" :description="errorMessage">
          <template #footer>
            <NSpace justify="center">
              <NButton @click="completeAuthentication">重试</NButton>
              <NButton type="primary" @click="backToLogin">返回登录页</NButton>
            </NSpace>
          </template>
        </NResult>
      </template>
    </NCard>
  </div>
</template>
