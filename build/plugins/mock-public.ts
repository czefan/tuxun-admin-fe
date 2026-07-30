import fs from 'node:fs';
import { URL, fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const WORKER_FILE = 'mockServiceWorker.js';

function resolveWorkerPath() {
  return fileURLToPath(new URL(`../../src/mocks/public/${WORKER_FILE}`, import.meta.url));
}

/**
 * 把 MSW 的 Service Worker 脚本挂到站点根路径。
 *
 * 不放 `public/` 是因为那样会无条件打进所有产物；这里只在开启 mock 时注册，
 * 保证生产构建不会带上 worker。脚本本体与其余 mock 代码一起放在 `src/mocks/` 下。
 */
export function setupMockPublicPlugin(viteEnv: Env.ImportMeta): Plugin[] {
  if (viteEnv.VITE_ENABLE_MOCK !== 'Y') return [];

  return [
    {
      name: 'vite-plugin-mock-public',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.endsWith(`/${WORKER_FILE}`) || req.url === `/${WORKER_FILE}`)) {
            const filePath = resolveWorkerPath();
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'application/javascript');
              return res.end(fs.readFileSync(filePath));
            }
          }
          return next();
        });
      },
      generateBundle() {
        const filePath = resolveWorkerPath();
        if (fs.existsSync(filePath)) {
          this.emitFile({
            type: 'asset',
            fileName: WORKER_FILE,
            source: fs.readFileSync(filePath)
          });
        }
      }
    }
  ];
}
