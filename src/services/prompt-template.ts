import type { PageResult } from '@/types/integration';
import type {
  CreatePromptTemplateVersionDto,
  PromptTemplateControllerFindPageParams,
  PromptTemplateCreatableKey,
  PromptTemplateDetail,
  PromptTemplateVersion,
  UpdatePromptTemplateDto,
} from '@/types/prompt-template';
import { http } from '@/utils/request';

const PROMPT_TEMPLATE_BASE = 'admin/prompt-template';

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

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeNullableId(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }
  const parsed = normalizeNumber(value);
  return parsed === undefined ? undefined : parsed;
}

export function normalizePromptTemplateVersion(
  raw: unknown,
): PromptTemplateVersion | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const id = Number(item.id);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  const key = typeof item.key === 'string' ? item.key : '';
  if (!key) {
    return null;
  }

  const isActiveRaw = item.isActive ?? item.is_active;
  const isActive =
    typeof isActiveRaw === 'boolean'
      ? isActiveRaw
      : isActiveRaw === 1 || isActiveRaw === '1' || isActiveRaw === 'true'
        ? true
        : isActiveRaw === 0 || isActiveRaw === '0' || isActiveRaw === 'false'
          ? false
          : undefined;

  return {
    id,
    key,
    appClientId: normalizeNullableId(item.appClientId ?? item.app_client_id),
    agentId: normalizeNullableId(item.agentId ?? item.agent_id),
    locale: typeof item.locale === 'string' ? item.locale : undefined,
    category: typeof item.category === 'string' ? item.category : undefined,
    title: typeof item.title === 'string' ? item.title : undefined,
    description:
      typeof item.description === 'string' ? item.description : undefined,
    content: typeof item.content === 'string' ? item.content : undefined,
    isActive,
    version: normalizeNumber(item.version),
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
  };
}

function flattenListItems(list: unknown[]): PromptTemplateVersion[] {
  const rows: PromptTemplateVersion[] = [];

  list.forEach((raw) => {
    if (typeof raw !== 'object' || raw === null) {
      return;
    }

    const item = raw as Record<string, unknown>;
    const versionsRaw = item.versions ?? item.history;
    if (Array.isArray(versionsRaw)) {
      versionsRaw.forEach((versionRaw) => {
        const version = normalizePromptTemplateVersion(versionRaw);
        if (version) {
          rows.push(version);
        }
      });
      return;
    }

    const version = normalizePromptTemplateVersion(item);
    if (version) {
      rows.push(version);
    }
  });

  return rows;
}

function normalizePageList(raw: unknown): PromptTemplateVersion[] {
  if (Array.isArray(raw)) {
    return flattenListItems(raw);
  }

  const payload = unwrapPayload(raw);
  const listRaw = payload.list ?? payload.items ?? payload.records;
  if (Array.isArray(listRaw)) {
    return flattenListItems(listRaw);
  }

  return [];
}

function extractPageMeta(
  raw: unknown,
): Pick<
  PageResult<PromptTemplateVersion>,
  'total' | 'page' | 'pageSize' | 'totalPages'
> {
  const source = unwrapPayload(raw);
  const total = Number(source.total ?? source.count ?? 0);
  const page = Number(source.page ?? 1);
  const pageSize = Number(source.pageSize ?? source.page_size ?? 0);
  const totalPagesRaw = source.totalPages ?? source.total_pages;

  return {
    total: Number.isFinite(total) ? total : 0,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 0,
    totalPages:
      typeof totalPagesRaw === 'number' && Number.isFinite(totalPagesRaw)
        ? totalPagesRaw
        : pageSize > 0
          ? Math.max(
              1,
              Math.ceil((Number.isFinite(total) ? total : 0) / pageSize),
            )
          : 1,
  };
}

function normalizeCreatableKey(
  raw: unknown,
): PromptTemplateCreatableKey | null {
  if (typeof raw === 'string') {
    const key = raw.trim();
    return key ? { key } : null;
  }

  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const key =
    typeof item.key === 'string'
      ? item.key
      : typeof item.value === 'string'
        ? item.value
        : '';
  const trimmed = key.trim();
  if (!trimmed) {
    return null;
  }

  return {
    key: trimmed,
    title: typeof item.title === 'string' ? item.title : undefined,
    description:
      typeof item.description === 'string' ? item.description : undefined,
    category: typeof item.category === 'string' ? item.category : undefined,
    locale: typeof item.locale === 'string' ? item.locale : undefined,
  };
}

function normalizeCreatableKeys(raw: unknown): PromptTemplateCreatableKey[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => normalizeCreatableKey(item))
      .filter((item): item is PromptTemplateCreatableKey => item !== null);
  }

  const payload = unwrapPayload(raw);
  const listRaw =
    payload.keys ?? payload.list ?? payload.items ?? payload.records;
  if (Array.isArray(listRaw)) {
    return listRaw
      .map((item) => normalizeCreatableKey(item))
      .filter((item): item is PromptTemplateCreatableKey => item !== null);
  }

  return [];
}

