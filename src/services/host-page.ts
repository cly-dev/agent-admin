import type {
  CreateHostPageDto,
  HostPage,
  HostPageControllerFindByAppClientParams,
  UpdateHostPageDto,
} from '@/types/host-page';
import type { PageResult } from '@/types/integration';
import { normalizePageResult } from '@/utils/api-page';
import { http } from '@/utils/request';

const HOST_PAGE_BASE = 'admin/host-page';

function unwrapPayload(raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }
  const payload = raw as Record<string, unknown>;
  if (typeof payload.data === 'object' && payload.data !== null) {
    return payload.data as Record<string, unknown>;
  }
  return payload;
}

function normalizeBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 1 || value === '1' || value === 'true') {
    return true;
  }
  if (value === 0 || value === '0' || value === 'false') {
    return false;
  }
  return undefined;
}

export function normalizeHostPage(raw: unknown): HostPage {
  const item = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  const id = Number(item.id);
  const appClientId = Number(item.appClientId ?? item.app_client_id);
  const hostToolCountRaw =
    item.hostToolCount ?? item.host_tool_count ?? item._count;

  let hostToolCount: number | undefined;
  if (
    typeof hostToolCountRaw === 'number' &&
    Number.isFinite(hostToolCountRaw)
  ) {
    hostToolCount = hostToolCountRaw;
  } else if (
    typeof hostToolCountRaw === 'object' &&
    hostToolCountRaw !== null
  ) {
    const count = (hostToolCountRaw as Record<string, unknown>).hostTools;
    if (typeof count === 'number') {
      hostToolCount = count;
    }
  }

  return {
    id: Number.isFinite(id) ? id : 0,
    appClientId: Number.isFinite(appClientId) ? appClientId : 0,
    appClientName:
      typeof item.appClientName === 'string'
        ? item.appClientName
        : typeof item.app_client_name === 'string'
          ? item.app_client_name
          : undefined,
    scope: String(item.scope ?? ''),
    label: String(item.label ?? ''),
    description:
      typeof item.description === 'string'
        ? item.description
        : item.description === null
          ? null
          : undefined,
    routePattern:
      typeof item.routePattern === 'string'
        ? item.routePattern
        : typeof item.route_pattern === 'string'
          ? item.route_pattern
          : item.routePattern === null || item.route_pattern === null
            ? null
            : undefined,
    sortOrder:
      typeof item.sortOrder === 'number'
        ? item.sortOrder
        : typeof item.sort_order === 'number'
          ? item.sort_order
          : undefined,
    isActive: normalizeBoolean(item.isActive ?? item.is_active),
    hostToolCount,
    createdAt:
      typeof item.createdAt === 'string'
        ? item.createdAt
        : typeof item.created_at === 'string'
          ? item.created_at
          : undefined,
    updatedAt:
      typeof item.updatedAt === 'string'
        ? item.updatedAt
        : typeof item.updated_at === 'string'
          ? item.updated_at
          : undefined,
  };
}

export async function HostPageController_findByAppClient(
  appClientId: number,
  params?: Omit<HostPageControllerFindByAppClientParams, 'appClientId'>,
): Promise<PageResult<HostPage>> {
  const response = await http.get<unknown>(
    `${HOST_PAGE_BASE}/by-app-client/${appClientId}`,
    params,
  );
  return normalizePageResult(response, normalizeHostPage);
}

export async function HostPageController_findOne(
  id: number,
): Promise<HostPage> {
  const response = await http.get<unknown>(`${HOST_PAGE_BASE}/${id}`);
  return normalizeHostPage(unwrapPayload(response));
}

export async function HostPageController_create(
  data: CreateHostPageDto,
): Promise<HostPage> {
  const response = await http.post<unknown>(HOST_PAGE_BASE, data);
  return normalizeHostPage(unwrapPayload(response));
}

export async function HostPageController_update(
  id: number,
  data: UpdateHostPageDto,
): Promise<HostPage> {
  const response = await http.patch<unknown>(`${HOST_PAGE_BASE}/${id}`, data);
  return normalizeHostPage(unwrapPayload(response));
}

export function HostPageController_remove(id: number) {
  return http.delete<void>(`${HOST_PAGE_BASE}/${id}`);
}
