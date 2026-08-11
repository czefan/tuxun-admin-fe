/** The storage namespace */
declare namespace StorageType {
  interface Session {
    /** The theme color */
    themeColor: string;
    /** The protected route requested before school authentication */
    loginRedirect: string;
    /** OAuth2 state，发起授权时写入、回调校验后立即清除 */
    oauthState: string;
    // /**
    //  * the theme settings
    //  */
    // themeSettings: App.Theme.ThemeSetting;
  }

  interface Local {
    /** The i18n language */
    lang: App.I18n.LangType;
    /** Fixed sider with mix-menu */
    mixSiderFixed: CommonType.YesOrNo;
    /** The theme color */
    themeColor: string;
    /** The dark mode */
    darkMode: boolean;
    /** The theme settings */
    themeSettings: App.Theme.ThemeSetting;
    /**
     * The override theme flags
     *
     * The value is the build time of the project
     */
    overrideThemeFlag: string;
    /** The global tabs */
    globalTabs: App.Global.Tab[];
    /** The backup theme setting before is mobile */
    backupThemeSettingBeforeIsMobile: {
      layout: UnionKey.ThemeLayoutMode;
      siderCollapse: boolean;
    };
    /** The last login user id */
    lastLoginUserId: string;
  }
}
