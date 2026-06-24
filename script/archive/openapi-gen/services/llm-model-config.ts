// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: script/archive/openapi-gen/services/ — merge into src/services/ manually when ready
// Source: http://localhost:3030/docs-json

import type {
  UpdateIntentRecallConfigDto,
  UpsertLlmModelConfigDto,
} from '@/types/llm-model-config';
import { http } from '@/utils/request';

/**
 * 列出全部 LLM / Embedding 配置（按 kind 唯一）
 * @tags llm-model-config
 */
export function LlmModelConfigController_findAll() {
  return http.get<void>('admin/llm-model-config');
}

/**
 * 按 kind 创建或更新配置
 * @tags llm-model-config
 */
export function LlmModelConfigController_upsert(data: UpsertLlmModelConfigDto) {
  return http.put<void>('admin/llm-model-config', data);
}

/**
 * 按 kind 查询配置
 * @tags llm-model-config
 */
export function LlmModelConfigController_findByKind(kind: string) {
  return http.get<void>(`admin/llm-model-config/kind/${kind}`);
}

/**
 * 获取意图召回配置
 * @tags llm-model-config
 */
export function LlmModelConfigController_getIntentRecall() {
  return http.get<void>('admin/llm-model-config/intent-recall');
}

/**
 * 更新意图召回配置
 * @tags llm-model-config
 */
export function LlmModelConfigController_updateIntentRecall(
  data: UpdateIntentRecallConfigDto,
) {
  return http.put<void>('admin/llm-model-config/intent-recall', data);
}
