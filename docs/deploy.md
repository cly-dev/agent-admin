# agent-admin 上线部署

## 1. 环境变量

构建时通过 `UMI_ENV` 加载对应 env 文件（变量名必须以 `UMI_APP_` 开头才会打进前端包）。

| 文件        | 用途                       |
| ----------- | -------------------------- |
| `.env.dev`  | 本地开发 `pnpm dev`        |
| `.env.prod` | 生产构建 `pnpm build`      |
| `.env.test` | 测试环境 `pnpm build:test` |

**生产必改项（`.env.prod`）：**

```bash
UMI_APP_API_BASE_URL=https://<你的 API 域名>
UMI_APP_OMNIX_CHAT_DSN=<AppClient DSN>
UMI_APP_OMNIX_CHAT_BASE_URL=https://<你的 API 域名>
```

说明：

- `UMI_APP_API_BASE_URL`：管理端 REST API 根地址（请求会再拼 `/admin` 前缀，见 `src/utils/request.ts`）。
- `UMI_APP_OMNIX_CHAT_*`：右下角嵌入聊天组件；不配 DSN 则不展示。
- 生产环境请使用 **HTTPS 绝对地址**，不要用 `/api` 代理路径。

本地参考：`.env.example`（勿提交真实密钥）。

## 2. 构建

### 依赖

```bash
pnpm install
```

`omnix-chat` 当前为 `link:../agent-chat`。CI/生产机构建需满足其一：

1. 与 `agent-chat` 同级目录 checkout（推荐 monorepo 布局）；
2. 或将 `omnix-chat` 发布为 npm 包后，在 `package.json` 改为版本号依赖。

### 生产包

```bash
pnpm build
# 产物目录：dist/
```

测试环境：

```bash
pnpm build:test
```

构建前请确认 `.env.prod` 已填写真实域名。

## 3. 静态资源托管

`dist/` 为纯静态 SPA，任意对象存储 + CDN 或 Nginx 均可。

### Nginx 示例

```nginx
server {
  listen 80;
  server_name admin.your-domain.com;
  root /var/www/agent-admin/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # 若 API 与前端同域反代（可选；更常见是 UMI_APP_API_BASE_URL 直连 API 域名）
  # location /admin/ {
  #   proxy_pass https://api.your-domain.com/admin/;
  # }
}
```

### 子路径部署

若挂到 `https://domain.com/admin/` 而非根路径，需在 `.umirc.ts` 增加：

```ts
base: '/admin/',
publicPath: '/admin/',
```

并重新构建。

## 4. 上线前检查清单

- [ ] `.env.prod` 中 API / Chat 地址已改为生产域名
- [ ] `pnpm build` 本地通过，无 fatal 错误
- [ ] 后端 CORS 已允许管理端域名
- [ ] 后端 `/admin/*` 路由可访问
- [ ] 登录、项目切换、核心列表页冒烟通过
- [ ] 嵌入聊天（若启用）DSN 与 token 链路正常
- [ ] `.env` 未提交到 Git（已在 `.gitignore`）

## 5. 常见问题

**构建报 `Found conflicts in esbuild helpers`**

已在 `.umirc.ts` 设置 `esbuildMinifyIIFE: true`。

**生产请求仍打到 localhost:3030**

说明 `UMI_APP_API_BASE_URL` 未在构建时注入。检查是否使用 `UMI_ENV=prod` 构建，以及 `.env.prod` 是否存在。

**刷新子路由 404**

静态托管需配置 SPA fallback（`try_files ... /index.html`）。
