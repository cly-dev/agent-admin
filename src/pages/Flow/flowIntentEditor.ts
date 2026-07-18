import type { FlowProfile } from '@/types/flow';
import type {
  FlowIntent,
  FlowIntentEdge,
  FlowIntentOperation,
  FlowIntentStep,
} from '@/types/flow-intent';

import type { FlowBindEntry } from './flowBindEntry';

export type FlowIntentValidationIssue = {
  path: string;
  messageId: string;
};

let stepSeq = 0;

export function createStepId(
  operation: FlowIntentOperation,
  existing: FlowIntentStep[],
  channel?: 'speak' | 'fill',
): string {
  const prefix =
    operation === 'deliver' ? (channel === 'fill' ? 'fill' : 'speak') : operation;
  let n = 1;
  while (existing.some((step) => step.id === `${prefix}_${n}`)) {
    n += 1;
  }
  stepSeq = Math.max(stepSeq, n);
  return `${prefix}_${n}`;
}

export function emptyIntent(profile: FlowProfile): FlowIntent {
  return {
    version: 1,
    profile,
    entryStepId: '',
    steps: [],
    edges: [],
  };
}

export function createDefaultStep(
  operation: FlowIntentOperation,
  profile: FlowProfile,
  existing: FlowIntentStep[] = [],
  bindEntry: FlowBindEntry | null = null,
): FlowIntentStep {
  const defaultChannel = bindEntry === 'page_action' ? 'fill' : 'speak';
  const id = createStepId(
    operation,
    existing,
    operation === 'deliver' ? defaultChannel : undefined,
  );
  const base: FlowIntentStep = {
    id,
    operation,
    name: '',
    objective: '',
  };
  if (operation === 'read') {
    return {
      ...base,
      name: '',
      completeWhen: 'first_success',
      readToolIds: [],
      images: { enabled: false },
    };
  }
  if (operation === 'judge') {
    return {
      ...base,
      name: '判定分流',
      policyHint: '',
    };
  }
  if (operation === 'deliver') {
    return {
      ...base,
      channel: defaultChannel,
      summarizeMode: 'final',
      stream: true,
      fillHostToolIds: [],
    };
  }
  return {
    ...base,
    writeToolId: undefined,
    readToolIds: [],
  };
}

/** Reset fields when switching operation. */
export function resetStepForOperation(
  step: FlowIntentStep,
  operation: FlowIntentOperation,
  profile: FlowProfile,
  bindEntry: FlowBindEntry | null = null,
): FlowIntentStep {
  const next = createDefaultStep(operation, profile, [], bindEntry);
  return {
    ...next,
    id: step.id,
    name: step.name,
    objective: step.objective,
  };
}

/** Rebuild sequential always edges from ordered steps (简易模式). */
export function rebuildAlwaysEdges(steps: FlowIntentStep[]): FlowIntentEdge[] {
  const edges: FlowIntentEdge[] = [];
  for (let i = 0; i < steps.length - 1; i += 1) {
    const from = steps[i].id;
    const to = steps[i + 1].id;
    edges.push({
      id: `e_${from}_${to}`,
      from,
      to,
      kind: 'always',
    });
  }
  return edges;
}

