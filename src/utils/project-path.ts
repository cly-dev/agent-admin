export const CURRENT_PROJECT_STORAGE_KEY = 'agent-admin:current-project-id';

export const APP_PAGE_KEYS = [
  'dashboard',
  'project',
  'agent',
  'tool',
  'chat',
  'user',
  'setting',
] as const;

/** 入口路由 `/integration/:projectId` 等旧路径映射到实际页面 */
const ENTRY_PATH_ALIASES: Record<string, string> = {
  integration: '/tool/integration',
};

export type AppPageKey = (typeof APP_PAGE_KEYS)[number];

const ENTRY_PATH_REGEX =
  /^\/(dashboard|project|agent|tool|integration|chat|user|setting)\/(\d+)$/;

export function isAppPageKey(value: string): value is AppPageKey {
  return (APP_PAGE_KEYS as readonly string[]).includes(value);
}

/** 从入口路由 `/dashboard/:projectId` 解析 projectId，路由参数优先级最高 */
export function getRouteProjectIdFromPath(pathname: string): number | null {
  const match = pathname.match(ENTRY_PATH_REGEX);
  if (!match) {
    return null;
  }

  const projectId = Number(match[2]);
  return Number.isFinite(projectId) && projectId > 0 ? projectId : null;
}

/** 入口路由对应的「干净」页面路径，如 `/dashboard/123` → `/dashboard` */
export function getCleanPathFromEntry(pathname: string): string | null {
  const match = pathname.match(ENTRY_PATH_REGEX);
  if (!match) {
    return null;
  }

  const pageKey = match[1];
  if (pageKey === 'chat') {
    return '/chat/list';
  }
  return ENTRY_PATH_ALIASES[pageKey] ?? `/${pageKey}`;
}

export function getPageKeyFromPath(pathname: string): AppPageKey {
  if (pathname.startsWith('/chat/detail/')) {
    return 'chat';
  }

  if (
    pathname.startsWith('/tool/integration') ||
    pathname.startsWith('/integration')
  ) {
    return 'tool';
  }

  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  if (first && isAppPageKey(first)) {
    return first;
  }

  return 'dashboard';
}

/** 当前页面路径（不含入口 projectId 后缀） */
export function getCurrentPagePath(pathname: string): string {
  const cleanEntryPath = getCleanPathFromEntry(pathname);
  if (cleanEntryPath) {
    return cleanEntryPath;
  }

  if (pathname.startsWith('/chat/detail/')) {
    return pathname;
  }

  const pageKey = getPageKeyFromPath(pathname);
  if (pathname.startsWith(`/${pageKey}/`)) {
    return pathname;
  }
  return `/${pageKey}`;
}

export function buildPagePath(pageKey: string, subPath?: string): string {
  if (!subPath) {
    return `/${pageKey}`;
  }

  if (subPath.startsWith('/')) {
    return subPath;
  }

  return `/${pageKey}/${subPath}`;
}

/** 带来 projectId 的入口链接，仅用于分享/外部跳转 */
export function buildEntryPath(
  pageKey: string,
  projectId: string | number,
): string {
  return `/${pageKey}/${projectId}`;
}

export function isAuthPage(pathname: string): boolean {
  return pathname === '/login';
}

export function isAppPage(pathname: string): boolean {
  if (isAuthPage(pathname)) {
    return false;
  }

  if (pathname.startsWith('/chat/detail/')) {
    return true;
  }

  const pageKey = getPageKeyFromPath(pathname);
  return (
    pathname === `/${pageKey}` ||
    pathname.startsWith(`/${pageKey}/`) ||
    getRouteProjectIdFromPath(pathname) !== null
  );
}
