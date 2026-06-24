export type SkillDeliverable =
  | 'analysis'
  | 'list'
  | 'detail'
  | 'mutation'
  | 'answer';

export type WorkflowPhase = 'gather' | 'analyze' | 'answer' | 'mutate';

export type WorkflowStepKind = 'tool' | 'host_tool' | 'summarize' | 'reason';

export type WorkflowStopWhen =
  | 'observation_non_empty'
  | 'observation_fetch_complete'
  | 'observation_has_fields'
  | 'always';

export type WorkflowStep = {
  id: string;
  phase: WorkflowPhase;
  kind: WorkflowStepKind;
  toolRole?: string;
  hostToolNames?: string[];
  objective: string;
  stopWhen?: WorkflowStopWhen;
};

export type SkillWorkflowState = {
  deliverable?: SkillDeliverable;
  steps: WorkflowStep[];
};

export const DELIVERABLE_OPTIONS: SkillDeliverable[] = [
  'analysis',
  'list',
  'detail',
  'mutation',
  'answer',
];

export const WORKFLOW_PHASE_OPTIONS: WorkflowPhase[] = [
  'gather',
  'analyze',
  'answer',
  'mutate',
];

export const WORKFLOW_KIND_OPTIONS: WorkflowStepKind[] = [
  'tool',
  'host_tool',
  'summarize',
  'reason',
];

export const STOP_WHEN_OPTIONS: WorkflowStopWhen[] = [
  'observation_non_empty',
  'observation_fetch_complete',
  'observation_has_fields',
  'always',
];

export function createEmptyWorkflowStep(): WorkflowStep {
  return {
    id: `step_${Date.now()}`,
    phase: 'answer',
    kind: 'summarize',
    objective: '',
    stopWhen: 'always',
  };
}

function normalizeWorkflowStep(raw: unknown): WorkflowStep | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const id = typeof item.id === 'string' ? item.id.trim() : '';
  const phase = item.phase;
  const kind = item.kind;
  const objective = typeof item.objective === 'string' ? item.objective : '';
  if (!id || !WORKFLOW_PHASE_OPTIONS.includes(phase as WorkflowPhase)) {
    return null;
  }
  if (!WORKFLOW_KIND_OPTIONS.includes(kind as WorkflowStepKind)) {
    return null;
  }
  const hostToolNamesRaw = item.hostToolNames ?? item.host_tool_names;
  const hostToolNames = Array.isArray(hostToolNamesRaw)
    ? hostToolNamesRaw.map((name) => String(name)).filter(Boolean)
    : undefined;
  const stopWhenRaw = item.stopWhen ?? item.stop_when;
  const stopWhen =
    typeof stopWhenRaw === 'string' &&
    STOP_WHEN_OPTIONS.includes(stopWhenRaw as WorkflowStopWhen)
      ? (stopWhenRaw as WorkflowStopWhen)
      : undefined;

  return {
    id,
    phase: phase as WorkflowPhase,
    kind: kind as WorkflowStepKind,
    toolRole:
      typeof item.toolRole === 'string'
        ? item.toolRole
        : typeof item.tool_role === 'string'
          ? item.tool_role
          : undefined,
    hostToolNames,
    objective,
    stopWhen,
  };
}

export function parseWorkflowFromConfig(
  config?: Record<string, unknown> | null,
): SkillWorkflowState {
  if (!config) {
    return { steps: [] };
  }
  const deliverableRaw =
    config.deliverable ??
    (config.workflow as Record<string, unknown> | undefined)?.deliverable;
  const deliverable =
    typeof deliverableRaw === 'string' &&
    DELIVERABLE_OPTIONS.includes(deliverableRaw as SkillDeliverable)
      ? (deliverableRaw as SkillDeliverable)
      : undefined;

  const workflowRaw =
    typeof config.workflow === 'object' && config.workflow !== null
      ? (config.workflow as Record<string, unknown>)
      : null;
  const stepsRaw = workflowRaw?.steps;
  const steps: WorkflowStep[] = Array.isArray(stepsRaw)
    ? stepsRaw
        .map((item) => normalizeWorkflowStep(item))
        .filter((item): item is WorkflowStep => item !== null)
    : [];

  return { deliverable, steps };
}

export function mergeWorkflowIntoConfig(
  baseConfig: Record<string, unknown> | undefined | null,
  workflow: SkillWorkflowState,
): Record<string, unknown> | undefined {
  const next = { ...(baseConfig ?? {}) };
  if (workflow.deliverable) {
    next.deliverable = workflow.deliverable;
  } else {
    delete next.deliverable;
  }
  if (workflow.steps.length > 0) {
    next.workflow = {
      ...(typeof next.workflow === 'object' && next.workflow !== null
        ? (next.workflow as Record<string, unknown>)
        : {}),
      deliverable: workflow.deliverable,
      steps: workflow.steps.map((step) => ({
        ...step,
        hostToolNames:
          step.kind === 'host_tool' && step.hostToolNames?.length
            ? step.hostToolNames
            : undefined,
        toolRole:
          step.kind === 'tool' && step.toolRole?.trim()
            ? step.toolRole.trim()
            : undefined,
      })),
    };
  } else if (next.workflow) {
    delete next.workflow;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

export function hasWorkflowConfig(
  config?: Record<string, unknown> | null,
): boolean {
  return parseWorkflowFromConfig(config).steps.length > 0;
}

export type WorkflowValidationIssue = {
  stepId?: string;
  messageKey: string;
  messageValues?: Record<string, string>;
};

export function validateWorkflowSteps(
  steps: WorkflowStep[],
  options: {
    hostToolNameOptions: string[];
  },
): WorkflowValidationIssue[] {
  const issues: WorkflowValidationIssue[] = [];
  const ids = new Set<string>();

  for (const step of steps) {
    if (!step.objective.trim()) {
      issues.push({
        stepId: step.id,
        messageKey: 'skill.workflow.validation.objectiveRequired',
      });
    }
    if (ids.has(step.id)) {
      issues.push({
        stepId: step.id,
        messageKey: 'skill.workflow.validation.duplicateId',
      });
    }
    ids.add(step.id);

    if (step.kind === 'tool' && !step.toolRole?.trim()) {
      issues.push({
        stepId: step.id,
        messageKey: 'skill.workflow.validation.toolRoleRequired',
      });
    }
    if (step.kind === 'host_tool') {
      const names = step.hostToolNames ?? [];
      if (names.length === 0) {
        issues.push({
          stepId: step.id,
          messageKey: 'skill.workflow.validation.hostToolNamesRequired',
        });
      }
      for (const name of names) {
        if (!options.hostToolNameOptions.includes(name)) {
          issues.push({
            stepId: step.id,
            messageKey: 'skill.workflow.validation.hostToolNotBound',
            messageValues: { name },
          });
        }
      }
    }
  }

  return issues;
}
