import type { PageResult } from '@/types/integration';

export interface PromptTemplateVersion {
  id: number;
  key: string;
  appClientId?: number | null;
  agentId?: number | null;
  locale?: string;
  category?: string;
  title?: string;
  description?: string;
  content?: string;
  isActive?: boolean;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PromptTemplateDetail {
  key: string;
  appClientId?: number | null;
  agentId?: number | null;
  locale?: string;
  category?: string;
  activeVersion?: PromptTemplateVersion;
  versions: PromptTemplateVersion[];
}

export interface UpdatePromptTemplateDto {
  category?: string;
  title?: string;
  description?: string;
  content?: string;
}

export interface CreatePromptTemplateVersionDto {
  key: string;
  appClientId?: number;
  agentId?: number;
  locale?: string;
  category?: string;
  title?: string;
  description?: string;
  content: string;
  publish?: boolean;
}

export interface PromptTemplateControllerFindPageParams {
  page?: number;
  pageSize?: number;
  key?: string;
  appClientId?: number;
  agentId?: number;
  locale?: string;
  isActive?: boolean;
}

export type PromptTemplatePageResult = PageResult<PromptTemplateVersion>;

/** 系统预置、可新建版本的 prompt key */
export interface PromptTemplateCreatableKey {
  key: string;
  title?: string;
  description?: string;
  category?: string;
  locale?: string;
}
