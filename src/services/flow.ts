import type { PageResult } from '@/types/integration';
import type {
  CreateFlowDto,
  Flow,
  FlowHostToolBinding,
  FlowListItem,
  FlowListQuery,
  FlowMigratePreview,
  FlowMigrationCandidate,
  FlowPresetCatalogEntry,
  FlowRevision,
  FlowRevisionListQuery,
  FlowRevisionSummary,
  FlowToolBinding,
  MigrateFlowFromWorkflowDto,
  MigrateFlowFromWorkflowResult,
  UpdateFlowDto,
} from '@/types/flow';
import { normalizePageResult } from '@/utils/api-page';
import { http } from '@/utils/request';

const FLOW_BASE = 'admin/flow';

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

function normalizeToolBinding(raw: unknown): FlowToolBinding | null {
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

function normalizeHostToolBinding(raw: unknown): FlowHostToolBinding | null {
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

function normalizeFlowBase(item: Record<string, unknown>) {
  const id = Number(item.id);
  const appClientId = Number(item.appClientId ?? item.app_client_id);
  return {
    id,
    appClientId,
    appClientName: String(
      item.appClientName ??
        item.app_client_name ??
        (typeof item.appClient === 'object' && item.appClient !== null
          ? (item.appClient as Record<string, unknown>).name
          : '') ??
        '',
    ),
    flowKey: String(item.flowKey ?? item.flow_key ?? ''),
    name: String(item.name ?? ''),
    description:
      typeof item.description === 'string' ? item.description : null,
    profile: String(item.profile ?? ''),
    deliverable: String(item.deliverable ?? ''),
    version: Number(item.version ?? 0),
    isActive: normalizeBoolean(item.isActive ?? item.is_active ?? true),
    sortOrder: Number(item.sortOrder ?? item.sort_order ?? 0),
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
    skillRefCount: Number(
      item.skillRefCount ?? item.skill_ref_count ?? 0,
    ),
    pageActionRefCount: Number(
      item.pageActionRefCount ?? item.page_action_ref_count ?? 0,
    ),
  };
}

export function normalizeFlowListItem(raw: unknown): FlowListItem {
  const item = unwrapPayload(raw);
  const base = normalizeFlowBase(item);
  return {
    ...base,
    irNodeCount: Number(item.irNodeCount ?? item.ir_node_count ?? 0),
  };
}

export function normalizeFlow(raw: unknown): Flow {
  const item = unwrapPayload(raw);
  const base = normalizeFlowBase(item);
  const constraintsRaw = item.constraints;
  const constraints = Array.isArray(constraintsRaw)
    ? constraintsRaw.map((c) => String(c))
    : [];
  const toolsRaw = item.flowTools ?? item.flow_tools;
  const hostToolsRaw = item.flowHostTools ?? item.flow_host_tools;
  return {
    ...base,
    goal: typeof item.goal === 'string' ? item.goal : null,
    intent: item.intent ?? null,
    ir: item.ir ?? null,
    constraints,
    flowTools: Array.isArray(toolsRaw)
      ? toolsRaw
          .map(normalizeToolBinding)
          .filter((row): row is FlowToolBinding => row !== null)
      : [],
    flowHostTools: Array.isArray(hostToolsRaw)
      ? hostToolsRaw
          .map(normalizeHostToolBinding)
          .filter((row): row is FlowHostToolBinding => row !== null)
      : [],
    revisionCount: Number(
      item.revisionCount ?? item.revision_count ?? 0,
    ),
  };
}

export function normalizeFlowRevisionSummary(
  raw: unknown,
): FlowRevisionSummary {
  const item = unwrapPayload(raw);
  return {
    id: Number(item.id),
    flowId: Number(item.flowId ?? item.flow_id),
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

export function normalizeFlowRevision(raw: unknown): FlowRevision {
  const item = unwrapPayload(raw);
  const summary = normalizeFlowRevisionSummary(item);
  const constraintsRaw = item.constraints;
  return {
    ...summary,
    intent: item.intent ?? null,
    ir: item.ir ?? null,
    constraints: Array.isArray(constraintsRaw)
      ? constraintsRaw.map((c) => String(c))
      : [],
  };
}

function normalizePresetCatalogEntry(raw: unknown): FlowPresetCatalogEntry {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid preset catalog entry');
  }
  const item = raw as Record<string, unknown>;
  const expanded =
    (Array.isArray(item.expandedActions) ? item.expandedActions : null) ??
    (Array.isArray(item.expandedOperations) ? item.expandedOperations : []);
  return {
    kind: String(item.kind) as FlowPresetCatalogEntry['kind'],
    label: String(item.label ?? ''),
    description: String(item.description ?? ''),
    profiles: (Array.isArray(item.profiles) ? item.profiles : []).map(
      String,
    ) as FlowPresetCatalogEntry['profiles'],
    requiredConfig: (Array.isArray(item.requiredConfig)
      ? item.requiredConfig
      : Array.isArray(item.required_config)
        ? item.required_config
        : []
    ).map(String) as FlowPresetCatalogEntry['requiredConfig'],
    optionalConfig: (Array.isArray(item.optionalConfig)
      ? item.optionalConfig
      : Array.isArray(item.optional_config)
        ? item.optional_config
        : []
    ).map(String) as FlowPresetCatalogEntry['optionalConfig'],
    expandedActions: expanded.map(String),
  };
}

function normalizeMigrationCandidate(raw: unknown): FlowMigrationCandidate {
  const item = unwrapPayload(raw);
  return {
    workflowId: Number(item.workflowId ?? item.workflow_id),
    workflowKey: String(item.workflowKey ?? item.workflow_key ?? ''),
    name: String(item.name ?? ''),
    profile: String(item.profile ?? ''),
    isActive: normalizeBoolean(item.isActive ?? item.is_active ?? true),
    skillRefCount: Number(item.skillRefCount ?? item.skill_ref_count ?? 0),
    pageActionRefCount: Number(
      item.pageActionRefCount ?? item.page_action_ref_count ?? 0,
    ),
    previewPath: String(item.previewPath ?? item.preview_path ?? ''),
    migratePath: String(item.migratePath ?? item.migrate_path ?? ''),
  };
}

export function normalizeMigratePreview(raw: unknown): FlowMigratePreview {
  const item = unwrapPayload(raw);
  const rebind =
    typeof item.rebind === 'object' && item.rebind !== null
      ? (item.rebind as Record<string, unknown>)
      : {};
  const errorRaw =
    typeof item.error === 'object' && item.error !== null
      ? (item.error as Record<string, unknown>)
      : null;
  return {
    sourceWorkflowId: Number(
      item.sourceWorkflowId ?? item.source_workflow_id ?? 0,
    ),
    suggestedFlowKey: String(
      item.suggestedFlowKey ?? item.suggested_flow_key ?? '',
    ),
    profile: String(item.profile ?? ''),
    canMigrate: normalizeBoolean(item.canMigrate ?? item.can_migrate ?? false),
    lossy: normalizeBoolean(item.lossy ?? false),
    matchedPattern:
      typeof item.matchedPattern === 'string'
        ? item.matchedPattern
        : typeof item.matched_pattern === 'string'
          ? item.matched_pattern
          : null,
    warnings: Array.isArray(item.warnings)
      ? item.warnings.map(String)
      : [],
    intent: item.intent ?? null,
    error: errorRaw
      ? {
          code: String(errorRaw.code ?? ''),
          message: String(errorRaw.message ?? ''),
        }
      : null,
    flowKeyAvailable: normalizeBoolean(
      item.flowKeyAvailable ?? item.flow_key_available ?? true,
    ),
    rebind: {
      skillCount: Number(rebind.skillCount ?? rebind.skill_count ?? 0),
      pageActionCount: Number(
        rebind.pageActionCount ?? rebind.page_action_count ?? 0,
      ),
    },
  };
}

export function normalizeMigrateResult(
  raw: unknown,
): MigrateFlowFromWorkflowResult {
  const item = unwrapPayload(raw);
  const rebind =
    typeof item.rebind === 'object' && item.rebind !== null
      ? (item.rebind as Record<string, unknown>)
      : {};
  return {
    flow: normalizeFlow(item.flow),
    sourceWorkflowId: Number(
      item.sourceWorkflowId ?? item.source_workflow_id ?? 0,
    ),
    matchedPattern: String(
      item.matchedPattern ?? item.matched_pattern ?? '',
    ),
    warnings: Array.isArray(item.warnings)
      ? item.warnings.map(String)
      : [],
    rebind: {
      skillsUpdated: Number(
        rebind.skillsUpdated ?? rebind.skills_updated ?? 0,
      ),
      pageActionsUpdated: Number(
        rebind.pageActionsUpdated ?? rebind.page_actions_updated ?? 0,
      ),
    },
    sourceDeactivated: normalizeBoolean(
      item.sourceDeactivated ?? item.source_deactivated ?? false,
    ),
  };
}

export async function FlowController_listPresetsCatalog(
  profile?: string,
): Promise<FlowPresetCatalogEntry[]> {
  const raw = await http.get<unknown>(`${FLOW_BASE}/presets/catalog`, {
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

export async function FlowController_findByAppClient(
  appClientId: number,
  query: FlowListQuery = {},
): Promise<PageResult<FlowListItem>> {
  const raw = await http.get<unknown>(
    `${FLOW_BASE}/by-app-client/${appClientId}`,
    query,
  );
  return normalizePageResult(raw, normalizeFlowListItem);
}

export async function FlowController_findOne(id: number): Promise<Flow> {
  const raw = await http.get<unknown>(`${FLOW_BASE}/${id}`);
  return normalizeFlow(raw);
}

export async function FlowController_create(
  dto: CreateFlowDto,
): Promise<Flow> {
  const raw = await http.post<unknown>(FLOW_BASE, dto);
  return normalizeFlow(raw);
}

export async function FlowController_update(
  id: number,
  dto: UpdateFlowDto,
): Promise<Flow> {
  const raw = await http.patch<unknown>(`${FLOW_BASE}/${id}`, dto);
  return normalizeFlow(raw);
}

export async function FlowController_remove(
  id: number,
): Promise<{ ok: boolean; id: number }> {
  const raw = await http.delete<unknown>(`${FLOW_BASE}/${id}`);
  const payload = unwrapPayload(raw);
  return {
    ok: normalizeBoolean(payload.ok ?? true),
    id: Number(payload.id ?? id),
  };
}

export async function FlowController_listRevisions(
  id: number,
  query: FlowRevisionListQuery = {},
): Promise<FlowRevisionSummary[]> {
  const raw = await http.get(`${FLOW_BASE}/${id}/revisions`, query);
  const payload = unwrapPayload(raw);
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.list)
      ? payload.list
      : [];
  return list.map(normalizeFlowRevisionSummary);
}

export async function FlowController_getRevision(
  flowId: number,
  version: number,
): Promise<FlowRevision> {
  const raw = await http.get<unknown>(
    `${FLOW_BASE}/${flowId}/revisions/${version}`,
  );
  return normalizeFlowRevision(raw);
}

export async function FlowController_listMigrationCandidates(
  appClientId: number,
): Promise<FlowMigrationCandidate[]> {
  const raw = await http.get<unknown>(`${FLOW_BASE}/migration-candidates`, {
    appClientId,
  });
  const payload = unwrapPayload(raw);
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload.list)
        ? payload.list
        : [];
  return list.map(normalizeMigrationCandidate);
}

export async function FlowController_previewMigrateFromWorkflow(
  workflowId: number,
  flowKey?: string,
): Promise<FlowMigratePreview> {
  const raw = await http.get<unknown>(
    `${FLOW_BASE}/migrate-from-workflow/${workflowId}/preview`,
    flowKey ? { flowKey } : {},
  );
  return normalizeMigratePreview(raw);
}

export async function FlowController_migrateFromWorkflow(
  workflowId: number,
  dto: MigrateFlowFromWorkflowDto = {},
): Promise<MigrateFlowFromWorkflowResult> {
  const raw = await http.post<unknown>(
    `${FLOW_BASE}/migrate-from-workflow/${workflowId}`,
    dto,
  );
  return normalizeMigrateResult(raw);
}

/** 状态边 key 分配：运营填名称 → 服务端生成稳定 key */
export async function FlowController_allocateStateKeys(
  labels: string[],
): Promise<string[]> {
  const raw = await http.post<unknown>(`${FLOW_BASE}/intent/state-keys`, {
    labels,
  });
  const payload = unwrapPayload(raw);
  const keys = Array.isArray(payload.keys)
    ? payload.keys
    : Array.isArray(payload)
      ? payload
      : [];
  return keys.map((key) => String(key ?? '').trim()).filter(Boolean);
}
