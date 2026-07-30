/**
 * 后端服务只有一个（图寻 Go 服务），因此这里不做多服务配置。
 *
 * VITE_SERVICE_BASE_URL 有两种写法：
 *
 * - 相对路径（如 `/api`）：浏览器侧同源请求，Cookie 正常携带，开发时由 vite 代理转发到
 *   VITE_SERVICE_PROXY_TARGET；这是当前 test / mock 环境采用的方式。
 * - 绝对地址（如 `http://x.y.z/api`）：开发时浏览器改请求 PROXY_PATTERN 前缀，由 vite 代理剥掉前缀后转发。
 */

/** 绝对地址 baseURL 在开发代理下使用的路径前缀 */
export const PROXY_PATTERN = '/proxy-default';

/**
 * 取后端服务的 baseURL
 *
 * @param env 当前环境变量
 * @param isProxy 是否启用了 vite 开发代理
 */
export function getServiceBaseURL(env: Env.ImportMeta, isProxy: boolean) {
  const baseURL = env.VITE_SERVICE_BASE_URL;

  return {
    baseURL: isProxy && !baseURL.startsWith('/') ? PROXY_PATTERN : baseURL
  };
}
