import { http } from '@/utils/request';
import { normalizePageResult } from '@/utils/api-page';
import type {
  CreateToolCategoryDto,
  ToolCategory,
  ToolCategoryControllerFindPageParams,
  ToolCategoryPageResult,
  UpdateToolCategoryDto,
} from '@/types/tool-category';

const TOOL_CATEGORY_BASE = 'admin/tool-category';

function normalizeToolCategory(raw: unknown): ToolCategory {
  if (typeof raw !== 'object' || raw === null) {
    return {
      id: 0,
      label: '',
      sortOrder: 0,
    };
  }

  const item = raw as Record<string, unknown>;
  const id = Number(item.id ?? 0);
  const sortOrder = Number(item.sortOrder ?? item.sort_order ?? 0);

  return {
    id: Number.isFinite(id) ? id : 0,
    label: typeof item.label === 'string' ? item.label : '',
    description: typeof item.description === 'string' ? item.description : undefined,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
  };
}

export async function ToolCategoryController_findPage(
  params?: ToolCategoryControllerFindPageParams,
): Promise<ToolCategoryPageResult> {
  const response = await http.get<unknown>(TOOL_CATEGORY_BASE, params);
  return normalizePageResult(response, normalizeToolCategory);
}

export async function ToolCategoryController_create(data: CreateToolCategoryDto): Promise<ToolCategory> {
  const response = await http.post<unknown>(TOOL_CATEGORY_BASE, data);
  return normalizeToolCategory(response);
}

export async function ToolCategoryController_findOne(id: number): Promise<ToolCategory> {
  const response = await http.get<unknown>(`${TOOL_CATEGORY_BASE}/${id}`);
  return normalizeToolCategory(response);
}

export async function ToolCategoryController_update(
  id: number,
  data: UpdateToolCategoryDto,
): Promise<ToolCategory> {
  const response = await http.patch<unknown>(`${TOOL_CATEGORY_BASE}/${id}`, data);
  return normalizeToolCategory(response);
}

export function ToolCategoryController_remove(id: number) {
  return http.delete<void>(`${TOOL_CATEGORY_BASE}/${id}`);
}
