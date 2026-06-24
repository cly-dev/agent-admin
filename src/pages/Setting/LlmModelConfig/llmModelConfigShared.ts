import type {
  LlmModelConfig,
  LlmModelConfigKind,
  UpsertLlmModelConfigDto,
} from '@/types/llm-model-config';

export const KIND_LABEL_IDS: Record<LlmModelConfigKind, string> = {
  chat: 'setting.llmModel.kind.chat',
  transformers_embedding: 'setting.llmModel.kind.transformersEmbedding',
  api_embedding: 'setting.llmModel.kind.apiEmbedding',
};

export type LlmModelConfigFormValues = {
  kind: LlmModelConfigKind;
  provider?: string;
  model: string;
  apiKey?: string;
  baseUrl: string;
  chatPath?: string;
  parametersJson?: string;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
  enabled?: boolean;
};

export function configToFormValues(
  config: LlmModelConfig | null,
  defaultKind: LlmModelConfigKind,
): LlmModelConfigFormValues {
  return {
    kind: config?.kind ?? defaultKind,
    provider: config?.provider ?? '',
    model: config?.model ?? '',
    apiKey: '',
    baseUrl: config?.baseUrl ?? '',
    chatPath: config?.chatPath ?? '',
    parametersJson: config?.parameters
      ? JSON.stringify(config.parameters, null, 2)
      : '',
    stream: config?.stream ?? false,
    maxTokens: config?.maxTokens,
    temperature: config?.temperature,
    enabled: config?.enabled ?? true,
  };
}

export function buildUpsertPayload(
  values: LlmModelConfigFormValues,
): UpsertLlmModelConfigDto {
  let parameters: Record<string, unknown> | undefined;
  const parametersJson = values.parametersJson?.trim();
  if (parametersJson) {
    const parsed = JSON.parse(parametersJson) as unknown;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error('INVALID_PARAMETERS_JSON');
    }
    parameters = parsed as Record<string, unknown>;
  }

  const payload: UpsertLlmModelConfigDto = {
    kind: values.kind,
    model: values.model.trim(),
    baseUrl: values.baseUrl.trim(),
    provider: values.provider?.trim() || undefined,
    chatPath: values.chatPath?.trim() || undefined,
    parameters,
    stream: values.stream,
    maxTokens: values.maxTokens,
    temperature: values.temperature,
    enabled: values.enabled,
  };

  const apiKey = values.apiKey?.trim();
  if (apiKey) {
    payload.apiKey = apiKey;
  }

  return payload;
}

export function formatBaseUrlHost(baseUrl: string): string {
  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl;
  }
}
