import { parseWorkflowNodes } from '@/pages/Workflow/workflowShared';
import type { PageResult } from '@/types/integration';
import type {
  CreateWorkflowDto,
  UpdateWorkflowDto,
  Workflow,
  WorkflowListItem,
  WorkflowListQuery,
  WorkflowPresetCatalogEntry,
  WorkflowRevision,
  WorkflowRevisionListQuery,
  WorkflowRevisionSummary,
} from '@/types/workflow';
import { normalizePageResult } from '@/utils/api-page';
import { http } from '@/utils/request';

const WORKFLOW_BASE = 'admin/workflow';

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

function normalizeToolBinding(raw: unknown) {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const toolId = Number(item.toolId ?? item.tool_id);
  if (!Number.isFinite(toolId) || toolId <= 0) {
    return null;
  }
  const toolRaw = item.tool;
  return {
    id: Number(item.id) || undefined,
    toolId,
    isRequired: normalizeBoolean(item.isRequired ?? item.is_required ?? true),
    tool:
      typeof toolRaw === 'object' && toolRaw !== null
        ? {
            id: Number((toolRaw as Record<string, unknown>).id),
            name: String((toolRaw as Record<string, unknown>).name ?? ''),
            path: String((toolRaw as Record<string, unknown>).path ?? ''),
            method: String((toolRaw as Record<string, unknown>).method ?? ''),
            definitionKey: String(
              (toolRaw as Record<string, unknown>).definitionKey ??
                (toolRaw as Record<string, unknown>).definition_key ??
                '',
            ),
          }
        : undefined,
  };
}

function normalizeHostToolBinding(raw: unknown) {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const hostToolId = Number(item.hostToolId ?? item.host_tool_id);
  if (!Number.isFinite(hostToolId) || hostToolId <= 0) {
    return null;
  }
  const hostToolRaw = item.hostTool ?? item.host_tool;
  return {
    id: Number(item.id) || undefined,
    hostToolId,
    isRequired: normalizeBoolean(item.isRequired ?? item.is_required ?? true),
    hostTool:
      typeof hostToolRaw === 'object' && hostToolRaw !== null
        ? {
            id: Number((hostToolRaw as Record<string, unknown>).id),
            name: String((hostToolRaw as Record<string, unknown>).name ?? ''),
            pageScope:
              typeof (hostToolRaw as Record<string, unknown>).pageScope ===
              'string'
                ? ((hostToolRaw as Record<string, unknown>).pageScope as string)
                : typeof (hostToolRaw as Record<string, unknown>).page_scope ===
                    'string'
                  ? ((hostToolRaw as Record<string, unknown>)
                      .page_scope as string)
                  : null,
            definitionKey: String(
              (hostToolRaw as Record<string, unknown>).definitionKey ??
                (hostToolRaw as Record<string, unknown>).definition_key ??
                '',
            ),
          }
        : undefined,
  };
}

function normalizeWorkflowBase(item: Record<string, unknown>) {
  const id = Number(item.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('Invalid Workflow id');
  }
  const nodes = parseWorkflowNodes(item.nodes);
  const constraintsRaw = item.constraints;
  const constraints = Array.isArray(constraintsRaw)
    ? constraintsRaw.map((c) => String(c))
    : [];

  const toolsRaw = item.workflowTools ?? item.workflow_tools ?? [];
  const hostToolsRaw = item.workflowHostTools ?? item.workflow_host_tools ?? [];

  return {
    id,
    appClientId: Number(item.appClientId ?? item.app_client_id ?? 0),
    appClientName:
      typeof item.appClientName === 'string'
        ? item.appClientName
        : typeof item.app_client_name === 'string'
          ? item.app_client_name
          : undefined,
    workflowKey: String(item.workflowKey ?? item.workflow_key ?? ''),
    name: String(item.name ?? ''),
    description:
      typeof item.description === 'string'
        ? item.description
        : item.description === null
          ? null
          : null,
    goal:
      typeof item.goal === 'string'
        ? item.goal
        : item.goal === null
          ? null
          : null,
    profile: String(item.profile ?? 'shared'),
    deliverable: String(item.deliverable ?? 'answer'),
    nodes,
    version: Number(item.version ?? 1),
    constraints,
    isActive: normalizeBoolean(item.isActive ?? item.is_active ?? true),
    sortOrder: Number(item.sortOrder ?? item.sort_order ?? 0),
    createdAt: normalizeDate(item.createdAt ?? item.created_at),
    updatedAt: normalizeDate(item.updatedAt ?? item.updated_at),
    workflowTools: (Array.isArray(toolsRaw) ? toolsRaw : [])
      .map(normalizeToolBinding)
      .filter((item): item is NonNullable<typeof item> => item !== null),
    workflowHostTools: (Array.isArray(hostToolsRaw) ? hostToolsRaw : [])
      .map(normalizeHostToolBinding)
      .filter((item): item is NonNullable<typeof item> => item !== null),
    skillRefCount: Number(item.skillRefCount ?? item.skill_ref_count ?? 0),
    pageActionRefCount: Number(
      item.pageActionRefCount ?? item.page_action_ref_count ?? 0,
    ),
    revisionCount: Number(item.revisionCount ?? item.revision_count ?? 0),
    nodeCount: nodes.length,
  };
}

export function normalizeWorkflow(raw: unknown): Workflow {
  return normalizeWorkflowBase(unwrapPayload(raw)) as Workflow;
}

