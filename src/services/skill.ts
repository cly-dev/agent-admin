import { normalizeAgentAllowedTool } from '@/pages/Agent/agentNormalize';
import {
  normalizeHostToolSummary,
  normalizeSkillHostToolBindingRecord,
} from '@/services/host-tool';
import type {
  HostToolSummary,
  SkillHostToolBindingRecord,
} from '@/types/host-tool';
import type { PageResult } from '@/types/integration';
import type {
  CreateSkillDto,
  ReplaceSkillToolsDto,
  Skill,
  SkillControllerFindByAgentParams,
  SkillControllerFindByAppClientParams,
  SkillDetail,
  SkillRef,
  SkillToolBinding,
  UpdateSkillDto,
} from '@/types/skill';
import type { WorkflowOverrides } from '@/types/workflow';
import { normalizePageResult } from '@/utils/api-page';
import { http } from '@/utils/request';

const SKILL_BASE = 'admin/skill';

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

function normalizeBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 1 || value === '1' || value === 'true') {
    return true;
  }
  if (value === 0 || value === '0' || value === 'false') {
    return false;
  }
  return undefined;
}

function normalizeConfig(value: unknown): Record<string, unknown> | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function normalizeEntityRef(raw: unknown): SkillRef | undefined {
  if (typeof raw !== 'object' || raw === null) {
    return undefined;
  }
  const item = raw as Record<string, unknown>;
  const id = Number(item.id);
  if (!Number.isFinite(id) || id <= 0) {
    return undefined;
  }
  const name =
    typeof item.name === 'string'
      ? item.name
      : typeof item.label === 'string'
        ? item.label
        : undefined;
  return { id, name };
}

function normalizeNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeWorkflowOverrides(value: unknown): WorkflowOverrides | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as WorkflowOverrides;
  }
  return value === null ? null : null;
}

export function normalizeSkillToolBinding(
  raw: unknown,
): SkillToolBinding | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const toolRef = normalizeAgentAllowedTool(item);
  const toolId = Number(item.toolId ?? item.tool_id ?? toolRef.toolId);
  if (!Number.isFinite(toolId) || toolId <= 0) {
    return null;
  }

  const bindingId = Number(item.id ?? item.bindingId ?? item.binding_id);
  const isRequiredRaw = item.isRequired ?? item.is_required;
  const requiresWriteConfirmationRaw =
    item.requiresWriteConfirmation ?? item.requires_write_confirmation;
  const toolNested =
    typeof item.tool === 'object' && item.tool !== null
      ? (item.tool as Record<string, unknown>)
      : null;
  const requiresWriteFromTool =
    toolNested?.requiresWriteConfirmation ??
    toolNested?.requires_write_confirmation;

  return {
    id: Number.isFinite(bindingId) && bindingId > 0 ? bindingId : undefined,
    toolId,
    isRequired:
      typeof isRequiredRaw === 'boolean'
        ? isRequiredRaw
        : isRequiredRaw === 1 ||
          isRequiredRaw === '1' ||
          isRequiredRaw === 'true',
    name: toolRef.name || undefined,
    description: toolRef.description,
    path: toolRef.path,
    method: toolRef.method,
    definitionKey: toolRef.definitionKey,
    isActive: toolRef.isActive,
    requiresWriteConfirmation:
      typeof requiresWriteConfirmationRaw === 'boolean'
        ? requiresWriteConfirmationRaw
        : typeof requiresWriteFromTool === 'boolean'
          ? requiresWriteFromTool
          : undefined,
  };
}

