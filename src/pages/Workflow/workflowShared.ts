import type {
  WorkflowActionKind,
  WorkflowDeliverable,
  WorkflowHostToolBindingDto,
  WorkflowNodeDef,
  WorkflowProfile,
  WorkflowToolBindingDto,
} from '@/types/workflow';

export type WorkflowToolRow = {
  toolId: number;
  isRequired: boolean;
  name?: string;
};

export type WorkflowHostToolRow = {
  hostToolId: number;
  isRequired: boolean;
  name?: string;
};

export type WorkflowNodeValidationIssue = {
  nodeId: string;
  code:
    | 'name_required'
    | 'objective_required'
    | 'tool_id_required'
    | 'host_tool_id_required'
    | 'missing_tool_ids'
    | 'missing_host_tool_ids';
};

export const WORKFLOW_PROFILE_OPTIONS: WorkflowProfile[] = [
  'chat_skill',
  'page_action',
  'shared',
];

export const WORKFLOW_DELIVERABLE_OPTIONS: WorkflowDeliverable[] = [
  'answer',
  'analysis',
  'list',
  'detail',
  'mutation',
];

export const PAGE_ACTION_ACTIONS: WorkflowActionKind[] = [
  'load_page_context',
  'detect_clues',
  'fetch_data',
  'summarize_images',
  'generate_and_push',
  'summarize',
];

export const CHAT_SKILL_ACTIONS: WorkflowActionKind[] = [
  ...PAGE_ACTION_ACTIONS,
  'compose_mutation',
  'present_mutation',
  'write_data',
  'await_user_confirm',
];

export function actionsForProfile(
  profile: WorkflowProfile | string,
): WorkflowActionKind[] {
  if (profile === 'page_action') {
    return PAGE_ACTION_ACTIONS;
  }
  return CHAT_SKILL_ACTIONS;
}

export function compatibleProfilesForEntry(
  entry: 'skill' | 'page_action',
): WorkflowProfile[] {
  return entry === 'skill'
    ? ['chat_skill', 'shared']
    : ['page_action', 'shared'];
}

const ACTION_CREATE_LABEL: Partial<Record<WorkflowActionKind, string>> = {
  summarize_images: '图片识别',
  detect_clues: '状态识别',
  load_page_context: '加载页上下文',
  fetch_data: '获取数据',
  generate_and_push: '生成并推送',
  summarize: '说明总结',
};

function defaultLabelForAction(action: WorkflowActionKind): string {
  return ACTION_CREATE_LABEL[action] ?? action.replace(/_/g, ' ');
}

export function defaultInputForAction(
  action: WorkflowActionKind,
): Record<string, unknown> {
  switch (action) {
    case 'load_page_context':
      return { materialize: true };
    case 'detect_clues':
      return {};
    case 'fetch_data':
      return { completeWhen: 'first_success' };
    case 'summarize_images':
      return {
        from: 'upstream',
        maxCells: 4,
        cellPx: 512,
        onFailure: 'degrade',
        cacheTtlSec: 86400,
      };
    case 'generate_and_push':
      return { stream: true };
    case 'summarize':
      return { mode: 'final' };
    case 'compose_mutation':
    case 'write_data':
      return {};
    case 'present_mutation':
      return { mode: 'brief' };
    case 'await_user_confirm':
      return { confirmKind: 'mutation' };
    default:
      return {};
  }
}

export function createEmptyWorkflowNode(
  action: WorkflowActionKind = 'summarize',
): WorkflowNodeDef {
  const label = defaultLabelForAction(action);
  return {
    id: `step_${Date.now()}`,
    action,
    name: label,
    objective: label,
    input: defaultInputForAction(action),
  };
}

export function normalizeWorkflowNode(raw: unknown): WorkflowNodeDef | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const id = typeof item.id === 'string' ? item.id.trim() : '';
  const action = item.action;
  const name = typeof item.name === 'string' ? item.name : '';
  const objective = typeof item.objective === 'string' ? item.objective : '';
  if (!id || typeof action !== 'string') {
    return null;
  }
  const inputRaw = item.input;
  const input =
    typeof inputRaw === 'object' &&
    inputRaw !== null &&
    !Array.isArray(inputRaw)
      ? (inputRaw as Record<string, unknown>)
      : {};
  return {
    id,
    action: action as WorkflowActionKind,
    name,
    objective,
    input,
  };
}

