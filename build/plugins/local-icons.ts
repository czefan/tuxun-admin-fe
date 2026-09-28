import { readdir } from 'node:fs/promises';
import path from 'node:path';
import type { Plugin } from 'vite';

/** 复用 unplugin-icons 编译本地图标，避免维护第二套 SVG sprite 构建链。 */
export function setupLocalIconsPlugin(directory: string, collection: string): Plugin {
  const moduleId = 'virtual:local-icons';
  const resolvedId = `\0${moduleId}`;
  return {
    name: 'local-icons',
    resolveId(id) {
      return id === moduleId ? resolvedId : undefined;
    },
    async load(id) {
      if (id !== resolvedId) return undefined;
      const files = (await readdir(directory, { recursive: true })).filter(file => file.endsWith('.svg')).sort();
      const imports = files.map((file, index) => {
        this.addWatchFile(path.join(directory, file));
        const name = file.slice(0, -4).split(path.sep).join('/');
        return `import icon${index} from ${JSON.stringify(`~icons/${collection}/${name}`)};`;
      });
      const entries = files.map(
        (file, index) => `${JSON.stringify(file.slice(0, -4).split(path.sep).join('-'))}: icon${index}`
      );
      return `${imports.join('\n')}\nexport default {${entries.join(',')}};`;
    },
    configureServer(server) {
      server.watcher.add(directory);
      const refresh = (file: string) => {
        if (!file.startsWith(`${directory}${path.sep}`) || !file.endsWith('.svg')) return;
        const module = server.moduleGraph.getModuleById(resolvedId);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', refresh).on('unlink', refresh);
    }
  };
}
