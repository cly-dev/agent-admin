import type { FlowIntentEdge, FlowIntentStep } from '@/types/flow-intent';
import { rebuildAlwaysEdges } from './flowIntentEditor';

export function resolveIntentEdges(
  steps: FlowIntentStep[],
  edges: FlowIntentEdge[],
): FlowIntentEdge[] {
  return edges.length > 0 ? edges : rebuildAlwaysEdges(steps);
}

export function normalizeStepsForSignature(
  steps: FlowIntentStep[],
): FlowIntentStep[] {
  return steps.map((step) => ({
    ...step,
    name: step.name ?? '',
    objective: step.objective ?? '',
  }));
}

export function normalizeEdgesForSignature(
  edges: FlowIntentEdge[],
): FlowIntentEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    from: edge.from,
    to: edge.to,
    kind: edge.kind ?? 'always',
    state: edge.state
      ? {
          key: edge.state.key ?? '',
          description: edge.state.description ?? '',
        }
      : undefined,
  }));
}

export function intentGraphSignature(
  steps: FlowIntentStep[],
  edges: FlowIntentEdge[],
): string {
  return JSON.stringify({
    steps: normalizeStepsForSignature(steps),
    edges: normalizeEdgesForSignature(edges),
  });
}

export function resolveEntryStepId(
  steps: FlowIntentStep[],
  edges: FlowIntentEdge[],
  preferred?: string,
): string {
  if (preferred && steps.some((step) => step.id === preferred)) {
    return preferred;
  }
  return steps[0]?.id ?? '';
}

export function appendStepPreservingEdges(
  steps: FlowIntentStep[],
  edges: FlowIntentEdge[],
  step: FlowIntentStep,
): {
  steps: FlowIntentStep[];
  edges: FlowIntentEdge[];
  entryStepId: string;
} {
  const nextSteps = [...steps, step];
  if (steps.length === 0) {
    return {
      steps: nextSteps,
      edges: [],
      entryStepId: step.id,
    };
  }

  const resolved = resolveIntentEdges(steps, edges);
  const outFrom = new Set(resolved.map((edge) => edge.from));
  const leaves = steps.filter((item) => !outFrom.has(item.id));
  const connectFrom =
    leaves.length === 1
      ? leaves[0].id
      : (steps[steps.length - 1]?.id ?? leaves[0]?.id);

  if (!connectFrom) {
    return {
      steps: nextSteps,
      edges: rebuildAlwaysEdges(nextSteps),
      entryStepId: step.id,
    };
  }

  const newEdge: FlowIntentEdge = {
    id: `e_${connectFrom}_${step.id}`,
    from: connectFrom,
    to: step.id,
    kind: 'always',
  };

  return {
    steps: nextSteps,
    edges: [...resolved, newEdge],
    entryStepId: resolveEntryStepId(steps, resolved),
  };
}

export function updateStepInGraph(
  steps: FlowIntentStep[],
  step: FlowIntentStep,
): FlowIntentStep[] {
  return steps.map((item) => (item.id === step.id ? step : item));
}

export function removeStepFromGraph(
  steps: FlowIntentStep[],
  edges: FlowIntentEdge[],
  stepId: string,
): {
  steps: FlowIntentStep[];
  edges: FlowIntentEdge[];
  entryStepId: string;
} {
  const nextSteps = steps.filter((step) => step.id !== stepId);
  const nextEdges = edges.filter(
    (edge) => edge.from !== stepId && edge.to !== stepId,
  );
  const resolved = resolveIntentEdges(nextSteps, nextEdges);
  return {
    steps: nextSteps,
    edges: resolved,
    entryStepId: resolveEntryStepId(nextSteps, resolved),
  };
}