export function normalizeSkill(raw: unknown): Skill {
  const item = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  const id = Number(item.id);
  const appClientFromNested = normalizeEntityRef(
    item.appClient ?? item.app_client,
  );
  const appClientIdRaw = Number(item.appClientId ?? item.app_client_id);
  const appClientId =
    Number.isFinite(appClientIdRaw) && appClientIdRaw > 0
      ? appClientIdRaw
      : (appClientFromNested?.id ?? 0);
  const appClientName =
    typeof item.appClientName === 'string'
      ? item.appClientName
      : typeof item.app_client_name === 'string'
        ? item.app_client_name
        : appClientFromNested?.name;
  const agentSkillCountRaw = item.agentSkillCount ?? item.agent_skill_count;
  const toolsRaw = item.tools ?? item.skillTools ?? item.skill_tools;
  const toolCountRaw = item.toolCount ?? item.tool_count;
  const hostToolCountRaw = item.hostToolCount ?? item.host_tool_count;
  const riskLevelRaw = item.riskLevel ?? item.risk_level;
  const requiresWriteConfirmationRaw =
    item.requiresWriteConfirmation ?? item.requires_write_confirmation;

  return {
    id: Number.isFinite(id) ? id : 0,
    appClientId,
    appClientName,
    agentSkillCount:
      typeof agentSkillCountRaw === 'number' &&
      Number.isFinite(agentSkillCountRaw)
        ? agentSkillCountRaw
        : undefined,
    name: String(item.name ?? ''),
    prompt: typeof item.prompt === 'string' ? item.prompt : '',
    capabilityKey:
      typeof item.capabilityKey === 'string'
        ? item.capabilityKey
        : typeof item.capability_key === 'string'
          ? item.capability_key
          : undefined,
    description:
      typeof item.description === 'string' ? item.description : undefined,
    config: normalizeConfig(item.config),
    riskLevel:
      riskLevelRaw === 'L1' || riskLevelRaw === 'L2' || riskLevelRaw === 'L3'
        ? riskLevelRaw
        : undefined,
    requiresWriteConfirmation:
      typeof requiresWriteConfirmationRaw === 'boolean'
        ? requiresWriteConfirmationRaw
        : undefined,
    isActive: normalizeBoolean(item.isActive ?? item.is_active),
    workflowId: normalizeNullableNumber(item.workflowId ?? item.workflow_id),
    workflowVersion: normalizeNullableNumber(
      item.workflowVersion ?? item.workflow_version,
    ),
    workflowOverrides: normalizeWorkflowOverrides(
      item.workflowOverrides ?? item.workflow_overrides,
    ),
    flowId: normalizeNullableNumber(item.flowId ?? item.flow_id),
    flowVersion: normalizeNullableNumber(
      item.flowVersion ?? item.flow_version,
    ),
    workflowName:
      typeof item.workflowName === 'string'
        ? item.workflowName
        : typeof item.workflow_name === 'string'
          ? item.workflow_name
          : undefined,
    flowName:
      typeof item.flowName === 'string'
        ? item.flowName
        : typeof item.flow_name === 'string'
          ? item.flow_name
          : undefined,
    toolCount:
      typeof toolCountRaw === 'number' && Number.isFinite(toolCountRaw)
        ? toolCountRaw
        : Array.isArray(toolsRaw)
          ? toolsRaw.length
          : undefined,
    hostToolCount:
      typeof hostToolCountRaw === 'number' && Number.isFinite(hostToolCountRaw)
        ? hostToolCountRaw
        : undefined,
    createdAt:
      typeof item.createdAt === 'string'
        ? item.createdAt
        : typeof item.created_at === 'string'
          ? item.created_at
          : undefined,
    updatedAt:
      typeof item.updatedAt === 'string'
        ? item.updatedAt
        : typeof item.updated_at === 'string'
          ? item.updated_at
          : undefined,
    appClient: appClientId
      ? { id: appClientId, name: appClientName }
      : appClientFromNested,
  };
}

export function normalizeSkillDetail(raw: unknown): SkillDetail | null {
  const payload = unwrapPayload(raw);
  const skill = normalizeSkill(payload);
  if (!skill.id || !skill.appClientId) {
    const fallback = normalizeSkill(raw);
    if (!fallback.id || !fallback.appClientId) {
      return null;
    }
    return { ...fallback, tools: [] };
  }

  const toolsRaw = payload.tools ?? payload.skillTools ?? payload.skill_tools;
  const tools = Array.isArray(toolsRaw)
    ? toolsRaw
        .map((item) => normalizeSkillToolBinding(item))
        .filter((item): item is SkillToolBinding => item !== null)
    : [];

  const skillHostToolsRaw = payload.skillHostTools ?? payload.skill_host_tools;
  const hostToolsRaw = payload.hostTools ?? payload.host_tools;
  const skillHostTools: SkillHostToolBindingRecord[] = Array.isArray(
    skillHostToolsRaw,
  )
    ? skillHostToolsRaw
        .map((item) => normalizeSkillHostToolBindingRecord(item))
        .filter((item): item is SkillHostToolBindingRecord => item !== null)
    : [];
  const hostTools: HostToolSummary[] = Array.isArray(hostToolsRaw)
    ? hostToolsRaw
        .map((item) => normalizeHostToolSummary(item))
        .filter((item): item is HostToolSummary => item !== null)
    : skillHostTools.map((item) => item.hostTool);

  return { ...skill, tools, skillHostTools, hostTools };
}

