// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: script/archive/openapi-gen/types/ — merge into src/types/ manually when ready
// Source: http://localhost:3030/docs-json

export interface CreateRoleDto {
  /**
   * 角色唯一标识名
   * @example "operator"
   */
  name: string;
  /** 角色说明 */
  description?: string;
  /**
   * 该角色允许使用的最高工具风险等级
   * @default "L1"
   */
  allowToolLevel?: 'L1' | 'L2' | 'L3';
}

export interface UpdateRoleDto {
  /** @example "operator" */
  name?: string;
  /** 传 null 可清空说明 */
  description?: string;
  allowToolLevel?: 'L1' | 'L2' | 'L3';
}

export interface RoleControllerFindPageParams {
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
  /** 角色 ID（精确） */
  id?: number;
  /** 角色名（模糊，忽略大小写） */
  name?: string;
  /** 关键词：匹配 name / description */
  keyword?: string;
  allowToolLevel?: 'L1' | 'L2' | 'L3';
  /**
   * 排序字段
   * @default "id"
   */
  orderBy?: 'id' | 'name' | 'allowToolLevel' | 'createdAt';
  /** @default "asc" */
  order?: 'asc' | 'desc';
}
