import type { Edge, Graph, Node } from '@antv/x6';
import type { FlowIntentEdge, FlowIntentStep } from '@/types/flow-intent';
import {
  formatCanvasSilentAsync,
  invalidateCanvasLayout,
  type FlowCanvasOrientation,
} from '@/components/flow/FlowEditor/utils/flowCanvasFormatter';
import {
  onePortOutHorizontal,
  onePortOutVertical,
  twoPortsHorizontal,
  twoPortsVertical,
} from '@/components/flow/FlowEditor/utils/nodeShapes';
import { resolveIntentEdges } from '../intentGraph';
import { rebuildAlwaysEdges } from '../flowIntentEditor';
import {
  intentStepToFlowData,
  type IntentFlowNodeData,
} from './intentFlowVisual';

export type IntentFlowEdgeData = {
  intentEdgeId: string;
  kind: 'always' | 'state' | 'default';
  state?: { key: string; description: string };
  /** 运营状态名称，仅画布侧 */
  uiLabel?: string;
};

const INTENT_NODE_SIZE = { width: 248, height: 88 };
/** 与 Workflow 状态识别 tip 同尺寸 */
const BRANCH_TIP_NODE_SIZE = { width: 128, height: 36 };

function nodeSizeForStep(step: FlowIntentStep) {
  return step.branchTip ? BRANCH_TIP_NODE_SIZE : INTENT_NODE_SIZE;
}

const EDGE_STROKE: Record<'always' | 'state' | 'default', string> = {
  always: '#94a3b8',
  // 与 Workflow clue 一致
  state: '#94a3b8',
  default: '#94a3b8',
};

function edgeKindOf(edge: FlowIntentEdge): 'always' | 'state' | 'default' {
  return edge.kind ?? 'always';
}

function edgeAttrsForKind(kind: 'always' | 'state' | 'default') {
  const stroke = EDGE_STROKE[kind];
  return {
    line: {
      stroke,
      strokeWidth: 1.5,
      // 与 Workflow：default 虚线；state/always 实线
      strokeDasharray: kind === 'default' ? '6 4' : undefined,
      targetMarker: {
        name: 'classic',
        size: 7,
        fill: stroke,
        stroke,
      },
    },
  };
}

const INTENT_PORT_ATTRS = {
  circle: {
    r: 5,
    magnet: true,
    stroke: '#94a3b8',
    fill: '#ffffff',
    strokeWidth: 2,
    cursor: 'crosshair',
  },
};

function withIntentPortStyle<
  T extends { groups: Record<string, { attrs?: object }> },
>(ports: T): T {
  const groups = Object.fromEntries(
    Object.entries(ports.groups).map(([key, group]) => [
      key,
      { ...group, attrs: INTENT_PORT_ATTRS },
    ]),
  );
  return { ...ports, groups } as T;
}

function edgeLabel(
  _kind: 'always' | 'state' | 'default',
  _options?: { uiLabel?: string; description?: string; key?: string },
): string {
  // 与 Workflow 一致：分支 Key 在末梢节点上展示，连线不打标签
  return '';
}

export function createIntentEdge(graph: Graph, edge: FlowIntentEdge): Edge {
  const kind = edgeKindOf(edge);
  const label = edgeLabel(kind, {
    uiLabel: edge.uiLabel,
    description: edge.state?.description,
    key: edge.state?.key,
  });
  return graph.addEdge({
    id: edge.id,
    source: { cell: edge.from, port: 'out' },
    target: { cell: edge.to, port: 'in' },
    attrs: edgeAttrsForKind(kind),
    connector: { name: 'rounded' },
    labels: label
      ? [
          {
            attrs: {
              label: {
                text: label,
                fill: EDGE_STROKE[kind],
                fontSize: 10,
                fontWeight: 600,
              },
              body: {
                fill: '#ffffff',
                stroke: EDGE_STROKE[kind],
                strokeWidth: 1,
                rx: 4,
                ry: 4,
              },
            },
          },
        ]
      : [],
    data: {
      intentEdgeId: edge.id,
      kind,
      state: edge.state,
      uiLabel: edge.uiLabel,
    } satisfies IntentFlowEdgeData,
    zIndex: 0,
  });
}

