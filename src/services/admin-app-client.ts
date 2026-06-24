// AUTO-GENERATED — DO NOT EDIT MANUALLY
// Run: npm run gen:api to regenerate
// Hand-maintained — OpenAPI stubs: script/archive/openapi-gen/services/
// Source: http://localhost:3030/docs-json

import { serializeAuthConfigForApi } from '@/pages/Project/appClientAuth';
import type {
  AppClient,
  CreateAppClientDto,
  UpdateAppClientDto,
} from '@/types/admin-app-client';
import type {
  AppClientAuthConfig,
  AppClientAuthTestResult,
  AppClientProfileFieldMapping,
  TestAppClientAuthDto,
} from '@/types/app-client-auth';
import { http } from '@/utils/request';

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

function normalizeStringRecord(
  raw: unknown,
): Record<string, string> | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return undefined;
  }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string') {
      result[key] = value;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function normalizeAuthConfig(raw: unknown): AppClientAuthConfig | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  const item = unwrapPayload(raw);
  const provider =
    item.provider === 'jwt_shared_secret'
      ? 'jwt_shared_secret'
      : 'http_profile';

  const httpRaw =
    typeof item.http === 'object' && item.http !== null
      ? (item.http as Record<string, unknown>)
      : null;
  const jwtRaw =
    typeof item.jwt === 'object' && item.jwt !== null
      ? (item.jwt as Record<string, unknown>)
      : null;
  const mappingRaw =
    httpRaw && typeof httpRaw.mapping === 'object' && httpRaw.mapping !== null
      ? (httpRaw.mapping as Record<string, unknown>)
      : null;

  const config: AppClientAuthConfig = {
    provider,
    autoBindRoleName:
      typeof item.autoBindRoleName === 'string'
        ? item.autoBindRoleName
        : typeof item.auto_bind_role_name === 'string'
          ? item.auto_bind_role_name
          : undefined,
    propagateTokenToIntegrations:
      typeof item.propagateTokenToIntegrations === 'boolean'
        ? item.propagateTokenToIntegrations
        : typeof item.propagate_token_to_integrations === 'boolean'
          ? item.propagate_token_to_integrations
          : undefined,
  };

  if (httpRaw && mappingRaw) {
    const email =
      typeof mappingRaw.email === 'string' ? mappingRaw.email.trim() : '';
    if (email) {
      const mapping: AppClientProfileFieldMapping = { email };

      if (
        typeof mappingRaw.username === 'string' &&
        mappingRaw.username.trim()
      ) {
        mapping.username = mappingRaw.username.trim();
      }
      if (typeof mappingRaw.active === 'string' && mappingRaw.active.trim()) {
        mapping.active = mappingRaw.active.trim();
      }

      config.http = {
        baseUrl: typeof httpRaw.baseUrl === 'string' ? httpRaw.baseUrl : '',
        profilePath:
          typeof httpRaw.profilePath === 'string'
            ? httpRaw.profilePath
            : typeof httpRaw.profile_path === 'string'
              ? httpRaw.profile_path
              : '',
        method: httpRaw.method === 'POST' ? 'POST' : 'GET',
        tokenPlacement:
          httpRaw.tokenPlacement === 'header_x_account_token' ||
          httpRaw.token_placement === 'header_x_account_token'
            ? 'header_x_account_token'
            : httpRaw.tokenPlacement === 'query_token' ||
                httpRaw.token_placement === 'query_token'
              ? 'query_token'
              : 'authorization_bearer',
        mapping,
        extraHeaders: normalizeStringRecord(
          httpRaw.extraHeaders ?? httpRaw.extra_headers,
        ),
      };
    }
  }

  if (jwtRaw && typeof jwtRaw.sharedSecret === 'string') {
    config.jwt = {
      sharedSecret: jwtRaw.sharedSecret,
      issuer: typeof jwtRaw.issuer === 'string' ? jwtRaw.issuer : undefined,
      audience:
        typeof jwtRaw.audience === 'string' ? jwtRaw.audience : undefined,
    };
  }

  if (config.provider === 'http_profile') {
    if (
      !config.http?.baseUrl ||
      !config.http.profilePath ||
      !config.http.mapping.email
    ) {
      return null;
    }
  }

  if (config.provider === 'jwt_shared_secret' && !config.jwt?.sharedSecret) {
    return null;
  }

  return config;
}

