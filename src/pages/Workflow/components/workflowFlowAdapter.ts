import type { Edge, Graph, Node } from '@antv/x6';
import type {
  WorkflowActionKind,
  WorkflowEdge,
  WorkflowEdgeKind,
  WorkflowNodeDef,
} from '@/types/workflow';
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
import { edgeKindOf, isBranchTipNode, synthesizeAlwaysEdges } from '../workflowGraph';
import { resolveWorkflowEdgeLabel } from './workflowFlowLabels';
import {
  type WorkflowFlowNodeData,
  workflowNodeToFlowData,
} from './workflowFlowVisual';

export type WorkflowFlowEdgeData = {
  workflowEdgeId: string;
  kind: WorkflowEdgeKind;
  clue?: { key: string; description: string };
};

const WORKFLOW_NODE_SIZE = { width: 248, height: 88 };
const BRANCH_TIP_NODE_SIZE = { width: 128, height: 36 };

function sizeForWorkflowNode(node: WorkflowNodeDef): {
  width: number;
  height: number;
} {
  return isBranchTipNode(node) ? BRANCH_TIP_NODE_SIZE : WORKFLOW_NODE_SIZE;
}

const EDGE_STROKE: Record<WorkflowEdgeKind, string> = {
  always: '#94a3b8',
  clue: '#94a3b8',
  default: '#94a3b8',
};

function edgeAttrsForKind(kind: WorkflowEdgeKind) {
  const stroke = EDGE_STROKE[kind];
  return {
    line: {
      stroke,
      strokeWidth: kind === 'default' ? 1.5 : 1.5,
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

const WORKFLOW_PORT_ATTRS = {
  circle: {
    r: 5,
    magnet: true,
    stroke: '#94a3b8',
    fill: '#ffffff',
    strokeWidth: 2,
    cursor: 'crosshair',
  },
};

function withWorkflowPortStyle<
  T extends { groups: Record<string, { attrs?: object }> },
>(ports: T): T {
  const groups = Object.fromEntries(
    Object.entries(ports.groups).map(([key, group]) => [
      key,
      { ...group, attrs: WORKFLOW_PORT_ATTRS },
    ]),
  );
  return { ...ports, groups } as T;
}

function edgeLabel(kind: WorkflowEdgeKind, clueKey?: string): string {
  // 状态 Key 展示在分支节点上，连线不再打「状态 · xxx」标签
  if (kind === 'clue') {
    return '';
  }
  return resolveWorkflowEdgeLabel(kind, clueKey);
}

export function createWorkflowEdge(
  graph: Graph,
  edge: WorkflowEdge,
): Edge {
  const kind = edgeKindOf(edge);
  const label = edgeLabel(kind, edge.clue?.key);
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
      workflowEdgeId: edge.id,
      kind,
      clue: edge.clue,
    } satisfies WorkflowFlowEdgeData,
    zIndex: 0,
  });
}

export function readEdgeData(edge: Edge): WorkflowFlowEdgeData {
  const data = (edge.getData() ?? {}) as Partial<WorkflowFlowEdgeData>;
  const kind = isWorkflowEdgeKind(data.kind) ? data.kind : 'always';
  return {
    workflowEdgeId:
      (typeof data.workflowEdgeId === 'string' && data.workflowEdgeId) ||
      edge.id,
    kind,
    clue: data.clue,
  };
}

function isWorkflowEdgeKind(value: unknown): value is WorkflowEdgeKind {
  return value === 'always' || value === 'clue' || value === 'default';
}

export function updateWorkflowEdgeVisual(edge: Edge, data: WorkflowFlowEdgeData) {
  const kind = data.kind;
  const label = edgeLabel(kind, data.clue?.key);
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

/** 拓扑序（入度为 0 优先）；环残留节点按原序追加 */
export function sortWorkflowGraphNodes(graph: Graph): Node[] {
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

export function extractWorkflowNodesFromGraph(graph: Graph): WorkflowNodeDef[] {
  return sortWorkflowGraphNodes(graph).map((node) => {
    const data = (node.getData() ?? {}) as WorkflowFlowNodeData;
    return {
      id: data.workflowNodeId ?? node.id,
      action: data.workflowAction ?? 'summarize',
      name: data.workflowName ?? '',
      objective: data.description ?? '',
      input: data.workflowInput ?? {},
    };
  });
}

export function extractWorkflowEdgesFromGraph(graph: Graph): WorkflowEdge[] {
  return graph.getEdges().map((edge) => {
    const data = readEdgeData(edge);
    return {
      id: data.workflowEdgeId,
      from: edge.getSourceCellId(),
      to: edge.getTargetCellId(),
      kind: data.kind,
      clue:
        data.kind === 'clue'
          ? {
              key: data.clue?.key?.trim() ?? '',
              description: data.clue?.description?.trim() ?? '',
            }
          : undefined,
    };
  });
}

export function extractWorkflowGraphFromCanvas(graph: Graph): {
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdge[];
  entryNodeId?: string;
} {
  const nodes = extractWorkflowNodesFromGraph(graph);
  let edges = extractWorkflowEdgesFromGraph(graph);
  if (nodes.length > 1 && edges.length === 0) {
    edges = synthesizeAlwaysEdges(nodes);
  }
  return {
    nodes,
    edges,
    entryNodeId: nodes[0]?.id,
  };
}

export function normalizeWorkflowNodesForSignature(
  nodes: WorkflowNodeDef[],
): WorkflowNodeDef[] {
  return nodes.map((node) => ({
    id: node.id,
    action: node.action,
    name: node.name ?? '',
    objective: node.objective ?? '',
    input: node.input ?? {},
  }));
}

export function normalizeWorkflowEdgesForSignature(
  edges: WorkflowEdge[],
): WorkflowEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    from: edge.from,
    to: edge.to,
    kind: edge.kind ?? 'always',
    clue: edge.clue
      ? {
          key: edge.clue.key ?? '',
          description: edge.clue.description ?? '',
        }
      : undefined,
  }));
}

