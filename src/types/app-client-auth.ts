export type AppClientAuthProvider = 'http_profile' | 'jwt_shared_secret';

export type AppClientTokenPlacement =
  | 'authorization_bearer'
  | 'header_x_account_token'
  | 'query_token';

export type AppClientProfileFieldMapping = {
  /** 外部 Profile JSON 路径，支持点号嵌套（如 data.email） */
  email: string;
  username?: string;
  active?: string;
  /** @deprecated 不再在页面配置 */
  employeeId?: string;
  nickName?: string;
  cnName?: string;
};

export type AppClientHttpAuthConfig = {
  baseUrl: string;
  profilePath: string;
  method?: 'GET' | 'POST';
  tokenPlacement?: AppClientTokenPlacement;
  mapping: AppClientProfileFieldMapping;
  extraHeaders?: Record<string, string>;
};

export type AppClientJwtAuthConfig = {
  sharedSecret: string;
  issuer?: string;
  audience?: string;
};

export type AppClientAuthConfig = {
  provider: AppClientAuthProvider;
  http?: AppClientHttpAuthConfig;
  jwt?: AppClientJwtAuthConfig;
  autoBindRoleName?: string;
  propagateTokenToIntegrations?: boolean;
};

export type AppClientAuthTestProfile = {
  email: string;
  username: string;
  active: boolean;
  employeeId?: string;
  nickName?: string;
  cnName?: string;
};

export type AppClientAuthTestResult = {
  ok: true;
  source: 'db' | 'env_fallback';
  profile: AppClientAuthTestProfile;
};

export type TestAppClientAuthDto = {
  accountToken: string;
};
