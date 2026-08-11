<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/modules/auth';
import { getCallbackUrl, validateAndClearState } from '@/service/auth/oauth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const errorMessage = ref('');

function pickQuery(key: string) {
  const value = route.query[key];
  return typeof value === 'string' ? value : '';
}

async function completeAuthentication() {
  errorMessage.value = '';

  // 1. 认证侧显式报错优先（error / error_description），别让用户看「缺少 code」这种误导性提示
  const authError = pickQuery('error_description') || pickQuery('error');
  if (authError) {
    errorMessage.value = `统一认证返回错误：${authError}`;
    return;
  }

  // 2. state 校验必须在读 code 之前做，且一次性消费 —— 校验失败就不该拿 code 去换
  if (!validateAndClearState(pickQuery('state'))) {
    errorMessage.value = '登录状态校验失败，请返回登录页重新发起认证。';
    return;
  }

  const code = pickQuery('code');
  if (!code) {
    errorMessage.value = '登录回调缺少 code，请返回登录页重新发起认证。';
    return;
  }

  // 3. redirect_uri 必须与授权阶段完全一致 —— 同一个 getCallbackUrl()
  const success = await authStore.completeLogin(code, getCallbackUrl());
  if (!success) {
    // 优先展示后端返回的真实原因（redirect_uri 不在白名单 / code 失效等），别再猜一句话。
    // forbidden 只在本轮「回调成功但等级不足」时成立（此时 loginError 为空）；
    // 若残留着上一次的 forbidden 而本轮回调失败，必须展示本轮的真实错误，不能被旧的归因盖掉
    errorMessage.value =
      authStore.sessionStatus === 'forbidden' && !authStore.loginError
        ? '当前账号无后台管理权限（需 Level 2 及以上）。'
        : authStore.loginError || '登录失败：请返回登录页重试（凭据有效期 5 分钟且只能使用一次）。';
    return;
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
              <!-- code 一次性、state 已消费，原地重试在新流程下必然再失败一次，收敛为「返回重新认证」 -->
              <NButton type="primary" @click="backToLogin">返回登录页重新认证</NButton>
            </NSpace>
          </template>
        </NResult>
      </template>
    </NCard>
  </div>
</template>
