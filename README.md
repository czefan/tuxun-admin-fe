# 图寻后台管理前端 (tuxun-admin-fe)

本项目是图寻后台管理系统的前端应用，基于 [SoybeanAdmin](https://github.com/soybeanjs/soybean-admin) 模板构建。

---

## 🛠️ 技术选型

- **应用框架**：Vue 3 (Composition API)
- **工程构建**：Vite 8
- **开发语言**：TypeScript
- **组件库**：Naive UI
- **样式引擎**：UnoCSS (原子化 CSS)
- **网络层封装**：基于 `@sa/axios` 封装 Flat 请求
- **Mock 服务**：MSW (Mock Service Worker 2.x)
- **包管理工具**：pnpm (>= 10.5.0)

---

## 🚀 开发命令与工作流

### 1. 基础命令

- **安装依赖**：

  ```bash
  pnpm install
  ```

- **启动开发环境 (后端代理联调)**：

  ```bash
  pnpm dev
  ```

- **启动开发环境 (MSW 纯粹 Mock 模式)**：

  ```bash
  pnpm dev:mock
  ```

- **项目打包 (生产环境编译)**：

  ```bash
  pnpm build
  ```

- **全量静态检查 (契约校验 + 代码规范 + TS 类型)**：

  ```bash
  pnpm check
  ```

### 2. 自动路由与契约类型生成

- **路由自动生成**：在 `src/views` 目录下变更页面后执行：

  ```bash
  pnpm gen-route
  ```

- **API 契约 TS 类型生成**：基于 `contract/apifox-import.json` 生成 `src/service/contract/schema.d.ts`：

  ```bash
  pnpm gen:api-types
  ```

### 3. 代码规范与 Git 提交拦截

项目配置了 `simple-git-hooks` 作为 Git Hooks 工具，包含以下校验：

- **提交前校验 (Pre-commit)**：在执行 `git commit` 时，系统自动运行 `pnpm typecheck && pnpm lint && pnpm fmt` 检查代码规范与类型。
- **提交信息校验 (Commit-msg)**：通过 `pnpm sa git-commit-verify` 验证 Commit Message 规范。

手动检查命令：

```bash
pnpm check:contract # 仅进行契约校验
pnpm typecheck      # 仅进行 Vue/TS 类型检查
pnpm lint           # 运行代码规范检测与修复
pnpm fmt            # 运行代码格式化
```

---

## 📡 接口联调与环境配置

项目在根目录使用 `.env.*` 文件进行多环境配置管理：

- `.env.test`：本地开发与后端接口联调环境（默认 `pnpm dev` 使用）
- `.env.mock`：MSW 纯粹 Mock 独立开发环境（`pnpm dev:mock` 使用）
- `.env.prod`：生产环境构建配置

### 1. 认证与登录规范

前后端统一使用同域 Cookie Session 认证，所有 API 统一通过 `/api` 基础路径发起代理或 Mock 拦截：

```env
VITE_SERVICE_BASE_URL=/api
```

- **登录方式**：前端发起 OAuth2 授权码流程。跳转统一认证授权页，将回调带回的 `code` 与 `redirect_uri` 交给 `GET /api/user/logincallback` 换取会话；token 换取与会话建立均在后端，`client_secret` 不进入前端。
- **认证方式**：同域 Session Cookie，前端不存储/手动发送 Token。
- **登出方式**：清除本地会话后整页跳转统一认证登出（`/oauth2/logout`），同步清除 IdP session，登出后回到登录页。
- **权限与错误处理**：HTTP 401 自动重定向至登录页，HTTP 403 重定向至 403 页面（后台仅允许 Level 2 及以上权限使用）。

登录环境变量：

```env
VITE_OAUTH_BASE_URL=https://oauth.tiaozhan.com   # 统一认证授权服务地址
VITE_OAUTH_CLIENT_ID=tu_xun                      # OAuth Client ID（与 tuxun-fe 共用，非 secret）
```

本地联调时 `VITE_OAUTH_BASE_URL` 不要指向 `http://localhost:8088`（该端口被 Go 后端占用）。

本地登录前置条件：

- 回调页 `http://localhost:9527/login/callback` 需在 tz-oauth 与后端回调白名单登记（生产为对应域名）；未登记时可用 `pnpm dev:mock` 或登录页「开发测试登录」面板验证。
- 生产为 history 路由 SPA，需配 `try_files ... /index.html` 回退，否则认证回跳 `/login/callback` 会 404。参考 [deploy/nginx.conf.example](deploy/nginx.conf.example)。

### 2. 接口契约规范

接口响应结构与字段定义严格以后端 OpenAPI/Apifox 契约镜像（`contract/apifox-import.json`）为准，基础响应格式如下：

```ts
interface ApiResponse<T> {
  success: boolean;
  resp: T;
  message: string;
  code: number;
}
```

- **成功标准**：`success === true` 且 `code === 0`，业务响应载荷存放于 `resp` 字段。
- **类型对齐**：`src/service/api/` 与 `src/mocks/` 的数据结构一律通过 `schema.d.ts` 驱动。

---

## 📂 项目核心目录结构

```text
.
├── contract/        # 后端 API 契约只读镜像与 check-contract.py 校验工具
├── src/
│   ├── assets/      # 静态资源
│   ├── components/  # 通用业务组件 (高德地图拾取器、图片拖拽上传器、富文本编辑器等)
│   ├── hooks/       # 通用 Composition API 钩子
│   ├── layouts/     # 页面框架布局
│   ├── locales/     # 国际化配置
│   ├── mocks/       # MSW Mock 服务层与 Handler 处理器
│   ├── service/     # 网络服务层 (api 目录、request 封装与 contract/schema.d.ts)
│   ├── store/       # Pinia 全局状态管理
│   └── views/       # 业务页面 (运行 pnpm gen-route 注册路由)
```

---

## 📌 后台业务模块规划

- **工作台 (Home)**：指标看板、快捷新建题目/通知及扫码核销。
- **审核管理 (Review)**：
  - **图片审核**：投稿图片违规核查与处理。
  - **答题审核**：答题记录违规排查。
  - **评论审核**：评论检索与违规删评。
- **运营管理 (Operation)**：
  - **官方题目**：图库管理与题目维护。
  - **运营活动**：赛事与定时活动管理。
  - **系统通知**：全量与定向通知发布。
  - **反馈意见**：用户反馈处理。
  - **基础内容**：弹窗公告、积分规则与 FAQ 维护。
- **商城管理 (Mall)**：
  - **商品管理**：商品上下架、价格与库存维护。
  - **核销记录**：兑换记录查询与扫码核销。
- **系统管理 (System)**：
  - **用户管理**：用户查询与账号封禁/解封。
