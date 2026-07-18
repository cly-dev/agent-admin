import type { IntegrationAuthMode } from '@/types/integration';
import type {
  Tool,
  ToolCategoryRef,
  ToolHttpMethod,
  ToolIntegrationRef,
  ToolResponseProfile,
  ToolRiskLevel,
} from '@/types/tool';
import { normalizeAgentMetadata } from './toolAgentMetadata';
import { DEFAULT_TOOL_METHOD, DEFAULT_TOOL_RISK } from './toolConstants';

function asRecord(raw: unknown): Record<string, unknown> | undefined {
  if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
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

function normalizeAuthMode(value: unknown): IntegrationAuthMode | undefined {
  const normalized = String(value ?? '').toUpperCase();
  if (
    normalized === 'USER_ONLY' ||
    normalized === 'SYSTEM_ONLY' ||
    normalized === 'USER_PREFERRED'
  ) {
    return normalized;
  }
  return undefined;
}

function normalizeHttpMethod(value: unknown): ToolHttpMethod {
  const raw = String(value ?? DEFAULT_TOOL_METHOD);
  if (raw === 'Get' || raw === 'Post' || raw === 'Put' || raw === 'Delete') {
    return raw;
  }
  const upper = raw.toUpperCase();
  if (upper === 'GET') return 'Get';
  if (upper === 'POST') return 'Post';
  if (upper === 'PUT') return 'Put';
  if (upper === 'DELETE') return 'Delete';
  return DEFAULT_TOOL_METHOD;
}

function normalizeRiskLevel(value: unknown): ToolRiskLevel {
  const level = String(value ?? DEFAULT_TOOL_RISK).toUpperCase();
  if (level === 'L1' || level === 'L2' || level === 'L3') {
    return level;
  }
  return DEFAULT_TOOL_RISK;
}

function normalizeIntegrationRef(raw: unknown): ToolIntegrationRef | undefined {
  if (typeof raw !== 'object' || raw === null) {
    return undefined;
  }

  const item = raw as Record<string, unknown>;
  const id = Number(item.id);
  if (!Number.isFinite(id)) {
    return undefined;
  }

  return {
    id,
    name: String(item.name ?? ''),
    baseUrl:
      typeof item.baseUrl === 'string'
        ? item.baseUrl
        : typeof item.base_url === 'string'
          ? item.base_url
          : undefined,
    authMode: normalizeAuthMode(item.authMode ?? item.auth_mode),
    systemConfigured: Boolean(item.systemConfigured ?? item.system_configured),
  };
}

function normalizeResponseProfile(
  raw: unknown,
): ToolResponseProfile | undefined {
  let source = raw;
  if (typeof source === 'string') {
    const trimmed = source.trim();
    if (!trimmed) return undefined;
    try {
      source = JSON.parse(trimmed) as unknown;
    } catch {
      return undefined;
    }
  }
  if (typeof source !== 'object' || source === null) {
    return undefined;
  }

  const item = source as Record<string, unknown>;
  const coreFields = item.coreFields ?? item.core_fields;
  const optionalFields = item.optionalFields ?? item.optional_fields;

  return {
    ...item,
    ...(coreFields !== undefined ? { coreFields } : {}),
    ...(optionalFields !== undefined ? { optionalFields } : {}),
  } as ToolResponseProfile;
}

function normalizeJsonObject(raw: unknown): object | undefined {
  return asRecord(raw);
}

function scoreToolCandidate(item: Record<string, unknown>): number {
  let score = 0;
  if (item.id !== undefined) score += 2;
  if (item.name !== undefined) score += 2;
  if (item.path !== undefined) score += 2;
  if (item.method !== undefined) score += 1;
  if (item.integrationId !== undefined || item.integration_id !== undefined)
    score += 1;
  if (
    item.outputSchema !== undefined ||
    item.output_schema !== undefined ||
    item.responses !== undefined ||
    item.responseSchema !== undefined ||
    item.successResponseSchema !== undefined
  ) {
    score += 2;
  }
  return score;
}

function findBestToolRecord(raw: unknown): Record<string, unknown> {
  const root = asRecord(raw);
  if (!root) return {};

  const queue: Array<{ node: Record<string, unknown>; depth: number }> = [
    { node: root, depth: 0 },
  ];
  let best = root;
  let bestScore = scoreToolCandidate(root);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const { node, depth } = current;
    const score = scoreToolCandidate(node);
    if (score > bestScore) {
      best = node;
      bestScore = score;
    }
    if (depth >= 5) continue;

    Object.values(node).forEach((value) => {
      const child = asRecord(value);
      if (child) {
        queue.push({ node: child, depth: depth + 1 });
      }
    });
  }

  return best;
}

