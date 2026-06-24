import type {
  AppClientAuthConfig,
  AppClientAuthProvider,
  AppClientProfileFieldMapping,
  AppClientTokenPlacement,
} from '@/types/app-client-auth';
import type { FormInstance } from 'antd';

export type ProjectAuthConfigFormValues = {
  useCustomConfig: boolean;
  provider: AppClientAuthProvider;
  httpBaseUrl?: string;
  httpProfilePath?: string;
  httpMethod?: 'GET' | 'POST';
  httpTokenPlacement?: AppClientTokenPlacement;
  mappingEmail?: string;
  mappingUsername?: string;
  mappingActive?: string;
  extraHeadersJson?: string;
  jwtSharedSecret?: string;
  jwtIssuer?: string;
  jwtAudience?: string;
  autoBindRoleName?: string;
  propagateTokenToIntegrations?: boolean;
};

/** 外部 Profile JSON 路径，支持点号嵌套（如 data.email）。 */
const PROFILE_JSON_PATH_PATTERN =
  /^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*$/;

export function isValidProfileJsonPath(value: string): boolean {
  return PROFILE_JSON_PATH_PATTERN.test(value.trim());
}

/** 页面可配置的 HTTP Profile 字段映射（提交时仅包含此处列出的字段）。 */
export const HTTP_PROFILE_MAPPING_FORM_FIELDS = [
  { formKey: 'mappingEmail', mappingKey: 'email', required: true },
  { formKey: 'mappingUsername', mappingKey: 'username', required: false },
  { formKey: 'mappingActive', mappingKey: 'active', required: false },
] as const satisfies ReadonlyArray<{
  formKey: keyof Pick<
    ProjectAuthConfigFormValues,
    'mappingEmail' | 'mappingUsername' | 'mappingActive'
  >;
  mappingKey: keyof AppClientProfileFieldMapping;
  required: boolean;
}>;

type HttpProfileMappingFormKey =
  (typeof HTTP_PROFILE_MAPPING_FORM_FIELDS)[number]['formKey'];

export const DEFAULT_HTTP_PROFILE_FORM: Pick<
  ProjectAuthConfigFormValues,
  | 'provider'
  | 'httpProfilePath'
  | 'httpMethod'
  | 'httpTokenPlacement'
  | HttpProfileMappingFormKey
  | 'autoBindRoleName'
  | 'propagateTokenToIntegrations'
> = {
  provider: 'http_profile',
  httpProfilePath: '/account/seller/account/current',
  httpMethod: 'GET',
  httpTokenPlacement: 'authorization_bearer',
  mappingEmail: 'email',
  mappingUsername: 'username',
  mappingActive: 'active',
  autoBindRoleName: 'operator',
  propagateTokenToIntegrations: true,
};

