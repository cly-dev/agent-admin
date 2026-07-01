import {
  WORKFLOW_PHASE_SHORT_LABEL_FALLBACK,
  WORKFLOW_AWAIT_CONFIRM_GATE_HINT_FALLBACK,
  type WorkflowNodePhase,
} from '../workflowNodePhase';

type PhaseShortLabelResolver = (phase: WorkflowNodePhase) => string;
type GateHintResolver = () => string;

let resolvePhaseShortLabelImpl: PhaseShortLabelResolver = (phase) =>
  WORKFLOW_PHASE_SHORT_LABEL_FALLBACK[phase];

let resolveAwaitUserConfirmGateHintImpl: GateHintResolver = () =>
  WORKFLOW_AWAIT_CONFIRM_GATE_HINT_FALLBACK;

export function setWorkflowFlowNodeLabelResolver(
  resolver: PhaseShortLabelResolver,
): void {
  resolvePhaseShortLabelImpl = resolver;
}

export function setWorkflowFlowGateHintResolver(resolver: GateHintResolver): void {
  resolveAwaitUserConfirmGateHintImpl = resolver;
}

export function resetWorkflowFlowNodeLabelResolver(): void {
  resolvePhaseShortLabelImpl = (phase) =>
    WORKFLOW_PHASE_SHORT_LABEL_FALLBACK[phase];
  resolveAwaitUserConfirmGateHintImpl = () =>
    WORKFLOW_AWAIT_CONFIRM_GATE_HINT_FALLBACK;
}

export function resolvePhaseShortLabel(phase: WorkflowNodePhase): string {
  return resolvePhaseShortLabelImpl(phase);
}

export function resolveAwaitUserConfirmGateHint(): string {
  return resolveAwaitUserConfirmGateHintImpl();
}
