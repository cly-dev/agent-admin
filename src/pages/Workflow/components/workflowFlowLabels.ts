import {
  WORKFLOW_PHASE_SHORT_LABEL_FALLBACK,
  WORKFLOW_AWAIT_CONFIRM_GATE_HINT_FALLBACK,
  type WorkflowNodePhase,
} from '../workflowNodePhase';
import type { WorkflowEdgeKind } from '@/types/workflow';

type PhaseShortLabelResolver = (phase: WorkflowNodePhase) => string;
type GateHintResolver = () => string;
type EdgeLabelResolver = (kind: WorkflowEdgeKind, clueKey?: string) => string;

const WORKFLOW_EDGE_LABEL_FALLBACK: Record<
  WorkflowEdgeKind,
  (clueKey?: string) => string
> = {
  always: () => '',
  clue: () => '',
  default: () => '',
};

let resolvePhaseShortLabelImpl: PhaseShortLabelResolver = (phase) =>
  WORKFLOW_PHASE_SHORT_LABEL_FALLBACK[phase];

let resolveAwaitUserConfirmGateHintImpl: GateHintResolver = () =>
  WORKFLOW_AWAIT_CONFIRM_GATE_HINT_FALLBACK;

let resolveEdgeLabelImpl: EdgeLabelResolver = (kind, clueKey) =>
  WORKFLOW_EDGE_LABEL_FALLBACK[kind](clueKey);

export function setWorkflowFlowNodeLabelResolver(
  resolver: PhaseShortLabelResolver,
): void {
  resolvePhaseShortLabelImpl = resolver;
}

export function setWorkflowFlowGateHintResolver(resolver: GateHintResolver): void {
  resolveAwaitUserConfirmGateHintImpl = resolver;
}

export function setWorkflowFlowEdgeLabelResolver(resolver: EdgeLabelResolver): void {
  resolveEdgeLabelImpl = resolver;
}

export function resetWorkflowFlowNodeLabelResolver(): void {
  resolvePhaseShortLabelImpl = (phase) =>
    WORKFLOW_PHASE_SHORT_LABEL_FALLBACK[phase];
  resolveAwaitUserConfirmGateHintImpl = () =>
    WORKFLOW_AWAIT_CONFIRM_GATE_HINT_FALLBACK;
  resolveEdgeLabelImpl = (kind, clueKey) =>
    WORKFLOW_EDGE_LABEL_FALLBACK[kind](clueKey);
}

export function resolvePhaseShortLabel(phase: WorkflowNodePhase): string {
  return resolvePhaseShortLabelImpl(phase);
}

export function resolveAwaitUserConfirmGateHint(): string {
  return resolveAwaitUserConfirmGateHintImpl();
}

export function resolveWorkflowEdgeLabel(
  kind: WorkflowEdgeKind,
  clueKey?: string,
): string {
  return resolveEdgeLabelImpl(kind, clueKey);
}
