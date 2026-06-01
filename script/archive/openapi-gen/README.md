# OpenAPI 生成物归档

本目录存放 `npm run gen:api` 从 OpenAPI 文档生成的**参考代码**，不再参与应用构建。

## 目录结构

| 路径 | 说明 |
|------|------|
| `types/` | 接口 DTO、Query 参数类型 |
| `services/` | 薄封装 HTTP 请求函数 |

## 与业务代码的关系

正式实现位于：

- `src/types/<module>.ts` — 手写或合并后的类型
- `src/services/<module>.ts` — 含 normalize、分页封装等

生成后请对照 `types/`、`services/` 中的 diff，将需要的声明与函数**手动合并**到 `src/types`、`src/services`，不要直接覆盖手写文件。

## 历史说明

此前生成物位于 `src/types/api-gen`、`src/services/api-gen`，已于 2026-06 迁入本目录并删除原路径。
