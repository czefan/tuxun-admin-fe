import { computed, reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { fetchGetUserInfo, fetchLoginCallback, fetchLogout, fetchTestLogin } from '@/service/api';
import { getErrorMessage } from '@/service/request/shared';
import { getAuthorizeUrl, getLogoutUrl, isOAuthConfigured, mockAuthorizeQuery } from '@/service/auth/oauth';
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
  const { toLogin, routerPush } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const authEpoch = ref(0);
  const sessionStatus = ref<AuthSessionStatus>('unknown');
  const sessionInitialized = ref(false);
  const hasSession = ref(false);
  const userInfo = reactive<Api.Auth.UserInfo>(createEmptyUserInfo());
  /** 最近一次登录回调失败的原因：后端 message（getErrorMessage 优先取它），或超时 / 断网的兜底文案；留给回调页展示 */
  const loginError = ref('');

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
        // 数据异常（无 id/netid 或 level 非数字）时无法确认身份：仅本地清空后台登录态。
        // 不调用 fetchLogout —— 共享 cookie 域下那会连 C 端用户的图寻全局会话一起销毁
        if (!data || typeof data.level !== 'number' || !data.id || !data.netid) {
          clearSession();
          sessionStatus.value = 'forbidden';
          return false;
        }
        // 共享 cookie 域：Level 1 用户（C 端用户误入后台）不再静默登出图寻全局会话，
        // 保留会话与用户信息，只标记无后台权限；是否退出由图寻用户自己决定（登录页会提示）
        if (data.level < 2) {
          Object.assign(userInfo, createEmptyUserInfo(), data);
          hasSession.value = true;
          sessionInitialized.value = true;
          sessionStatus.value = 'forbidden';
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

  /** @param mockLevel 仅 mock 模式生效：指定模拟回调的登录等级（默认 Level 3），用于验证等级权限分支 */
  function beginLogin(redirect?: string, mockLevel?: 1 | 2 | 3) {
    if (redirect) {
      const sanitized = sanitizeLoginRedirect(redirect);
      sessionStg.set('loginRedirect', sanitized);
    } else {
      sessionStg.remove('loginRedirect');
    }

    // mock 模式：不真跳外部授权页，直接带一次性 code 走回调页，让 state 校验 → 换会话 → 等级校验 → 回跳全流程被真实执行
    if (import.meta.env.VITE_ENABLE_MOCK === 'Y') {
      routerPush(`/login/callback?${mockAuthorizeQuery(mockLevel)}`);
      return;
    }

    if (!isOAuthConfigured()) {
      window.$message?.error('登录服务未配置，请联系管理员配置 VITE_OAUTH_BASE_URL / VITE_OAUTH_CLIENT_ID');
      return;
    }

    window.location.assign(getAuthorizeUrl());
  }

  function consumeLoginRedirect() {
    const redirect = sessionStg.get('loginRedirect');
    sessionStg.remove('loginRedirect');
    return sanitizeLoginRedirect(redirect);
  }

  /** code 为空表示会话已由别的途径建立（测试登录），只跑「拉资料 + 校验等级」的收尾 */
  async function completeLogin(code: string, redirectUri = '') {
    startLoading();
    loginError.value = '';

    try {
      if (code) {
        const callbackResult = await fetchLoginCallback(code, redirectUri);
        if (callbackResult.error) {
          // 必须走 getErrorMessage：error.message 是 axios 内部串（Request failed with status code 400），
          // 后端原文在 error.response.data.message；顺带区分超时 / 断网
          loginError.value = getErrorMessage(callbackResult.error);
          return false;
        }
      }

      // getUserInfo 内部已校验 level >= 2：不合格的账号保持图寻会话、只标记无后台权限（共享 cookie 域不再登出）
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
   * 开发 / 测试环境的免 SSO 登录：按 NetID 直接建立会话。
   * 生产构建下 MODE 常量折叠后整段会被摇掉，后端也不会开放该接口。
   */
  async function testLogin(netid: string, password: string) {
    // 生产构建下 MODE 折叠为字面量，整个函数体成为死代码被摇掉
    if (import.meta.env.MODE !== 'test' && import.meta.env.MODE !== 'mock') return false;

    startLoading();
    try {
      const result = await fetchTestLogin({ netid, password });
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
          // 顺序按 SERVICE_INTEGRATION §6.1：先清本站会话，再让浏览器去 IdP 清 session
          const result = await fetchLogout();
          const logoutUrl = getLogoutUrl();
          // 要整页跳 IdP 时就不再走 router 跳登录页了 —— 那一跳紧接着就被整页导航冲掉，只会闪一下
          await resetStore(!logoutUrl);
          if (logoutUrl) {
            // 必须整页跳转：AJAX 带不上 tz-oauth 的 cookie，清不掉 IdP session（§6「不要」第一条）
            // 跳走后本页即将卸载，下面的 return 只对降级路径有意义
            window.location.assign(logoutUrl);
          }
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
    loginError,
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
