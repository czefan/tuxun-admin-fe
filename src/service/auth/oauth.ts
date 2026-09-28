import { sessionStg } from '@/utils/storage';

/** tz-oauth 授权服务地址，去掉尾斜杠 */
function getOAuthBaseUrl() {
  return (import.meta.env.VITE_OAUTH_BASE_URL || '').replace(/\/+$/, '');
}

/** 本端绝对 URL；BASE_URL 即 vite.config 的 base（取自 VITE_BASE_URL），支持子路径部署 */
function absoluteUrl(path: string) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  return `${window.location.origin}${base}${path}`;
}

/**
 * 本端登录回调页的绝对 URL。
 * 授权阶段与换取阶段（GET /user/logincallback 的 redirect_uri）必须用同一个值，
 * 因此全仓只允许这一处生成，且不带尾斜杠 —— 后端白名单要求完全一致。
 */
export function getCallbackUrl() {
  return absoluteUrl('/login/callback');
}

/**
 * tz-oauth OIDC 登出地址（SERVICE_INTEGRATION §6）。
 * 未配置 OAuth（含 mock 模式）时返回空串，调用方降级为「只清本地会话」。
 *
 * 注意三点：
 * 1. 参数名是 post_logout_redirect_uri，不是 redirect_uri —— 写错不会报错，只会静默不回跳；
 * 2. 参数必须放 query，不能放 body；
 * 3. 只能整页跳转，不能用 axios/fetch 调 —— 跨站请求带不上 tz-oauth 的 session cookie，等于没登出。
 */
export function getLogoutUrl() {
  if (import.meta.env.VITE_ENABLE_MOCK === 'Y') return '';
  if (!isOAuthConfigured()) return '';
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_OAUTH_CLIENT_ID || '',
    // 回登录页而不是首页：admin 的 / 未登录时会被守卫再弹一次 /login，直接指过去省一跳
    post_logout_redirect_uri: absoluteUrl('/login')
  });
  return `${getOAuthBaseUrl()}/oauth2/logout?${params}`;
}

/** 生成密码学安全的 state 并落 sessionStorage，用于 CSRF 防护 */
function generateState() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const state = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  sessionStg.set('oauthState', state);
  return state;
}

/** 校验回调带回的 state，无论成败都立即清除（一次性） */
export function validateAndClearState(state: string) {
  const stored = sessionStg.get('oauthState');
  sessionStg.remove('oauthState');
  // stored 为空 = 本端没发起过这次登录（外部直接构造的跳转）；state 为空 = 认证侧没带回，一律拒绝
  return Boolean(stored) && Boolean(state) && stored === state;
}

export function getAuthorizeUrl() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: import.meta.env.VITE_OAUTH_CLIENT_ID || '',
    redirect_uri: getCallbackUrl(),
    state: generateState()
  });
  // scope 手工拼接：URLSearchParams 会把空格编码成 '+'，而 tz-oauth 文档与 tuxun-fe 用的都是 '%20'。
  // 两者按 x-www-form-urlencoded 规则都解码为空格，但没必要赌授权服务的解析实现，与 C 端保持逐字节一致最省事。
  return `${getOAuthBaseUrl()}/oauth2/authorize?${params}&scope=openid%20profile`;
}

/** OAuth 配置是否可用；未配置时 authorize URL 会退化成相对路径，跳过去只会命中 SPA fallback 白屏 */
export function isOAuthConfigured() {
  return Boolean(getOAuthBaseUrl()) && Boolean(import.meta.env.VITE_OAUTH_CLIENT_ID);
}

/** mock 模式专用：生成并存 state，返回可直接拼到 /login/callback 的查询串（code=mock-code&state=xxx）。
 *  level 可指定模拟登录等级（1/2/3），对应 code 后缀 mock-code-l1/l2/l3，便于一键验证等级权限分支 */
export function mockAuthorizeQuery(level?: 1 | 2 | 3) {
  return `code=${level ? `mock-code-l${level}` : 'mock-code'}&state=${generateState()}`;
}
