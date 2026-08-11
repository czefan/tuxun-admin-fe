<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getPaletteColorByNumber, mixColor } from '@sa/color';
import { useAuthStore } from '@/store/modules/auth';
import { useThemeStore } from '@/store/modules/theme';
import { isOAuthConfigured } from '@/service/auth/oauth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const bgThemeColor = computed(() =>
  themeStore.darkMode ? getPaletteColorByNumber(themeStore.themeColor, 600) : themeStore.themeColor
);
const bgColor = computed(() => mixColor('#ffffff', themeStore.themeColor, themeStore.darkMode ? 0.5 : 0.2));
const displayName = computed(
  () => authStore.userInfo.nickname || authStore.userInfo.username || authStore.userInfo.netid
);

function login() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
  authStore.beginLogin(redirect);
}

/** mock 下走完整回调链路登录指定等级（L1 应被拒 / L2 进入 / L3 全权限），区别于上方免 SSO 直连 */
function mockCallbackLogin(level: 1 | 2 | 3) {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
  authStore.beginLogin(redirect, level);
}

async function logoutAndRetry() {
  await authStore.logout();
}

/** 开发 / 测试环境的免 SSO 登录入口；生产构建下该常量为 false，整段会被摇掉 */
const showTestLogin = import.meta.env.MODE !== 'prod';

const isMock = import.meta.env.VITE_ENABLE_MOCK === 'Y';
/** 未配置授权服务时置灰登录按钮：mock 模式走短路不需要真实配置，故排除 */
const oauthDisabled = computed(() => !isMock && !isOAuthConfigured());

/** mock 登录页的三个等级按钮（L3 超管 / L2 普通管理员 / L1 普通用户），按等级驱动 mock 回调登录 */
const LEVEL_META: { level: 1 | 2 | 3; label: string; type: 'warning' | 'primary' | 'default' }[] = [
  { level: 3, label: '超级管理员', type: 'warning' },
  { level: 2, label: '普通管理员', type: 'primary' },
  { level: 1, label: '普通用户', type: 'default' }
];

const testUserId = ref<number | null>(null);
const testPassword = ref('');

async function testLogin(userId: number, password: string) {
  const success = await authStore.testLogin(userId, password);
  if (success) {
    await router.replace(authStore.consumeLoginRedirect());
  }
}

function handleManualTestLogin() {
  if (!testUserId.value) {
    window.$message?.warning('请输入要登录的用户 ID');
    return;
  }
  return testLogin(testUserId.value, testPassword.value);
}
</script>

<template>
  <div class="relative size-full flex-center overflow-hidden" :style="{ backgroundColor: bgColor }">
    <WaveBg :theme-color="bgThemeColor" />
    <NCard :bordered="false" class="relative z-4 w-420px rd-12px lt-sm:w-320px">
      <header class="flex-y-center gap-16px">
        <SystemLogo class="size-64px lt-sm:size-52px" />
        <div>
          <h1 class="m-0 text-25px font-semibold">图寻后台管理</h1>
          <p class="mb-0 mt-5px text-13px text-#888">仅 Level 2、Level 3 管理员可进入</p>
        </div>
        <ThemeSchemaSwitch
          :theme-schema="themeStore.themeScheme"
          :show-tooltip="false"
          class="ml-auto text-20px"
          @switch="themeStore.toggleThemeScheme"
        />
      </header>

      <main class="pt-28px">
        <NAlert v-if="authStore.hasSession && !authStore.isAdmin" type="warning" title="当前账号无后台权限">
          已登录账号 {{ displayName }} 的等级为 Level {{ authStore.userInfo.level }}。请退出后使用管理员账号重新认证。
        </NAlert>
        <NAlert v-else type="info" :title="isMock ? 'Mock 模拟登录' : '学校统一认证'">
          {{
            isMock
              ? '当前为 Mock 模式，选择等级走模拟统一认证回调链路（Level 1 会被拒）。'
              : '点击下方按钮后将跳转到学校统一认证页面，认证完成后会自动返回管理端。'
          }}
        </NAlert>

        <NButton
          v-if="authStore.hasSession && !authStore.isAdmin"
          class="mt-32px"
          type="warning"
          size="large"
          block
          @click="logoutAndRetry"
        >
          退出当前账号
        </NButton>

        <!-- Mock：主登录就是 3 个等级的回调按钮（完整链路：state 校验 → 换会话 → 等级校验 → 回跳） -->
        <div v-else-if="isMock" class="mt-32px grid grid-cols-3 gap-8px">
          <NButton
            v-for="meta in LEVEL_META"
            :key="meta.level"
            :type="meta.type"
            secondary
            block
            :loading="authStore.loginLoading"
            @click="mockCallbackLogin(meta.level)"
          >
            L{{ meta.level }} {{ meta.label }}
          </NButton>
        </div>

        <NTooltip v-else :disabled="!oauthDisabled">
          <template #trigger>
            <div>
              <!-- 注意：margin 必须写在按钮本体，写在外层 NTooltip 上不会生效（naive-ui 把 class 挂到浮层） -->
              <NButton class="mt-32px" type="primary" size="large" block :disabled="oauthDisabled" @click="login">
                去登录
              </NButton>
            </div>
          </template>
          尚未配置 OAuth 授权服务（VITE_OAUTH_BASE_URL / VITE_OAUTH_CLIENT_ID），请联系管理员配置后重试
        </NTooltip>

        <!-- 真实模式：跳过 OAuth，按用户 ID 手填测试登录 -->
        <NCollapse v-if="showTestLogin && !isMock" class="mt-24px">
          <NCollapseItem title="开发测试登录" name="test-login">
            <NSpace vertical :size="12">
              <NInputNumber v-model:value="testUserId" placeholder="用户 ID" :show-button="false" class="w-full" />
              <NInput
                v-model:value="testPassword"
                type="password"
                placeholder="测试登录密码"
                show-password-on="click"
                @keyup.enter="handleManualTestLogin"
              />
              <NButton type="warning" secondary block :loading="authStore.loginLoading" @click="handleManualTestLogin">
                以该账号登录
              </NButton>

              <p class="m-0 text-12px text-#999">仅开发 / 测试环境可用，生产构建不会包含此入口。</p>
            </NSpace>
          </NCollapseItem>
        </NCollapse>
      </main>
    </NCard>
  </div>
</template>
