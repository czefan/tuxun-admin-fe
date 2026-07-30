import { http, HttpResponse } from 'msw';
import { mockDb } from '../data/db';
import { mockForbidden, mockNotFound, mockSuccess, mockUnauthorized } from '../response';

export const authHandlers = [
  http.get('/api/test/login', ({ request }) => {
    const url = new URL(request.url);
    const password = url.searchParams.get('password');
    if (!password) {
      return mockForbidden('测试登录需提供密码');
    }

    // 按 user_id 切换身份，方便验证不同等级下的权限分支
    const userId = Number(url.searchParams.get('user_id'));
    const session = mockDb.loginAs(userId);
    if (!session) {
      return mockNotFound(`用户 ${userId} 不存在，可用测试账号见 mock users 表`);
    }

    return mockSuccess(session, '测试登录成功');
  }),

  http.get('/api/user/login', ({ request }) => {
    const targetUrl = new URL('/login/callback?guid=mock-auth-guid-888', request.url).toString();
    return HttpResponse.redirect(targetUrl);
  }),

  http.get('/api/user/logincallback', ({ request }) => {
    const url = new URL(request.url);
    const guid = url.searchParams.get('guid');
    if (!guid || guid === 'invalid') {
      return mockForbidden('登录授权失败或 GUID 已失效');
    }
    mockDb.reset(3);
    return mockSuccess(mockDb.session, '登录回调验证成功');
  }),

  http.get('/api/user/info', () => {
    if (!mockDb.session) {
      return mockUnauthorized();
    }
    if (mockDb.session.level < 2) {
      return mockForbidden('当前账号没有管理后台权限');
    }
    return mockSuccess(mockDb.session);
  }),

  http.delete('/api/user/logout', () => {
    mockDb.session = null;
    return mockSuccess(null, '退出登录成功');
  })
];