export function readIntentEdgeData(edge: Edge): IntentFlowEdgeData {
  const data = (edge.getData() ?? {}) as Partial<IntentFlowEdgeData>;
  const kind =
    data.kind === 'state' || data.kind === 'default' || data.kind === 'always'
      ? data.kind
      : 'always';
  return {
    intentEdgeId:
      (typeof data.intentEdgeId === 'string' && data.intentEdgeId) || edge.id,
    kind,
    state: data.state,
    uiLabel: typeof data.uiLabel === 'string' ? data.uiLabel : undefined,
  };
}

export function updateIntentEdgeVisual(edge: Edge, data: IntentFlowEdgeData) {
  const kind = data.kind;
  const label = edgeLabel(kind, {
    uiLabel: data.uiLabel,
    description: data.state?.description,
    key: data.state?.key,
  });
  edge.setAttrs(edgeAttrsForKind(kind));
  edge.setData({ ...data, kind });
  edge.setLabels(
    label
      ? [
          {
            attrs: {
              label: {
                text: label,
                fill: EDGE_STROKE[kind],
                fontSize: 10,
                fontWeight: 600,
              },
              body: {
                fill: '#ffffff',
                stroke: EDGE_STROKE[kind],
                strokeWidth: 1,
                rx: 4,
                ry: 4,
              },
            },
          },
        ]
      : [],
  );
}

export function sortIntentGraphNodes(graph: Graph): Node[] {
  const nodes = graph.getNodes();
  if (nodes.length === 0) {
    return [];
  }

  const inDegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  nodes.forEach((node) => {
    inDegree.set(node.id, 0);
    outgoing.set(node.id, []);
  });
  graph.getEdges().forEach((edge) => {
    const sourceId = edge.getSourceCellId();
    const targetId = edge.getTargetCellId();
    outgoing.get(sourceId)?.push(targetId);
    inDegree.set(targetId, (inDegree.get(targetId) ?? 0) + 1);
  });

  const queue = nodes
    .filter((node) => (inDegree.get(node.id) ?? 0) === 0)
    .map((node) => node.id);
  const orderedIds: string[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);
    orderedIds.push(currentId);
    for (const nextId of outgoing.get(currentId) ?? []) {
      const nextDegree = (inDegree.get(nextId) ?? 0) - 1;
      inDegree.set(nextId, nextDegree);
      if (nextDegree === 0) {
        queue.push(nextId);
      }
    }
  }

  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      orderedIds.push(node.id);
    }
  });

  return orderedIds
    .map((id) => graph.getCellById(id))
    .filter((cell): cell is Node => Boolean(cell?.isNode()));
}

function stepFromNodeData(
  node: Node,
  stepMap: Map<string, FlowIntentStep>,
): FlowIntentStep | null {
  const data = (node.getData() ?? {}) as IntentFlowNodeData;
  const stepId = data.intentStepId ?? node.id;
  const existing = stepMap.get(stepId);
  if (existing) {
    return {
      ...existing,
      name: data.name ?? existing.name,
      objective: data.objective ?? existing.objective,
      branchTip:
        data.isBranchTip === true ? true : existing.branchTip,
    };
  }
  return null;
}

export function extractIntentGraphFromCanvas(
  graph: Graph,
  stepMap: Map<string, FlowIntentStep>,
): {
  steps: FlowIntentStep[];
  edges: FlowIntentEdge[];
  entryStepId?: string;
} {
  const steps = sortIntentGraphNodes(graph)
    .map((node) => stepFromNodeData(node, stepMap))
    .filter((step): step is FlowIntentStep => step !== null);

  let edges: FlowIntentEdge[] = graph.getEdges().map((edge) => {
    const data = readIntentEdgeData(edge);
    const fromId = edge.getSourceCellId();
    const fromStep = stepMap.get(fromId);
    // 从 judge 拉出的边：hook 可能写成 always，归一为 state（待填）
    let kind = data.kind;
    if (
      fromStep?.operation === 'judge' &&
      (kind === 'always' || kind === ('clue' as typeof kind))
    ) {
      kind = 'state';
    }
    return {
      id: data.intentEdgeId,
      from: fromId,
      to: edge.getTargetCellId(),
      kind,
      state: kind === 'state' ? data.state : undefined,
      uiLabel: kind === 'state' ? data.uiLabel : undefined,
    };
  });

  if (steps.length > 1 && edges.length === 0) {
    edges = rebuildAlwaysEdges(steps);
  }

  return {
    steps,
    edges,
    entryStepId: steps[0]?.id,
  };
}

