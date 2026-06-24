export const LLM_MODEL_CONFIG_KINDS = [
  'chat',
  'transformers_embedding',
  'api_embedding',
] as const;

export type LlmModelConfigKind = (typeof LLM_MODEL_CONFIG_KINDS)[number];

export type IntentRecallMode = 'auto' | 'vector' | 'keyword';

export interface UpsertLlmModelConfigDto {
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
}

export interface UpdateIntentRecallConfigDto {
  recallMode?: IntentRecallMode;
  vectorTopK?: number;
  vectorMinScore?: number;
  bindToolsMax?: number;
  fallbackToKeyword?: boolean;
}

export interface LlmModelConfig {
  id?: number;
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

export interface IntentRecallConfig {
  recallMode?: IntentRecallMode;
  vectorTopK?: number;
  vectorMinScore?: number;
  bindToolsMax?: number;
  fallbackToKeyword?: boolean;
}