export function normalizeWorkflowListItem(raw: unknown): WorkflowListItem {
  const item = normalizeWorkflowBase(unwrapPayload(raw));
  return {
    id: item.id,
    appClientId: item.appClientId,
    appClientName: item.appClientName,
    workflowKey: item.workflowKey,
    name: item.name,
    description: item.description,
    profile: item.profile,
    deliverable: item.deliverable,
    version: item.version,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    skillRefCount: item.skillRefCount,
    pageActionRefCount: item.pageActionRefCount,
    revisionCount: item.revisionCount,
    nodeCount: item.nodeCount ?? 0,
  };
}

export function normalizeWorkflowRevision(raw: unknown): WorkflowRevision {
  const item = unwrapPayload(raw);
  const id = Number(item.id);
  const workflowId = Number(item.workflowId ?? item.workflow_id);
  const constraintsRaw = item.constraints;
  const constraints = Array.isArray(constraintsRaw)
    ? constraintsRaw.map((c) => String(c))
    : [];
  return {
    id,
    workflowId,
    version: Number(item.version ?? 0),
    deliverable: String(item.deliverable ?? ''),
    nodes: parseWorkflowNodes(item.nodes),
    constraints,
    changeNote:
      typeof item.changeNote === 'string'
        ? item.changeNote
        : typeof item.change_note === 'string'
          ? item.change_note
          : null,
    createdAt: String(item.createdAt ?? item.created_at ?? ''),
    isCurrent: normalizeBoolean(item.isCurrent ?? item.is_current ?? false),
  };
}

export function normalizeWorkflowRevisionSummary(
  raw: unknown,
): WorkflowRevisionSummary {
  const item = unwrapPayload(raw);
  return {
    id: Number(item.id),
    workflowId: Number(item.workflowId ?? item.workflow_id),
    version: Number(item.version ?? 0),
    deliverable: String(item.deliverable ?? ''),
    changeNote:
      typeof item.changeNote === 'string'
        ? item.changeNote
        : typeof item.change_note === 'string'
          ? item.change_note
          : null,
    createdAt: String(item.createdAt ?? item.created_at ?? ''),
    isCurrent: normalizeBoolean(item.isCurrent ?? item.is_current ?? false),
  };
}

function normalizePresetCatalogEntry(raw: unknown): WorkflowPresetCatalogEntry {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid preset catalog entry');
  }
  const item = raw as Record<string, unknown>;
  return {
    kind: String(item.kind) as WorkflowPresetCatalogEntry['kind'],
    label: String(item.label ?? ''),
    description: String(item.description ?? ''),
    profiles: (Array.isArray(item.profiles) ? item.profiles : []).map(
      String,
    ) as WorkflowPresetCatalogEntry['profiles'],
    requiredConfig: (Array.isArray(item.requiredConfig)
      ? item.requiredConfig
      : []
    ).map(String) as WorkflowPresetCatalogEntry['requiredConfig'],
    optionalConfig: (Array.isArray(item.optionalConfig)
      ? item.optionalConfig
      : []
    ).map(String) as WorkflowPresetCatalogEntry['optionalConfig'],
    expandedActions: (Array.isArray(item.expandedActions)
      ? item.expandedActions
      : []
    ).map(String),
  };
}

export async function WorkflowController_listPresetsCatalog(
  profile?: string,
): Promise<WorkflowPresetCatalogEntry[]> {
  const raw = await http.get<unknown>(`${WORKFLOW_BASE}/presets/catalog`, {
    ...(profile ? { profile } : {}),
  });
  const payload = unwrapPayload(raw);
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.list)
      ? payload.list
      : [];
  return list.map(normalizePresetCatalogEntry);
}

export async function WorkflowController_findByAppClient(
  appClientId: number,
  query: WorkflowListQuery = {},
): Promise<PageResult<WorkflowListItem>> {
  const raw = await http.get<unknown>(
    `${WORKFLOW_BASE}/by-app-client/${appClientId}`,
    query,
  );
  return normalizePageResult(raw, normalizeWorkflowListItem);
}

export async function WorkflowController_findOne(
  id: number,
): Promise<Workflow> {
  const raw = await http.get<unknown>(`${WORKFLOW_BASE}/${id}`);
  return normalizeWorkflow(raw);
}

export async function WorkflowController_create(
  dto: CreateWorkflowDto,
): Promise<Workflow> {
  const raw = await http.post<unknown>(WORKFLOW_BASE, dto);
  return normalizeWorkflow(raw);
}

export async function WorkflowController_update(
  id: number,
  dto: UpdateWorkflowDto,
): Promise<Workflow> {
  const raw = await http.patch<unknown>(`${WORKFLOW_BASE}/${id}`, dto);
  return normalizeWorkflow(raw);
}

export async function WorkflowController_remove(
  id: number,
): Promise<{ ok: boolean; id: number }> {
  const raw = await http.delete<unknown>(`${WORKFLOW_BASE}/${id}`);
  const payload = unwrapPayload(raw);
  return {
    ok: normalizeBoolean(payload.ok ?? true),
    id: Number(payload.id ?? id),
  };
}

export async function WorkflowController_listRevisions(
  id: number,
  query: WorkflowRevisionListQuery = {},
): Promise<WorkflowRevisionSummary[]> {
  const raw = await http.get(`${WORKFLOW_BASE}/${id}/revisions`, query);
  const payload = unwrapPayload(raw);
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.list)
      ? payload.list
      : [];
  return list.map(normalizeWorkflowRevisionSummary);
}

export async function WorkflowController_getRevision(
  workflowId: number,
  version: number,
): Promise<WorkflowRevision> {
  const raw = await http.get<unknown>(
    `${WORKFLOW_BASE}/${workflowId}/revisions/${version}`,
  );
  return normalizeWorkflowRevision(raw);
}
