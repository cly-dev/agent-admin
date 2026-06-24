// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: script/archive/openapi-gen/types/ — merge into src/types/ manually when ready
// Source: http://localhost:3030/docs-json

export interface UpsertLlmModelConfigDto {
  kind: 'chat' | 'transformers_embedding' | 'api_embedding';
  provider?: string;
  model: string;
  apiKey?: string;
  baseUrl: string;
  chatPath?: string;
  parameters?: object;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
  enabled?: boolean;
}

export interface UpdateIntentRecallConfigDto {
  recallMode?: 'auto' | 'vector' | 'keyword';
  vectorTopK?: number;
  vectorMinScore?: number;
  bindToolsMax?: number;
  fallbackToKeyword?: boolean;
}