function portsForIntentNode(
  hasIncoming: boolean,
  orientation: FlowCanvasOrientation,
) {
  if (orientation === 'horizontal') {
    return withIntentPortStyle(
      hasIncoming ? twoPortsHorizontal : onePortOutHorizontal,
    );
  }
  return withIntentPortStyle(
    hasIncoming ? twoPortsVertical : onePortOutVertical,
  );
}

export async function applyIntentGraphToCanvas(
  graph: Graph,
  steps: FlowIntentStep[],
  edges: FlowIntentEdge[],
  orientation: FlowCanvasOrientation,
  formatStepLabel?: (step: FlowIntentStep) => string,
): Promise<void> {
  const resolvedEdges = resolveIntentEdges(steps, edges);
  const targets = new Set(resolvedEdges.map((edge) => edge.to));
  const nextNodeIds = new Set(steps.map((step) => step.id));
  const nextEdgeIds = new Set(resolvedEdges.map((edge) => edge.id));

  let structureChanged = false;

  for (const edge of [...graph.getEdges()]) {
    if (!nextEdgeIds.has(edge.id)) {
      graph.removeEdge(edge.id);
      structureChanged = true;
    }
  }
  for (const node of [...graph.getNodes()]) {
    if (!nextNodeIds.has(node.id)) {
      graph.removeNode(node.id);
      structureChanged = true;
    }
  }

  if (steps.length === 0) {
    return;
  }

  for (const step of steps) {
    const outs = resolvedEdges.filter((edge) => edge.from === step.id);
    const branchCount = outs.filter((edge) => edge.kind === 'state').length;
    const hasDefault = outs.some((edge) => edge.kind === 'default');
    const branchSummary =
      step.operation === 'judge'
        ? branchCount === 0 && !hasDefault
          ? undefined
          : [
              branchCount > 0 ? `${branchCount} 条分支` : '',
              hasDefault ? '含其他' : '',
            ]
              .filter(Boolean)
              .join(' · ')
        : undefined;
    const data = {
      ...intentStepToFlowData(step, formatStepLabel?.(step)),
      branchSummary,
    };
    const ports = portsForIntentNode(targets.has(step.id), orientation);
    const existing = graph.getCellById(step.id);

    if (existing?.isNode()) {
      const prev = (existing.getData() ?? {}) as IntentFlowNodeData;
      const size = nodeSizeForStep(step);
      existing.setData({
        ...data,
        selected: Boolean(prev.selected),
        layoutOrientation: prev.layoutOrientation ?? orientation,
      });
      if (
        existing.getSize().width !== size.width ||
        existing.getSize().height !== size.height
      ) {
        existing.resize(size.width, size.height);
      }
    } else {
      const size = nodeSizeForStep(step);
      graph.addNode({
        id: step.id,
        shape: 'intent-node-react',
        width: size.width,
        height: size.height,
        ports,
        data: {
          ...data,
          layoutOrientation: orientation,
        },
      });
      structureChanged = true;
    }
  }

  for (const edge of resolvedEdges) {
    const existing = graph.getCellById(edge.id);
    if (existing?.isEdge()) {
      updateIntentEdgeVisual(existing, {
        intentEdgeId: edge.id,
        kind: edgeKindOf(edge),
        state: edge.state,
        uiLabel: edge.uiLabel,
      });
      if (
        existing.getSourceCellId() !== edge.from ||
        existing.getTargetCellId() !== edge.to
      ) {
        existing.setSource({ cell: edge.from, port: 'out' });
        existing.setTarget({ cell: edge.to, port: 'in' });
        structureChanged = true;
      }
    } else {
      createIntentEdge(graph, edge);
      structureChanged = true;
    }
  }

  if (structureChanged) {
    invalidateCanvasLayout(graph);
    await formatCanvasSilentAsync(graph, orientation);
  }
}

