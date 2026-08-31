import { request } from '../request';

/** Complete school authentication and establish the backend session. */
export function fetchLoginCallback(code: string, redirectUri: string) {
  return request<Api.Auth.LoginUserSummary>({
    url: '/user/logincallback',
    params: { code, redirect_uri: redirectUri }
  });
}

/** Dev / Test login entry. */
export function fetchTestLogin(params: { netid: string; password: string }) {
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
