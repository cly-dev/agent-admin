import type {
  CreateLlmModelConfigDto,
  LlmModelConfig,
  LlmModelConfigKind,
  UpdateLlmModelConfigDto,
} from '@/types/llm-model-config';

export const KIND_LABEL_IDS: Record<LlmModelConfigKind, string> = {
  chat: 'setting.llmModel.kind.chat',
  transformers_embedding: 'setting.llmModel.kind.transformersEmbedding',
  api_embedding: 'setting.llmModel.kind.apiEmbedding',
};

export const DEFAULT_PROVIDER_BY_KIND: Record<LlmModelConfigKind, string> = {
  chat: 'openai-compatible',
  api_embedding: 'openai-compatible-embeddings',
  transformers_embedding: 'transformers.js',
};

const CONTEXT_LENGTH_KEYS = [
  'contextLength',
  'maxContextTokens',
  'context_window',
] as const;

export type LlmModelConfigFormValues = {
  kind: LlmModelConfigKind;
  provider?: string;
  model: string;
  apiKey?: string;
  baseUrl: string;
  chatPath?: string;
  /** 模型上下文窗口（写入 parameters.contextLength） */
  contextLength?: number;
  /** 除上下文窗口外的扩展参数 JSON */
  parametersJson?: string;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
  enabled?: boolean;
};

function readContextLength(
  parameters?: Record<string, unknown>,
): number | undefined {
  if (!parameters) {
    return undefined;
  }
  for (const key of CONTEXT_LENGTH_KEYS) {
    const raw = parameters[key];
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
      return Math.floor(raw);
    }
    if (typeof raw === 'string' && raw.trim()) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) {
        return Math.floor(parsed);
      }
    }
  }
  return undefined;
}

function stripContextLengthKeys(
  parameters?: Record<string, unknown>,
): Record<string, unknown> {
  if (!parameters) {
    return {};
  }
  const next = { ...parameters };
  for (const key of CONTEXT_LENGTH_KEYS) {
    delete next[key];
  }
  return next;
}

function parseParametersJson(
  parametersJson?: string,
): Record<string, unknown> | undefined {
  const trimmed = parametersJson?.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = JSON.parse(trimmed) as unknown;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('INVALID_PARAMETERS_JSON');
  }
  return parsed as Record<string, unknown>;
}

/** 读-改-写合并 parameters：保留已有键，合并表单 JSON，写入 contextLength */
export function buildParametersForSave(
  values: LlmModelConfigFormValues,
  existing?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const fromJson = parseParametersJson(values.parametersJson) ?? {};
  const base = stripContextLengthKeys(existing);
  const merged: Record<string, unknown> = {
    ...base,
    ...stripContextLengthKeys(fromJson),
  };

  if (
    typeof values.contextLength === 'number' &&
    Number.isFinite(values.contextLength) &&
    values.contextLength > 0
  ) {
    merged.contextLength = Math.floor(values.contextLength);
  }

  return Object.keys(merged).length > 0 ? merged : undefined;
}

export function configToFormValues(
  config: LlmModelConfig | null,
  defaultKind: LlmModelConfigKind,
): LlmModelConfigFormValues {
  const kind = config?.kind ?? defaultKind;
  const restParameters = stripContextLengthKeys(config?.parameters);
  return {
    kind,
    provider: config?.provider ?? DEFAULT_PROVIDER_BY_KIND[kind],
    model: config?.model ?? '',
    apiKey: '',
    baseUrl: config?.baseUrl ?? '',
    chatPath:
      config?.chatPath ?? (kind === 'chat' ? '/v1/chat/completions' : ''),
    contextLength: readContextLength(config?.parameters),
    parametersJson:
      Object.keys(restParameters).length > 0
        ? JSON.stringify(restParameters, null, 2)
        : '',
    stream: config?.stream ?? false,
    maxTokens: config?.maxTokens,
    temperature: config?.temperature,
    enabled: config?.enabled ?? true,
  };
}

export function buildCreatePayload(
  values: LlmModelConfigFormValues,
): CreateLlmModelConfigDto {
  const parameters = buildParametersForSave(values);
  const payload: CreateLlmModelConfigDto = {
    kind: values.kind,
    model: values.model.trim(),
    baseUrl: values.baseUrl.trim(),
    provider: values.provider?.trim() || DEFAULT_PROVIDER_BY_KIND[values.kind],
    chatPath: values.chatPath?.trim() || undefined,
    parameters,
    stream: values.stream,
    maxTokens: values.maxTokens ?? null,
    temperature: values.temperature ?? null,
    enabled: values.enabled,
  };

  const apiKey = values.apiKey?.trim();
  if (apiKey) {
    payload.apiKey = apiKey;
  }

  return payload;
}

export function buildUpdatePayload(
  values: LlmModelConfigFormValues,
  existing?: LlmModelConfig | null,
): UpdateLlmModelConfigDto {
  const parameters = buildParametersForSave(values, existing?.parameters);
  const payload: UpdateLlmModelConfigDto = {
    model: values.model.trim(),
    baseUrl: values.baseUrl.trim(),
    provider: values.provider?.trim() || undefined,
    chatPath: values.chatPath?.trim() || undefined,
    parameters,
    stream: values.stream,
    maxTokens: values.maxTokens ?? null,
    temperature: values.temperature ?? null,
    enabled: values.enabled,
  };

  const apiKey = values.apiKey?.trim();
  if (apiKey) {
    payload.apiKey = apiKey;
  }

  return payload;
}

export function getContextLengthDisplay(
  config: LlmModelConfig,
): number | undefined {
  return readContextLength(config.parameters);
}

export function formatBaseUrlHost(baseUrl: string): string {
  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl;
  }
}
