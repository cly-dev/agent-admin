export const LLM_MODEL_CONFIG_KINDS = [
  'chat',
  'transformers_embedding',
  'api_embedding',
] as const;

export type LlmModelConfigKind = (typeof LLM_MODEL_CONFIG_KINDS)[number];

export type IntentRecallMode = 'auto' | 'vector' | 'keyword';

/** POST /admin/llm-model-config 新建 */
export interface CreateLlmModelConfigDto {
  kind: LlmModelConfigKind;
  provider?: string;
  model: string;
  apiKey?: string | null;
  baseUrl: string;
  chatPath?: string;
  parameters?: Record<string, unknown>;
  stream?: boolean;
  maxTokens?: number | null;
  temperature?: number | null;
  enabled?: boolean;
}

/** PATCH /admin/llm-model-config/:id 部分更新 */
export interface UpdateLlmModelConfigDto {
  provider?: string;
  model?: string;
  apiKey?: string | null;
  baseUrl?: string;
  chatPath?: string;
  parameters?: Record<string, unknown>;
  stream?: boolean;
  maxTokens?: number | null;
  temperature?: number | null;
  enabled?: boolean;
}

/** @deprecated 使用 CreateLlmModelConfigDto；保留兼容旧引用 */
export type UpsertLlmModelConfigDto = CreateLlmModelConfigDto;

export interface UpdateIntentRecallConfigDto {
  recallMode?: IntentRecallMode;
  vectorTopK?: number;
  vectorMinScore?: number;
  bindToolsMax?: number;
  fallbackToKeyword?: boolean;
}

export interface LlmModelConfig {
  id: number;
  kind: LlmModelConfigKind;
  provider?: string;
  model: string;
  apiKey?: string;
  baseUrl: string;
  chatPath?: string;
  parameters?: Record<string, unknown>;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type LlmConnectionProbe =
  | 'chat'
  | 'embedding_api'
  | 'embedding_local'
  | 'unsupported';

export interface LlmConnectionTestResult {
  ok: boolean;
  configId: number;
  kind: LlmModelConfigKind;
  provider: string;
  model: string;
  probe: LlmConnectionProbe;
  durationMs: number;
  error?: string;
  detail?: Record<string, unknown>;
}

export interface IntentRecallConfig {
  recallMode?: IntentRecallMode;
  vectorTopK?: number;
  vectorMinScore?: number;
  bindToolsMax?: number;
  fallbackToKeyword?: boolean;
}
