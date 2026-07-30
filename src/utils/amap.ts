import AMapLoader from '@amap/amap-jsapi-loader';

/**
 * 高德地图 JSAPI 2.0 的懒加载封装。
 *
 * 安全密钥有两种配置方式，按环境二选一：
 * 1. `VITE_AMAP_SECURITY_JSCODE` —— jscode 直接内联进前端产物，仅适合开发 / 内网环境；
 * 2. `VITE_AMAP_SERVICE_HOST` —— 指向后端代理（转发 restapi.amap.com 并在服务端附加 jscode），
 *    生产环境用这个，jscode 不出现在前端。两者同时配置时优先走代理。
 *
 * 注意：key 本身无论哪种方式都会出现在前端（JSAPI 必须用它加载脚本），
 * 它的防护手段是高德控制台的安全域名白名单，而不是保密。
 *
 * 全局只加载一次；坐标系为 GCJ-02，与后端 `coord_type: 'gcj02'` 对齐。
 */

const KEY = import.meta.env.VITE_AMAP_KEY;
const SECURITY_JSCODE = import.meta.env.VITE_AMAP_SECURITY_JSCODE;
const SERVICE_HOST = import.meta.env.VITE_AMAP_SERVICE_HOST;

/** 需要用到的插件：定位、逆地理编码、输入提示、地点搜索 */
const PLUGINS = ['AMap.Geolocation', 'AMap.Geocoder', 'AMap.AutoComplete', 'AMap.PlaceSearch'];

/** 是否已配置 key —— 未配置时调用方应降级为手动输入经纬度 */
export const isAmapConfigured = Boolean(KEY);

let loadPromise: Promise<any> | null = null;

export function loadAmap(): Promise<any> {
  if (!KEY) {
    return Promise.reject(new Error('未配置 VITE_AMAP_KEY，地图功能不可用'));
  }

  if (!loadPromise) {
    // 安全配置必须在 load 之前挂到 window 上，晚了不生效
    if (SERVICE_HOST) {
      window._AMapSecurityConfig = { serviceHost: SERVICE_HOST };
    } else if (SECURITY_JSCODE) {
      window._AMapSecurityConfig = { securityJsCode: SECURITY_JSCODE };
    }

    loadPromise = AMapLoader.load({
      key: KEY,
      version: '2.0',
      plugins: PLUGINS
    }).catch(error => {
      // 允许下次重试，否则一次网络失败会永久锁死
      loadPromise = null;
      throw error;
    });
  }

  return loadPromise;
}
