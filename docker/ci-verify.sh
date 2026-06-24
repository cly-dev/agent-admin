#!/usr/bin/env bash
# Kaniko 构建前检查（在 omnix-admin / custom-no-code 仓库根目录执行）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

missing=0

if [ ! -f package.json ]; then
  echo "ERROR: 缺少 ${ROOT}/package.json"
  echo "       构建上下文必须是前端仓库根目录，不是 agent-admin/ 子目录。"
  missing=1
fi

if [ ! -f pnpm-lock.yaml ]; then
  echo "ERROR: 缺少 pnpm-lock.yaml"
  missing=1
fi

if [ ! -f docker/nginx.conf ]; then
  echo "ERROR: 缺少 docker/nginx.conf"
  missing=1
fi

if [ -f Dockerfile ] && grep -q 'agent-admin/package.json' Dockerfile; then
  echo "ERROR: Dockerfile 仍是旧版（含 agent-admin/package.json）"
  echo "       请拉取最新代码，根目录 Dockerfile 应使用 COPY package.json"
  missing=1
fi

if [ -f Dockerfile ] && grep -q 'COPY agent-chat' Dockerfile; then
  echo "ERROR: Dockerfile 仍要求 COPY agent-chat"
  echo "       omnix-chat 已改为 npm 依赖，请拉取最新 Dockerfile"
  missing=1
fi

if [ "${missing}" -ne 0 ]; then
  exit 1
fi

echo "OK: 构建上下文就绪 (${ROOT})"
ls -la package.json pnpm-lock.yaml Dockerfile
