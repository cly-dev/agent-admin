// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: src/types/api-gen/ — merge into src/types/ manually when ready
// Source: http://localhost:3030/docs-json

export interface CreateToolCategoryDto {
  /**
   * 分类标签
   * @example "商品"
   */
  label: string;
  /** 分类描述 */
  description?: string;
  /**
   * 排序（越小越靠前）
   * @default 0
   * @example 0
   */
  sortOrder?: number;
}

export interface UpdateToolCategoryDto {
  /**
   * 分类标签
   * @example "商品"
   */
  label?: string;
  /** 分类描述 */
  description?: string;
  /**
   * 排序（越小越靠前）
   * @example 0
   */
  sortOrder?: number;
}

export interface ToolCategoryControllerFindPageParams {
  /**
   * 页码，从 1 开始
   * @default 1
   * @example 1
   */
  page?: number;
  /**
   * 每页条数，最大 100
   * @default 20
   * @example 20
   */
  pageSize?: number;
  /** 分类 ID（精确） */
  id?: number;
  /** 分类标签（模糊，忽略大小写） */
  label?: string;
  /** 关键词：匹配 label / description */
  keyword?: string;
  /**
   * 排序字段
   * @default "sortOrder"
   */
  orderBy?: "id" | "label" | "sortOrder" | "createdAt" | "updatedAt";
  /**
   * 排序方向
   * @default "asc"
   */
  order?: "asc" | "desc";
}
