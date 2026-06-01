import { normalizeIntegration } from '@/pages/Integrations/useIntegrations';
import { http } from '@/utils/request';
import { normalizePageResult } from '@/utils/api-page';
import type {
  CreateIntegrationDto,
  Integration,
  IntegrationControllerFindByAppClientParams,
  IntegrationControllerFindPageParams,
  PageResult,
  UpdateIntegrationDto,
} from '@/types/integration';

const INTEGRATION_BASE = 'admin/integration';

/** 分页查询 Integration 列表 */
export async function IntegrationController_findPage(
  params?: IntegrationControllerFindPageParams,
): Promise<PageResult<Integration>> {
  const response = await http.get<unknown>(INTEGRATION_BASE, params);
  return normalizePageResult(response, normalizeIntegration);
}

/** 按 AppClient ID 分页查询 Integration 列表 */
export async function IntegrationController_findByAppClient(
  appClientId: number,
  params?: IntegrationControllerFindByAppClientParams,
): Promise<PageResult<Integration>> {
  const response = await http.get<unknown>(`${INTEGRATION_BASE}/by-app-client/${appClientId}`, params);
  return normalizePageResult(response, normalizeIntegration);
}

/** 创建 Integration */
export async function IntegrationController_create(data: CreateIntegrationDto) {
  const response = await http.post<unknown>(INTEGRATION_BASE, data);
  return normalizeIntegration(response);
}

/** 按 ID 查询 Integration */
export async function IntegrationController_findOne(id: number) {
  const response = await http.get<unknown>(`${INTEGRATION_BASE}/${id}`);
  return normalizeIntegration(response);
}

/** 按 ID 更新 Integration */
export async function IntegrationController_update(id: number, data: UpdateIntegrationDto) {
  const response = await http.patch<unknown>(`${INTEGRATION_BASE}/${id}`, data);
  return normalizeIntegration(response);
}

/** 按 ID 删除 Integration */
export function IntegrationController_remove(id: number) {
  return http.delete<void>(`${INTEGRATION_BASE}/${id}`);
}
