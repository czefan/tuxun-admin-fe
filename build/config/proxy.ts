import type { ProxyOptions } from 'vite';
import { bgRed, bgYellow, green, lightBlue } from 'kolorist';
import { consola } from 'consola';
import { PROXY_PATTERN } from '../../src/utils/service';

/**
 * Set http proxy
 *
 * @param env - The current env
 * @param enable - If enable http proxy
 */
export function createViteProxy(env: Env.ImportMeta, enable: boolean) {
  if (!enable || env.VITE_HTTP_PROXY !== 'Y') return undefined;

  const baseURL = env.VITE_SERVICE_BASE_URL;
  const enableLog = env.VITE_PROXY_LOG === 'Y';

  // baseURL 是相对路径时按原路径转发，保持浏览器同源以便 Cookie 正常携带
  if (baseURL.startsWith('/')) {
    if (!env.VITE_SERVICE_PROXY_TARGET) return undefined;
    return createProxyItem(baseURL, env.VITE_SERVICE_PROXY_TARGET, enableLog);
  }

  // baseURL 是绝对地址时，浏览器改请求 PROXY_PATTERN 前缀，这里剥掉前缀转发到真实地址
  return createProxyItem(PROXY_PATTERN, baseURL, enableLog, true);
}

function createProxyItem(pattern: string, target: string, enableLog: boolean, stripPattern = false) {
  const options: ProxyOptions = {
    target,
    changeOrigin: true,
    configure: (proxy, opts) => {
      proxy.on('proxyReq', (_proxyReq, req) => {
        if (!enableLog) return;

        consola.log(
          `${lightBlue('[proxy url]')}: ${bgYellow(` ${req.method} `)} ${green(req.url || '')}\n` +
            `${lightBlue('[real request url]')}: ${green(`${opts.target}${req.url || ''}`)}`
        );
      });
      proxy.on('error', (_err, req) => {
        if (!enableLog) return;
        consola.log(bgRed(`Error: ${req.method} `), green(req.url || ''));
      });
    }
  };

  if (stripPattern) {
    options.rewrite = path => path.replace(new RegExp(`^${pattern}`), '');
  }

  return { [pattern]: options } satisfies Record<string, ProxyOptions>;
}
