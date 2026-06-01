import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import {
  IntegrationController_create,
  IntegrationController_findByAppClient,
  IntegrationController_remove,
  IntegrationController_update,
} from '@/services/integration';
import type {
  CreateIntegrationDto,
  Integration,
  IntegrationAuthMode,
  IntegrationToolRef,
  UpdateIntegrationDto,
} from '@/types/integration';
import { useIntl } from '@umijs/max';
import { message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';

/* ---------- constants ---------- */

export const SEARCH_DEBOUNCE_MS = 300;
export const AVATAR_VARIANT_COUNT = 6;
export const DEFAULT_AUTH_MODE: IntegrationAuthMode = 'USER_PREFERRED';

export const AUTH_MODE_VALUES: IntegrationAuthMode[] = [
  'USER_PREFERRED',
  'SYSTEM_ONLY',
  'USER_ONLY',
];

/* ---------- types ---------- */

export type IntegrationFormValues = CreateIntegrationDto & { apiKey?: string };

export type UseIntegrationsResult = {
  projectId: number;
  integrations: Integration[];
  loading: boolean;
  keyword: string;
  page: number;
  pageSize: number;
  total: number;
  isSearchActive: boolean;
  summaryText: string | null;
  showEmpty: boolean;
  showPagination: boolean;
  modalOpen: boolean;
  editing: Integration | null;
  setKeyword: (value: string) => void;
  onPageChange: (page: number, pageSize: number) => void;
  openCreate: () => void;
  openConfigure: (integration: Integration) => void;
  handleDelete: (id: number) => Promise<void>;
  submitting: boolean;
  handleSubmit: (values: IntegrationFormValues) => Promise<boolean>;
  onModalOpenChange: (open: boolean) => void;
};

/* ---------- api normalize (shared with service layer) ---------- */

function normalizeAuthMode(value: unknown): IntegrationAuthMode {
  const normalized = String(value ?? DEFAULT_AUTH_MODE).toUpperCase();
  if (
    normalized === 'USER_ONLY' ||
    normalized === 'SYSTEM_ONLY' ||
    normalized === 'USER_PREFERRED'
  ) {
    return normalized;
  }

  return DEFAULT_AUTH_MODE;
}

function normalizeToolRef(raw: unknown): IntegrationToolRef {
  const item = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;

  return {
    id: Number(item.id),
    name: String(item.name ?? ''),
    path: String(item.path ?? ''),
    method: String(item.method ?? 'GET'),
    isActive: Boolean(item.isActive ?? item.is_active ?? true),
  };
}

export function normalizeIntegration(raw: unknown): Integration {
  const item = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const toolsRaw = item.tools;
  const normalizedToolCount =
    typeof item.toolCount === 'number'
      ? item.toolCount
      : typeof item.tool_count === 'number'
        ? item.tool_count
        : Array.isArray(toolsRaw)
          ? toolsRaw.length
          : 0;

  return {
    id: Number(item.id),
    appClientId: Number(item.appClientId ?? item.app_client_id),
    name: String(item.name ?? ''),
    baseUrl: String(item.baseUrl ?? item.base_url ?? ''),
    authMode: normalizeAuthMode(item.authMode ?? item.auth_mode),
    systemConfigured: Boolean(item.systemConfigured ?? item.system_configured),
    description:
      typeof item.description === 'string' || item.description === null
        ? (item.description as string | null)
        : undefined,
    toolCount: normalizedToolCount,
    apiKey: typeof item.apiKey === 'string' ? item.apiKey : undefined,
    tools: Array.isArray(toolsRaw) ? toolsRaw.map(normalizeToolRef) : undefined,
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

/* ---------- display helpers (used by card components) ---------- */

export function getIntegrationInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function needsIntegrationReauth(integration: Integration): boolean {
  return integration.authMode === 'SYSTEM_ONLY' && !integration.systemConfigured;
}

export function isIntegrationDeleteDisabled(integration: Integration): boolean {
  return (integration.toolCount ?? 0) > 0;
}

export function getAvatarVariant(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_VARIANT_COUNT;
}

export function formatIntegrationHost(baseUrl: string): string {
  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl;
  }
}

export function buildCreateIntegrationPayload(
  projectId: number,
  values: IntegrationFormValues,
): CreateIntegrationDto {
  const payload: CreateIntegrationDto = {
    appClientId: projectId,
    name: values.name.trim(),
    baseUrl: values.baseUrl.trim(),
    authMode: values.authMode ?? DEFAULT_AUTH_MODE,
    description: values.description?.trim() || null,
  };

  const apiKey = values.apiKey?.trim();
  if (apiKey) {
    payload.apiKey = apiKey;
  }

  return payload;
}

export function buildUpdateIntegrationPayload(values: IntegrationFormValues): UpdateIntegrationDto {
  const payload: UpdateIntegrationDto = {
    name: values.name.trim(),
    baseUrl: values.baseUrl.trim(),
    authMode: values.authMode,
    description: values.description?.trim() || null,
  };

  const apiKey = values.apiKey?.trim();
  if (apiKey) {
    payload.apiKey = apiKey;
  }

  return payload;
}

/* ---------- hook ---------- */

export function useIntegrations(): UseIntegrationsResult {
  const intl = useIntl();
  const { projectId } = useProjectRoute();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Integration | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword, projectId]);

  const loadIntegrations = useCallback(async () => {
    if (!projectId) {
      setIntegrations([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const result = await IntegrationController_findByAppClient(projectId, {
        page,
        pageSize,
        keyword: debouncedKeyword || undefined,
        orderBy: 'updatedAt',
        order: 'desc',
      });

      setIntegrations(result.list);
      setTotal(result.total);

      const maxPage = Math.max(1, Math.ceil(result.total / pageSize) || 1);
      if (page > maxPage) {
        setPage(maxPage);
      }
    } catch (error: unknown) {
      setIntegrations([]);
      setTotal(0);
      message.error(
        error instanceof Error ? error.message : intl.formatMessage({ id: 'integration.loadFailed' }),
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, intl, page, pageSize, projectId]);

  useEffect(() => {
    void loadIntegrations();
  }, [loadIntegrations]);

  const onPageChange = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage);
    setPageSize(nextPageSize);
  };

  const isSearchActive = debouncedKeyword.length > 0;
  const showEmpty = Boolean(projectId) && !loading && total === 0;
  const showPagination = Boolean(projectId) && total > 0;

  const summaryText = useMemo(() => {
    if (!projectId) {
      return null;
    }

    if (loading) {
      return intl.formatMessage({ id: 'common.loading' });
    }

    if (total === 0) {
      return isSearchActive
        ? intl.formatMessage({ id: 'integration.summary.searchNone' })
        : intl.formatMessage({ id: 'integration.summary.none' });
    }

    return isSearchActive
      ? intl.formatMessage({ id: 'integration.summary.searchFound' }, { total })
      : intl.formatMessage({ id: 'integration.summary.total' }, { total });
  }, [intl, isSearchActive, loading, projectId, total]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openConfigure = (integration: Integration) => {
    setEditing(integration);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await IntegrationController_remove(id);
      message.success(intl.formatMessage({ id: 'integration.deleted' }));
      if (integrations.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await loadIntegrations();
      }
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : intl.formatMessage({ id: 'integration.deleteFailed' }),
      );
    }
  };

  const handleSubmit = async (values: IntegrationFormValues) => {
    if (!projectId) {
      message.warning(intl.formatMessage({ id: 'integration.selectProject' }));
      return false;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await IntegrationController_update(editing.id, buildUpdateIntegrationPayload(values));
        message.success(intl.formatMessage({ id: 'integration.updated' }));
      } else {
        await IntegrationController_create(buildCreateIntegrationPayload(projectId, values));
        message.success(intl.formatMessage({ id: 'integration.created' }));
      }

      setModalOpen(false);
      setEditing(null);
      await loadIntegrations();
      return true;
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : intl.formatMessage({ id: 'integration.actionFailed' }),
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const onModalOpenChange = (open: boolean): void => {
    setModalOpen(open);
    if (!open) {
      setEditing(null);
    }
  };

  return {
    projectId,
    integrations,
    loading,
    keyword,
    page,
    pageSize,
    total,
    isSearchActive,
    summaryText,
    showEmpty,
    showPagination,
    modalOpen,
    editing,
    submitting,
    setKeyword,
    onPageChange,
    openCreate,
    openConfigure,
    handleDelete,
    handleSubmit,
    onModalOpenChange,
  };
}
