import {
  LLM_MODEL_CONFIG_KINDS,
  type IntentRecallConfig,
  type IntentRecallMode,
  type LlmModelConfig,
  type LlmModelConfigKind,
  type UpdateIntentRecallConfigDto,
  type UpsertLlmModelConfigDto,
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

export function normalizeLlmModelConfig(raw: unknown): LlmModelConfig | null {
  const item =
    typeof raw === 'object' && raw !== null
      ? (raw as Record<string, unknown>)
      : unwrapPayload(raw);
  const kindRaw = typeof item.kind === 'string' ? item.kind : '';
  if (!isLlmModelConfigKind(kindRaw)) {
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
    id: normalizeNumber(item.id),
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

/** 列出全部 LLM / Embedding 配置 */
export async function LlmModelConfigController_findAll(): Promise<
  LlmModelConfig[]
> {
  const response = await http.get<unknown>(LLM_MODEL_CONFIG_BASE);
  return normalizeLlmModelConfigList(response);
}

/** 按 kind 查询配置 */
export async function LlmModelConfigController_findByKind(
  kind: LlmModelConfigKind,
): Promise<LlmModelConfig | null> {
  const response = await http.get<unknown>(
    `${LLM_MODEL_CONFIG_BASE}/kind/${kind}`,
  );
  return (
    normalizeLlmModelConfig(unwrapPayload(response)) ??
    normalizeLlmModelConfig(response)
  );
}

/** 按 kind 创建或更新配置 */
export async function LlmModelConfigController_upsert(
  data: UpsertLlmModelConfigDto,
): Promise<LlmModelConfig> {
  const response = await http.put<unknown>(LLM_MODEL_CONFIG_BASE, data);
  const config =
    normalizeLlmModelConfig(unwrapPayload(response)) ??
    normalizeLlmModelConfig(response);
  if (!config) {
    return { ...data };
  }
  return config;
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
