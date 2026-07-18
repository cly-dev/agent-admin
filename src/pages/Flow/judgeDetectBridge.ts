import type { FlowProfile } from '@/types/flow';
import type {
  FlowIntentEdge,
  FlowIntentOperation,
  FlowIntentStep,
} from '@/types/flow-intent';
import type {
  WorkflowActionKind,
  WorkflowEdge,
  WorkflowNodeDef,
} from '@/types/workflow';
import {
  BRANCH_TIP_FLAG,
  isBranchTipNode,
  materializeBranchTip,
  removeDetectClueEdge,
} from '@/pages/Workflow/workflowGraph';
import { createDefaultStep } from './flowIntentEditor';

/** Flow Intent ↔ Workflow detect_clues 视图桥接，复用状态识别图规则 */

function operationToAction(
  operation: FlowIntentOperation,
): WorkflowActionKind {
  switch (operation) {
    case 'read':
      return 'fetch_data';
    case 'judge':
      return 'detect_clues';
    case 'deliver':
      return 'summarize';
    case 'mutate':
      return 'await_user_confirm';
    default:
      return 'summarize';
  }
}

function actionToOperation(
  action: WorkflowActionKind | string,
): FlowIntentOperation {
  switch (action) {
    case 'fetch_data':
    case 'summarize_images':
    case 'load_page_context':
      return 'read';
    case 'detect_clues':
      return 'judge';
    case 'await_user_confirm':
    case 'compose_mutation':
    case 'present_mutation':
    case 'write_data':
      return 'mutate';
    default:
      return 'deliver';
  }
}

export function intentStepsToDetectNodes(
  steps: FlowIntentStep[],
): WorkflowNodeDef[] {
  return steps.map((step): WorkflowNodeDef => {
    if (step.branchTip) {
      return {
        id: step.id,
        action: 'summarize',
        name: step.name ?? '',
        objective: step.objective ?? '',
        input: {
          [BRANCH_TIP_FLAG]: true,
          mode: 'final',
          stream: true,
        },
      };
    }
    if (step.operation === 'judge') {
      return {
        id: step.id,
        action: 'detect_clues',
        name: step.name ?? '',
        objective: step.objective ?? '',
        input: {
          ...(step.policyHint?.trim()
            ? { hint: step.policyHint.trim() }
            : {}),
        },
      };
    }
    return {
      id: step.id,
      action: operationToAction(step.operation),
      name: step.name ?? '',
      objective: step.objective ?? '',
      input: {},
    };
  });
}

export function intentEdgesToDetectEdges(
  edges: FlowIntentEdge[],
): WorkflowEdge[] {
  return edges.map((edge) => {
    if (edge.kind === 'state') {
      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        kind: 'clue' as const,
        clue: {
          key: edge.state?.key?.trim() || edge.uiLabel?.trim() || '',
          description: edge.state?.description?.trim() || '',
        },
      };
    }
    if (edge.kind === 'default') {
      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        kind: 'default' as const,
      };
    }
    return {
      id: edge.id,
      from: edge.from,
      to: edge.to,
      kind: 'always' as const,
    };
  });
}

/**
 * 把 DetectCluesPanel / workflowGraph 的变更合并回 Flow Intent。
 * 保留既有步骤的业务字段；新建 tip 映射为 branchTip deliver。
 */
