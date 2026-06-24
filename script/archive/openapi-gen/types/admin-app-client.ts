// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Output: script/archive/openapi-gen/types/ — merge into src/types/ manually when ready
// Source: http://localhost:3030/docs-json

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
