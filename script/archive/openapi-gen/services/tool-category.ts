// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: src/services/api-gen/ — merge into src/services/ manually when ready
// Source: http://localhost:3030/docs-json

import { http } from "@/utils/request";
import type {
  ToolCategoryControllerFindPageParams,
  CreateToolCategoryDto,
  UpdateToolCategoryDto,
} from "@/types/tool-category";

/**
 * 分页查询工具分类列表
 * @tags tool-category
 */
export function ToolCategoryController_findPage(params?: ToolCategoryControllerFindPageParams) {
  return http.get<void>("admin/tool-category", params);
}

/**
 * 创建工具分类
 * @tags tool-category
 */
export function ToolCategoryController_create(data: CreateToolCategoryDto) {
  return http.post<void>("admin/tool-category", data);
}

/**
 * 按 ID 查询工具分类
 * @tags tool-category
 */
export function ToolCategoryController_findOne(id: number) {
  return http.get<void>(`admin/tool-category/${id}`);
}

/**
 * 按 ID 更新工具分类
 * @tags tool-category
 */
export function ToolCategoryController_update(id: number, data: UpdateToolCategoryDto) {
  return http.patch<void>(`admin/tool-category/${id}`, data);
}

/**
 * 按 ID 删除工具分类
 * @tags tool-category
 */
export function ToolCategoryController_remove(id: number) {
  return http.delete<void>(`admin/tool-category/${id}`);
}