export function withOrderedSteps(
  intent: FlowIntent,
  steps: FlowIntentStep[],
): FlowIntent {
  return {
    ...intent,
    steps,
    entryStepId: steps[0]?.id ?? '',
    edges: rebuildAlwaysEdges(steps),
  };
}

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => Number(item))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function parseStep(raw: unknown): FlowIntentStep | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const id = String(item.id ?? '').trim();
  const operation = item.operation;
  if (
    !id ||
    (operation !== 'read' &&
      operation !== 'judge' &&
      operation !== 'deliver' &&
      operation !== 'mutate')
  ) {
    return null;
  }
  const slots =
    typeof item.slots === 'object' && item.slots !== null
      ? (item.slots as Record<string, unknown>)
      : {};
  const capabilities =
    typeof item.capabilities === 'object' && item.capabilities !== null
      ? (item.capabilities as Record<string, unknown>)
      : {};
  const imagesRaw =
    typeof capabilities.images === 'object' && capabilities.images !== null
      ? (capabilities.images as Record<string, unknown>)
      : null;

  const step: FlowIntentStep = {
    id,
    operation,
    name: typeof item.name === 'string' ? item.name : undefined,
    objective: typeof item.objective === 'string' ? item.objective : undefined,
    readToolIds: asNumberArray(slots.readToolIds),
    fillHostToolIds: asNumberArray(slots.fillHostToolIds),
    writeToolId:
      typeof slots.writeToolId === 'number' && slots.writeToolId > 0
        ? slots.writeToolId
        : undefined,
    completeWhen:
      item.completeWhen === 'fetch_all_pages' ||
      item.completeWhen === 'first_success'
        ? item.completeWhen
        : undefined,
    channel: item.channel === 'fill' || item.channel === 'speak' ? item.channel : undefined,
    summarizeMode:
      item.summarizeMode === 'brief' ||
      item.summarizeMode === 'detailed' ||
      item.summarizeMode === 'draft' ||
      item.summarizeMode === 'final'
        ? item.summarizeMode
        : undefined,
    stream: typeof item.stream === 'boolean' ? item.stream : undefined,
    policyHint:
      typeof capabilities.policyHint === 'string'
        ? capabilities.policyHint
        : undefined,
  };

  if (imagesRaw) {
    step.images = {
      enabled: imagesRaw.enabled === true,
      hint: typeof imagesRaw.hint === 'string' ? imagesRaw.hint : undefined,
      from:
        imagesRaw.from === 'upstream' ||
        imagesRaw.from === 'page_context' ||
        imagesRaw.from === 'all'
          ? imagesRaw.from
          : undefined,
      onFailure:
        imagesRaw.onFailure === 'degrade' || imagesRaw.onFailure === 'fail'
          ? imagesRaw.onFailure
          : undefined,
      maxCells:
        typeof imagesRaw.maxCells === 'number' ? imagesRaw.maxCells : undefined,
      cellPx:
        typeof imagesRaw.cellPx === 'number' ? imagesRaw.cellPx : undefined,
      maxGroups:
        typeof imagesRaw.maxGroups === 'number'
          ? imagesRaw.maxGroups
          : undefined,
      maxCellsPerGroup:
        typeof imagesRaw.maxCellsPerGroup === 'number'
          ? imagesRaw.maxCellsPerGroup
          : undefined,
      cacheTtlSec:
        typeof imagesRaw.cacheTtlSec === 'number'
          ? imagesRaw.cacheTtlSec
          : undefined,
    };
  }

  return step;
}

export function parseIntent(
  raw: unknown,
  fallbackProfile: FlowProfile,
): FlowIntent {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return emptyIntent(fallbackProfile);
  }
  const item = raw as Record<string, unknown>;
  const profile =
    item.profile === 'chat_skill' ||
    item.profile === 'page_action' ||
    item.profile === 'shared'
      ? item.profile
      : fallbackProfile;
  const steps = Array.isArray(item.steps)
    ? item.steps
        .map(parseStep)
        .filter((step): step is FlowIntentStep => step !== null)
    : [];

  const edges: FlowIntentEdge[] = [];
  if (Array.isArray(item.edges)) {
    for (const edgeRaw of item.edges) {
      if (typeof edgeRaw !== 'object' || edgeRaw === null) {
        continue;
      }
      const edge = edgeRaw as Record<string, unknown>;
      const from = String(edge.from ?? '').trim();
      const to = String(edge.to ?? '').trim();
      const id = String(edge.id ?? `e_${from}_${to}`).trim();
      if (!from || !to) {
        continue;
      }
      const stateRaw =
        typeof edge.state === 'object' && edge.state !== null
          ? (edge.state as Record<string, unknown>)
          : null;
      edges.push({
        id,
        from,
        to,
        kind:
          edge.kind === 'state' ||
          edge.kind === 'default' ||
          edge.kind === 'always'
            ? edge.kind
            : 'always',
        state: stateRaw
          ? {
              key: String(stateRaw.key ?? ''),
              description: String(stateRaw.description ?? ''),
            }
          : undefined,
      });
    }
  }

  const entryStepId =
    typeof item.entryStepId === 'string' &&
    steps.some((step) => step.id === item.entryStepId)
      ? item.entryStepId
      : (steps[0]?.id ?? '');

  return {
    version: 1,
    profile,
    entryStepId,
    steps,
    edges: edges.length > 0 ? edges : rebuildAlwaysEdges(steps),
  };
}