/** 按 AppClient 分页查询 Skill（可选 agentId 筛选；含嵌套 agent、appClient） */
export async function SkillController_findByAppClient(
  appClientId: number,
  params?: Omit<SkillControllerFindByAppClientParams, 'appClientId'>,
): Promise<PageResult<Skill>> {
  const response = await http.get<unknown>(
    `${SKILL_BASE}/by-app-client/${appClientId}`,
    params,
  );
  return normalizePageResult(response, normalizeSkill);
}

/** 分页查询 Agent 下的 Skill 列表（含嵌套 agent、appClient） */
export async function SkillController_findByAgent(
  agentId: number,
  appClientId: number,
  params?: Omit<SkillControllerFindByAgentParams, 'agentId' | 'appClientId'>,
): Promise<PageResult<Skill>> {
  const response = await http.get<unknown>(
    `admin/agent/${agentId}/app-client/${appClientId}/skills`,
    params,
  );
  return normalizePageResult(response, normalizeSkill);
}

/** 为 AppClient 创建 Skill（推荐路径） */
export async function SkillController_createByAppClient(
  appClientId: number,
  data: CreateSkillDto,
): Promise<SkillDetail> {
  const response = await http.post<unknown>(
    `admin/app-client/${appClientId}/skills`,
    data,
  );
  const detail = normalizeSkillDetail(response);
  if (detail) {
    return detail;
  }
  const skill = normalizeSkill(unwrapPayload(response));
  return { ...skill, tools: [] };
}

/** 为 Agent 创建 Skill（兼容：额外写入 AgentSkill） */
export async function SkillController_create(
  agentId: number,
  appClientId: number,
  data: CreateSkillDto,
): Promise<SkillDetail> {
  const response = await http.post<unknown>(
    `admin/agent/${agentId}/app-client/${appClientId}/skills`,
    data,
  );
  const detail = normalizeSkillDetail(response);
  if (detail) {
    return detail;
  }
  const skill = normalizeSkill(unwrapPayload(response));
  return { ...skill, tools: [] };
}

/** 按 ID 查询 Skill 详情 */
export async function SkillController_findOne(
  skillId: number,
): Promise<SkillDetail> {
  const response = await http.get<unknown>(`${SKILL_BASE}/${skillId}`);
  const detail = normalizeSkillDetail(response);
  if (!detail) {
    throw new Error('Skill not found');
  }
  return detail;
}

/** 按 ID 更新 Skill（不含工具绑定） */
export async function SkillController_update(
  skillId: number,
  data: UpdateSkillDto,
): Promise<SkillDetail> {
  const response = await http.patch<unknown>(`${SKILL_BASE}/${skillId}`, data);
  const detail = normalizeSkillDetail(response);
  if (detail) {
    return detail;
  }
  return SkillController_findOne(skillId);
}

/** 按 ID 删除 Skill（级联删除 SkillTool） */
export function SkillController_remove(skillId: number) {
  return http.delete<void>(`${SKILL_BASE}/${skillId}`);
}

/** 全量替换 Skill 关联工具 */
export async function SkillController_replaceTools(
  skillId: number,
  data: ReplaceSkillToolsDto,
): Promise<SkillDetail> {
  const response = await http.put<unknown>(
    `${SKILL_BASE}/${skillId}/tools`,
    data,
  );
  const detail = normalizeSkillDetail(response);
  if (detail) {
    return detail;
  }
  return SkillController_findOne(skillId);
}
