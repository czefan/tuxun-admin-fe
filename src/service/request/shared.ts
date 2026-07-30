import type { AxiosError } from 'axios';
import { BACKEND_ERROR_CODE } from '@sa/axios';
import { router } from '@/router';
import { useAuthStore } from '@/store/modules/auth';
import { sanitizeLoginRedirect } from '@/store/modules/auth/shared';
import { sessionStg } from '@/utils/storage';
import type { RequestInstanceState } from './type';

let navigatingTo403Promise: Promise<void> | null = null;

function lockOriginalRedirect() {
  const currentRouteName = String(router.currentRoute.value.name || '');
  if (currentRouteName !== 'login' && currentRouteName !== '403') {
    const fullPath = router.currentRoute.value.fullPath;
    if (fullPath && !sessionStg.get('loginRedirect')) {
      const sanitized = sanitizeLoginRedirect(fullPath);
      if (sanitized !== '/home') {
        sessionStg.set('loginRedirect', sanitized);
      }
    }
  }
}

export async function handleRequestError(error: AxiosError<App.Service.Response<unknown>>) {
  const status = error.response?.status;
  const requestUrl = error.config?.url || '';
  const authStore = useAuthStore();

  if (status === 401) {
    lockOriginalRedirect();
    if (requestUrl.includes('/user/info') && !authStore.sessionInitialized) {
      authStore.clearSession();
      return true;
    }

    await authStore.handleSessionExpired();
    return true;
  }

  if (status === 403) {
    if (requestUrl.includes('/user/info') && !authStore.sessionInitialized) {
      authStore.clearSession();
      return true;
    }

    if (requestUrl.includes('/user/logincallback')) {
      return true;
    }

    if (!authStore.isLogin || authStore.sessionStatus !== 'authenticated') {
      return true;
    }

    lockOriginalRedirect();

    const currentRouteName = String(router.currentRoute.value.name || '');
    if (currentRouteName === '403') {
      return true;
    }

    if (!navigatingTo403Promise) {
      navigatingTo403Promise = (async () => {
        try {
          await router.replace({ name: '403' }).catch(() => {});
        } finally {
          navigatingTo403Promise = null;
        }
      })();
    }
    await navigatingTo403Promise;
    return true;
  }

  return false;
}

export function getErrorMessage(error: AxiosError<App.Service.Response<unknown>>) {
  if (error.code === BACKEND_ERROR_CODE || error.response?.data) {
    return error.response?.data?.message || error.message;
  }

  if (error.code === 'ECONNABORTED') {
    return '请求超时，请稍后重试';
  }

  return navigator.onLine ? '网络请求失败，请稍后重试' : '网络连接已断开，请检查网络';
}

export function showErrorMsg(state: RequestInstanceState, message: string) {
  if (!state.errMsgStack?.length) {
    state.errMsgStack = [];
  }

  if (state.errMsgStack.includes(message)) return;

  state.errMsgStack.push(message);

  window.$message?.error(message, {
    onLeave: () => {
      state.errMsgStack = state.errMsgStack.filter(item => item !== message);
    }
  });
}
