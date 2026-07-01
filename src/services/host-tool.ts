import type {
  AgentHostToolRef,
  AgentHostToolsBindingResult,
  BindAgentHostToolsDto,
  CreateHostToolDto,
  HostTool,
  HostToolControllerFindByAppClientParams,
  HostToolSummary,
  ReplaceSkillHostToolsDto,
  SkillHostToolBinding,
  SkillHostToolBindingRecord,
  SkillHostToolsBindingResult,
  UpdateHostToolDto,
} from '@/types/host-tool';
import type { PageResult } from '@/types/integration';
import { normalizePageResult } from '@/utils/api-page';
import { http } from '@/utils/request';

const HOST_TOOL_BASE = 'admin/host-tool';

/** 管理端 host-tools 列表接口 pageSize 上限 */
export const HOST_TOOL_MAX_PAGE_SIZE = 100;

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

function normalizeConfig(
  value: unknown,
): Record<string, unknown> | null | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

export function normalizeHostToolSummary(raw: unknown): HostToolSummary | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const id = Number(item.id);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  const pageScopeRaw = item.pageScope ?? item.page_scope;
  return {
    id,
    name: String(item.name ?? ''),
    pageScope:
      typeof pageScopeRaw === 'string'
        ? pageScopeRaw
        : pageScopeRaw === null
          ? null
          : null,
    definitionKey:
      typeof item.definitionKey === 'string'
        ? item.definitionKey
        : typeof item.definition_key === 'string'
          ? item.definition_key
          : undefined,
    description:
      typeof item.description === 'string' ? item.description : undefined,
    isActive: normalizeBoolean(item.isActive ?? item.is_active),
    argsSchema: item.argsSchema ?? item.args_schema,
  };
}

export function normalizeAgentHostToolRef(
  raw: unknown,
): AgentHostToolRef | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const bindingId = Number(item.id ?? item.bindingId ?? item.binding_id);
  const hostToolId = Number(item.hostToolId ?? item.host_tool_id);
  const hostToolRaw = item.hostTool ?? item.host_tool;
  const hostTool = normalizeHostToolSummary(hostToolRaw);
  if (!hostTool) {
    return null;
  }
  return {
    bindingId: Number.isFinite(bindingId) ? bindingId : hostTool.id,
    agentId: Number.isFinite(Number(item.agentId ?? item.agent_id))
      ? Number(item.agentId ?? item.agent_id)
      : undefined,
    hostToolId:
      Number.isFinite(hostToolId) && hostToolId > 0 ? hostToolId : hostTool.id,
    hostTool,
  };
}

export function normalizeSkillHostToolBindingRecord(
  raw: unknown,
): SkillHostToolBindingRecord | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const bindingId = Number(item.id ?? item.bindingId ?? item.binding_id);
  const hostToolId = Number(item.hostToolId ?? item.host_tool_id);
  const hostToolRaw = item.hostTool ?? item.host_tool;
  const hostTool = normalizeHostToolSummary(hostToolRaw);
  if (!hostTool) {
    return null;
  }
  const priorityRaw = item.priority;
  const isRequiredRaw = item.isRequired ?? item.is_required;
  return {
    bindingId: Number.isFinite(bindingId) ? bindingId : 0,
    skillId: Number.isFinite(Number(item.skillId ?? item.skill_id))
      ? Number(item.skillId ?? item.skill_id)
      : undefined,
    hostToolId:
      Number.isFinite(hostToolId) && hostToolId > 0 ? hostToolId : hostTool.id,
    trigger:
      typeof item.trigger === 'string' ? item.trigger : 'ON_MUTATION_SUCCESS',
    priority:
      typeof priorityRaw === 'number' && Number.isFinite(priorityRaw)
        ? priorityRaw
        : 0,
    isRequired:
      typeof isRequiredRaw === 'boolean'
        ? isRequiredRaw
        : isRequiredRaw === 1 ||
          isRequiredRaw === '1' ||
          isRequiredRaw === 'true',
    skillArgsTemplate:
      item.skillArgsTemplate ??
      item.skill_args_template ??
      item.argsTemplate ??
      null,
    hostTool,
  };
}

