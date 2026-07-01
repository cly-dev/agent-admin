import type { Edge, Graph, Node } from '@antv/x6';
import type { WorkflowActionKind, WorkflowNodeDef } from '@/types/workflow';
import {
  formatCanvasSilentAsync,
  type FlowCanvasOrientation,
} from '@/components/flow/FlowEditor/utils/flowCanvasFormatter';
import {
  onePortOutHorizontal,
  onePortOutVertical,
  twoPortsHorizontal,
  twoPortsVertical,
} from '@/components/flow/FlowEditor/utils/nodeShapes';
import {
  type WorkflowFlowNodeData,
  workflowNodeToFlowData,
} from './workflowFlowVisual';

const WORKFLOW_EDGE_ATTRS = {
  line: {
    stroke: '#94a3b8',
    strokeWidth: 1.5,
    targetMarker: {
      name: 'classic',
      size: 7,
      fill: '#94a3b8',
      stroke: '#94a3b8',
    },
  },
};

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

function withWorkflowPortStyle<T extends { groups: Record<string, { attrs?: object }> }>(
  ports: T,
): T {
  const groups = Object.fromEntries(
    Object.entries(ports.groups).map(([key, group]) => [
      key,
      { ...group, attrs: WORKFLOW_PORT_ATTRS },
    ]),
  );
  return { ...ports, groups } as T;
}

function createEdge(graph: Graph, sourceId: string, targetId: string): Edge {
  return graph.addEdge({
    source: { cell: sourceId, port: 'out' },
    target: { cell: targetId, port: 'in' },
    attrs: WORKFLOW_EDGE_ATTRS,
    connector: { name: 'rounded' },
    zIndex: 0,
  });
}

export function sortWorkflowGraphNodes(graph: Graph): Node[] {
  const nodes = graph.getNodes();
  if (nodes.length === 0) {
    return [];
  }

  const inDegree = new Map<string, number>();
  nodes.forEach((node) => inDegree.set(node.id, 0));
  graph.getEdges().forEach((edge) => {
    const targetId = edge.getTargetCellId();
    inDegree.set(targetId, (inDegree.get(targetId) ?? 0) + 1);
  });

  let current = nodes.find((node) => (inDegree.get(node.id) ?? 0) === 0);
  const ordered: Node[] = [];
  const visited = new Set<string>();

  while (current) {
    if (visited.has(current.id)) {
      break;
    }
    visited.add(current.id);
    ordered.push(current);
    const outEdge = graph
      .getEdges()
      .find((edge) => edge.getSourceCellId() === current!.id);
    current = outEdge
      ? (graph.getCellById(outEdge.getTargetCellId()) as Node | undefined)
      : undefined;
  }

  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      ordered.push(node);
    }
  });

  return ordered;
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

export function nodesSignature(nodes: WorkflowNodeDef[]): string {
  return JSON.stringify(normalizeWorkflowNodesForSignature(nodes));
}

function portsForWorkflowNode(
  index: number,
  orientation: FlowCanvasOrientation,
) {
  const isHead = index === 0;
  if (orientation === 'horizontal') {
    return withWorkflowPortStyle(isHead ? onePortOutHorizontal : twoPortsHorizontal);
  }
  return withWorkflowPortStyle(isHead ? onePortOutVertical : twoPortsVertical);
}

export async function applyWorkflowNodesToGraph(
  graph: Graph,
  nodes: WorkflowNodeDef[],
  orientation: FlowCanvasOrientation,
): Promise<void> {
  graph.clearCells();
  if (nodes.length === 0) {
    return;
  }

  nodes.forEach((node, index) => {
    graph.addNode({
      id: node.id,
      shape: 'workflow-node-react',
      ports: portsForWorkflowNode(index, orientation),
      data: workflowNodeToFlowData(node),
    });
  });

  for (let index = 0; index < nodes.length - 1; index += 1) {
    createEdge(graph, nodes[index].id, nodes[index + 1].id);
  }

  await formatCanvasSilentAsync(graph, orientation);

  const headNode = graph.getCellById(nodes[0].id);
  if (headNode?.isNode()) {
    headNode.setProp('ports', portsForWorkflowNode(0, orientation));
  }
}

export async function insertWorkflowNodeAfter(
  graph: Graph,
  fromNodeId: string,
  node: WorkflowNodeDef,
  orientation: FlowCanvasOrientation,
): Promise<void> {
  const outEdge = graph
    .getEdges()
    .find((edge) => edge.getSourceCellId() === fromNodeId);

  graph.addNode({
    id: node.id,
    shape: 'workflow-node-react',
    ports:
      orientation === 'horizontal'
        ? withWorkflowPortStyle(twoPortsHorizontal)
        : withWorkflowPortStyle(twoPortsVertical),
    data: workflowNodeToFlowData(node),
  });
  createEdge(graph, fromNodeId, node.id);

  if (outEdge) {
    const targetId = outEdge.getTargetCellId();
    graph.removeEdge(outEdge.id);
    createEdge(graph, node.id, targetId);
  }

  await formatCanvasSilentAsync(graph, orientation);
}

export async function removeWorkflowNode(
  graph: Graph,
  nodeId: string,
  orientation: FlowCanvasOrientation,
): Promise<void> {
  const inEdge = graph.getEdges().find((edge) => edge.getTargetCellId() === nodeId);
  const outEdge = graph.getEdges().find((edge) => edge.getSourceCellId() === nodeId);

  if (inEdge && outEdge) {
    const sourceId = inEdge.getSourceCellId();
    const targetId = outEdge.getTargetCellId();
    graph.removeEdge(inEdge.id);
    graph.removeEdge(outEdge.id);
    createEdge(graph, sourceId, targetId);
  } else {
    graph.getEdges().forEach((edge) => {
      if (edge.getSourceCellId() === nodeId || edge.getTargetCellId() === nodeId) {
        graph.removeEdge(edge.id);
      }
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
