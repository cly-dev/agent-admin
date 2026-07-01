export type ValidationIssue = {
  path: string;
  code: string;
  message: string;
};

export type ApiBusinessError = {
  code: string;
  message: string;
  issues?: ValidationIssue[];
  workflowId?: number;
  skillId?: number;
  pageActionId?: number;
};

export class ApiRequestError extends Error {
  readonly businessError?: ApiBusinessError;

  readonly httpStatus?: number;

  constructor(
    message: string,
    options?: { businessError?: ApiBusinessError; httpStatus?: number },
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.businessError = options?.businessError;
    this.httpStatus = options?.httpStatus;
  }
}

function normalizeValidationIssue(raw: unknown): ValidationIssue | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const path = typeof item.path === 'string' ? item.path : '';
  const code = typeof item.code === 'string' ? item.code : '';
  const message = typeof item.message === 'string' ? item.message : '';
  if (!path && !code && !message) {
    return null;
  }
  return { path, code, message };
}

export function parseApiBusinessError(data: unknown): ApiBusinessError | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  const record = data as Record<string, unknown>;
  if (typeof record.code !== 'string' || !/^[A-Z][A-Z0-9_]+$/.test(record.code)) {
    return null;
  }
  if (typeof record.message !== 'string' && !Array.isArray(record.issues)) {
    return null;
  }

  const issues = Array.isArray(record.issues)
    ? record.issues
        .map(normalizeValidationIssue)
        .filter((item): item is ValidationIssue => item !== null)
    : undefined;

  return {
    code: record.code,
    message: typeof record.message === 'string' ? record.message : '',
    issues: issues?.length ? issues : undefined,
    workflowId: typeof record.workflowId === 'number' ? record.workflowId : undefined,
    skillId: typeof record.skillId === 'number' ? record.skillId : undefined,
    pageActionId:
      typeof record.pageActionId === 'number' ? record.pageActionId : undefined,
  };
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

export function formatApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
    const issues = error.businessError?.issues;
    if (issues?.length) {
      return issues
        .map((issue) => issue.message || issue.path)
        .filter(Boolean)
        .join(' · ');
    }
    return error.businessError?.message || error.message || fallback;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export function formatApiErrorIssues(error: unknown): ValidationIssue[] {
  if (error instanceof ApiRequestError) {
    return error.businessError?.issues ?? [];
  }
  return [];
}
