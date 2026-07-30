<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getPaletteColorByNumber, mixColor } from '@sa/color';
import { useAuthStore } from '@/store/modules/auth';
import { useThemeStore } from '@/store/modules/theme';

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

async function logoutAndRetry() {
  await authStore.logout();
}

/** 开发 / 测试环境的免 SSO 登录入口；生产构建下该常量为 false，整段会被摇掉 */
const showTestLogin = import.meta.env.MODE !== 'prod';

const isMock = import.meta.env.VITE_ENABLE_MOCK === 'Y';
/** mock 的 /api/test/login 只校验密码非空，填什么都行 */
const MOCK_PASSWORD = '123456';

/** 等级语义是后端契约，与 mock 数据无关，写死在这里 */
const LEVEL_META = [
  { level: 3, label: '超级管理员', type: 'warning' as const },
  { level: 2, label: '普通管理员', type: 'primary' as const },
  { level: 1, label: '普通用户（应被拒绝）', type: 'default' as const }
];

const mockAccounts = ref<{ id: number; label: string; type: 'warning' | 'primary' | 'default' }[]>([]);

// 账号 ID 只在 mock 数据里定义一次，这里按等级现取，改了 mock 表不用回来同步
if (isMock) {
  // isMock 构建期折叠为字面量，生产产物里这段连同 mock 数据一起被摇掉
  import('@/mocks/data/db').then(({ mockDb }) => {
    mockAccounts.value = LEVEL_META.flatMap(meta => {
      const user = mockDb.users.find(item => item.level === meta.level && item.status === 'active');
      if (!user) return [];
      return [
        { id: user.id, label: `Level ${meta.level} ${meta.label} · ${user.nickname} #${user.id}`, type: meta.type }
      ];
    });
  });
}

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
        <NAlert v-else type="info" title="学校统一认证">
          点击下方按钮后将跳转到学校认证页面，认证完成后会自动返回管理端。
        </NAlert>

        <NButton
          v-if="authStore.hasSession && !authStore.isAdmin"
          class="mt-24px"
          type="warning"
          size="large"
          block
          @click="logoutAndRetry"
        >
          退出当前账号
        </NButton>
        <NButton v-else class="mt-24px" type="primary" size="large" block @click="login">使用学校统一认证登录</NButton>

        <!-- 开发 / 测试环境专用：跳过学校认证，按用户 ID 直接建会话 -->
        <NCollapse v-if="showTestLogin" class="mt-24px">
          <NCollapseItem title="开发测试登录" name="test-login">
            <NSpace vertical :size="12">
              <!-- Mock：账号从 mock 数据现取，每个等级一个按钮，点一下直接登录 -->
              <template v-if="isMock">
                <NButton
                  v-for="acc in mockAccounts"
                  :key="acc.id"
                  :type="acc.type"
                  secondary
                  block
                  :loading="authStore.loginLoading"
                  @click="testLogin(acc.id, MOCK_PASSWORD)"
                >
                  {{ acc.label }}
                </NButton>
              </template>

              <!-- 真实测试后端：用户 ID 与密码都由后端决定，只能手填 -->
              <template v-else>
                <NInputNumber v-model:value="testUserId" placeholder="用户 ID" :show-button="false" class="w-full" />
                <NInput
                  v-model:value="testPassword"
                  type="password"
                  placeholder="测试登录密码"
                  show-password-on="click"
                  @keyup.enter="handleManualTestLogin"
                />
                <NButton
                  type="warning"
                  secondary
                  block
                  :loading="authStore.loginLoading"
                  @click="handleManualTestLogin"
                >
                  以该账号登录
                </NButton>
              </template>

              <p class="m-0 text-12px text-#999">仅开发 / 测试环境可用，生产构建不会包含此入口。</p>
            </NSpace>
          </NCollapseItem>
        </NCollapse>
      </main>
    </NCard>
  </div>
</template>