export async function insertIntentStepAfter(
  graph: Graph,
  fromStepId: string,
  step: FlowIntentStep,
  orientation: FlowCanvasOrientation,
  formatStepLabel?: (step: FlowIntentStep) => string,
): Promise<{ edgeId: string; stepId: string }> {
  const outEdges = graph
    .getEdges()
    .filter((edge) => edge.getSourceCellId() === fromStepId);

  const fromCell = graph.getCellById(fromStepId);
  const fromData = fromCell?.isNode()
    ? ((fromCell.getData() ?? {}) as IntentFlowNodeData)
    : null;
  const fromIsBranchTip = Boolean(fromData?.isBranchTip);
  const fromIsJudge =
    fromData?.operation === 'judge' && !fromIsBranchTip;
  const newEdgeKind: FlowIntentEdge['kind'] = fromIsJudge ? 'state' : 'always';

  graph.addNode({
    id: step.id,
    shape: 'intent-node-react',
    width: nodeSizeForStep(step).width,
    height: nodeSizeForStep(step).height,
    ports:
      orientation === 'horizontal'
        ? withIntentPortStyle(twoPortsHorizontal)
        : withIntentPortStyle(twoPortsVertical),
    data: intentStepToFlowData(step, formatStepLabel?.(step)),
  });

  const edgeId = `e_${fromStepId}_${step.id}`;

  if (outEdges.length === 0 || fromIsJudge) {
    // judge（非末梢）允许多出边；末梢 tip 与业务节点走 always
    createIntentEdge(graph, {
      id: edgeId,
      from: fromStepId,
      to: step.id,
      kind: newEdgeKind,
    });
  } else if (outEdges.length === 1) {
    const outEdge = outEdges[0];
    const data = readIntentEdgeData(outEdge);
    const targetId = outEdge.getTargetCellId();
    graph.removeEdge(outEdge.id);
    createIntentEdge(graph, {
      id: edgeId,
      from: fromStepId,
      to: step.id,
      kind: 'always',
    });
    createIntentEdge(graph, {
      id: data.intentEdgeId || `e_${step.id}_${targetId}`,
      from: step.id,
      to: targetId,
      kind: data.kind,
      state: data.state,
      uiLabel: data.uiLabel,
    });
  } else {
    createIntentEdge(graph, {
      id: edgeId,
      from: fromStepId,
      to: step.id,
      kind: 'always',
    });
  }

  invalidateCanvasLayout(graph);
  await formatCanvasSilentAsync(graph, orientation);
  return { edgeId, stepId: step.id };
}

export async function removeIntentStep(
  graph: Graph,
  stepId: string,
  orientation: FlowCanvasOrientation,
): Promise<void> {
  const inEdges = graph
    .getEdges()
    .filter((edge) => edge.getTargetCellId() === stepId);
  const outEdges = graph
    .getEdges()
    .filter((edge) => edge.getSourceCellId() === stepId);

  for (const edge of [...inEdges, ...outEdges]) {
    graph.removeEdge(edge.id);
  }

  if (inEdges.length === 1 && outEdges.length === 1) {
    const inEdge = inEdges[0];
    const outEdge = outEdges[0];
    const data = readIntentEdgeData(inEdge);
    createIntentEdge(graph, {
      id: `e_${inEdge.getSourceCellId()}_${outEdge.getTargetCellId()}`,
      from: inEdge.getSourceCellId(),
      to: outEdge.getTargetCellId(),
      kind: data.kind,
      state: data.state,
    });
  }

  graph.removeNode(stepId);
  await formatCanvasSilentAsync(graph, orientation);
}

export function inferIntentEdgeKindOnConnect(
  sourceStep: FlowIntentStep | undefined,
): 'always' | 'state' | 'default' {
  if (sourceStep?.operation === 'judge') {
    return 'state';
  }
  return 'always';
}
