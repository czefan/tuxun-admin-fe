# 图寻后台管理前端 (tuxun-admin-fe)

本项目是图寻后台管理系统的前端应用，基于 [SoybeanAdmin](https://github.com/soybeanjs/soybean-admin) 模版构建，采用 Vue 3, Vite, Naive UI, TypeScript 和 UnoCSS 开发。

---

## 🛠️ 技术选型

- **应用框架**：Vue 3 (Composition API)
- **工程构建**：Vite 8
- **开发语言**：TypeScript
- **组件库**：Naive UI
- **样式引擎**：UnoCSS (原子化 CSS)
- **网络层封装**：基于 `@sa/axios` 封装 Rarer/Flat 请求 (扁平响应值获取)
- **包管理工具**：pnpm (>= 10.5.0)

---

## 🚀 开发命令与工作流

### 1. 基础命令

- **安装依赖**：
  ```bash
  pnpm install
  ```
- **启动开发环境 (默认使用 test 代理环境)**：
  ```bash
  pnpm dev
  ```
- **项目打包 (生产环境编译)**：
  ```bash
  pnpm build
  ```
- **类型检查**：
  ```bash
  pnpm typecheck
  ```

### 2. 自动路由生成机制

项目集成了 `@elegant-router/vue`。在 `src/views` 目录下新增或修改页面页面目录结构后，必须执行以下命令以自动扫描目录并生成路由和类型：

```bash
pnpm gen-route
```

_注：自动生成的路由相关代码位于 `src/router/` 下，请勿手动编辑。_

### 3. 代码规范与 Git 提交拦截

项目配置了 `simple-git-hooks` 作为 Git Hooks 工具，包含以下校验：

- **提交前校验 (Pre-commit)**：在执行 `git commit` 时，系统会自动运行 `pnpm typecheck && pnpm lint && pnpm fmt`，确保无类型错误且代码风格合规（使用 `oxlint` 和 `oxfmt` 加速检测）。
- **提交信息校验 (Commit-msg)**：通过 `pnpm sa git-commit-verify` 验证提交备注格式。

如需手动运行校验或格式化：

```bash
pnpm lint  # 运行代码规范检测
pnpm fmt   # 自动格式化代码
```

---

## 📡 接口联调与环境配置

项目在根目录使用 `.env.*` 文件进行多环境配置管理：

- `.env.test`：本地开发与测试环境（默认开发联调使用）
- `.env.prod`：生产环境构建配置

### 1. 后端接口切换

开发与生产统一使用同域 Cookie Session 认证，所有 API 统一通过 `/api` 基础路径发起代理或直接请求：

```env
VITE_SERVICE_BASE_URL=/api
```

### 2. 接口契约规范

接口响应规范严格以权威 Apifox 契约（`apifox-import.json`）为准，标准结构如下：

```ts
interface ApiResponse<T> {
  success: boolean;
  resp: T;
  message: string;
  code: number;
}
```

- **认证方式**：基于同域 Session Cookie。前端不保存/发送 Token。
- **业务成功标识**：`success === true` 且 `code === 0`，数据存放在 `resp` 字段中。
- **登录与权限**：HTTP 401 自动导航至登录页，HTTP 403 导航至 403 无权限页（仅 Level 2 及以上允许使用后台）。

---

## 📂 项目核心目录结构

```text
src/
├── assets/          # 静态资源管理
├── components/      # 业务无关的全局通用组件
├── hooks/           # 通用 Composition API 钩子
├── layouts/         # 页面框架布局 (菜单栏、导航栏、主面板)
├── locales/         # 国际化语言配置
├── service/         # 网络服务层
│   ├── api/         # 接口定义目录
│   └── request/     # 请求拦截器与基础封装
├── store/           # Pinia 全局状态管理
└── views/           # 页面级组件 (在此添加页面后执行 pnpm gen-route 注册路由)
```

---

## 📌 首批后台业务规划

首期规划的后台管理功能模块如下：

- **审核管理**：投稿审核、答题审核（日常内容违规核查）。
- **评论管理**：评论检索与一键删评，重点筛查泄漏游戏特定地点的内容。
- **官方运营**：发布官方题目、创建系统通知（支持定向或全量用户发送）。
- **用户管理**：用户信息、积分明细查询及封禁/解封状态管理。
- **商城管理**：商品上架下架、库存调配、积分价格维护。
- **奖品核销**：兑换订单的核销码验证与扫码核销处理。
