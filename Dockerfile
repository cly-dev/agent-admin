# omnix-admin 生产镜像（Kaniko / 内网 ACR）
#
# 构建上下文 = Jenkins 工作区（custom-no-code）
# 兼容两种目录：
#   A) package.json 在上下文根目录（git clone .）
#   B) package.json 在 omnix-admin/ 子目录（git clone ... omnix-admin）
#
# docker build \
#   --build-arg UMI_APP_API_BASE_URL=https://api.example.com \
#   --build-arg UMI_APP_OMNIX_CHAT_BASE_URL=https://api.example.com \
#   --build-arg UMI_APP_OMNIX_CHAT_DSN=xxx \
#   -t omnix-admin:latest .

# -----------------------------------------------------------------------------
# Stage 1: build
# -----------------------------------------------------------------------------
FROM erp-prod-acr-registry-vpc.cn-hangzhou.cr.aliyuncs.com/cht-base/node:22.18-chrome AS builder

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /build

# 先整包拷入，再解析项目根（Jenkins 常见：代码在 omnix-admin/ 子目录）
COPY . /build/context/

RUN set -eux; \
    if [ -f /build/context/package.json ]; then \
      echo /build/context > /build/APP_ROOT; \
    elif [ -f /build/context/omnix-admin/package.json ]; then \
      echo /build/context/omnix-admin > /build/APP_ROOT; \
    else \
      echo "ERROR: package.json not found at ./ or ./omnix-admin/"; \
      ls -la /build/context; \
      find /build/context -maxdepth 3 -name package.json 2>/dev/null || true; \
      exit 1; \
    fi

WORKDIR /build/app

RUN set -eux; \
    APP_ROOT=$(cat /build/APP_ROOT); \
    cp "${APP_ROOT}/package.json" "${APP_ROOT}/pnpm-lock.yaml" /build/app/; \
    if [ -f "${APP_ROOT}/.npmrc" ]; then cp "${APP_ROOT}/.npmrc" /build/app/; fi

ENV CI=true \
    HUSKY=0

RUN pnpm install --frozen-lockfile --ignore-scripts \
    && pnpm exec max setup

RUN set -eux; \
    APP_ROOT=$(cat /build/APP_ROOT); \
    cd "${APP_ROOT}"; \
    tar cf - --exclude=node_modules --exclude=.git . | tar xf - -C /build/app

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
FROM erp-prod-acr-registry-vpc.cn-hangzhou.cr.aliyuncs.com/cht-base/nginx:1.27-alpine AS runtime

COPY --from=builder /build/app/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /build/app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O - http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
