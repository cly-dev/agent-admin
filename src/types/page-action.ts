import type { WorkflowOverrides } from '@/types/workflow';

export type PageActionDelivery = 'inline_stream' | 'sync';

export type PageAction = {
  id: number;
  appClientId: number;
  appClientName?: string;
  actionKey: string;
  name: string;
  description: string | null;
  hostToolId: number;
  hostToolName: string;
  pageScope: string | null;
  systemPrompt: string;
  /** 只读；新记录恒为 inline_stream，历史数据可能为 sync */
  defaultDelivery: PageActionDelivery | string;
  allowCustomInstruction: boolean;
  isActive: boolean;
  sortOrder: number;
  config: Record<string, unknown> | null;
  sourceSkillId: number | null;
  workflowId: number | null;
  workflowVersion: number | null;
  workflowOverrides: WorkflowOverrides | null;
  workflowName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PageActionFillField = 'text' | 'content' | 'value';

export type PageActionInlineHostToolDto = {
  name?: string;
  description?: string;
  fillField?: PageActionFillField;
};

export type CreatePageActionDto = {
  appClientId: number;
  actionKey: string;
  name: string;
  description?: string;
  hostToolId?: number;
  hostTool?: PageActionInlineHostToolDto;
  pageScope?: string | null;
  systemPrompt: string;
  allowCustomInstruction?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  config?: Record<string, unknown>;
  sourceSkillId?: number | null;
  workflowId?: number | null;
  workflowVersion?: number | null;
  workflowOverrides?: WorkflowOverrides | null;
};

export type UpdatePageActionDto = {
  name?: string;
  description?: string | null;
  hostToolId?: number;
  pageScope?: string | null;
  systemPrompt?: string;
  allowCustomInstruction?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  config?: Record<string, unknown> | null;
  workflowId?: number | null;
  workflowVersion?: number | null;
  workflowOverrides?: WorkflowOverrides | null;
};

export type PageActionListQuery = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  pageScope?: string;
  isActive?: boolean;
};