/** 获取可新建版本的系统 key 列表 */
export async function PromptTemplateController_listCreatableKeys(): Promise<
  PromptTemplateCreatableKey[]
> {
  const response = await http.get<unknown>(`${PROMPT_TEMPLATE_BASE}/keys`);
  return normalizeCreatableKeys(response);
}

export async function PromptTemplateController_findPage(
  params?: PromptTemplateControllerFindPageParams,
): Promise<PageResult<PromptTemplateVersion>> {
  const response = await http.get<unknown>(PROMPT_TEMPLATE_BASE, params);
  const list = normalizePageList(response);
  const meta = extractPageMeta(response);

  return {
    list,
    total: meta.total > 0 ? meta.total : list.length,
    page: meta.page,
    pageSize:
      meta.pageSize > 0 ? meta.pageSize : (params?.pageSize ?? list.length),
    totalPages: meta.totalPages,
  };
}

export async function PromptTemplateController_createVersion(
  data: CreatePromptTemplateVersionDto,
): Promise<PromptTemplateVersion> {
  const response = await http.post<unknown>(PROMPT_TEMPLATE_BASE, data);
  const version = normalizePromptTemplateVersion(unwrapPayload(response));
  if (!version) {
    return (
      normalizePromptTemplateVersion(response) ?? {
        id: 0,
        key: data.key,
        content: data.content,
      }
    );
  }
  return version;
}

export function normalizePromptTemplateDetail(
  raw: unknown,
): PromptTemplateDetail | null {
  const item = unwrapPayload(raw);
  const versionsRaw = item.versions ?? item.history ?? item.list;
  const versions = Array.isArray(versionsRaw)
    ? versionsRaw
        .map((versionRaw) => normalizePromptTemplateVersion(versionRaw))
        .filter((version): version is PromptTemplateVersion => version !== null)
    : [];

  const single = normalizePromptTemplateVersion(item);
  if (single && versions.length === 0) {
    versions.push(single);
  }

  const key =
    typeof item.key === 'string'
      ? item.key
      : (versions[0]?.key ?? single?.key ?? '');
  if (!key && versions.length === 0) {
    return null;
  }

  const activeRaw = item.activeVersion ?? item.active_version;
  const activeVersion =
    normalizePromptTemplateVersion(activeRaw) ??
    versions.find((version) => version.isActive) ??
    versions[0];

  return {
    key,
    appClientId:
      normalizeNullableId(item.appClientId ?? item.app_client_id) ??
      versions[0]?.appClientId,
    agentId:
      normalizeNullableId(item.agentId ?? item.agent_id) ??
      versions[0]?.agentId,
    locale: typeof item.locale === 'string' ? item.locale : versions[0]?.locale,
    category:
      typeof item.category === 'string' ? item.category : versions[0]?.category,
    activeVersion,
    versions:
      versions.length > 0 ? versions : activeVersion ? [activeVersion] : [],
  };
}

export async function PromptTemplateController_findOne(
  id: number,
): Promise<PromptTemplateDetail> {
  const response = await http.get<unknown>(`${PROMPT_TEMPLATE_BASE}/${id}`);
  const detail = normalizePromptTemplateDetail(response);
  if (!detail) {
    const version = normalizePromptTemplateVersion(unwrapPayload(response));
    if (!version) {
      throw new Error('Prompt template not found');
    }
    return {
      key: version.key,
      appClientId: version.appClientId,
      agentId: version.agentId,
      locale: version.locale,
      category: version.category,
      activeVersion: version.isActive ? version : undefined,
      versions: [version],
    };
  }
  return detail;
}

export async function PromptTemplateController_publish(
  id: number,
): Promise<PromptTemplateVersion> {
  const response = await http.post<unknown>(
    `${PROMPT_TEMPLATE_BASE}/${id}/publish`,
  );
  const version = normalizePromptTemplateVersion(unwrapPayload(response));
  if (!version) {
    return normalizePromptTemplateVersion(response) ?? { id, key: '' };
  }
  return version;
}

/** 编辑提示词版本（不可改 key / 作用域 / 版本号） */
export async function PromptTemplateController_update(
  id: number,
  data: UpdatePromptTemplateDto,
): Promise<PromptTemplateVersion> {
  const response = await http.patch<unknown>(
    `${PROMPT_TEMPLATE_BASE}/${id}`,
    data,
  );
  const version = normalizePromptTemplateVersion(unwrapPayload(response));
  if (!version) {
    const fallback = normalizePromptTemplateVersion(response);
    if (!fallback) {
      throw new Error('Failed to update prompt template');
    }
    return fallback;
  }
  return version;
}

/** 删除未启用的历史版本 */
export function PromptTemplateController_remove(id: number) {
  return http.delete<void>(`${PROMPT_TEMPLATE_BASE}/${id}`);
}