export function stringifyWorkflowOverrides(
  value: Record<string, { objective?: string }> | null | undefined,
): string {
  if (!value || Object.keys(value).length === 0) {
    return '';
  }
  return JSON.stringify(value, null, 2);
}

const TOOL_ACTIONS: WorkflowActionKind[] = [
  'fetch_data',
  'compose_mutation',
  'write_data',
];

function coercePositiveIntIds(value: unknown): number[] {
  if (Array.isArray(value)) {
    const ids: number[] = [];
    const seen = new Set<number>();
    for (const item of value) {
      const id = typeof item === 'number' ? item : Number(item);
      if (!Number.isFinite(id) || id <= 0 || seen.has(id)) {
        continue;
      }
      seen.add(id);
      ids.push(id);
    }
    return ids;
  }
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return [value];
  }
  return [];
}

/** fetch_data：优先 toolIds，遗留 toolId 视为单元素 */
export function resolveNodeToolIds(
  input: Record<string, unknown> | null | undefined,
): number[] {
  const fromArray = coercePositiveIntIds(input?.toolIds);
  if (fromArray.length > 0) {
    return fromArray;
  }
  return coercePositiveIntIds(input?.toolId);
}

/** generate_and_push：优先 hostToolIds，遗留 hostToolId 视为单元素 */
export function resolveNodeHostToolIds(
  input: Record<string, unknown> | null | undefined,
): number[] {
  const fromArray = coercePositiveIntIds(input?.hostToolIds);
  if (fromArray.length > 0) {
    return fromArray;
  }
  return coercePositiveIntIds(input?.hostToolId);
}

export function extractToolIdsFromNodes(nodes: WorkflowNodeDef[]): number[] {
  const ids = new Set<number>();
  for (const node of nodes) {
    if (!TOOL_ACTIONS.includes(node.action)) {
      continue;
    }
    if (node.action === 'fetch_data') {
      for (const id of resolveNodeToolIds(node.input)) {
        ids.add(id);
      }
      continue;
    }
    const toolId = node.input?.toolId;
    if (typeof toolId === 'number' && toolId > 0) {
      ids.add(toolId);
    }
  }
  return [...ids];
}

export function extractHostToolIdsFromNodes(
  nodes: WorkflowNodeDef[],
): number[] {
  const ids = new Set<number>();
  for (const node of nodes) {
    if (node.action !== 'generate_and_push') {
      continue;
    }
    for (const id of resolveNodeHostToolIds(node.input)) {
      ids.add(id);
    }
  }
  return [...ids];
}

export function findPushNodeHostToolId(
  nodes: WorkflowNodeDef[],
): number | null {
  const pushNode = nodes.find((node) => node.action === 'generate_and_push');
  const ids = resolveNodeHostToolIds(pushNode?.input);
  return ids[0] ?? null;
}

export function hasGenerateAndPushNode(nodes: WorkflowNodeDef[]): boolean {
  return nodes.some((node) => node.action === 'generate_and_push');
}

/** Workflow contains at least one `await_user_confirm` node (approval gate). */
export function hasAwaitUserConfirmNode(nodes: WorkflowNodeDef[]): boolean {
  return nodes.some((node) => node.action === 'await_user_confirm');
}

export function hasLoadPageContextNode(nodes: WorkflowNodeDef[]): boolean {
  return nodes.some((node) => node.action === 'load_page_context');
}

export function isPageContextMutationWorkflow(
  nodes: WorkflowNodeDef[],
): boolean {
  return hasLoadPageContextNode(nodes) && hasAwaitUserConfirmNode(nodes);
}

export function countAwaitUserConfirmNodes(nodes: WorkflowNodeDef[]): number {
  return nodes.filter((node) => node.action === 'await_user_confirm').length;
}

