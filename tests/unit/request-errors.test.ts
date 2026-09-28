import { describe, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';
const auth = vi.hoisted(() => ({ sessionInitialized: false, clearSession: vi.fn(), handleSessionExpired: vi.fn() }));
vi.mock('@/store/modules/auth', () => ({ useAuthStore: () => auth }));
vi.mock('@/router', () => ({ router: { currentRoute: { value: { name: 'login', fullPath: '/login' } } } }));
vi.mock('@/utils/storage', () => ({ sessionStg: { get: vi.fn(), set: vi.fn() } }));
import { handleRequestError } from '@/service/request/shared';

describe('初始化登录错误', () => {
  it.each([401, 403])('%i 由会话初始化处理，拦截器不能提前改变 authEpoch', async status => {
    const error = new AxiosError<App.Service.Response<unknown>>('failed');
    Object.assign(error, { config: { url: '/user/info' }, response: { status } });
    expect(await handleRequestError(error)).toBe(true);
    expect(auth.clearSession).not.toHaveBeenCalled();
    expect(auth.handleSessionExpired).not.toHaveBeenCalled();
  });
  it('取消请求不弹网络错误', async () => {
    expect(await handleRequestError(new AxiosError<App.Service.Response<unknown>>('canceled', 'ERR_CANCELED'))).toBe(
      true
    );
  });
});
