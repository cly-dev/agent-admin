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

`omnix-chat` 通过 npm 安装（当前 `1.5.5`），CI/Docker 构建只需 `pnpm install`，无需克隆 `agent-chat` 源码。

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

## 5. Docker 部署

项目提供两种镜像构建方式。

### 方式 A：在镜像内完整构建（推荐 CI）

构建上下文为 **前端仓库根目录**（`custom-no-code` / `omnix-admin`，含 `package.json`、`Dockerfile`）：

```bash
cd /path/to/omnix-admin

docker build \
  --build-arg UMI_APP_API_BASE_URL=https://api.example.com \
  --build-arg UMI_APP_OMNIX_CHAT_BASE_URL=https://api.example.com \
  --build-arg UMI_APP_OMNIX_CHAT_DSN=your-dsn \
  -t omnix-admin:latest .

docker run --rm -p 8080:80 agent-admin:latest
```

### 方式 B：仅打包 dist（CI 已执行 pnpm build）

```bash
cd agent-admin
UMI_ENV=prod pnpm build

docker build -f docker/Dockerfile.runtime -t agent-admin:latest .
docker run --rm -p 8080:80 agent-admin:latest
```

### Nginx

配置文件：`docker/nginx.conf`

- `/`：SPA 回退 `index.html`
- `/healthz`：健康检查
- 静态资源 7 天缓存，`index.html` 不缓存

API 地址在 **构建时** 通过 `UMI_APP_*` 写入 JS，默认由浏览器直连后端；若需同域反代，见 `nginx.conf` 内注释。

### Jenkins / Kaniko 拉镜像超时

若日志出现：

```text
Get "https://index.docker.io/v2/": dial tcp ...:443: i/o timeout
```

说明构建机**访问不了 Docker Hub**，不是 Dockerfile 语法错误。可选方案：

1. **推荐**：在 `step-0`（`node-build` 镜像）里 `pnpm install && pnpm build`，Kaniko 只打运行镜像：

   ```bash
   cd omnix-admin   # 按仓库实际路径
   pnpm install --frozen-lockfile
   UMI_ENV=prod pnpm build
   # Kaniko 构建
   docker build -f docker/Dockerfile.runtime \
     --build-arg NGINX_IMAGE=<内网 nginx 镜像> \
     -t agent-admin:latest .
   ```

2. **多阶段 Dockerfile**：让 DevOps 把 `node:20-alpine`、`nginx:1.27-alpine` 同步到 ACR，构建时传入：

   ```bash
   --build-arg NODE_IMAGE=<ACR>/cht-base/node:20-alpine
   --build-arg NGINX_IMAGE=<ACR>/cht-base/nginx:1.27-alpine
   ```

3. 或配置 Kaniko / 集群 **registry-mirror** 指向可访问的 Docker Hub 镜像加速。

### Kaniko 报 `agent-admin/package.json: no such file or directory`

说明流水线用的 **仍是旧 Dockerfile**（路径带 `agent-admin/` 前缀），而 `omnix-admin` 仓库里 `package.json` 在 **仓库根目录**（Jenkins 上的 `custom-no-code/`），没有 `agent-admin/` 子目录。

处理：

1. **提交并推送** 当前仓库根目录的 `Dockerfile`（应为 `COPY package.json`，不是 `COPY agent-admin/package.json`）。
2. Kaniko 参数示例：
   ```text
   构建上下文: /home/jenkins/agent/workspace/custom-no-code
   Dockerfile: Dockerfile          # 仓库根目录，不是 agent-admin/Dockerfile
   ```
3. 构建前校验：
   ```bash
   cd custom-no-code
   bash docker/ci-verify.sh       # 检查路径是否正确
   ```

### Kaniko 报 `pnpm install` 找不到 `omnix-chat`

确认 `package.json` 中 `omnix-chat` 为版本号（如 `1.5.5`），不是 `link:../agent-chat`。构建镜像需能访问 npm registry（或内网镜像源）。

若 step-0 已 `pnpm build`，Kaniko 只打运行镜像即可：

```bash
docker build -f docker/Dockerfile.runtime --build-arg NGINX_IMAGE=<内网 nginx> -t ...
```

## 6. 常见问题

**构建报 `Found conflicts in esbuild helpers`**

已在 `.umirc.ts` 设置 `esbuildMinifyIIFE: true`。

**生产请求仍打到 localhost:3030**

说明 `UMI_APP_API_BASE_URL` 未在构建时注入。检查是否使用 `UMI_ENV=prod` 构建，以及 `.env.prod` 是否存在。

**刷新子路由 404**

静态托管需配置 SPA fallback（`try_files ... /index.html`）。