function extractOutputSchema(
  item: Record<string, unknown>,
): object | undefined {
  const direct =
    item.outputSchema ??
    item.output_schema ??
    item.outputSchemaJson ??
    item.output_schema_json ??
    item.outputSchemaStr ??
    item.output_schema_str;
  const normalizedDirect = normalizeJsonObject(direct);
  if (normalizedDirect) return normalizedDirect;

  const responsesRaw =
    item.responses ??
    item.responseSchema ??
    item.response_schema ??
    item.successResponseSchema ??
    item.success_response_schema;
  const responses = asRecord(responsesRaw);
  if (!responses) return undefined;

  const r200 = asRecord(responses['200']);
  if (r200) {
    const schema200 = normalizeJsonObject(
      r200.schema ?? r200.response ?? r200.body,
    );
    if (schema200)
      return {
        '200': {
          schema: schema200,
          description: r200.description ?? '接口成功响应体',
        },
      };
  }

  const schemaDirect = normalizeJsonObject(
    responses.schema ?? responses.response ?? responses.body,
  );
  if (schemaDirect) return schemaDirect;

  return responses;
}

function normalizeCategoryRef(raw: unknown): ToolCategoryRef | undefined {
  if (typeof raw !== 'object' || raw === null) {
    return undefined;
  }

  const item = raw as Record<string, unknown>;
  const id = Number(item.id);
  if (!Number.isFinite(id)) {
    return undefined;
  }

  return {
    id,
    label: String(item.label ?? item.name ?? ''),
  };
}

export function normalizeTool(raw: unknown): Tool {
  const item = findBestToolRecord(raw);
  const tagsRaw = item.tags;
  const category = normalizeCategoryRef(
    item.toolCategory ?? item.tool_category,
  );
  const responseProfileRaw =
    item.responseProfile ??
    item.response_profile ??
    item.responseProfileJson ??
    item.response_profile_json;

  return {
    id: Number(item.id),
    appClientId: Number(item.appClientId ?? item.app_client_id),
    name: String(item.name ?? ''),
    definitionKey:
      typeof item.definitionKey === 'string'
        ? item.definitionKey
        : typeof item.definition_key === 'string'
          ? item.definition_key
          : undefined,
    description: String(item.description ?? ''),
    riskLevel: normalizeRiskLevel(item.riskLevel ?? item.risk_level),
    method: normalizeHttpMethod(item.method),
    path: String(item.path ?? ''),
    integrationId: Number(item.integrationId ?? item.integration_id),
    toolCategoryId:
      item.toolCategoryId !== undefined || item.tool_category_id !== undefined
        ? Number(item.toolCategoryId ?? item.tool_category_id)
        : category?.id,
    isActive: Boolean(item.isActive ?? item.is_active ?? true),
    timeout:
      typeof item.timeout === 'number'
        ? item.timeout
        : item.timeout !== undefined
          ? Number(item.timeout)
          : undefined,
    schema: normalizeJsonObject(item.schema),
    inputSchema: normalizeJsonObject(item.inputSchema ?? item.input_schema),
    outputSchema: extractOutputSchema(item),
    responseProfile: normalizeResponseProfile(responseProfileRaw),
    agentMetadata: normalizeAgentMetadata(
      item.agentMetadata ?? item.agent_metadata,
    ),
    integration: normalizeIntegrationRef(item.integration),
    toolCategory: category,
    tags: Array.isArray(tagsRaw)
      ? tagsRaw.map((tag) => String(tag))
      : category?.label
        ? [category.label]
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
  };
}
