import type { AppClientAuthConfig } from './app-client-auth';

export type { AppClientAuthConfig } from './app-client-auth';

export interface AppClient {
  id: number;
  name: string;
  description?: string;
  /** 项目接入密钥（只读，由系统生成） */
  dsn?: string;
  isActive: boolean;
  authConfig?: AppClientAuthConfig | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAppClientDto {
  /**
   * 业务系统名称
   * @example "crm-system"
   */
  name: string;
  /**
   * 业务系统描述
   * @example "CRM business application"
   */
  description?: string;
  /**
   * 是否启用
   * @example true
   */
  isActive?: boolean;
}

export interface UpdateAppClientDto {
  /**
   * 业务系统名称
   * @example "crm-system"
   */
  name?: string;
  /**
   * 业务系统描述
   * @example "CRM business application"
   */
  description?: string;
  /**
   * 是否启用
   * @example true
   */
  isActive?: boolean;
  /** 外部鉴权配置；传 null 清空并回退环境变量 */
  authConfig?: AppClientAuthConfig | null;
}
