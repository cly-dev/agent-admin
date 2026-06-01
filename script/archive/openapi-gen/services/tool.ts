// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: src/services/api-gen/ — merge into src/services/ manually when ready
// Source: http://localhost:3030/docs-json

import { http } from "@/utils/request";
import type {
  ToolControllerFindPageParams,
  InitToolSchemasFromDebugDto,
} from "@/types/tool";

/**
 * 分页查询工具列表
 * @description 支持分页与字段筛选。每条记录返回完整关联：appClient、toolCategory（类目 label 同时出现在 tags 数组）、integration、agentTools/skillTools/roleTools 及嵌套实体。
 * @tags tool
 */
export function ToolController_findPage(params?: ToolControllerFindPageParams) {
  return http.get<void>("admin/tool", params);
}

/**
 * 调试 Tool 并由大模型初始化 outputSchema / responseProfile
 * @description 先按工具配置发起真实 HTTP 调试请求；成功后调用大模型根据响应样本推断 outputSchema 与 responseProfile，并默认写回该 Tool（persist=true）。工具必须属于路径中的 appClientId。
 * @tags tool
 */
export function ToolController_initSchemasFromDebug(appClientId: number, id: number, data: InitToolSchemasFromDebugDto) {
  return http.post<void>(`admin/tool/by-app-client/${appClientId}/${id}/debug/init-schemas`, data);
}
