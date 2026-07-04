import { getCurrentPagePath, getPageKeyFromPath } from '@/utils/project-path';
import type { AgentChatPageContext } from 'omnix-chat/react';

export const OMNIX_CHAT_ACCOUNT_TOKEN_PREFIX =
  'agent-admin:omnix-chat-account-token';
export const OMNIX_CHAT_AUTO_OPEN_PREFIX = 'agent-admin:omnix-chat-auto-open';
export const OMNIX_CHAT_UPDATED_EVENT = 'omnix-chat:updated';

const DEFAULT_OMNIX_CHAT_BASE_URL = 'http://localhost:3030';
const DEV_PROXY_PREFIX = '/api';

const usesLocalApiProxy = (): boolean => {
  return (
    process.env.NODE_ENV === 'development' && process.env.UMI_ENV === 'dev'
  );
};

/** Fixed app-client DSN for the embedded chat widget. */
export function getOmnixChatDsn(): string | undefined {
  const dsn = process.env.UMI_APP_OMNIX_CHAT_DSN?.trim();
  return dsn || undefined;
}

/** Backend root for omnix-chat (`/app-client/auth`, `/chat`, …). */
export function getOmnixChatBaseUrl(): string {
  const rawBaseUrl = (
    process.env.UMI_APP_OMNIX_CHAT_BASE_URL ??
    process.env.UMI_APP_API_BASE_URL ??
    DEFAULT_OMNIX_CHAT_BASE_URL
  ).replace(/\/+$/, '');

  if (usesLocalApiProxy() && rawBaseUrl.startsWith('/')) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${rawBaseUrl}`;
    }
    return rawBaseUrl;
  }

  if (
    usesLocalApiProxy() &&
    !process.env.UMI_APP_OMNIX_CHAT_BASE_URL &&
    !process.env.UMI_APP_API_BASE_URL
  ) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${DEV_PROXY_PREFIX}`;
    }
    return DEV_PROXY_PREFIX;
  }

  return rawBaseUrl;
}

function storageKey(prefix: string, projectId: number): string {
  return `${prefix}:${projectId}`;
}

export function notifyOmnixChatUpdated(projectId: number): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(
    new CustomEvent(OMNIX_CHAT_UPDATED_EVENT, {
      detail: { projectId },
    }),
  );
}

export function getOmnixChatAccountToken(
  projectId: number,
): string | undefined {
  if (!projectId) {
    return undefined;
  }
  try {
    const raw = sessionStorage.getItem(
      storageKey(OMNIX_CHAT_ACCOUNT_TOKEN_PREFIX, projectId),
    );
    const trimmed = raw?.trim();
    return trimmed || undefined;
  } catch {
    return undefined;
  }
}

export function setOmnixChatAccountToken(
  projectId: number,
  token: string,
): void {
  if (!projectId) {
    return;
  }
  const trimmed = token.trim();
  if (!trimmed) {
    sessionStorage.removeItem(
      storageKey(OMNIX_CHAT_ACCOUNT_TOKEN_PREFIX, projectId),
    );
  } else {
    sessionStorage.setItem(
      storageKey(OMNIX_CHAT_ACCOUNT_TOKEN_PREFIX, projectId),
      trimmed,
    );
  }
  notifyOmnixChatUpdated(projectId);
}

export function consumeOmnixChatAutoOpen(projectId: number): boolean {
  if (!projectId) {
    return false;
  }
  try {
    const key = storageKey(OMNIX_CHAT_AUTO_OPEN_PREFIX, projectId);
    const shouldOpen = sessionStorage.getItem(key) === '1';
    if (shouldOpen) {
      sessionStorage.removeItem(key);
    }
    return shouldOpen;
  } catch {
    return false;
  }
}

export function requestOmnixChatAutoOpen(
  projectId: number,
  accountToken?: string,
): void {
  if (!projectId) {
    return;
  }
  if (accountToken?.trim()) {
    setOmnixChatAccountToken(projectId, accountToken);
  }
  sessionStorage.setItem(
    storageKey(OMNIX_CHAT_AUTO_OPEN_PREFIX, projectId),
    '1',
  );
  notifyOmnixChatUpdated(projectId);
}

export function buildOmnixChatPageContext(
  pathname: string,
): AgentChatPageContext {
  const routePath = getCurrentPagePath(pathname);
  const pageKey = getPageKeyFromPath(pathname);
  const segments = routePath.split('/').filter(Boolean);
  const page = segments.length > 0 ? segments.join('/') : 'dashboard';

  const detailMatch = pathname.match(/\/detail\/([^/]+)/);
  const entityId = detailMatch?.[1];

  return {
    page: `admin:${page}`,
    routePath,
    metadata: {
      pageKey,
      adminConsole: true,
    },
    entity:
      entityId && !entityId.includes('create')
        ? { type: pageKey, id: entityId }
        : undefined,
  };
}
