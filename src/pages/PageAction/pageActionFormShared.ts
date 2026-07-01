import type { HostTool } from '@/types/host-tool';
import type {
  PageActionFillField,
  PageActionInlineHostToolDto,
} from '@/types/page-action';
import {
  DEFAULT_PAGE_ACTION_SYSTEM_PROMPT,
} from './pageActionShared';

export const PAGE_ACTION_LIST_PATH = '/workflow/frontend-tool-flow';
export const PAGE_ACTION_CREATE_PATH = '/workflow/frontend-tool-flow/create';

export function buildPageActionEditPath(id: number): string {
  return `/workflow/frontend-tool-flow/detail/${id}`;
}

export type PageActionFormValues = {
  actionKey: string;
  name: string;
  description?: string;
  pageScope?: string;
  systemPrompt: string;
  allowCustomInstruction: boolean;
  isActive: boolean;
  sortOrder: number;
  hostToolId?: number;
  hostToolName?: string;
  hostToolDescription?: string;
  hostToolFillField?: PageActionFillField;
};

export type PageActionWorkflowPushState = {
  hasPushNode: boolean;
  pushHostToolId: number | null;
};

export function validatePageActionWorkflowBinding(
  workflowId: number | null | undefined,
  pushState: PageActionWorkflowPushState,
  hostToolId: number | undefined,
  messages: {
    missingPushNode: string;
    hostToolRequired: string;
    hostToolMismatch: string;
  },
): string | null {
  if (!workflowId) {
    return null;
  }
  if (!pushState.hasPushNode) {
    return messages.missingPushNode;
  }
  if (!hostToolId) {
    return messages.hostToolRequired;
  }
  if (pushState.pushHostToolId && hostToolId !== pushState.pushHostToolId) {
    return messages.hostToolMismatch;
  }
  return null;
}

export function getDefaultPageActionFormValues(): Partial<PageActionFormValues> {
  return {
    allowCustomInstruction: true,
    isActive: true,
    sortOrder: 0,
    systemPrompt: DEFAULT_PAGE_ACTION_SYSTEM_PROMPT,
  };
}

export function buildInlineHostTool(
  values: PageActionFormValues,
): PageActionInlineHostToolDto | undefined {
  const name = values.hostToolName?.trim();
  const description = values.hostToolDescription?.trim();
  const fillField = values.hostToolFillField;
  if (!name && !description && !fillField) {
    return undefined;
  }
  return {
    ...(name ? { name } : {}),
    ...(description ? { description } : {}),
    ...(fillField && fillField !== 'text' ? { fillField } : {}),
  };
}

function normalizeActionKeySegment(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, '-');
}

export function buildActionKeyFromHostTool(tool: HostTool): string | undefined {
  const scope = tool.pageScope?.trim();
  const purpose = normalizeActionKeySegment(tool.name || tool.definitionKey || '');
  if (!scope || !purpose) {
    return undefined;
  }
  return `${scope}.${purpose}`;
}

export type ApplyHostToolBindingOptions = {
  /** 为 true 时仅填充当前为空的字段，避免覆盖用户已编辑内容 */
  preserveUserInput?: boolean;
};

function isEmptyFormValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  return false;
}

export function buildPageActionFormPatchFromHostTool(
  tool: HostTool,
  current: Partial<PageActionFormValues>,
  options: ApplyHostToolBindingOptions = {},
): Partial<PageActionFormValues> {
  const { preserveUserInput = false } = options;
  const patch: Partial<PageActionFormValues> = {
    hostToolName: undefined,
    hostToolDescription: undefined,
    hostToolFillField: undefined,
  };

  const assign = <K extends keyof PageActionFormValues>(
    key: K,
    value: PageActionFormValues[K] | undefined,
  ) => {
    if (value === undefined || value === '') {
      return;
    }
    if (preserveUserInput && !isEmptyFormValue(current[key])) {
      return;
    }
    patch[key] = value;
  };

  assign('pageScope', tool.pageScope?.trim() || undefined);
  assign('actionKey', buildActionKeyFromHostTool(tool));
  assign('name', tool.name?.trim() || undefined);
  assign('description', tool.description?.trim() || undefined);

  if (tool.sortOrder !== undefined) {
    assign('sortOrder', tool.sortOrder);
  }
  if (tool.isActive !== undefined) {
    assign('isActive', tool.isActive);
  }

  return patch;
}