function trimOptional(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseExtraHeadersJson(
  raw: unknown,
): Record<string, string> | undefined {
  const text = trimOptional(raw);
  if (!text) {
    return undefined;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('INVALID_EXTRA_HEADERS_JSON');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('INVALID_EXTRA_HEADERS_JSON');
  }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== 'string') {
      throw new Error('INVALID_EXTRA_HEADERS_JSON');
    }
    result[key] = value;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function readMappingFormValue(
  values: ProjectAuthConfigFormValues,
  formKey: HttpProfileMappingFormKey,
): string | undefined {
  return trimOptional(values[formKey]);
}

export function buildHttpProfileMappingFromForm(
  values: ProjectAuthConfigFormValues,
): AppClientProfileFieldMapping {
  const mapping: AppClientProfileFieldMapping = {};

  for (const field of HTTP_PROFILE_MAPPING_FORM_FIELDS) {
    const mappedValue = readMappingFormValue(values, field.formKey);
    if (field.required) {
      if (!mappedValue) {
        throw new Error('HTTP_PROFILE_REQUIRED');
      }
      if (!isValidProfileJsonPath(mappedValue)) {
        throw new Error('MAPPING_PATH_INVALID');
      }
      mapping[field.mappingKey] = mappedValue;
      continue;
    }
    if (mappedValue) {
      if (!isValidProfileJsonPath(mappedValue)) {
        throw new Error('MAPPING_PATH_INVALID');
      }
      mapping[field.mappingKey] = mappedValue;
    }
  }

  return mapping;
}

/** 鉴权表单取值：条件渲染字段需 getFieldsValue(true) 才能拿到用户输入的路径。 */
export async function collectProjectAuthFormValues(
  form: FormInstance<ProjectAuthConfigFormValues>,
): Promise<ProjectAuthConfigFormValues> {
  const snapshot = form.getFieldsValue(true);
  if (!snapshot.useCustomConfig) {
    return snapshot;
  }

  const provider = snapshot.provider ?? 'http_profile';
  const fieldNames: (keyof ProjectAuthConfigFormValues)[] = [
    'useCustomConfig',
    'provider',
    'autoBindRoleName',
    'propagateTokenToIntegrations',
  ];

  if (provider === 'http_profile') {
    fieldNames.push(
      'httpBaseUrl',
      'httpProfilePath',
      'httpMethod',
      'httpTokenPlacement',
      'extraHeadersJson',
      ...HTTP_PROFILE_MAPPING_FORM_FIELDS.map((field) => field.formKey),
    );
  } else {
    fieldNames.push('jwtSharedSecret', 'jwtIssuer', 'jwtAudience');
  }

  await form.validateFields(fieldNames);
  return form.getFieldsValue(true);
}

/** 提交 API 时仅保留页面配置的 mapping 字段，避免带上历史 nickName / employeeId。 */
export function serializeAuthConfigForApi(
  config: AppClientAuthConfig | null,
): Record<string, unknown> | null {
  if (config === null) {
    return null;
  }

  const payload: Record<string, unknown> = {
    provider: config.provider,
  };

  if (config.autoBindRoleName) {
    payload.autoBindRoleName = config.autoBindRoleName;
  }
  if (config.propagateTokenToIntegrations !== undefined) {
    payload.propagateTokenToIntegrations = config.propagateTokenToIntegrations;
  }

  if (config.provider === 'http_profile' && config.http) {
    const mapping: Record<string, string> = {
      email: config.http.mapping.email,
    };
    if (config.http.mapping.username) {
      mapping.username = config.http.mapping.username;
    }
    if (config.http.mapping.active) {
      mapping.active = config.http.mapping.active;
    }

    payload.http = {
      baseUrl: config.http.baseUrl,
      profilePath: config.http.profilePath,
      method: config.http.method ?? 'GET',
      tokenPlacement: config.http.tokenPlacement ?? 'authorization_bearer',
      mapping,
      ...(config.http.extraHeaders
        ? { extraHeaders: config.http.extraHeaders }
        : {}),
    };
  }

  if (config.provider === 'jwt_shared_secret' && config.jwt) {
    payload.jwt = {
      sharedSecret: config.jwt.sharedSecret,
      ...(config.jwt.issuer ? { issuer: config.jwt.issuer } : {}),
      ...(config.jwt.audience ? { audience: config.jwt.audience } : {}),
    };
  }

  return payload;
}

export function authConfigToFormValues(
  authConfig: AppClientAuthConfig | null | undefined,
): ProjectAuthConfigFormValues {
  if (!authConfig) {
    return {
      useCustomConfig: true,
      ...DEFAULT_HTTP_PROFILE_FORM,
      httpBaseUrl: '',
      extraHeadersJson: '',
      jwtSharedSecret: '',
      jwtIssuer: '',
      jwtAudience: '',
    };
  }

  const extraHeadersJson =
    authConfig.http?.extraHeaders &&
    Object.keys(authConfig.http.extraHeaders).length > 0
      ? JSON.stringify(authConfig.http.extraHeaders, null, 2)
      : '';

  const mapping = authConfig.http?.mapping;

  return {
    useCustomConfig: true,
    provider: authConfig.provider,
    httpBaseUrl: authConfig.http?.baseUrl ?? '',
    httpProfilePath:
      authConfig.http?.profilePath ?? DEFAULT_HTTP_PROFILE_FORM.httpProfilePath,
    httpMethod: authConfig.http?.method ?? DEFAULT_HTTP_PROFILE_FORM.httpMethod,
    httpTokenPlacement:
      authConfig.http?.tokenPlacement ??
      DEFAULT_HTTP_PROFILE_FORM.httpTokenPlacement,
    mappingEmail: mapping?.email ?? DEFAULT_HTTP_PROFILE_FORM.mappingEmail,
    mappingUsername:
      mapping?.username ?? DEFAULT_HTTP_PROFILE_FORM.mappingUsername,
    mappingActive: mapping?.active ?? DEFAULT_HTTP_PROFILE_FORM.mappingActive,
    extraHeadersJson,
    jwtSharedSecret: authConfig.jwt?.sharedSecret ?? '',
    jwtIssuer: authConfig.jwt?.issuer ?? '',
    jwtAudience: authConfig.jwt?.audience ?? '',
    autoBindRoleName:
      authConfig.autoBindRoleName ?? DEFAULT_HTTP_PROFILE_FORM.autoBindRoleName,
    propagateTokenToIntegrations:
      authConfig.propagateTokenToIntegrations ??
      DEFAULT_HTTP_PROFILE_FORM.propagateTokenToIntegrations,
  };
}

export function buildAuthConfigFromForm(
  values: ProjectAuthConfigFormValues,
): AppClientAuthConfig | null {
  if (!values.useCustomConfig) {
    return null;
  }

  const autoBindRoleName = trimOptional(values.autoBindRoleName);
  const propagateTokenToIntegrations =
    values.propagateTokenToIntegrations ?? true;

  if (values.provider === 'jwt_shared_secret') {
    const sharedSecret = trimOptional(values.jwtSharedSecret);
    if (!sharedSecret) {
      throw new Error('JWT_SHARED_SECRET_REQUIRED');
    }
    return {
      provider: 'jwt_shared_secret',
      jwt: {
        sharedSecret,
        issuer: trimOptional(values.jwtIssuer),
        audience: trimOptional(values.jwtAudience),
      },
      autoBindRoleName,
      propagateTokenToIntegrations,
    };
  }

  const baseUrl = trimOptional(values.httpBaseUrl);
  const profilePath = trimOptional(values.httpProfilePath);

  if (!baseUrl || !profilePath) {
    throw new Error('HTTP_PROFILE_REQUIRED');
  }

  const mapping = buildHttpProfileMappingFromForm(values);
  const extraHeaders = parseExtraHeadersJson(values.extraHeadersJson);

  return {
    provider: 'http_profile',
    http: {
      baseUrl,
      profilePath,
      method: values.httpMethod ?? 'GET',
      tokenPlacement: values.httpTokenPlacement ?? 'authorization_bearer',
      mapping,
      extraHeaders,
    },
    autoBindRoleName,
    propagateTokenToIntegrations,
  };
}

/** 主保存合并 authConfig：未启用自定义配置时不改动现有鉴权（返回 undefined）。 */
export async function resolveAuthConfigForUpdate(
  form: FormInstance<ProjectAuthConfigFormValues>,
): Promise<AppClientAuthConfig | null | undefined> {
  const values = await collectProjectAuthFormValues(form);
  if (!values.useCustomConfig) {
    return undefined;
  }
  return buildAuthConfigFromForm(values);
}

/** 鉴权区块单独保存：未启用自定义配置时写入 null 回退环境变量。 */
export async function resolveAuthConfigForAuthPanelSave(
  form: FormInstance<ProjectAuthConfigFormValues>,
): Promise<AppClientAuthConfig | null> {
  const values = await collectProjectAuthFormValues(form);
  if (!values.useCustomConfig) {
    return null;
  }
  return buildAuthConfigFromForm(values);
}