export function detectGraphToIntent(
  detectNodes: WorkflowNodeDef[],
  detectEdges: WorkflowEdge[],
  prevSteps: FlowIntentStep[],
  profile: FlowProfile,
): { steps: FlowIntentStep[]; edges: FlowIntentEdge[] } {
  const prevById = new Map(prevSteps.map((step) => [step.id, step]));

  const steps: FlowIntentStep[] = detectNodes.map((node) => {
    const prev = prevById.get(node.id);
    if (isBranchTipNode(node)) {
      if (prev?.branchTip) {
        return {
          ...prev,
          name: node.name ?? prev.name,
          objective: node.objective ?? prev.objective,
          branchTip: true,
        };
      }
      const tip = createDefaultStep('deliver', profile, []);
      return {
        ...tip,
        id: node.id,
        name: node.name ?? tip.name,
        objective: node.objective ?? tip.objective,
        channel: 'speak',
        branchTip: true,
      };
    }

    if (node.action === 'detect_clues') {
      const hint =
        typeof node.input?.hint === 'string' ? node.input.hint : undefined;
      if (prev?.operation === 'judge') {
        return {
          ...prev,
          name: node.name ?? prev.name,
          objective: node.objective ?? prev.objective,
          policyHint: hint ?? prev.policyHint,
          branchTip: undefined,
        };
      }
      return {
        ...createDefaultStep('judge', profile, []),
        id: node.id,
        name: node.name ?? '判定分流',
        objective: node.objective ?? '',
        policyHint: hint ?? '',
      };
    }

    const operation = actionToOperation(node.action);
    if (prev && !prev.branchTip && prev.operation === operation) {
      return {
        ...prev,
        name: node.name ?? prev.name,
        objective: node.objective ?? prev.objective,
        branchTip: undefined,
      };
    }
    if (prev?.branchTip) {
      const next = createDefaultStep(operation, profile, []);
      return {
        ...next,
        id: node.id,
        name: node.name?.trim() || prev.name || next.name,
        objective: node.objective?.trim() || prev.objective || next.objective,
        branchTip: undefined,
      };
    }
    if (prev) {
      return {
        ...prev,
        name: node.name ?? prev.name,
        objective: node.objective ?? prev.objective,
        branchTip: undefined,
      };
    }
    const created = createDefaultStep(operation, profile, []);
    return {
      ...created,
      id: node.id,
      name: node.name ?? created.name,
      objective: node.objective ?? created.objective,
    };
  });

  const edges: FlowIntentEdge[] = detectEdges.map((edge) => {
    if (edge.kind === 'clue') {
      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        kind: 'state' as const,
        state: {
          key: edge.clue?.key?.trim() || '',
          description: edge.clue?.description?.trim() || '',
        },
      };
    }
    if (edge.kind === 'default') {
      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        kind: 'default' as const,
      };
    }
    return {
      id: edge.id,
      from: edge.from,
      to: edge.to,
      kind: 'always' as const,
    };
  });

  return { steps, edges };
}

export function isJudgeBranchTip(
  step: Pick<FlowIntentStep, 'branchTip'> | null | undefined,
): boolean {
  return step?.branchTip === true;
}

export function materializeJudgeBranchTip(
  steps: FlowIntentStep[],
  tipId: string,
  operation: FlowIntentOperation,
  profile: FlowProfile,
): FlowIntentStep[] {
  const nodes = intentStepsToDetectNodes(steps);
  const action = operationToAction(operation);
  materializeBranchTip(nodes, tipId, action);
  const tip = steps.find((item) => item.id === tipId);
  const next = createDefaultStep(operation, profile, []);
  return steps.map((step) => {
    if (step.id !== tipId || !step.branchTip) {
      return step;
    }
    return {
      ...next,
      id: tipId,
      name: tip?.name?.trim() || next.name,
      objective: tip?.objective?.trim() || next.objective,
      branchTip: undefined,
    };
  });
}

/** 复用 workflowGraph.removeDetectClueEdge */
export function removeJudgeStateEdge(
  steps: FlowIntentStep[],
  edges: FlowIntentEdge[],
  edgeId: string,
  profile: FlowProfile,
): { steps: FlowIntentStep[]; edges: FlowIntentEdge[] } {
  const nodes = intentStepsToDetectNodes(steps);
  const detectEdges = intentEdgesToDetectEdges(edges);
  const target = detectEdges.find((edge) => edge.id === edgeId);
  const detectId = target?.from ?? '';
  const next = removeDetectClueEdge(nodes, detectEdges, detectId, edgeId, {
    cascadeLeaf: true,
  });
  return detectGraphToIntent(next.nodes, next.edges, steps, profile);
}