/** Tool ids referenced by `write_data` nodes only. */
export function extractWriteToolIdsFromNodes(
  nodes: WorkflowNodeDef[],
): number[] {
  const ids = new Set<number>();
  for (const node of nodes) {
    if (node.action !== 'write_data') continue;
    const toolId = node.input?.toolId;
    if (typeof toolId === 'number' && toolId > 0) {
      ids.add(toolId);
    }
  }
  return [...ids];
}

export function syncBindingRowsFromNodes(
  nodes: WorkflowNodeDef[],
  existingToolRows: WorkflowToolRow[],
  existingHostToolRows: WorkflowHostToolRow[],
): { toolRows: WorkflowToolRow[]; hostToolRows: WorkflowHostToolRow[] } {
  return {
    toolRows: extractToolIdsFromNodes(nodes).map((toolId) => ({
      toolId,
      isRequired:
        existingToolRows.find((row) => row.toolId === toolId)?.isRequired ??
        true,
      name: existingToolRows.find((row) => row.toolId === toolId)?.name,
    })),
    hostToolRows: extractHostToolIdsFromNodes(nodes).map((hostToolId) => ({
      hostToolId,
      isRequired:
        existingHostToolRows.find((row) => row.hostToolId === hostToolId)
          ?.isRequired ?? true,
      name: existingHostToolRows.find((row) => row.hostToolId === hostToolId)
        ?.name,
    })),
  };
}

export function buildOptionalBindingsPayload(
  toolRows: WorkflowToolRow[],
  hostToolRows: WorkflowHostToolRow[],
  nodes: WorkflowNodeDef[],
): {
  tools?: WorkflowToolBindingDto[];
  hostTools?: WorkflowHostToolBindingDto[];
} {
  const nodeToolIds = new Set(extractToolIdsFromNodes(nodes));
  const nodeHostToolIds = new Set(extractHostToolIdsFromNodes(nodes));
  const relevantTools = toolRows.filter((row) => nodeToolIds.has(row.toolId));
  const relevantHostTools = hostToolRows.filter((row) =>
    nodeHostToolIds.has(row.hostToolId),
  );
  const hasToolOverride = relevantTools.some((row) => !row.isRequired);
  const hasHostToolOverride = relevantHostTools.some((row) => !row.isRequired);

  return {
    tools: hasToolOverride
      ? relevantTools.map((row) => ({
          toolId: row.toolId,
          isRequired: row.isRequired,
        }))
      : undefined,
    hostTools: hasHostToolOverride
      ? relevantHostTools.map((row) => ({
          hostToolId: row.hostToolId,
          isRequired: row.isRequired,
        }))
      : undefined,
  };
}

export function validateWorkflowNodes(
  nodes: WorkflowNodeDef[],
): WorkflowNodeValidationIssue[] {
  const issues: WorkflowNodeValidationIssue[] = [];
  for (const node of nodes) {
    if (!node.name?.trim()) {
      issues.push({ nodeId: node.id, code: 'name_required' });
    }
    if (!node.objective?.trim()) {
      issues.push({ nodeId: node.id, code: 'objective_required' });
    }
    if (node.action === 'fetch_data') {
      if (resolveNodeToolIds(node.input).length === 0) {
        issues.push({ nodeId: node.id, code: 'missing_tool_ids' });
      }
    } else if (
      node.action === 'compose_mutation' ||
      node.action === 'write_data'
    ) {
      const toolId = node.input?.toolId;
      if (typeof toolId !== 'number' || toolId <= 0) {
        issues.push({ nodeId: node.id, code: 'tool_id_required' });
      }
    }
    if (node.action === 'generate_and_push') {
      if (resolveNodeHostToolIds(node.input).length === 0) {
        issues.push({ nodeId: node.id, code: 'missing_host_tool_ids' });
      }
    }
  }
  return issues;
}

export function parseWorkflowOverridesJson(
  value?: string,
): Record<string, { objective?: string }> | null | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, { objective?: string }>;
    }
    return null;
  } catch {
    return null;
  }
}

export function formatWorkflowRevisionLabel(
  version: number,
  changeNote?: string | null,
): string {
  const note = changeNote?.trim();
  return note ? `v${version} · ${note}` : `v${version}`;
}