export function nodesSignature(nodes: WorkflowNodeDef[]): string {
  return JSON.stringify(normalizeWorkflowNodesForSignature(nodes));
}

export function graphSignature(
  nodes: WorkflowNodeDef[],
  edges: WorkflowEdge[],
): string {
  return JSON.stringify({
    nodes: normalizeWorkflowNodesForSignature(nodes),
    edges: normalizeWorkflowEdgesForSignature(edges),
  });
}

function portsForWorkflowNode(
  hasIncoming: boolean,
  orientation: FlowCanvasOrientation,
) {
  if (orientation === 'horizontal') {
    return withWorkflowPortStyle(
      hasIncoming ? twoPortsHorizontal : onePortOutHorizontal,
    );
  }
  return withWorkflowPortStyle(
    hasIncoming ? twoPortsVertical : onePortOutVertical,
  );
}

export async function applyWorkflowGraphToCanvas(
  graph: Graph,
  nodes: WorkflowNodeDef[],
  edges: WorkflowEdge[],
  orientation: FlowCanvasOrientation,
): Promise<void> {
  const resolvedEdges =
    edges.length > 0 ? edges : synthesizeAlwaysEdges(nodes);
  const targets = new Set(resolvedEdges.map((edge) => edge.to));
  const nextNodeIds = new Set(nodes.map((node) => node.id));
  const nextEdgeIds = new Set(resolvedEdges.map((edge) => edge.id));

  let structureChanged = false;

  // 先删多余边，再删多余节点。禁止 clearCells：React Shape 清不干净会产生重影
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

  if (nodes.length === 0) {
    return;
  }

  for (const node of nodes) {
    const size = sizeForWorkflowNode(node);
    const data = workflowNodeToFlowData(node);
    const ports = portsForWorkflowNode(targets.has(node.id), orientation);
    const existing = graph.getCellById(node.id);

    if (existing?.isNode()) {
      const prev = (existing.getData() ?? {}) as WorkflowFlowNodeData;
      existing.setData({
        ...data,
        selected: Boolean(prev.selected),
        layoutOrientation: prev.layoutOrientation ?? orientation,
      });
      const currentSize = existing.getSize();
      if (
        currentSize.width !== size.width ||
        currentSize.height !== size.height
      ) {
        existing.resize(size.width, size.height);
        structureChanged = true;
      }
    } else {
      graph.addNode({
        id: node.id,
        shape: 'workflow-node-react',
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
    if (!graph.getCellById(edge.from) || !graph.getCellById(edge.to)) {
      continue;
    }
    const existing = graph.getCellById(edge.id);
    if (existing?.isEdge()) {
      if (
        existing.getSourceCellId() !== edge.from ||
        existing.getTargetCellId() !== edge.to
      ) {
        existing.setSource({ cell: edge.from, port: 'out' });
        existing.setTarget({ cell: edge.to, port: 'in' });
        structureChanged = true;
      }
      updateWorkflowEdgeVisual(existing, {
        workflowEdgeId: edge.id,
        kind: edgeKindOf(edge),
        clue: edge.clue,
      });
    } else {
      createWorkflowEdge(graph, edge);
      structureChanged = true;
    }
  }

  if (structureChanged) {
    invalidateCanvasLayout(graph);
    await formatCanvasSilentAsync(graph, orientation);
  }
}

/** @deprecated use applyWorkflowGraphToCanvas */
export async function applyWorkflowNodesToGraph(
  graph: Graph,
  nodes: WorkflowNodeDef[],
  orientation: FlowCanvasOrientation,
): Promise<void> {
  await applyWorkflowGraphToCanvas(
    graph,
    nodes,
    synthesizeAlwaysEdges(nodes),
    orientation,
  );
}

export async function insertWorkflowNodeAfter(
  graph: Graph,
  fromNodeId: string,
  node: WorkflowNodeDef,
  orientation: FlowCanvasOrientation,
): Promise<{ edgeId: string; nodeId: string }> {
  const outEdges = graph
    .getEdges()
    .filter((edge) => edge.getSourceCellId() === fromNodeId);

  graph.addNode({
    id: node.id,
    shape: 'workflow-node-react',
    ports:
      orientation === 'horizontal'
        ? withWorkflowPortStyle(twoPortsHorizontal)
        : withWorkflowPortStyle(twoPortsVertical),
    data: workflowNodeToFlowData(node),
  });

  const edgeId = `e_${fromNodeId}_${node.id}`;

  if (outEdges.length === 0) {
    const fromNode = graph.getCellById(fromNodeId);
    const fromData = fromNode?.isNode()
      ? ((fromNode.getData() ?? {}) as WorkflowFlowNodeData)
      : null;
    const kind =
      fromData?.workflowAction === 'detect_clues' ? 'clue' : 'always';
    createWorkflowEdge(graph, {
      id: edgeId,
      from: fromNodeId,
      to: node.id,
      kind,
      clue:
        kind === 'clue'
          ? { key: '', description: '' }
          : undefined,
    });
  } else if (outEdges.length === 1) {
    const outEdge = outEdges[0];
    const data = readEdgeData(outEdge);
    const targetId = outEdge.getTargetCellId();
    const fromNode = graph.getCellById(fromNodeId);
    const fromData = fromNode?.isNode()
      ? ((fromNode.getData() ?? {}) as WorkflowFlowNodeData)
      : null;
    if (fromData?.workflowAction === 'detect_clues') {
      createWorkflowEdge(graph, {
        id: edgeId,
        from: fromNodeId,
        to: node.id,
        kind: 'clue',
        clue: { key: '', description: '' },
      });
    } else {
      graph.removeEdge(outEdge.id);
      createWorkflowEdge(graph, {
        id: edgeId,
        from: fromNodeId,
        to: node.id,
        kind: 'always',
      });
      createWorkflowEdge(graph, {
        id: data.workflowEdgeId || `e_${node.id}_${targetId}`,
        from: node.id,
        to: targetId,
        kind: data.kind,
        clue: data.clue,
      });
    }
  } else {
    const fromNode = graph.getCellById(fromNodeId);
    const fromData = fromNode?.isNode()
      ? ((fromNode.getData() ?? {}) as WorkflowFlowNodeData)
      : null;
    createWorkflowEdge(graph, {
      id: edgeId,
      from: fromNodeId,
      to: node.id,
      kind: fromData?.workflowAction === 'detect_clues' ? 'clue' : 'always',
      clue:
        fromData?.workflowAction === 'detect_clues'
          ? { key: '', description: '' }
          : undefined,
    });
  }

  await formatCanvasSilentAsync(graph, orientation);
  return { edgeId, nodeId: node.id };
}

export async function removeWorkflowNode(
  graph: Graph,
  nodeId: string,
  orientation: FlowCanvasOrientation,
): Promise<void> {
  const inEdges = graph
    .getEdges()
    .filter((edge) => edge.getTargetCellId() === nodeId);
  const outEdges = graph
    .getEdges()
    .filter((edge) => edge.getSourceCellId() === nodeId);

  if (inEdges.length === 1 && outEdges.length === 1) {
    const inEdge = inEdges[0];
    const outEdge = outEdges[0];
    const sourceId = inEdge.getSourceCellId();
    const targetId = outEdge.getTargetCellId();
    const outData = readEdgeData(outEdge);
    graph.removeEdge(inEdge.id);
    graph.removeEdge(outEdge.id);
    createWorkflowEdge(graph, {
      id: `e_${sourceId}_${targetId}`,
      from: sourceId,
      to: targetId,
      kind: outData.kind,
      clue: outData.clue,
    });
  } else {
    [...inEdges, ...outEdges].forEach((edge) => {
      graph.removeEdge(edge.id);
    });
  }

  graph.removeNode(nodeId);
  await formatCanvasSilentAsync(graph, orientation);
}

export function isWorkflowActionKind(
  value: string,
  allowed: WorkflowActionKind[],
): value is WorkflowActionKind {
  return allowed.includes(value as WorkflowActionKind);
}

export function defaultEdgeKindForSourceAction(
  action: WorkflowActionKind | string | undefined,
): WorkflowEdgeKind {
  return action === 'detect_clues' ? 'clue' : 'always';
}