export function serializeIntent(intent: FlowIntent): Record<string, unknown> {
  const steps = intent.steps;
  const edges =
    intent.edges.length > 0 ? intent.edges : rebuildAlwaysEdges(steps);
  const entryStepId =
    intent.entryStepId && steps.some((step) => step.id === intent.entryStepId)
      ? intent.entryStepId
      : (steps[0]?.id ?? '');

  return {
    version: 1,
    profile: intent.profile,
    entryStepId,
    steps: steps.map((step) => {
      const base: Record<string, unknown> = {
        id: step.id,
        operation: step.operation,
      };
      if (step.name?.trim()) {
        base.name = step.name.trim();
      }
      if (step.objective?.trim()) {
        base.objective = step.objective.trim();
      }

      if (step.operation === 'read') {
        const slots: Record<string, unknown> = {};
        if (step.readToolIds && step.readToolIds.length > 0) {
          slots.readToolIds = step.readToolIds;
        }
        if (Object.keys(slots).length > 0) {
          base.slots = slots;
        }
        if (step.completeWhen) {
          base.completeWhen = step.completeWhen;
        }
        if (step.images?.enabled) {
          base.capabilities = {
            images: {
              enabled: true,
              ...(step.images.hint?.trim()
                ? { hint: step.images.hint.trim() }
                : {}),
              ...(step.images.from ? { from: step.images.from } : {}),
              ...(step.images.onFailure
                ? { onFailure: step.images.onFailure }
                : {}),
              ...(typeof step.images.maxCells === 'number'
                ? { maxCells: step.images.maxCells }
                : {}),
              ...(typeof step.images.cellPx === 'number'
                ? { cellPx: step.images.cellPx }
                : {}),
              ...(typeof step.images.maxGroups === 'number'
                ? { maxGroups: step.images.maxGroups }
                : {}),
              ...(typeof step.images.maxCellsPerGroup === 'number'
                ? { maxCellsPerGroup: step.images.maxCellsPerGroup }
                : {}),
              ...(typeof step.images.cacheTtlSec === 'number'
                ? { cacheTtlSec: step.images.cacheTtlSec }
                : {}),
            },
          };
        }
        return base;
      }

      if (step.operation === 'judge') {
        if (step.policyHint?.trim()) {
          base.capabilities = { policyHint: step.policyHint.trim() };
        }
        return base;
      }

      if (step.operation === 'deliver') {
        base.channel = step.channel ?? 'speak';
        if (step.channel === 'fill' && step.fillHostToolIds?.length) {
          base.slots = { fillHostToolIds: step.fillHostToolIds };
        }
        if (step.summarizeMode) {
          base.summarizeMode = step.summarizeMode;
        }
        if (typeof step.stream === 'boolean') {
          base.stream = step.stream;
        }
        return base;
      }

      // mutate
      const slots: Record<string, unknown> = {};
      if (step.writeToolId) {
        slots.writeToolId = step.writeToolId;
      }
      if (step.readToolIds && step.readToolIds.length > 0) {
        slots.readToolIds = step.readToolIds;
      }
      if (Object.keys(slots).length > 0) {
        base.slots = slots;
      }
      return base;
    }),
    edges: edges.map((edge) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      kind: edge.kind ?? 'always',
      ...(edge.kind === 'state' && edge.state
        ? { state: edge.state }
        : {}),
    })),
  };
}

