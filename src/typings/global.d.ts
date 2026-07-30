export {};

declare global {
  export interface Window {
    /** NProgress instance */
    NProgress?: import('nprogress').NProgress;
    /** Loading bar instance */
    $loadingBar?: import('naive-ui').LoadingBarProviderInst;
    /** Dialog instance */
    $dialog?: import('naive-ui').DialogProviderInst;
    /** Message instance */
    $message?: import('naive-ui').MessageProviderInst;
    /** Notification instance */
    $notification?: import('naive-ui').NotificationProviderInst;
    /** 高德 JSAPI 安全配置，变量名由高德规定，须在 SDK 加载前赋值 */
    _AMapSecurityConfig?: { securityJsCode: string } | { serviceHost: string };
  }

  /** Build time of the project */
  export const BUILD_TIME: string;
}
