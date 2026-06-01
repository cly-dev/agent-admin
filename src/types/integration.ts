export type IntegrationAuthMode = 'USER_ONLY' | 'SYSTEM_ONLY' | 'USER_PREFERRED';

export interface IntegrationToolRef {
  id: number;
  name: string;
  path: string;
  method: string;
  isActive: boolean;
}

export interface Integration {
  id: number;
  appClientId: number;
  name: string;
  baseUrl: string;
  authMode: IntegrationAuthMode;
  systemConfigured?: boolean;
  /** 后端直接返回的集成描述 */
  description?: string | null;
  /** 后端聚合的工具数量（优先使用） */
  toolCount?: number;
  /** 当前 Integration 关联的系统级 API Key（通常只在明细接口中返回） */
  apiKey?: string;
  tools?: IntegrationToolRef[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateIntegrationDto {
  /** 所属 AppClient ID */
  appClientId: number;
  /** 集成名称 */
  name: string;
  /** API 根地址 */
  baseUrl: string;
  /** 系统级 API Key（SYSTEM_ONLY / USER_PREFERRED 时使用） */
  apiKey?: string;
  /** 鉴权模式 */
  authMode?: IntegrationAuthMode;
  /** 集成描述 */
  description?: string | null;
}

export interface UpdateIntegrationDto {
  appClientId?: number;
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  authMode?: IntegrationAuthMode;
  description?: string | null;
}

export interface IntegrationControllerFindPageParams {
  page?: number;
  pageSize?: number;
  id?: number;
  appClientId?: number;
  name?: string;
  baseUrl?: string;
  keyword?: string;
  authMode?: IntegrationAuthMode;
  orderBy?: 'id' | 'name' | 'createdAt' | 'updatedAt' | 'baseUrl';
  order?: 'asc' | 'desc';
}

export type IntegrationControllerFindByAppClientParams = Omit<
  IntegrationControllerFindPageParams,
  'appClientId'
>;

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}
