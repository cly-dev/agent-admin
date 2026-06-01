export interface AppClient {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
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
}
