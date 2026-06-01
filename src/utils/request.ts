import { history, request, type RequestConfig } from '@umijs/max';
import { getAccessToken, signOut } from '@/services/auth/user';

export type ApiResponse<TData> = {
  data: TData;
  status: number;
  message: string;
};

type RequestParams = object;
type RequestBody = unknown;

type HttpRequestOptions = {
  method: string;
  params?: RequestParams;
  data?: RequestBody;
  headers?: Record<string, string>;
};

const DEFAULT_API_BASE_URL = 'http://localhost:3030';
const DEFAULT_API_PATH_PREFIX = '/admin';
const LOGIN_PATHS = ['/admin-user/login', '/admin/admin-user/login'] as const;
const DEV_PROXY_PREFIX = '/api';

const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development' || process.env.UMI_ENV === 'dev';
};

const ensureDevApiPrefix = (baseUrl: string): string => {
  if (/^https?:\/\//.test(baseUrl)) {
    return DEV_PROXY_PREFIX;
  }

  const normalizedPath = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
  if (normalizedPath === '/') {
    return DEV_PROXY_PREFIX;
  }

  return normalizedPath.startsWith(`${DEV_PROXY_PREFIX}/`)
    ? normalizedPath
    : `${DEV_PROXY_PREFIX}${normalizedPath}`;
};

export const getApiBaseUrl = (): string => {
  const rawBaseUrl = (process.env.UMI_APP_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, '');
  if (!isDevelopment()) {
    return rawBaseUrl;
  }

  return ensureDevApiPrefix(rawBaseUrl);
};

const shouldSkipUnauthorizedRedirect = (url?: string): boolean => {
  if (!url) {
    return false;
  }

  return LOGIN_PATHS.some((path) => url.endsWith(path));
};

const buildAuthorizedHeaders = (
  sourceHeaders: HeadersInit | Record<string, string> | undefined,
  token: string,
): Record<string, string> => {
  const headers = new Headers(sourceHeaders);
  headers.set('Authorization', `Bearer ${token}`);
  return Object.fromEntries(headers.entries());
};

const attachAuthHeader = (
  headers: Record<string, string> | undefined,
): Record<string, string> => {
  const token = getAccessToken();
  if (!token) {
    return headers ?? {};
  }

  return buildAuthorizedHeaders(headers, token);
};

const requestInterceptors: NonNullable<RequestConfig['requestInterceptors']> = [
  (
    (url: string, config: { headers?: HeadersInit } & Record<string, unknown>) => {
      const token = getAccessToken();
      if (!token) {
        return { url, options: config };
      }

      return {
        url,
        options: {
          ...config,
          headers: buildAuthorizedHeaders(config.headers, token),
        },
      };
    }
  ) as NonNullable<RequestConfig['requestInterceptors']>[number],
];

const responseInterceptors: NonNullable<RequestConfig['responseInterceptors']> = [
  async (response) => {
    const requestUrl = response.config?.url;
    if (response.status !== 401 || shouldSkipUnauthorizedRedirect(requestUrl)) {
      return response;
    }

    await signOut();
    history.push('/login');
    return response;
  },
];

export const requestConfig: RequestConfig = {
  baseURL: getApiBaseUrl(),
  requestInterceptors,
  responseInterceptors,
};

const normalizePath = (url: string): string => {
  if (/^https?:\/\//.test(url)) {
    return url;
  }

  let path = url.startsWith('/') ? url : `/${url}`;
  if (path.startsWith('/integration')) {
    return path;
  }
  if (path !== DEFAULT_API_PATH_PREFIX && !path.startsWith(`${DEFAULT_API_PATH_PREFIX}/`)) {
    path = `${DEFAULT_API_PATH_PREFIX}${path}`;
  }

  return path;
};

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'status' in value &&
    'message' in value
  );
};

const unwrapResponse = <T>(response: ApiResponse<T> | T): T => {
  if (isApiResponse<T>(response)) {
    return response.data;
  }

  return response;
};

async function invokeRequest<T>(url: string, options: HttpRequestOptions): Promise<T> {
  const response = (await request(normalizePath(url), {
    ...options,
    headers: attachAuthHeader(options.headers),
  } as Record<string, unknown>)) as ApiResponse<T>;

  return unwrapResponse(response);
}

export const http = {
  get<T>(url: string, params?: RequestParams): Promise<T> {
    return invokeRequest<T>(url, {
      method: 'GET',
      params,
    });
  },

  post<T>(url: string, data?: RequestBody): Promise<T> {
    return invokeRequest<T>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data,
    });
  },

  put<T>(url: string, data?: RequestBody): Promise<T> {
    return invokeRequest<T>(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      data,
    });
  },

  patch<T>(url: string, data?: RequestBody): Promise<T> {
    return invokeRequest<T>(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      data,
    });
  },

  delete<T>(url: string, params?: RequestParams, data?: RequestBody): Promise<T> {
    return invokeRequest<T>(url, {
      method: 'DELETE',
      params,
      ...(data !== undefined
        ? {
            data,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        : {}),
    });
  },
};
