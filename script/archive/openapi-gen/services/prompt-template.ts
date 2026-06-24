// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: script/archive/openapi-gen/services/ — merge into src/services/ manually when ready
// Source: http://localhost:3030/docs-json

import type { UpdatePromptTemplateDto } from '@/types/prompt-template';
import { http } from '@/utils/request';

/**
 * 编辑提示词版本
 * @description 可改 content / title / description / category；不可改 key、作用域与版本。已启用版本保存后立即同步 Redis
 * @tags prompt-template
 */
export function PromptTemplateController_update(
  id: number,
  data: UpdatePromptTemplateDto,
) {
  return http.patch<void>(`admin/prompt-template/${id}`, data);
}

/**
 * 删除提示词版本
 * @description 仅可删除未启用（isActive=false）的历史版本；同一 key+作用域至少保留一条版本
 * @tags prompt-template
 */
export function PromptTemplateController_remove(id: number) {
  return http.delete<void>(`admin/prompt-template/${id}`);
}
