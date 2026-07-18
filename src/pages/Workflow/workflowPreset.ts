import type { Tool } from '@/types/tool';
import type {
  WorkflowPresetCatalogEntry,
  WorkflowPresetConfig,
  WorkflowPresetKind,
  WorkflowPresetObjectiveConfig,
  WorkflowProfile,
} from '@/types/workflow';

export type WorkflowConfigMode = 'preset' | 'nodes';

export type WorkflowPresetFormState = {
  preset: WorkflowPresetKind | null;
  config: WorkflowPresetConfig;
};

export const PRESET_OBJECTIVE_KEYS: Record<
  WorkflowPresetKind,
  Array<keyof WorkflowPresetObjectiveConfig>
> = {
  page_auto_fill: ['loadPage', 'fetch', 'push', 'summarize'],
  page_context_push: ['loadPage', 'push', 'summarize'],
  page_context_mutation_submit: [
    'loadPage',
    'fetch',
    'compose',
    'present',
    'write',
    'summarize',
  ],
  fetch_push_summarize: ['fetch', 'push', 'summarize'],
  fetch_and_answer: ['fetch', 'summarize'],
  mutation_submit: ['fetch', 'compose', 'present', 'write', 'summarize'],
};

export function defaultPresetForProfile(
  profile: WorkflowProfile,
  catalog: WorkflowPresetCatalogEntry[],
): WorkflowPresetKind | null {
  if (profile === 'page_action') {
    return catalog.find((item) => item.kind === 'page_auto_fill')?.kind ?? catalog[0]?.kind ?? null;
  }
  if (profile === 'chat_skill') {
    return catalog.find((item) => item.kind === 'fetch_and_answer')?.kind ?? catalog[0]?.kind ?? null;
  }
  return catalog[0]?.kind ?? null;
}

export function emptyPresetConfig(): WorkflowPresetConfig {
  return {
    pushStream: true,
    materializePageContext: true,
    fetchCompleteWhen: 'first_success',
    summarizeMode: 'final',
    presentMode: 'brief',
    confirmKind: 'mutation',
    explainBeforeConfirm: false,
    summarizeAfter: false,
    objectives: {},
  };
}

/** Flow 产品三卡（指南约定） */
export const FLOW_PRODUCT_PRESET_KINDS: WorkflowPresetKind[] = [
  'page_auto_fill',
  'fetch_and_answer',
  'mutation_submit',
];

/** @deprecated 使用 flowBindEntry.filterFlowProductCatalog */
export function filterFlowProductCatalogLegacy(
  catalog: WorkflowPresetCatalogEntry[],
): WorkflowPresetCatalogEntry[] {
  const allowed = new Set(FLOW_PRODUCT_PRESET_KINDS);
  return catalog.filter((item) => allowed.has(item.kind));
}

/** Flow 创建/重建：只提交 catalog 工具字段（read / write / host） */
export function buildFlowPresetConfigPayload(
  config: WorkflowPresetConfig,
  _preset: WorkflowPresetKind,
): WorkflowPresetConfig {
  const payload: WorkflowPresetConfig = {};
  if (config.hostToolId) {
    payload.hostToolId = config.hostToolId;
  }
  if (config.readToolId) {
    payload.readToolId = config.readToolId;
  }
  if (config.writeToolId) {
    payload.writeToolId = config.writeToolId;
  }
  return payload;
}

export function catalogEntryForPreset(
  catalog: WorkflowPresetCatalogEntry[],
  preset: WorkflowPresetKind | null,
): WorkflowPresetCatalogEntry | undefined {
  if (!preset) {
    return undefined;
  }
  return catalog.find((item) => item.kind === preset);
}

export function buildPresetConfigPayload(
  config: WorkflowPresetConfig,
  preset: WorkflowPresetKind,
): WorkflowPresetConfig {
  const objectives = config.objectives ?? {};
  const trimmedObjectives = Object.fromEntries(
    Object.entries(objectives).filter(
      ([, value]) => typeof value === 'string' && value.trim(),
    ),
  ) as WorkflowPresetObjectiveConfig;

  const payload: WorkflowPresetConfig = {
    pushStream: config.pushStream !== false,
    materializePageContext: config.materializePageContext !== false,
  };

  if (config.readToolId) {
    payload.readToolId = config.readToolId;
  }
  if (config.writeToolId) {
    payload.writeToolId = config.writeToolId;
  }
  if (config.hostToolId) {
    payload.hostToolId = config.hostToolId;
  }
  if (config.fetchCompleteWhen) {
    payload.fetchCompleteWhen = config.fetchCompleteWhen;
  }
  if (config.summarizeMode) {
    payload.summarizeMode = config.summarizeMode;
  }
  if (config.presentMode) {
    payload.presentMode = config.presentMode;
  }
  if (config.confirmKind) {
    payload.confirmKind = config.confirmKind;
  }
  if (Object.keys(trimmedObjectives).length > 0) {
    payload.objectives = trimmedObjectives;
  }

  if (preset === 'page_context_push' || preset === 'page_auto_fill') {
    // page presets may omit readToolId
  }

  return payload;
}

