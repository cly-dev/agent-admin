import type {
  PageActionRunDetail,
  PageActionRunListItem,
  PageActionRunListQuery,
  PageActionRunStep,
  WorkflowRunSnapshot,
} from '@/types/page-action-run';
import type { PageResult } from '@/types/integration';
import { normalizePageResult } from '@/utils/api-page';
import { http } from '@/utils/request';

const PAGE_ACTION_RUN_BASE = 'admin/page-action/run';

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

function normalizeDate(value: unknown): string | undefined {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  return undefined;
}

function normalizeNullableString(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  return value === null ? null : null;
}

function normalizeNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return value === null ? null : null;
}

function normalizeStep(raw: unknown): PageActionRunStep {
  const item =
    typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const detailRaw = item.detail;
  return {
    step: Number(item.step ?? 0),
    type: String(item.type ?? '') as PageActionRunStep['type'],
    name: String(item.name ?? ''),
    at: normalizeDate(item.at) ?? '',
    status:
      item.status === 'ok' || item.status === 'failed' || item.status === 'skipped'
        ? item.status
        : undefined,
    detail:
      typeof detailRaw === 'object' && detailRaw !== null && !Array.isArray(detailRaw)
        ? (detailRaw as Record<string, unknown>)
        : undefined,
  };
}

export function normalizePageActionRunListItem(raw: unknown): PageActionRunListItem {
  const item = unwrapPayload(raw);
  const id = Number(item.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('Invalid PageActionRun id');
  }

  return {
    id,
    pageActionId: Number(item.pageActionId ?? item.page_action_id ?? 0),
    actionKey: String(item.actionKey ?? item.action_key ?? ''),
    pageActionName: String(item.pageActionName ?? item.page_action_name ?? ''),
    userId: Number(item.userId ?? item.user_id ?? 0),
    username: normalizeNullableString(item.username),
    userEmail: normalizeNullableString(item.userEmail ?? item.user_email),
    status: String(item.status ?? ''),
    generation: Number(item.generation ?? id),
    dslOutcome: normalizeNullableString(item.dslOutcome ?? item.dsl_outcome),
    errorCode: normalizeNullableString(item.errorCode ?? item.error_code),
    streamId: normalizeNullableString(item.streamId ?? item.stream_id),
    clientActionId: normalizeNullableString(
      item.clientActionId ?? item.client_action_id,
    ),
    model: normalizeNullableString(item.model),
    durationMs: normalizeNullableNumber(item.durationMs ?? item.duration_ms),
    stepCount: Number(item.stepCount ?? item.step_count ?? 0),
    createdAt: normalizeDate(item.createdAt ?? item.created_at) ?? '',
    finishedAt: normalizeDate(item.finishedAt ?? item.finished_at) ?? null,
  };
}

function normalizeWorkflowRun(raw: unknown): WorkflowRunSnapshot | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return raw === null ? null : null;
  }
  const item = raw as Record<string, unknown>;
  const nodesRaw = item.nodes;
  const nodes = Array.isArray(nodesRaw)
    ? nodesRaw
        .map((node) => {
          if (typeof node !== 'object' || node === null) {
            return null;
          }
          const row = node as Record<string, unknown>;
          const nodeId = String(row.nodeId ?? row.node_id ?? '');
          if (!nodeId) {
            return null;
          }
          return {
            nodeId,
            action: String(row.action ?? ''),
            status: String(row.status ?? 'pending'),
          };
        })
        .filter((node): node is NonNullable<typeof node> => node !== null)
    : undefined;

  return {
    workflowId: normalizeNullableNumber(item.workflowId ?? item.workflow_id) ?? undefined,
    version: normalizeNullableNumber(item.version) ?? undefined,
    currentNodeId:
      typeof item.currentNodeId === 'string'
        ? item.currentNodeId
        : typeof item.current_node_id === 'string'
          ? item.current_node_id
          : undefined,
    status: typeof item.status === 'string' ? item.status : undefined,
    compiledFrom:
      typeof item.compiledFrom === 'string'
        ? item.compiledFrom
        : typeof item.compiled_from === 'string'
          ? item.compiled_from
          : undefined,
    nodes,
  };
}

export function normalizePageActionRunDetail(raw: unknown): PageActionRunDetail {
  const item = unwrapPayload(raw);
  const base = normalizePageActionRunListItem(item);
  const stepsRaw = item.steps;

  return {
    ...base,
    delivery: String(item.delivery ?? 'inline_stream'),
    instruction: normalizeNullableString(item.instruction),
    context: item.context ?? null,
    pageContext: item.pageContext ?? item.page_context ?? null,
    fillText: normalizeNullableString(item.fillText ?? item.fill_text),
    errorMessage: normalizeNullableString(item.errorMessage ?? item.error_message),
    promptTokens: normalizeNullableNumber(item.promptTokens ?? item.prompt_tokens),
    completionTokens: normalizeNullableNumber(
      item.completionTokens ?? item.completion_tokens,
    ),
    idempotencyKey: normalizeNullableString(
      item.idempotencyKey ?? item.idempotency_key,
    ),
    workflowId: normalizeNullableNumber(item.workflowId ?? item.workflow_id),
    workflowVersion: normalizeNullableNumber(
      item.workflowVersion ?? item.workflow_version,
    ),
    workflowRun: normalizeWorkflowRun(item.workflowRun ?? item.workflow_run),
    steps: Array.isArray(stepsRaw) ? stepsRaw.map(normalizeStep) : [],
  };
}

export async function PageActionRunController_findByAppClient(
  appClientId: number,
  query: PageActionRunListQuery = {},
): Promise<PageResult<PageActionRunListItem>> {
  const raw = await http.get<unknown>(
    `${PAGE_ACTION_RUN_BASE}/by-app-client/${appClientId}`,
    query,
  );
  return normalizePageResult(raw, normalizePageActionRunListItem);
}

export async function PageActionRunController_findDetail(
  id: number,
): Promise<PageActionRunDetail> {
  const raw = await http.get<unknown>(`${PAGE_ACTION_RUN_BASE}/detail/${id}`);
  return normalizePageActionRunDetail(raw);
}
