// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: script/archive/openapi-gen/services/ — merge into src/services/ manually when ready
// Source: http://localhost:3030/docs-json

import type {
  BatchSetToolsActiveDto,
  DebugToolDto,
  ImportToolsFromSwaggerDto,
  InitToolSchemasFromDebugDto,
  ToolController_findByAppClientParams,
} from '@/types/tool';
import { http } from '@/utils/request';

/**
 * 按 AppClient ID 分页查询工具列表
 * @description 返回指定 appClient 下的工具，支持分页、排序及 name/keyword/integrationId 等筛选。路径中的 appClientId 优先于 Query 中的同名参数。
 * @tags tool
 */
export function ToolController_findByAppClient(
  appClientId: number,
  params?: ToolController_findByAppClientParams,
) {
  return http.get<void>(`admin/tool/by-app-client/${appClientId}`, params);
}

/**
 * 调试 Tool 并由大模型初始化 outputSchema / responseProfile
 * @description 先按工具配置发起真实 HTTP 调试请求；成功后调用大模型根据响应样本推断 outputSchema 与 responseProfile，并默认写回该 Tool（persist=true）。工具必须属于路径中的 appClientId。
 * @tags tool
 */
export function ToolController_initSchemasFromDebug(
  appClientId: number,
  id: number,
  data: InitToolSchemasFromDebugDto,
) {
  return http.post<void>(
    `admin/tool/by-app-client/${appClientId}/${id}/debug/init-schemas`,
    data,
  );
}

/**
 * 从 Swagger/OpenAPI URL 导入工具
 * @description 拉取 OpenAPI 文档并 upsert Tool、ToolCategory、RoleTool（与 swagger-tool-cli --apply 逻辑一致）。风险等级按 HTTP 方法自动设置：GET=L1，POST/PUT/PATCH=L2，DELETE=L3。未传 tags/ops/pathInclude 时导入 path 过滤后的全部接口（默认排除 public、buyer）。
 * @tags tool
 */
export function ToolController_importFromSwagger(
  data: ImportToolsFromSwaggerDto,
) {
  return http.post<void>('admin/tool/import/swagger', data);
}

/**
 * 批量更新工具启用状态
 * @description 统一设置 isActive：true 批量启用，false 批量禁用。不存在的 ID 会出现在 notFoundIds 中。
 * @tags tool
 */
export function ToolController_batchSetActive(data: BatchSetToolsActiveDto) {
  return http.patch<void>('admin/tool/batch/status', data);
}

/**
 * 调试 Tool HTTP 调用
 * @description 按工具配置的 method/path/integration 发起真实请求。可传 parameters（path/query/body）、headers、apiKey、timeoutMs。返回请求与响应详情（敏感头已脱敏）。
 * @tags tool
 */
export function ToolController_debug(id: number, data: DebugToolDto) {
  return http.post<void>(`admin/tool/${id}/debug`, data);
}
