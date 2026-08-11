/**
 * Namespace Env
 *
 * It is used to declare the type of the import.meta object
 */
declare namespace Env {
  /** The router history mode */
  type RouterHistoryMode = 'hash' | 'history' | 'memory';

  /** Interface for import.meta */
  // eslint-disable-next-line @typescript-eslint/no-shadow
  interface ImportMeta extends ImportMetaEnv {
    /** The base url of the application */
    readonly VITE_BASE_URL: string;
    /** The title of the application */
    readonly VITE_APP_TITLE: string;
    /** The description of the application */
    readonly VITE_APP_DESC: string;
    /** The router history mode */
    readonly VITE_ROUTER_HISTORY_MODE?: RouterHistoryMode;
    /** The prefix of the iconify icon */
    readonly VITE_ICON_PREFIX: 'icon';
    /**
     * The prefix of the local icon
     *
     * This prefix is start with the icon prefix
     */
    readonly VITE_ICON_LOCAL_PREFIX: 'icon-local';
    /** backend service base url */
    readonly VITE_SERVICE_BASE_URL: string;
    /** Optional local development proxy target */
    readonly VITE_SERVICE_PROXY_TARGET?: string;
    /**
     * Whether to enable the http proxy
     *
     * Only valid in the development environment
     */
    readonly VITE_HTTP_PROXY?: CommonType.YesOrNo;
    /**
     * The auth route mode
     *
     * - Static: the auth routes is generated in front-end
     * - Dynamic: the auth routes is generated in back-end
     */
    readonly VITE_AUTH_ROUTE_MODE: 'static' | 'dynamic';
    /**
     * The home route key
     *
     * It only has effect when the auth route mode is static, if the route mode is dynamic, the home route key is
     * defined in the back-end
     */
    readonly VITE_ROUTE_HOME: import('@elegant-router/types').LastLevelRouteKey;
    /**
     * Default menu icon if menu icon is not set
     *
     * Iconify icon name
     */
    readonly VITE_MENU_ICON: string;
    /** Whether to build with sourcemap */
    readonly VITE_SOURCE_MAP?: CommonType.YesOrNo;
    /**
     * Iconify api provider url
     *
     * If the project is deployed in intranet, you can set the api provider url to the local iconify server
     *
     * @link https://docs.iconify.design/api/providers.html
     */
    readonly VITE_ICONIFY_URL?: string;
    /** Used to differentiate storage across different domains */
    readonly VITE_STORAGE_PREFIX?: string;
    /** Whether to automatically detect updates after configuring application packaging */
    readonly VITE_AUTOMATICALLY_DETECT_UPDATE?: CommonType.YesOrNo;
    /** show proxy url log in terminal */
    readonly VITE_PROXY_LOG?: CommonType.YesOrNo;
    /** The launch editor */
    readonly VITE_DEVTOOLS_LAUNCH_EDITOR?: import('vite-plugin-vue-devtools').VitePluginVueDevToolsOptions['launchEditor'];
    /** Whether to enable MSW Mock mode */
    readonly VITE_ENABLE_MOCK?: CommonType.YesOrNo;
    /** MSW Mock 接口统一延迟（毫秒），用于验证 loading 态；0 或留空为不延迟 */
    readonly VITE_MOCK_DELAY?: string;
    /** 高德地图 JSAPI key（Web 端 / JS API 类型），为空则地图选点降级为手填经纬度 */
    readonly VITE_AMAP_KEY?: string;
    /** 高德安全密钥，jscode 会内联进前端产物，仅用于开发 / 内网环境 */
    readonly VITE_AMAP_SECURITY_JSCODE?: string;
    /** 高德代理服务地址（后端转发 restapi.amap.com 并附加 jscode），生产环境用，优先级高于 jscode */
    readonly VITE_AMAP_SERVICE_HOST?: string;
    /** tz-oauth 授权服务地址（生产 https://oauth.tiaozhan.com）；留空则登录按钮降级为可操作的错误提示 */
    readonly VITE_OAUTH_BASE_URL?: string;
    /** 本服务的 OAuth Client ID，与 tuxun-fe 共用（同一个后端 = 同一个 client_secret） */
    readonly VITE_OAUTH_CLIENT_ID?: string;
  }
}

interface ImportMeta {
  readonly env: Env.ImportMeta;
}