export function normalizeHostTool(raw: unknown): HostTool {
  const item = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  const id = Number(item.id);
  const appClientId = Number(item.appClientId ?? item.app_client_id);
  const hostPageIdRaw = item.hostPageId ?? item.host_page_id;

  return {
    id: Number.isFinite(id) ? id : 0,
    appClientId: Number.isFinite(appClientId) ? appClientId : 0,
    appClientName:
      typeof item.appClientName === 'string'
        ? item.appClientName
        : typeof item.app_client_name === 'string'
          ? item.app_client_name
          : undefined,
    hostPageId:
      hostPageIdRaw === null || hostPageIdRaw === undefined
        ? hostPageIdRaw === null
          ? null
          : undefined
        : Number(hostPageIdRaw),
    pageScope:
      typeof item.pageScope === 'string'
        ? item.pageScope
        : typeof item.page_scope === 'string'
          ? item.page_scope
          : item.pageScope === null || item.page_scope === null
            ? null
            : undefined,
    pageLabel:
      typeof item.pageLabel === 'string'
        ? item.pageLabel
        : typeof item.page_label === 'string'
          ? item.page_label
          : item.pageLabel === null || item.page_label === null
            ? null
            : undefined,
    definitionKey: String(item.definitionKey ?? item.definition_key ?? ''),
    name: String(item.name ?? ''),
    description: String(item.description ?? ''),
    argsSchema: item.argsSchema ?? item.args_schema ?? {},
    argsTemplate: item.argsTemplate ?? item.args_template ?? null,
    sortOrder:
      typeof item.sortOrder === 'number'
        ? item.sortOrder
        : typeof item.sort_order === 'number'
          ? item.sort_order
          : undefined,
    isActive: normalizeBoolean(item.isActive ?? item.is_active),
    config: normalizeConfig(item.config),
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
    bound: normalizeBoolean(item.bound),
  };
}

export function normalizeSkillHostToolBinding(
  raw: unknown,
): SkillHostToolBinding | null {
  const record = normalizeSkillHostToolBindingRecord(raw);
  if (!record) {
    return null;
  }
  const fullTool = normalizeHostTool(record.hostTool);
  return {
    ...fullTool,
    bindingId: record.bindingId,
    hostToolId: record.hostToolId,
    trigger: record.trigger,
    priority: record.priority,
    isRequired: record.isRequired,
    skillArgsTemplate: record.skillArgsTemplate,
    hostTool: record.hostTool,
  };
}

function normalizeAgentHostToolsBindingResult(
  raw: unknown,
): AgentHostToolsBindingResult {
  const payload = unwrapPayload(raw);
  const hostToolsRaw = payload.hostTools ?? payload.items ?? payload.list;
  const agentHostToolsRaw = payload.agentHostTools ?? payload.agent_host_tools;
  const hostTools = Array.isArray(hostToolsRaw)
    ? hostToolsRaw.map(normalizeHostTool).filter((item) => item.id > 0)
    : [];
  const agentHostTools = Array.isArray(agentHostToolsRaw)
    ? agentHostToolsRaw
        .map((item) => normalizeAgentHostToolRef(item))
        .filter((item): item is AgentHostToolRef => item !== null)
    : [];
  return { hostTools, agentHostTools };
}

function normalizeSkillHostToolsBindingResult(
  raw: unknown,
): SkillHostToolsBindingResult {
  const payload = unwrapPayload(raw);
  const skillHostToolsRaw =
    payload.skillHostTools ?? payload.skill_host_tools ?? payload.items;
  const hostToolsRaw = payload.hostTools ?? payload.host_tools;
  const skillHostTools = Array.isArray(skillHostToolsRaw)
    ? skillHostToolsRaw
        .map((item) => normalizeSkillHostToolBindingRecord(item))
        .filter((item): item is SkillHostToolBindingRecord => item !== null)
    : [];
  const hostTools = Array.isArray(hostToolsRaw)
    ? hostToolsRaw
        .map((item) => normalizeHostToolSummary(item))
        .filter((item): item is HostToolSummary => item !== null)
    : skillHostTools.map((item) => item.hostTool);
  return { hostTools, skillHostTools };
}

