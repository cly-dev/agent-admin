import type {
  CreatePageActionDto,
  PageAction,
  PageActionListQuery,
  UpdatePageActionDto,
} from '@/types/page-action';
import type { WorkflowOverrides } from '@/types/workflow';
import type { PageResult } from '@/types/integration';
import { normalizePageResult } from '@/utils/api-page';
import { http } from '@/utils/request';

const PAGE_ACTION_BASE = 'admin/page-action';

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

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 1 || value === '1' || value === 'true') {
    return true;
  }
  return false;
}

function normalizeDate(value: unknown): string | undefined {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  return undefined;
}

function normalizeWorkflowOverrides(value: unknown): WorkflowOverrides | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as WorkflowOverrides;
  }
  return value === null ? null : null;
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

export function normalizePageAction(raw: unknown): PageAction {
  const item = unwrapPayload(raw);
  const id = Number(item.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('Invalid PageAction id');
  }

  const pageScopeRaw = item.pageScope ?? item.page_scope;
  const configRaw = item.config;

  return {
    id,
    appClientId: Number(item.appClientId ?? item.app_client_id ?? 0),
    appClientName:
      typeof item.appClientName === 'string'
        ? item.appClientName
        : typeof item.app_client_name === 'string'
          ? item.app_client_name
          : undefined,
    actionKey: String(item.actionKey ?? item.action_key ?? ''),
    name: String(item.name ?? ''),
    description:
      typeof item.description === 'string'
        ? item.description
        : item.description === null
          ? null
          : null,
    hostToolId: Number(item.hostToolId ?? item.host_tool_id ?? 0),
    hostToolName: String(item.hostToolName ?? item.host_tool_name ?? ''),
    pageScope:
      typeof pageScopeRaw === 'string'
        ? pageScopeRaw
        : pageScopeRaw === null
          ? null
          : null,
    systemPrompt: String(item.systemPrompt ?? item.system_prompt ?? ''),
    defaultDelivery: String(
      item.defaultDelivery ?? item.default_delivery ?? 'inline_stream',
    ),
    allowCustomInstruction: normalizeBoolean(
      item.allowCustomInstruction ?? item.allow_custom_instruction ?? true,
    ),
    isActive: normalizeBoolean(item.isActive ?? item.is_active ?? true),
    sortOrder: Number(item.sortOrder ?? item.sort_order ?? 0),
    config:
      typeof configRaw === 'object' && configRaw !== null && !Array.isArray(configRaw)
        ? (configRaw as Record<string, unknown>)
        : configRaw === null
          ? null
          : null,
    sourceSkillId:
      item.sourceSkillId === null || item.source_skill_id === null
        ? null
        : Number(item.sourceSkillId ?? item.source_skill_id) || null,
    workflowId: normalizeNullableNumber(item.workflowId ?? item.workflow_id),
    workflowVersion: normalizeNullableNumber(
      item.workflowVersion ?? item.workflow_version,
    ),
    workflowOverrides: normalizeWorkflowOverrides(
      item.workflowOverrides ?? item.workflow_overrides,
    ),
    workflowName:
      typeof item.workflowName === 'string'
        ? item.workflowName
        : typeof item.workflow_name === 'string'
          ? item.workflow_name
          : undefined,
    createdAt: normalizeDate(item.createdAt ?? item.created_at),
    updatedAt: normalizeDate(item.updatedAt ?? item.updated_at),
  };
}

export async function PageActionController_create(
  body: CreatePageActionDto,
): Promise<PageAction> {
  const raw = await http.post<unknown>(PAGE_ACTION_BASE, body);
  return normalizePageAction(raw);
}

export async function PageActionController_update(
  id: number,
  body: UpdatePageActionDto,
): Promise<PageAction> {
  const raw = await http.patch<unknown>(`${PAGE_ACTION_BASE}/${id}`, body);
  return normalizePageAction(raw);
}

export async function PageActionController_findOne(id: number): Promise<PageAction> {
  const raw = await http.get<unknown>(`${PAGE_ACTION_BASE}/${id}`);
  return normalizePageAction(raw);
}

export async function PageActionController_findByAppClient(
  appClientId: number,
  query: PageActionListQuery = {},
): Promise<PageResult<PageAction>> {
  const raw = await http.get<unknown>(
    `${PAGE_ACTION_BASE}/by-app-client/${appClientId}`,
    query,
  );
  return normalizePageResult(raw, normalizePageAction);
}
