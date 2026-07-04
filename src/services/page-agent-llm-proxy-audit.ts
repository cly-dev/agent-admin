import type { PageResult } from '@/types/integration';
import type {
  PageAgentLlmProxyAuditDetail,
  PageAgentLlmProxyAuditListItem,
  PageAgentLlmProxyAuditQuery,
} from '@/types/page-agent-llm-proxy-audit';
import { normalizePageResult } from '@/utils/api-page';
import { http } from '@/utils/request';

const PAGE_AGENT_LLM_PROXY_AUDIT_BASE =
  'admin/page-agent/llm-proxy-audit/by-app-client';

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
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDate(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  return value === null ? null : null;
}

function normalizeRequestMeta(
  value: unknown,
): PageAgentLlmProxyAuditDetail['requestMeta'] {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as PageAgentLlmProxyAuditDetail['requestMeta'];
  }
  return value === null ? null : null;
}

export function normalizePageAgentLlmProxyAudit(
  raw: unknown,
): PageAgentLlmProxyAuditListItem {
  const item = unwrapPayload(raw);
  const id = Number(item.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('Invalid PageAgent LLM proxy audit id');
  }

  return {
    id,
    appClientId: Number(item.appClientId ?? item.app_client_id ?? 0),
    appClientName:
      typeof item.appClientName === 'string'
        ? item.appClientName
        : typeof item.app_client_name === 'string'
          ? item.app_client_name
          : undefined,
    userId: Number(item.userId ?? item.user_id ?? 0),
    username: normalizeNullableString(item.username),
    userEmail: normalizeNullableString(item.userEmail ?? item.user_email),
    modelConfigId: normalizeNullableNumber(
      item.modelConfigId ?? item.model_config_id,
    ),
    requestedModel: normalizeNullableString(
      item.requestedModel ?? item.requested_model,
    ),
    provider: normalizeNullableString(item.provider),
    providerModel: normalizeNullableString(
      item.providerModel ?? item.provider_model,
    ),
    status: String(item.status ?? ''),
    upstreamStatus: normalizeNullableNumber(
      item.upstreamStatus ?? item.upstream_status,
    ),
    durationMs: normalizeNullableNumber(item.durationMs ?? item.duration_ms),
    promptTokens: normalizeNullableNumber(
      item.promptTokens ?? item.prompt_tokens,
    ),
    completionTokens: normalizeNullableNumber(
      item.completionTokens ?? item.completion_tokens,
    ),
    totalTokens: normalizeNullableNumber(item.totalTokens ?? item.total_tokens),
    createdAt: normalizeDate(item.createdAt ?? item.created_at) ?? '',
    finishedAt: normalizeDate(item.finishedAt ?? item.finished_at),
  };
}

export function normalizePageAgentLlmProxyAuditDetail(
  raw: unknown,
): PageAgentLlmProxyAuditDetail {
  const item = unwrapPayload(raw);
  return {
    ...normalizePageAgentLlmProxyAudit(item),
    requestMeta: normalizeRequestMeta(item.requestMeta ?? item.request_meta),
    errorMessage: normalizeNullableString(
      item.errorMessage ?? item.error_message,
    ),
  };
}

export async function PageAgentLlmProxyAuditController_findByAppClient(
  appClientId: number,
  query: PageAgentLlmProxyAuditQuery = {},
): Promise<PageResult<PageAgentLlmProxyAuditListItem>> {
  const raw = await http.get<unknown>(
    `${PAGE_AGENT_LLM_PROXY_AUDIT_BASE}/${appClientId}`,
    query,
  );
  return normalizePageResult(raw, normalizePageAgentLlmProxyAudit);
}

export async function PageAgentLlmProxyAuditController_findDetail(
  appClientId: number,
  id: number,
): Promise<PageAgentLlmProxyAuditDetail> {
  const raw = await http.get<unknown>(
    `${PAGE_AGENT_LLM_PROXY_AUDIT_BASE}/${appClientId}/${id}`,
  );
  return normalizePageAgentLlmProxyAuditDetail(raw);
}