export type WorkflowPresetValidationIssue = {
  path: string;
  messageId: string;
};

export function validatePresetForm(
  preset: WorkflowPresetKind | null,
  config: WorkflowPresetConfig,
  catalog: WorkflowPresetCatalogEntry[],
): WorkflowPresetValidationIssue[] {
  if (!preset) {
    return [{ path: 'preset', messageId: 'workflow.preset.required' }];
  }
  const entry = catalogEntryForPreset(catalog, preset);
  if (!entry) {
    return [{ path: 'preset', messageId: 'workflow.preset.invalid' }];
  }

  const issues: WorkflowPresetValidationIssue[] = [];
  for (const key of entry.requiredConfig) {
    const value = config[key as keyof WorkflowPresetConfig];
    if (key.endsWith('ToolId') && (typeof value !== 'number' || value <= 0)) {
      issues.push({
        path: `presetConfig.${key}`,
        messageId: `workflow.preset.fieldRequired.${key}`,
      });
    }
  }
  return issues;
}

export function filterWriteToolCandidates(tools: Tool[]): Tool[] {
  const writeTools = tools.filter(
    (tool) => tool.riskLevel === 'L2' || tool.riskLevel === 'L3',
  );
  return writeTools.length > 0 ? writeTools : tools;
}

/** mutate 预读：排除写 Tool（L2/L3） */
export function filterReadToolCandidates(tools: Tool[]): Tool[] {
  return tools.filter(
    (tool) => tool.riskLevel !== 'L2' && tool.riskLevel !== 'L3',
  );
}

export function objectiveKeysForCatalogEntry(
  entry: WorkflowPresetCatalogEntry,
): Array<keyof WorkflowPresetObjectiveConfig> {
  const actionToKey: Record<string, keyof WorkflowPresetObjectiveConfig> = {
    load_page_context: 'loadPage',
    fetch_data: 'fetch',
    generate_and_push: 'push',
    compose_mutation: 'compose',
    present_mutation: 'present',
    write_data: 'write',
    summarize: 'summarize',
    // Flow Intent operations (expandedOperations)
    read: 'fetch',
    'deliver(fill)': 'push',
    'deliver(speak)': 'summarize',
    mutate: 'write',
  };
  const keys: Array<keyof WorkflowPresetObjectiveConfig> = [];
  for (const action of entry.expandedActions) {
    const normalized = action.replace(/\?$/, '');
    const key = actionToKey[normalized];
    if (key && !keys.includes(key)) {
      keys.push(key);
    }
  }
  // Fallback to known preset objective map when catalog only has ops we can't map
  if (keys.length === 0 && entry.kind in PRESET_OBJECTIVE_KEYS) {
    return [...PRESET_OBJECTIVE_KEYS[entry.kind]];
  }
  return keys;
}

export function mapPresetIssueToMessageId(path: string): string | null {
  if (path === 'preset') {
    return 'workflow.preset.required';
  }
  const match = path.match(/^presetConfig\.(\w+)$/);
  if (match) {
    return `workflow.preset.fieldRequired.${match[1]}`;
  }
  return null;
}

export function inferDeliverableForPreset(
  preset: WorkflowPresetKind | null,
): 'answer' | 'mutation' | undefined {
  if (preset === 'mutation_submit' || preset === 'page_context_mutation_submit') {
    return 'mutation';
  }
  return undefined;
}

export function isMutationPreset(preset: WorkflowPresetKind | null): boolean {
  return preset === 'mutation_submit' || preset === 'page_context_mutation_submit';
}

export function isPageContextMutationPreset(
  preset: WorkflowPresetKind | null,
): boolean {
  return preset === 'page_context_mutation_submit';
}
