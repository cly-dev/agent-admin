import type { PageResult } from '@/types/integration';

export interface ToolCategory {
  id: number;
  label: string;
  description?: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateToolCategoryDto {
  label: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateToolCategoryDto {
  label?: string;
  description?: string;
  sortOrder?: number;
}

export interface ToolCategoryControllerFindPageParams {
  page?: number;
  pageSize?: number;
  id?: number;
  label?: string;
  keyword?: string;
  orderBy?: 'id' | 'label' | 'sortOrder' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

export type ToolCategoryPageResult = PageResult<ToolCategory>;
