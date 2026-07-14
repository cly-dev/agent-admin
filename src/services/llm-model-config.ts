import {
  LLM_MODEL_CONFIG_KINDS,
  type CreateLlmModelConfigDto,
  type IntentRecallConfig,
  type IntentRecallMode,
  type LlmConnectionProbe,
  type LlmConnectionTestResult,
  type LlmModelConfig,
  type LlmModelConfigKind,
  type UpdateIntentRecallConfigDto,
  type UpdateLlmModelConfigDto,
} from '@/types/llm-model-config';
import { http } from '@/utils/request';

const LLM_MODEL_CONFIG_BASE = 'admin/llm-model-config';

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

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
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

function isLlmModelConfigKind(value: string): value is LlmModelConfigKind {
  return (LLM_MODEL_CONFIG_KINDS as readonly string[]).includes(value);
}

function normalizeParameters(
  value: unknown,
): Record<string, unknown> | undefined {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
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

function isLlmConnectionProbe(value: string): value is LlmConnectionProbe {
  return (
    value === 'chat' ||
    value === 'embedding_api' ||
    value === 'embedding_local' ||
    value === 'unsupported'
  );
}

export function normalizeLlmModelConfig(raw: unknown): LlmModelConfig | null {
  const item =
    typeof raw === 'object' && raw !== null
      ? (raw as Record<string, unknown>)
      : unwrapPayload(raw);
  const kindRaw = typeof item.kind === 'string' ? item.kind : '';
  if (!isLlmModelConfigKind(kindRaw)) {
    return null;
  }

  const id = normalizeNumber(item.id);
  if (id === undefined || id <= 0) {
    return null;
  }

  const model = typeof item.model === 'string' ? item.model.trim() : '';
  const baseUrl =
    typeof item.baseUrl === 'string'
      ? item.baseUrl
      : typeof item.base_url === 'string'
        ? item.base_url
        : '';
  if (!model || !baseUrl) {
    return null;
  }

  return {
    id,
    kind: kindRaw,
    provider: typeof item.provider === 'string' ? item.provider : undefined,
    model,
    apiKey:
      typeof item.apiKey === 'string'
        ? item.apiKey
        : typeof item.api_key === 'string'
          ? item.api_key
          : undefined,
    baseUrl,
    chatPath:
      typeof item.chatPath === 'string'
        ? item.chatPath
        : typeof item.chat_path === 'string'
          ? item.chat_path
          : undefined,
    parameters: normalizeParameters(item.parameters),
    stream: normalizeBoolean(item.stream),
    maxTokens: normalizeNumber(item.maxTokens ?? item.max_tokens),
    temperature: normalizeNumber(item.temperature),
    enabled: normalizeBoolean(item.enabled),
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

function normalizeLlmModelConfigList(raw: unknown): LlmModelConfig[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => normalizeLlmModelConfig(item))
      .filter((item): item is LlmModelConfig => item !== null);
  }

  const payload = unwrapPayload(raw);
  const listRaw =
    payload.list ?? payload.items ?? payload.records ?? payload.configs;
  if (Array.isArray(listRaw)) {
    return listRaw
      .map((item) => normalizeLlmModelConfig(item))
      .filter((item): item is LlmModelConfig => item !== null);
  }

  const single = normalizeLlmModelConfig(payload);
  return single ? [single] : [];
}

export function normalizeLlmConnectionTestResult(
  raw: unknown,
): LlmConnectionTestResult | null {
  const item = unwrapPayload(raw);
  const ok = normalizeBoolean(item.ok);
  const configId = normalizeNumber(item.configId ?? item.config_id);
  const kindRaw = typeof item.kind === 'string' ? item.kind : '';
  const probeRaw = typeof item.probe === 'string' ? item.probe : '';
  if (
    ok === undefined ||
    configId === undefined ||
    !isLlmModelConfigKind(kindRaw) ||
    !isLlmConnectionProbe(probeRaw)
  ) {
    return null;
  }

  return {
    ok,
    configId,
    kind: kindRaw,
    provider: typeof item.provider === 'string' ? item.provider : '',
    model: typeof item.model === 'string' ? item.model : '',
    probe: probeRaw,
    durationMs: normalizeNumber(item.durationMs ?? item.duration_ms) ?? 0,
    error: typeof item.error === 'string' ? item.error : undefined,
    detail: normalizeParameters(item.detail),
  };
}

function isIntentRecallMode(value: string): value is IntentRecallMode {
  return value === 'auto' || value === 'vector' || value === 'keyword';
}

export function normalizeIntentRecallConfig(raw: unknown): IntentRecallConfig {
  const item = unwrapPayload(raw);
  const recallModeRaw = item.recallMode ?? item.recall_mode;
  const recallMode =
    typeof recallModeRaw === 'string' && isIntentRecallMode(recallModeRaw)
      ? recallModeRaw
      : undefined;

  return {
    recallMode,
    vectorTopK: normalizeNumber(item.vectorTopK ?? item.vector_top_k),
    vectorMinScore: normalizeNumber(
      item.vectorMinScore ?? item.vector_min_score,
    ),
    bindToolsMax: normalizeNumber(item.bindToolsMax ?? item.bind_tools_max),
    fallbackToKeyword: normalizeBoolean(
      item.fallbackToKeyword ?? item.fallback_to_keyword,
    ),
  };
}

/** 列出全部 LLM / Embedding 配置（同 kind 可多条） */
export async function LlmModelConfigController_findAll(): Promise<
  LlmModelConfig[]
> {
  const response = await http.get<unknown>(LLM_MODEL_CONFIG_BASE);
  return normalizeLlmModelConfigList(response);
}

/** 按 kind 查询配置列表（enabled 优先）；无数据抛 404 */
export async function LlmModelConfigController_findByKind(
  kind: LlmModelConfigKind,
): Promise<LlmModelConfig[]> {
  const response = await http.get<unknown>(
    `${LLM_MODEL_CONFIG_BASE}/kind/${kind}`,
  );
  return normalizeLlmModelConfigList(response);
}

/** 新建一条模型配置 */
export async function LlmModelConfigController_create(
  data: CreateLlmModelConfigDto,
): Promise<LlmModelConfig> {
  const response = await http.post<unknown>(LLM_MODEL_CONFIG_BASE, data);
  const config =
    normalizeLlmModelConfig(unwrapPayload(response)) ??
    normalizeLlmModelConfig(response);
  if (!config) {
    throw new Error('invalid llm model config response');
  }
  return config;
}

/** 按 id 更新模型配置 */
export async function LlmModelConfigController_update(
  id: number,
  data: UpdateLlmModelConfigDto,
): Promise<LlmModelConfig> {
  const response = await http.patch<unknown>(
    `${LLM_MODEL_CONFIG_BASE}/${id}`,
    data,
  );
  const config =
    normalizeLlmModelConfig(unwrapPayload(response)) ??
    normalizeLlmModelConfig(response);
  if (!config) {
    throw new Error('invalid llm model config response');
  }
  return config;
}

/** 激活指定配置（同 kind 其它禁用） */
export async function LlmModelConfigController_activate(
  id: number,
): Promise<LlmModelConfig> {
  const response = await http.patch<unknown>(
    `${LLM_MODEL_CONFIG_BASE}/${id}/activate`,
  );
  const config =
    normalizeLlmModelConfig(unwrapPayload(response)) ??
    normalizeLlmModelConfig(response);
  if (!config) {
    throw new Error('invalid llm model config response');
  }
  return config;
}

/** 连通性探测 */
export async function LlmModelConfigController_testConnection(
  id: number,
): Promise<LlmConnectionTestResult> {
  const response = await http.post<unknown>(
    `${LLM_MODEL_CONFIG_BASE}/${id}/test-connection`,
  );
  const result =
    normalizeLlmConnectionTestResult(unwrapPayload(response)) ??
    normalizeLlmConnectionTestResult(response);
  if (!result) {
    throw new Error('invalid llm connection test response');
  }
  return result;
}

/** 获取意图召回配置 */
export async function LlmModelConfigController_getIntentRecall(): Promise<IntentRecallConfig> {
  const response = await http.get<unknown>(
    `${LLM_MODEL_CONFIG_BASE}/intent-recall`,
  );
  return normalizeIntentRecallConfig(response);
}

/** 更新意图召回配置 */
export async function LlmModelConfigController_updateIntentRecall(
  data: UpdateIntentRecallConfigDto,
): Promise<IntentRecallConfig> {
  const response = await http.put<unknown>(
    `${LLM_MODEL_CONFIG_BASE}/intent-recall`,
    data,
  );
  return normalizeIntentRecallConfig(response);
}