export async function HostToolController_findByAppClient(
  appClientId: number,
  params?: Omit<HostToolControllerFindByAppClientParams, 'appClientId'>,
): Promise<PageResult<HostTool>> {
  const response = await http.get<unknown>(
    `${HOST_TOOL_BASE}/by-app-client/${appClientId}`,
    params,
  );
  return normalizePageResult(response, normalizeHostTool);
}

export async function HostToolController_findOne(
  id: number,
): Promise<HostTool> {
  const response = await http.get<unknown>(`${HOST_TOOL_BASE}/${id}`);
  return normalizeHostTool(unwrapPayload(response));
}

export async function HostToolController_create(
  data: CreateHostToolDto,
): Promise<HostTool> {
  const response = await http.post<unknown>(HOST_TOOL_BASE, data);
  return normalizeHostTool(unwrapPayload(response));
}

export async function HostToolController_update(
  id: number,
  data: UpdateHostToolDto,
): Promise<HostTool> {
  const response = await http.patch<unknown>(`${HOST_TOOL_BASE}/${id}`, data);
  return normalizeHostTool(unwrapPayload(response));
}

export function HostToolController_remove(id: number) {
  return http.delete<void>(`${HOST_TOOL_BASE}/${id}`);
}

export async function HostToolController_getAgentHostTools(
  agentId: number,
  appClientId: number,
  params?: HostToolControllerFindByAppClientParams,
): Promise<PageResult<HostTool>> {
  const response = await http.get<unknown>(
    `admin/agent/${agentId}/app-client/${appClientId}/host-tools`,
    params,
  );
  return normalizePageResult(response, normalizeHostTool);
}

/** 分页拉取 Agent 下全部 Host Tool（单页最多 {@link HOST_TOOL_MAX_PAGE_SIZE} 条） */
export async function HostToolController_getAllAgentHostTools(
  agentId: number,
  appClientId: number,
): Promise<HostTool[]> {
  const list: HostTool[] = [];
  let page = 1;
  let total = 0;

  do {
    const result = await HostToolController_getAgentHostTools(
      agentId,
      appClientId,
      {
        page,
        pageSize: HOST_TOOL_MAX_PAGE_SIZE,
      },
    );
    list.push(...result.list);
    total = result.total;
    page += 1;
  } while (list.length < total);

  return list;
}

export async function HostToolController_addAgentHostTools(
  agentId: number,
  appClientId: number,
  data: BindAgentHostToolsDto,
): Promise<AgentHostToolsBindingResult> {
  const response = await http.post<unknown>(
    `admin/agent/${agentId}/app-client/${appClientId}/host-tools`,
    data,
  );
  return normalizeAgentHostToolsBindingResult(response);
}

export async function HostToolController_removeAgentHostTools(
  agentId: number,
  appClientId: number,
  data: BindAgentHostToolsDto,
): Promise<AgentHostToolsBindingResult> {
  const response = await http.delete<unknown>(
    `admin/agent/${agentId}/app-client/${appClientId}/host-tools`,
    { data },
  );
  return normalizeAgentHostToolsBindingResult(response);
}

export async function HostToolController_listSkillHostTools(
  skillId: number,
): Promise<SkillHostToolsBindingResult> {
  const response = await http.get<unknown>(`admin/skill/${skillId}/host-tools`);
  return normalizeSkillHostToolsBindingResult(response);
}

export async function HostToolController_replaceSkillHostTools(
  skillId: number,
  data: ReplaceSkillHostToolsDto,
): Promise<SkillHostToolsBindingResult> {
  const response = await http.put<unknown>(
    `admin/skill/${skillId}/host-tools`,
    data,
  );
  return normalizeSkillHostToolsBindingResult(response);
}