export function validateIntentDraft(
  intent: FlowIntent,
  allowsMutate = true,
): FlowIntentValidationIssue[] {
  const issues: FlowIntentValidationIssue[] = [];
  if (intent.steps.length === 0) {
    issues.push({ path: 'steps', messageId: 'flow.intent.validation.empty' });
    return issues;
  }

  if (
    !intent.entryStepId ||
    !intent.steps.some((step) => step.id === intent.entryStepId)
  ) {
    issues.push({
      path: 'entryStepId',
      messageId: 'flow.intent.validation.entryRequired',
    });
  }

  const ids = new Set<string>();
  const stepById = new Map(intent.steps.map((step) => [step.id, step]));

  intent.steps.forEach((step, index) => {
    if (ids.has(step.id)) {
      issues.push({
        path: `steps[${index}].id`,
        messageId: 'flow.intent.validation.duplicateId',
      });
    }
    ids.add(step.id);

    if (step.operation === 'mutate' && !allowsMutate) {
      issues.push({
        path: `steps[${index}].operation`,
        messageId: 'flow.intent.validation.mutateForbidden',
      });
    }

    if (step.operation === 'read') {
      const hasTools = (step.readToolIds?.length ?? 0) > 0;
      const hasImages = step.images?.enabled === true;
      if (!hasTools && !hasImages) {
        issues.push({
          path: `steps[${index}].slots`,
          messageId: 'flow.intent.validation.readRequired',
        });
      }
    }

    if (step.operation === 'deliver') {
      if (!step.channel) {
        issues.push({
          path: `steps[${index}].channel`,
          messageId: 'flow.intent.validation.channelRequired',
        });
      }
      if (
        step.channel === 'fill' &&
        (!step.fillHostToolIds || step.fillHostToolIds.length === 0)
      ) {
        issues.push({
          path: `steps[${index}].fillHostToolIds`,
          messageId: 'flow.intent.validation.fillHostRequired',
        });
      }
    }

    if (step.operation === 'mutate') {
      if (!step.writeToolId || step.writeToolId <= 0) {
        issues.push({
          path: `steps[${index}].writeToolId`,
          messageId: 'flow.intent.validation.writeToolRequired',
        });
      }
    }
  });

  const edgeIds = new Set<string>();
  const edgesByJudge = new Map<
    string,
    { state: number; default: number; always: number }
  >();

  // 每个 judge 都要校验，即使尚无出边
  intent.steps.forEach((step) => {
    if (step.operation === 'judge') {
      edgesByJudge.set(step.id, { state: 0, default: 0, always: 0 });
    }
  });

  intent.edges.forEach((edge, index) => {
    if (edgeIds.has(edge.id)) {
      issues.push({
        path: `edges[${index}].id`,
        messageId: 'flow.intent.validation.duplicateEdgeId',
      });
    }
    edgeIds.add(edge.id);

    const kind = edge.kind ?? 'always';
    const fromStep = stepById.get(edge.from);

    if (kind === 'state' || kind === 'default') {
      if (fromStep?.operation !== 'judge') {
        issues.push({
          path: `edges[${index}].kind`,
          messageId: 'flow.intent.validation.branchNotFromJudge',
        });
      } else {
        const bucket = edgesByJudge.get(edge.from) ?? {
          state: 0,
          default: 0,
          always: 0,
        };
        if (kind === 'state') {
          bucket.state += 1;
        } else {
          bucket.default += 1;
        }
        edgesByJudge.set(edge.from, bucket);
      }
    } else if (fromStep?.operation === 'judge') {
      // judge 出边用 always 冒充分支
      const bucket = edgesByJudge.get(edge.from);
      if (bucket) {
        bucket.always += 1;
        edgesByJudge.set(edge.from, bucket);
      }
    }

    if (kind === 'state') {
      const key = edge.state?.key?.trim() ?? '';
      const description = edge.state?.description?.trim() ?? '';
      if (!key || !description) {
        issues.push({
          path: `edges[${index}].state`,
          messageId: 'flow.intent.validation.stateRequired',
        });
      }
    }

    if (edge.from === edge.to) {
      issues.push({
        path: `edges[${index}]`,
        messageId: 'flow.intent.validation.selfLoop',
      });
    }
  });

  for (const [judgeId, counts] of edgesByJudge) {
    if (counts.state === 0 && counts.default === 0) {
      issues.push({
        path: `edges.${judgeId}`,
        messageId: 'flow.intent.validation.judgeNeedsBranches',
      });
    } else if (counts.state === 0 && counts.default > 0) {
      issues.push({
        path: `edges.${judgeId}`,
        messageId: 'flow.intent.validation.judgeDefaultWithoutState',
      });
    } else if (counts.default !== 1) {
      issues.push({
        path: `edges.${judgeId}`,
        messageId: 'flow.intent.validation.judgeMissingDefault',
      });
    }

    if (counts.always > 0) {
      issues.push({
        path: `edges.${judgeId}`,
        messageId: 'flow.intent.validation.judgeAlwaysForbidden',
      });
    }
  }

  return issues;
}

/** 保存前批量分配 state.key（按 uiLabel；无 label 且已有 key 则保留） */
export async function allocateIntentStateKeys(
  intent: FlowIntent,
  allocate: (labels: string[]) => Promise<string[]>,
): Promise<FlowIntent> {
  const stateEdges = intent.edges.filter((edge) => edge.kind === 'state');
  if (stateEdges.length === 0) {
    return intent;
  }

  const labels: string[] = [];
  const indexMap: number[] = [];
  stateEdges.forEach((edge, index) => {
    const label = edge.uiLabel?.trim() ?? '';
    if (label) {
      labels.push(label);
      indexMap.push(index);
    }
  });

  let keys: string[] = [];
  if (labels.length > 0) {
    keys = await allocate(labels);
  }

  let keyCursor = 0;
  const nextEdges = intent.edges.map((edge) => {
    if (edge.kind !== 'state') {
      return edge;
    }
    const label = edge.uiLabel?.trim() ?? '';
    const description = edge.state?.description?.trim() ?? '';
    if (label) {
      const key = keys[keyCursor]?.trim() || label;
      keyCursor += 1;
      return {
        ...edge,
        state: { key, description },
      };
    }
    return edge;
  });

  return { ...intent, edges: nextEdges };
}
