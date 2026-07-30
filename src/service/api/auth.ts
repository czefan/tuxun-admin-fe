import { request } from '../request';
import { getServiceBaseURL } from '@/utils/service';

/** School unified-authentication entry. */
export function getLoginEntryUrl() {
  const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
  const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

  return `${baseURL.replace(/\/$/, '')}/user/login`;
}

/** Complete school authentication and establish the backend session. */
export function fetchLoginCallback(guid: string) {
  return request<Api.Auth.LoginUserSummary>({
    url: '/user/logincallback',
    params: { guid }
  });
}

/** Dev / Test login entry. */
export function fetchTestLogin(params: { user_id: number; password: string }) {
  return request<Api.Auth.LoginUserSummary>({
    url: '/test/login',
    params
  });
}

/** Get user info */
export function fetchGetUserInfo() {
  return request<Api.Auth.UserInfo>({ url: '/user/info' });
}

/** Destroy the current backend session. */
export function fetchLogout() {
  return request<null>({
    url: '/user/logout',
    method: 'delete'
  });
}
