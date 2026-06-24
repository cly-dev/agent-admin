# agent-admin

Enterprise AI 管理控制台（Umi Max）。

## 开发

```bash
pnpm install
pnpm dev
```

默认 `http://localhost:8000`，API 通过 `.env.dev` 的 `/api` 代理到本地后端。

## 构建与上线

```bash
# 先编辑 .env.prod 填入生产 API 地址
pnpm build
```

产物在 `dist/`。完整步骤、环境变量与 Nginx 示例见 **[docs/deploy.md](./docs/deploy.md)**。

## UI Theme Rules

- Global theme follows `The Cognitive Architect` specification.
- New and refactored UI must use semantic theme tokens from `src/global.css`.
- Section boundaries must be expressed through surface layering, not 1px divider lines.

Review checklist: `docs/ui-theme-review-checklist.md`
