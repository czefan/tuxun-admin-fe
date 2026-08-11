import { http } from 'msw';
import { mockDb } from '../data/db';
import type { MockUserSession } from '../data/db';
import { mockBadRequest, mockForbidden, mockNotFound, mockSuccess, mockUnauthorized } from '../response';

/** 只挑契约 UserInfo 字段（id/netid/username/nickname/avatar/score_count/level/*_edits_remaining），
 *  不返回 session_id / status 等 LoginResult 才有的字段，避免 mock 比契约多出键 */
function toUserInfo(session: MockUserSession) {
  return {
    id: session.id,
    netid: session.netid,
    username: session.username,
    nickname: session.nickname,
    avatar: session.avatar,
    score_count: session.score_count,
    level: session.level,
    nickname_edits_remaining: session.nickname_edits_remaining,
    avatar_edits_remaining: session.avatar_edits_remaining
  };
}

/** 契约 LoginResult = UserSummary + session_id，比 UserInfo 少 score_count 与两个 *_edits_remaining */
function toLoginResult(session: MockUserSession) {
  const { id, netid, username, nickname, avatar, level, status, session_id } = session;
  return { id, netid, username, nickname, avatar, level, status, session_id };
}

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

    return mockSuccess(toLoginResult(session), '测试登录成功');
  }),

  http.get('/api/user/logincallback', ({ request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const redirectUri = url.searchParams.get('redirect_uri');
    // 契约：code 无效 / redirect_uri 缺失或不在白名单 → 400 code=3（不是 403）
    if (!code || code === 'invalid') return mockBadRequest('code 无效、已使用或已过期');
    if (!redirectUri) return mockBadRequest('redirect_uri 缺失或不在白名单内');

    // 契约 403：账号被封禁，拒绝建立会话
    if (code === 'banned') return mockForbidden('当前账号已被封禁');

    // 测试用 code 可携带等级后缀（mock-code-l1 / -l2 / -l3），默认 Level 3；
    // 动态取该等级第一个 active 的 mock 账号建会话（后续往 users 表加更多管理员会自动生效），
    // 避免默认 session 恒是 id=1 的超管、L2 按钮进去却显示超管信息
    const levelMatch = code.match(/-l([123])$/);
    const level = levelMatch ? Number(levelMatch[1]) : 3;
    const user = mockDb.users.find(item => item.level === level && item.status === 'active');
    if (!user) {
      return mockBadRequest(`当前等级 Level ${level} 没有可用的模拟账号`);
    }
    mockDb.loginAs(user.id);
    // loginAs 之后 session 必然非空（user 已确认存在），返回契约 LoginResult 字段
    return mockSuccess(toLoginResult(mockDb.session!), '登录回调验证成功');
  }),

  http.get('/api/user/info', () => {
    if (!mockDb.session) {
      return mockUnauthorized();
    }
    // 契约：GET /api/user/info 对 Level ≥ 1 的登录用户均返回 200；
    // 管理端的 Level ≥ 2 门槛由前端自行判定（getUserInfo 里 level<2 → 登出），不在本接口拦截
    return mockSuccess(toUserInfo(mockDb.session));
  }),

  http.delete('/api/user/logout', () => {
    mockDb.session = null;
    return mockSuccess(null, '退出登录成功');
  })
];
