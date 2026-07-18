import { normalizeTool } from '@/pages/Tool/toolNormalize';
import { http } from '@/utils/request';
import { normalizePageResult } from '@/utils/api-page';
import type { PageResult } from '@/types/integration';
import type {
  BatchSetToolsActiveDto,
  BatchSetToolsActiveResult,
  CreateToolDto,
  DebugToolDto,
  DebugToolResult,
  ImportToolsFromSwaggerDto,
  InitToolSchemasFromDebugDto,
  InitToolSchemasFromDebugResult,
  Tool,
  ToolControllerFindByAppClientParams,
  ToolControllerFindPageParams,
  UpdateToolDto,
} from '@/types/tool';

const TOOL_BASE = 'admin/tool';

function unwrapPayload(raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }
  const payload = raw as Record<string, unknown>;
  if (typeof payload.data === 'object' && payload.data !== null) {
    return payload.data as Record<string, unknown>;
  }
  return payload;
}

function normalizeBatchSetActiveResult(raw: unknown): BatchSetToolsActiveResult {
  const item = unwrapPayload(raw);
  const notFoundRaw = item.notFoundIds ?? item.not_found_ids;
  const notFoundIds = Array.isArray(notFoundRaw)
    ? notFoundRaw.map((id) => Number(id)).filter((id) => Number.isFinite(id))
    : undefined;

  return {
    updatedCount: Number(item.updatedCount ?? item.updated_count ?? 0) || undefined,
    notFoundIds,
  };
}

function normalizeDebugToolResult(raw: unknown): DebugToolResult {
  const item = unwrapPayload(raw);
  return {
    ok: typeof item.ok === 'boolean' ? item.ok : undefined,
    statusCode:
      typeof item.statusCode === 'number'
        ? item.statusCode
        : typeof item.status_code === 'number'
          ? item.status_code
          : undefined,
    durationMs:
      typeof item.durationMs === 'number'
        ? item.durationMs
        : typeof item.duration_ms === 'number'
          ? item.duration_ms
          : undefined,
    request:
      typeof item.request === 'object' && item.request !== null
        ? (item.request as Record<string, unknown>)
        : undefined,
    response:
      typeof item.response === 'object' && item.response !== null
        ? (item.response as Record<string, unknown>)
        : undefined,
    error: typeof item.error === 'string' ? item.error : undefined,
  };
}

/** 分页查询工具列表 */
export async function ToolController_findPage(
  params?: ToolControllerFindPageParams,
): Promise<PageResult<Tool>> {
  const response = await http.get<unknown>(TOOL_BASE, params);
  return normalizePageResult(response, normalizeTool);
}

/** 按 AppClient ID 分页查询工具列表 */
export async function ToolController_findByAppClient(
  appClientId: number,
  params?: ToolControllerFindByAppClientParams,
): Promise<PageResult<Tool>> {
  const response = await http.get<unknown>(
    `${TOOL_BASE}/by-app-client/${appClientId}`,
    params,
  );
  return normalizePageResult(response, normalizeTool);
}

/** 批量更新工具启用状态 */
export async function ToolController_batchSetActive(
  data: BatchSetToolsActiveDto,
): Promise<BatchSetToolsActiveResult> {
  const response = await http.patch<unknown>(`${TOOL_BASE}/batch/status`, data);
  return normalizeBatchSetActiveResult(response);
}

/** 调试 Tool HTTP 调用 */
export async function ToolController_debug(
  id: number,
  data: DebugToolDto,
): Promise<DebugToolResult> {
  const response = await http.post<unknown>(`${TOOL_BASE}/${id}/debug`, data);
  return normalizeDebugToolResult(response);
}

/**
 * 调试 Tool 并由大模型初始化 outputSchema / responseProfile / agentMetadata。
 * 推荐 persist: false，预览后再应用到表单或二次 persist。
 */
export async function ToolController_initSchemasFromDebug(
  appClientId: number,
  id: number,
  data: InitToolSchemasFromDebugDto,
): Promise<InitToolSchemasFromDebugResult> {
  const response = await http.post<unknown>(
    `${TOOL_BASE}/by-app-client/${appClientId}/${id}/debug/init-schemas`,
    data,
  );
  const payload = unwrapPayload(response) as Record<string, unknown>;
  return {
    debug: (payload.debug as InitToolSchemasFromDebugResult['debug']) ?? undefined,
    outputSchema:
      (payload.outputSchema as InitToolSchemasFromDebugResult['outputSchema']) ??
      undefined,
    responseProfile: normalizeResponseProfileLoose(payload.responseProfile),
    agentMetadata:
      (payload.agentMetadata as InitToolSchemasFromDebugResult['agentMetadata']) ??
      null,
    source: typeof payload.source === 'string' ? payload.source : undefined,
    agentMetadataSource:
      typeof payload.agentMetadataSource === 'string'
        ? payload.agentMetadataSource
        : undefined,
    persisted: payload.persisted === true,
    tool: payload.tool ? normalizeTool(payload.tool) : undefined,
    adjustments: Array.isArray(payload.adjustments)
      ? (payload.adjustments as InitToolSchemasFromDebugResult['adjustments'])
      : undefined,
  };
}

function normalizeResponseProfileLoose(
  raw: unknown,
): InitToolSchemasFromDebugResult['responseProfile'] {
  if (typeof raw !== 'object' || raw === null) {
    return undefined;
  }
  return raw as InitToolSchemasFromDebugResult['responseProfile'];
}

/** 创建工具 */
export async function ToolController_create(data: CreateToolDto) {
  const response = await http.post<unknown>(TOOL_BASE, data);
  return normalizeTool(unwrapPayload(response));
}

/** 按 ID 查询工具 */
export async function ToolController_findOne(id: number) {
  const response = await http.get<unknown>(`${TOOL_BASE}/${id}`);
  return normalizeTool(unwrapPayload(response));
}

/** 按 ID 更新工具 */
export async function ToolController_update(id: number, data: UpdateToolDto) {
  const response = await http.patch<unknown>(`${TOOL_BASE}/${id}`, data);
  return normalizeTool(unwrapPayload(response));
}

/** 按 ID 删除工具 */
export function ToolController_remove(id: number) {
  return http.delete<void>(`${TOOL_BASE}/${id}`);
}

/**
 * 从 Swagger/OpenAPI URL 导入工具
 * @description 拉取 OpenAPI 文档并 upsert Tool、ToolCategory、RoleTool
 */
export function ToolController_importFromSwagger(data: ImportToolsFromSwaggerDto) {
  return http.post<void>(`${TOOL_BASE}/import/swagger`, data);
}
