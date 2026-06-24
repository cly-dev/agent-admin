# omnix-admin 生产镜像（Kaniko / 内网 ACR）
# 构建上下文 = 仓库根目录（custom-no-code）
#
# docker build \
#   --build-arg UMI_APP_API_BASE_URL=https://api.example.com \
#   --build-arg UMI_APP_OMNIX_CHAT_BASE_URL=https://api.example.com \
#   --build-arg UMI_APP_OMNIX_CHAT_DSN=xxx \
#   -t omnix-admin:latest .

# -----------------------------------------------------------------------------
# Stage 1: build
# -----------------------------------------------------------------------------
ARG NODE_IMAGE=erp-prod-acr-registry-vpc.cn-hangzhou.cr.aliyuncs.com/cht-base/node:22.18-chrome
FROM ${NODE_IMAGE} AS builder

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /build/app

# omnix-chat 为 npm 依赖（package.json 版本号），无需 COPY agent-chat
COPY package.json pnpm-lock.yaml .npmrc ./

ENV CI=true \
    HUSKY=0

RUN pnpm install --frozen-lockfile --ignore-scripts \
    && pnpm exec max setup

COPY . .

ARG UMI_APP_API_BASE_URL
ARG UMI_APP_OMNIX_CHAT_DSN=
ARG UMI_APP_OMNIX_CHAT_BASE_URL

ENV NODE_ENV=production \
    UMI_ENV=prod \
    UMI_APP_API_BASE_URL=${UMI_APP_API_BASE_URL} \
    UMI_APP_OMNIX_CHAT_DSN=${UMI_APP_OMNIX_CHAT_DSN} \
    UMI_APP_OMNIX_CHAT_BASE_URL=${UMI_APP_OMNIX_CHAT_BASE_URL} \
    NODE_OPTIONS=--max-old-space-size=4096

RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 2: nginx
# -----------------------------------------------------------------------------
ARG NGINX_IMAGE=erp-prod-acr-registry-vpc.cn-hangzhou.cr.aliyuncs.com/cht-base/nginx:1.27-alpine
FROM ${NGINX_IMAGE} AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /build/app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O - http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