function normalizeAppClient(raw: unknown): AppClient {
  if (typeof raw !== 'object' || raw === null) {
    return { id: 0, name: '', isActive: true };
  }
  const item = raw as Record<string, unknown>;
  return {
    id: Number(item.id ?? 0) || 0,
    name: typeof item.name === 'string' ? item.name : '',
    description:
      typeof item.description === 'string' ? item.description : undefined,
    dsn:
      typeof item.dsn === 'string'
        ? item.dsn
        : typeof item.dns === 'string'
          ? item.dns
          : undefined,
    isActive: typeof item.isActive === 'boolean' ? item.isActive : true,
    authConfig: normalizeAuthConfig(item.authConfig ?? item.auth_config),
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
  };
}

function unwrapList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'object' || raw === null) return [];
  const payload = raw as Record<string, unknown>;
  const nested =
    typeof payload.data === 'object' && payload.data !== null
      ? (payload.data as Record<string, unknown>)
      : payload;
  const list =
    nested.list ?? nested.items ?? nested.records ?? nested.rows ?? nested;
  return Array.isArray(list) ? list : [];
}

/**
 * 管理员查询 AppClient 列表
 * @tags admin-app-client
 */
export async function AppClientController_findAll(): Promise<AppClient[]> {
  const response = await http.get<unknown>('admin/app-client');
  return unwrapList(response).map(normalizeAppClient);
}

/**
 * 管理员创建业务 AppClient
 * @tags admin-app-client
 */
export async function AppClientController_create(
  data: CreateAppClientDto,
): Promise<AppClient> {
  const response = await http.post<unknown>('admin/app-client', data);
  return normalizeAppClient(response);
}

/**
 * 管理员按 ID 查询 AppClient
 * @tags admin-app-client
 */
export async function AppClientController_findOne(
  id: number,
): Promise<AppClient> {
  const response = await http.get<unknown>(`admin/app-client/${id}`);
  return normalizeAppClient(response);
}

/**
 * 管理员按 ID 更新 AppClient
 * @tags admin-app-client
 */
export async function AppClientController_update(
  id: number,
  data: UpdateAppClientDto,
): Promise<AppClient> {
  const payload = {
    ...data,
    ...(data.authConfig !== undefined
      ? { authConfig: serializeAuthConfigForApi(data.authConfig) }
      : {}),
  };
  const response = await http.patch<unknown>(`admin/app-client/${id}`, payload);
  return normalizeAppClient(response);
}

/**
 * 管理员按 ID 删除 AppClient
 * @tags admin-app-client
 */
export function AppClientController_remove(id: number) {
  return http.delete<void>(`admin/app-client/${id}`);
}

/** 测试 AppClient 外部账号鉴权配置（不建档、不签发 JWT） */
export async function AppClientController_testAuth(
  id: number,
  data: TestAppClientAuthDto,
): Promise<AppClientAuthTestResult> {
  const response = await http.post<unknown>(
    `admin/app-client/${id}/auth/test`,
    data,
  );
  const item = unwrapPayload(response);
  const profileRaw =
    typeof item.profile === 'object' && item.profile !== null
      ? (item.profile as Record<string, unknown>)
      : {};

  return {
    ok: true,
    source: item.source === 'env_fallback' ? 'env_fallback' : 'db',
    profile: {
      employeeId:
        typeof profileRaw.employeeId === 'string'
          ? profileRaw.employeeId
          : typeof profileRaw.employee_id === 'string'
            ? profileRaw.employee_id
            : '',
      email: typeof profileRaw.email === 'string' ? profileRaw.email : '',
      username:
        typeof profileRaw.username === 'string' ? profileRaw.username : '',
      active: profileRaw.active === true || profileRaw.active === 'true',
      nickName:
        typeof profileRaw.nickName === 'string'
          ? profileRaw.nickName
          : typeof profileRaw.nick_name === 'string'
            ? profileRaw.nick_name
            : undefined,
      cnName:
        typeof profileRaw.cnName === 'string'
          ? profileRaw.cnName
          : typeof profileRaw.cn_name === 'string'
            ? profileRaw.cn_name
            : undefined,
    },
  };
}
