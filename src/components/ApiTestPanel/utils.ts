import type {
  ApiDebugToolRequest,
  ApiInitSchemasFromDebugRequest,
  ApiTestParamIn,
  ApiTestParamRow,
  ApiTestParamsByIn,
  ApiTestParamType,
  ApiTestRunResult,
} from './types';

export const API_TEST_SECTIONS: ApiTestParamIn[] = ['path', 'query', 'header', 'body'];

const PARAMETER_IN_SECTIONS: ApiTestParamIn[] = ['path', 'query', 'body'];

export function createEmptyApiTestParams(): ApiTestParamsByIn {
  return { path: [], query: [], header: [], body: [] };
}

export function createEmptyApiTestRow(paramIn: ApiTestParamIn): ApiTestParamRow {
  return {
    id: `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: '',
    in: paramIn,
    value: '',
    enabled: true,
    paramType: paramIn === 'body' ? 'object' : 'string',
  };
}

function sampleValueForType(type: ApiTestParamType, required: boolean): unknown {
  switch (type) {
    case 'integer':
    case 'number':
      return 1;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return required ? 'example' : '';
  }
}

function coerceApiTestParamValue(row: ApiTestParamRow): unknown {
  const trimmed = row.value.trim();
  if (!trimmed) {
    return row.paramType === 'string' ? '' : sampleValueForType(row.paramType, false);
  }

  if (row.in === 'body' && (row.paramType === 'object' || row.paramType === 'array')) {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return trimmed;
    }
  }

  switch (row.paramType) {
    case 'integer': {
      const parsed = Number.parseInt(trimmed, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    case 'number': {
      const parsed = Number.parseFloat(trimmed);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    case 'boolean':
      return trimmed === 'true' || trimmed === '1';
    case 'array':
    case 'object':
      try {
        return JSON.parse(trimmed) as unknown;
      } catch {
        return trimmed;
      }
    default:
      return trimmed;
  }
}

function mergeSectionToObject(
  state: ApiTestParamsByIn,
  sections: ApiTestParamIn[],
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const section of sections) {
    for (const row of state[section]) {
      if (!row.enabled || !row.name.trim()) {
        continue;
      }
      payload[row.name.trim()] = coerceApiTestParamValue(row);
    }
  }

  return payload;
}

/**
 * 组装调试请求：path/query/body → parameters，header → headers，另附 apiKey
 */
export function buildDebugToolRequest(
  state: ApiTestParamsByIn,
  options?: { apiKey?: string; timeoutMs?: number },
): ApiDebugToolRequest {
  const parameters = mergeSectionToObject(state, PARAMETER_IN_SECTIONS);
  const headers = mergeSectionToObject(state, ['header']);
  const request: ApiDebugToolRequest = {};

  if (Object.keys(parameters).length > 0) {
    request.parameters = parameters;
  }
  if (Object.keys(headers).length > 0) {
    request.headers = headers;
  }

  const apiKey = options?.apiKey?.trim();
  if (apiKey) {
    request.apiKey = apiKey;
  }
  if (options?.timeoutMs !== undefined) {
    request.timeoutMs = options.timeoutMs;
  }

  return request;
}

/** 组装 init-schemas 请求：在 debug 请求体基础上附加 hint / persist */
export function buildInitSchemasFromDebugRequest(
  state: ApiTestParamsByIn,
  options?: { apiKey?: string; timeoutMs?: number; hint?: string; persist?: boolean },
): ApiInitSchemasFromDebugRequest {
  const request = buildDebugToolRequest(state, options);
  const hint = options?.hint?.trim();

  return {
    ...request,
    persist: options?.persist ?? false,
    hint: hint || undefined,
  };
}

/** @deprecated 使用 buildDebugToolRequest */
export function mergeApiTestParamsToPayload(state: ApiTestParamsByIn): Record<string, unknown> {
  return buildDebugToolRequest(state).parameters ?? {};
}

/** 校验 Body JSON 行，返回非法 JSON 的参数名 */
export function findInvalidApiTestBodyParam(state: ApiTestParamsByIn): string | null {
  for (const section of API_TEST_SECTIONS) {
    for (const row of state[section]) {
      if (!row.enabled || row.in !== 'body') {
        continue;
      }
      if (row.paramType !== 'object' && row.paramType !== 'array') {
        continue;
      }
      const trimmed = row.value.trim();
      if (!trimmed) {
        continue;
      }
      try {
        JSON.parse(trimmed);
      } catch {
        return row.name || 'body';
      }
    }
  }
  return null;
}

export function formatApiTestPayload(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export type ApiTestResultView = {
  ok?: boolean;
  statusCode?: number;
  durationMs?: number;
  error?: string;
  request?: unknown;
  response?: unknown;
};

export function normalizeJsonTreeValue(value: unknown): object {
  if (value === undefined) {
    return { undefined: true };
  }
  if (value === null) {
    return { null: null };
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return { '': '' };
    }
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as object;
      }
      return { value: parsed };
    } catch {
      return { raw: value };
    }
  }
  if (typeof value === 'object') {
    return value as object;
  }
  return { value };
}

export function buildApiTestResultView(result: ApiTestRunResult | null | undefined): ApiTestResultView {
  if (!result) {
    return {};
  }

  return {
    ok: result.ok,
    statusCode: result.statusCode,
    durationMs: result.durationMs,
    error: result.error,
    request: result.request,
    response: result.response,
  };
}
