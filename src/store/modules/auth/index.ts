import { computed, reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { fetchGetUserInfo, fetchLoginCallback, fetchLogout, fetchTestLogin, getLoginEntryUrl } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import { localStg, sessionStg } from '@/utils/storage';
import { SetupStoreId } from '@/enum';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import type { AuthSessionStatus } from './shared';
import { createEmptyUserInfo, sanitizeLoginRedirect } from './shared';

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const routeStore = useRouteStore();
  const tabStore = useTabStore();
  const { toLogin } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const authEpoch = ref(0);
  const sessionStatus = ref<AuthSessionStatus>('unknown');
  const sessionInitialized = ref(false);
  const hasSession = ref(false);
  const userInfo = reactive<Api.Auth.UserInfo>(createEmptyUserInfo());

  const isAdmin = computed(() => hasSession.value && userInfo.level >= 2);
  const isLogin = computed(() => isAdmin.value);
  const isSuperAdmin = computed(() => isAdmin.value && userInfo.level >= 3);

  let initSessionPromise: Promise<boolean> | null = null;
  let sessionExpiredPromise: Promise<void> | null = null;
  let logoutPromise: Promise<boolean> | null = null;

  function bumpEpoch() {
    authEpoch.value += 1;
  }

  function clearSession() {
    bumpEpoch();
    hasSession.value = false;
    Object.assign(userInfo, createEmptyUserInfo());
    sessionInitialized.value = true;
    sessionStatus.value = 'anonymous';
  }

  function recordUserId() {
    if (userInfo.id) {
      localStg.set('lastLoginUserId', String(userInfo.id));
    }
  }

  function checkTabClear() {
    if (!userInfo.id) return false;

    const currentUserId = String(userInfo.id);
    const lastLoginUserId = localStg.get('lastLoginUserId');
    const shouldClear = Boolean(lastLoginUserId && lastLoginUserId !== currentUserId);

    if (shouldClear) {
      localStg.remove('globalTabs');
      tabStore.clearTabs();
    }

    localStg.remove('lastLoginUserId');
    return shouldClear;
  }

  let getUserInfoPromise: Promise<boolean> | null = null;

  async function getUserInfo() {
    if (getUserInfoPromise) return getUserInfoPromise;

    getUserInfoPromise = (async () => {
      try {
        const requestEpoch = authEpoch.value;
        sessionStatus.value = 'loading';
        const response = await fetchGetUserInfo();

        if (requestEpoch !== authEpoch.value) {
          return false;
        }

        if (response.error) {
          const status = response.error.response?.status;
          clearSession();
          if (status === 401) {
            return false;
          }
          if (status === 403) {
            sessionStatus.value = 'forbidden';
            sessionInitialized.value = true;
            return false;
          }
          sessionStatus.value = 'error';
          sessionInitialized.value = true;
          return false;
        }

        const data = response.data;
        if (!data || typeof data.level !== 'number' || data.level < 2 || !data.id || !data.netid) {
          await fetchLogout();
          clearSession();
          sessionStatus.value = 'forbidden';
          window.$message?.error('当前账号无后台管理权限');
          return false;
        }

        Object.assign(userInfo, createEmptyUserInfo(), data);
        hasSession.value = true;
        sessionInitialized.value = true;
        sessionStatus.value = 'authenticated';

        return true;
      } finally {
        getUserInfoPromise = null;
      }
    })();

    return getUserInfoPromise;
  }

  async function initSession() {
    if (sessionInitialized.value) return isLogin.value;

    if (!initSessionPromise) {
      initSessionPromise = (async () => {
        try {
          await getUserInfo();
          return isLogin.value;
        } finally {
          initSessionPromise = null;
        }
      })();
    }

    return initSessionPromise;
  }

  function beginLogin(redirect?: string) {
    if (redirect) {
      const sanitized = sanitizeLoginRedirect(redirect);
      sessionStg.set('loginRedirect', sanitized);
    } else {
      sessionStg.remove('loginRedirect');
    }

    window.location.assign(getLoginEntryUrl());
  }

  function consumeLoginRedirect() {
    const redirect = sessionStg.get('loginRedirect');
    sessionStg.remove('loginRedirect');
    return sanitizeLoginRedirect(redirect);
  }

  async function completeLogin(guid: string) {
    startLoading();

    try {
      if (guid) {
        const callbackResult = await fetchLoginCallback(guid);
        if (callbackResult.error) return false;
      }

      // getUserInfo 内部已校验 level >= 2，不合格的账号在那里就被登出了
      const loaded = await getUserInfo();
      if (!loaded) return false;

      checkTabClear();
      window.$notification?.success({
        title: '登录成功',
        content: `欢迎回来，${userInfo.nickname || userInfo.username}`,
        duration: 3500
      });

      return true;
    } finally {
      endLoading();
    }
  }

  /**
   * 开发 / 测试环境的免 SSO 登录：按用户 ID 直接建立会话。
   * 生产构建下 MODE 常量折叠后整段会被摇掉，后端也不会开放该接口。
   */
  async function testLogin(userId: number, password: string) {
    // 生产构建下 MODE 折叠为字面量，整个函数体成为死代码被摇掉
    if (import.meta.env.MODE === 'prod') return false;

    startLoading();
    try {
      const result = await fetchTestLogin({ user_id: userId, password });
      if (result.error) return false;
    } finally {
      endLoading();
    }

    // 会话已由后端种下，复用统一的收尾流程（拉用户信息 + 等级校验 + 欢迎提示）
    return completeLogin('');
  }

  async function resetStore(redirect = true) {
    recordUserId();
    clearSession();

    tabStore.cacheTabs();
    await routeStore.resetStore();

    if (redirect) {
      await toLogin();
    }
  }

  async function logout() {
    if (!logoutPromise) {
      logoutPromise = (async () => {
        try {
          const result = await fetchLogout();
          await resetStore();
          return !result.error;
        } finally {
          logoutPromise = null;
        }
      })();
    }
    return logoutPromise;
  }

  async function handleSessionExpired() {
    if (!sessionExpiredPromise) {
      sessionExpiredPromise = (async () => {
        try {
          const wasLoggedIn = hasSession.value;
          await resetStore();

          if (wasLoggedIn) {
            window.$message?.warning('登录状态已失效，请重新登录');
          }
        } finally {
          sessionExpiredPromise = null;
        }
      })();
    }

    return sessionExpiredPromise;
  }

  return {
    authEpoch,
    sessionStatus,
    sessionInitialized,
    hasSession,
    userInfo,
    isAdmin,
    isLogin,
    isSuperAdmin,
    loginLoading,
    getUserInfo,
    clearSession,
    initSession,
    beginLogin,
    consumeLoginRedirect,
    completeLogin,
    testLogin,
    resetStore,
    logout,
    handleSessionExpired
  };
});
