import type {
  WorkflowActionKind,
  WorkflowEdge,
  WorkflowEdgeKind,
  WorkflowNodeDef,
  WorkflowNodesDocument,
} from '@/types/workflow';
import { defaultInputForAction, normalizeWorkflowNode } from './workflowShared';

export type ParsedWorkflowGraph = {
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdge[];
  entryNodeId?: string;
  /** raw was legacy nodes[] without edges */
  edgesSynthesized: boolean;
};

export type WorkflowGraphValidationIssue = {
  code:
    | 'edges_required'
    | 'edges_empty'
    | 'multiple_detect_clues'
    | 'detect_no_outgoing'
    | 'missing_default'
    | 'duplicate_default'
    | 'duplicate_clue_key'
    | 'duplicate_clue_target'
    | 'default_overlaps_clue_target'
    | 'fanout_missing_join'
    | 'fanout_divergent_join'
    | 'invalid_detect_edge_kind'
    | 'non_detect_branch_edge'
    | 'clue_fields_required'
    | 'unknown_endpoint'
    | 'cycle'
    | 'unreachable_node';
  path?: string;
  message?: string;
};

const EDGE_KINDS: WorkflowEdgeKind[] = ['always', 'clue', 'default'];

function isEdgeKind(value: unknown): value is WorkflowEdgeKind {
  return typeof value === 'string' && EDGE_KINDS.includes(value as WorkflowEdgeKind);
}

export function synthesizeAlwaysEdges(nodes: WorkflowNodeDef[]): WorkflowEdge[] {
  const edges: WorkflowEdge[] = [];
  for (let index = 0; index < nodes.length - 1; index += 1) {
    const from = nodes[index];
    const to = nodes[index + 1];
    edges.push({
      id: `e_${from.id}_${to.id}`,
      from: from.id,
      to: to.id,
      kind: 'always',
    });
  }
  return edges;
}

export function normalizeWorkflowEdge(raw: unknown): WorkflowEdge | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const id = typeof item.id === 'string' ? item.id.trim() : '';
  const from = typeof item.from === 'string' ? item.from.trim() : '';
  const to = typeof item.to === 'string' ? item.to.trim() : '';
  if (!id || !from || !to) {
    return null;
  }
  const kind = isEdgeKind(item.kind) ? item.kind : 'always';
  let clue: WorkflowEdge['clue'];
  if (typeof item.clue === 'object' && item.clue !== null) {
    const clueRaw = item.clue as Record<string, unknown>;
    const key = typeof clueRaw.key === 'string' ? clueRaw.key.trim() : '';
    const description =
      typeof clueRaw.description === 'string' ? clueRaw.description.trim() : '';
    if (key || description) {
      clue = { key, description };
    }
  }
  return { id, from, to, kind, clue };
}

export function parseWorkflowEdges(raw: unknown): WorkflowEdge[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => normalizeWorkflowEdge(item))
    .filter((item): item is WorkflowEdge => item !== null);
}

/** 兼容遗留 nodes[] 与文档 { nodes, edges, entryNodeId } */
export function parseWorkflowGraph(raw: unknown): ParsedWorkflowGraph {
  if (Array.isArray(raw)) {
    const nodes = raw
      .map((item) => normalizeWorkflowNode(item))
      .filter((item): item is WorkflowNodeDef => item !== null);
    return {
      nodes,
      edges: synthesizeAlwaysEdges(nodes),
      entryNodeId: nodes[0]?.id,
      edgesSynthesized: true,
    };
  }

  if (typeof raw !== 'object' || raw === null) {
    return { nodes: [], edges: [], edgesSynthesized: true };
  }

  const doc = raw as Record<string, unknown>;
  const nodesRaw = doc.nodes;
  const nodes = Array.isArray(nodesRaw)
    ? nodesRaw
        .map((item) => normalizeWorkflowNode(item))
        .filter((item): item is WorkflowNodeDef => item !== null)
    : [];

  const hasEdgesField = Object.prototype.hasOwnProperty.call(doc, 'edges');
  const edges = hasEdgesField
    ? parseWorkflowEdges(doc.edges)
    : synthesizeAlwaysEdges(nodes);
  const entryNodeId =
    typeof doc.entryNodeId === 'string' && doc.entryNodeId.trim()
      ? doc.entryNodeId.trim()
      : nodes[0]?.id;

  return {
    nodes,
    edges,
    entryNodeId,
    edgesSynthesized: !hasEdgesField,
  };
}

/** 兼容旧 parseWorkflowNodes：仅取节点数组 */
export function parseWorkflowNodes(raw: unknown): WorkflowNodeDef[] {
  return parseWorkflowGraph(raw).nodes;
}

export function toWorkflowNodesDocument(
  nodes: WorkflowNodeDef[],
  edges: WorkflowEdge[],
  entryNodeId?: string,
): WorkflowNodesDocument {
  const resolvedEdges =
    edges.length > 0 ? edges : synthesizeAlwaysEdges(nodes);
  return {
    nodes,
    edges: resolvedEdges,
    entryNodeId: entryNodeId ?? nodes[0]?.id,
  };
}

export function buildClueBranchTemplate(): ParsedWorkflowGraph {
  const detectId = 'intent';
  const tipId = 'branch_default';
  const nodes: WorkflowNodeDef[] = [
    {
      id: detectId,
      action: 'detect_clues',
      name: '状态识别',
      objective: '识别当前状态并走对应分支',
      input: {},
    },
    createDefaultBranchTip(tipId),
  ];
  const edges: WorkflowEdge[] = [
    { id: 'e_default', from: detectId, to: tipId, kind: 'default' },
  ];
  return {
    nodes,
    edges,
    entryNodeId: detectId,
    edgesSynthesized: false,
  };
}

export function listMergeNodeCandidates(
  nodes: WorkflowNodeDef[],
  edges: WorkflowEdge[],
  detectId: string,
): WorkflowNodeDef[] {
  const clueTargets = new Set(
    listDetectClueEdges(edges, detectId).map((clue) => clue.to),
  );
  return nodes.filter(
    (node) =>
      node.id !== detectId &&
      !clueTargets.has(node.id) &&
      !isBranchTipNode(node),
  );
}

function hasCycle(nodes: WorkflowNodeDef[], edges: WorkflowEdge[]): boolean {
  const ids = new Set(nodes.map((node) => node.id));
  const outgoing = new Map<string, string[]>();
  for (const id of ids) {
    outgoing.set(id, []);
  }
  for (const edge of edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) {
      continue;
    }
    outgoing.get(edge.from)?.push(edge.to);
  }

  const visited = new Set<string>();
  const stack = new Set<string>();

  const dfs = (nodeId: string): boolean => {
    if (stack.has(nodeId)) {
      return true;
    }
    if (visited.has(nodeId)) {
      return false;
    }
    visited.add(nodeId);
    stack.add(nodeId);
    for (const next of outgoing.get(nodeId) ?? []) {
      if (dfs(next)) {
        return true;
      }
    }
    stack.delete(nodeId);
    return false;
  };

  for (const id of ids) {
    if (dfs(id)) {
      return true;
    }
  }
  return false;
}

export function validateWorkflowGraph(
  nodes: WorkflowNodeDef[],
  edges: WorkflowEdge[],
  entryNodeId?: string,
): WorkflowGraphValidationIssue[] {
  const issues: WorkflowGraphValidationIssue[] = [];
  if (nodes.length > 1 && edges.length === 0) {
    issues.push({ code: 'edges_empty' });
    return issues;
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  for (const edge of edges) {
    if (!nodeById.has(edge.from) || !nodeById.has(edge.to)) {
      issues.push({
        code: 'unknown_endpoint',
        path: edge.id,
      });
    }
  }

  if (hasCycle(nodes, edges)) {
    issues.push({ code: 'cycle' });
  }

  const detectNodes = nodes.filter((node) => node.action === 'detect_clues');
  if (detectNodes.length > 1) {
    issues.push({ code: 'multiple_detect_clues' });
  }

  for (const detect of detectNodes) {
    const outgoing = edges.filter((edge) => edge.from === detect.id);
    if (outgoing.length === 0) {
      issues.push({ code: 'detect_no_outgoing', path: detect.id });
      continue;
    }

    const clueEdges = outgoing.filter((edge) => (edge.kind ?? 'always') === 'clue');
    const defaultEdges = outgoing.filter(
      (edge) => (edge.kind ?? 'always') === 'default',
    );
    const alwaysEdges = outgoing.filter(
      (edge) => (edge.kind ?? 'always') === 'always',
    );

    if (alwaysEdges.length > 0) {
      issues.push({
        code: 'invalid_detect_edge_kind',
        path: detect.id,
      });
    }

    for (const edge of clueEdges) {
      if (!edge.clue?.key?.trim() || !edge.clue?.description?.trim()) {
        issues.push({ code: 'clue_fields_required', path: edge.id });
      }
    }

    const keys = clueEdges.map((edge) => edge.clue?.key?.trim() ?? '');
    if (keys.filter(Boolean).length !== new Set(keys.filter(Boolean)).size) {
      issues.push({ code: 'duplicate_clue_key', path: detect.id });
    }

    const targets = clueEdges.map((edge) => edge.to);
    if (targets.length !== new Set(targets).size) {
      issues.push({ code: 'duplicate_clue_target', path: detect.id });
    }

    if (clueEdges.length > 0) {
      if (defaultEdges.length === 0) {
        issues.push({ code: 'missing_default', path: detect.id });
      }
      if (defaultEdges.length > 1) {
        issues.push({ code: 'duplicate_default', path: detect.id });
      }
      const defaultTo = defaultEdges[0]?.to;
      if (defaultTo && clueEdges.some((edge) => edge.to === defaultTo)) {
        issues.push({
          code: 'default_overlaps_clue_target',
          path: detect.id,
        });
      }
      // 各状态分支可各自收尾，不要求 always 汇合到同一点
    }
  }

  for (const edge of edges) {
    const kind = edge.kind ?? 'always';
    if (kind === 'clue' || kind === 'default') {
      const source = nodeById.get(edge.from);
      if (source && source.action !== 'detect_clues') {
        issues.push({
          code: 'non_detect_branch_edge',
          path: edge.id,
        });
      }
    }
  }

  if (nodes.length > 0) {
    const entryId =
      (entryNodeId && nodes.some((node) => node.id === entryNodeId)
        ? entryNodeId
        : nodes[0]?.id) ?? undefined;
    const reachable = new Set<string>();
    if (entryId) {
      const queue = [entryId];
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (reachable.has(current)) {
          continue;
        }
        reachable.add(current);
        for (const edge of edges) {
          if (edge.from === current && !reachable.has(edge.to)) {
            queue.push(edge.to);
          }
        }
      }
    }
    for (const node of nodes) {
      if (!reachable.has(node.id)) {
        issues.push({ code: 'unreachable_node', path: node.id });
      }
    }
  }

  return issues;
}

export function edgeKindOf(edge: Pick<WorkflowEdge, 'kind'>): WorkflowEdgeKind {
  return edge.kind ?? 'always';
}

export function isDetectCluesAction(
  action: WorkflowActionKind | string,
): boolean {
  return action === 'detect_clues';
}

export type DetectClueListItem = {
  edgeId: string;
  key: string;
  description: string;
  to: string;
};

export function listDetectClueEdges(
  edges: WorkflowEdge[],
  detectId: string,
): DetectClueListItem[] {
  return edges
    .filter(
      (edge) =>
        edge.from === detectId && (edge.kind ?? 'always') === 'clue',
    )
    .map((edge) => ({
      edgeId: edge.id,
      key: edge.clue?.key ?? '',
      description: edge.clue?.description ?? '',
      to: edge.to,
    }));
}

export function findDetectDefaultEdge(
  edges: WorkflowEdge[],
  detectId: string,
): WorkflowEdge | undefined {
  return edges.find(
    (edge) =>
      edge.from === detectId && (edge.kind ?? 'always') === 'default',
  );
}

export function inferMergeNodeId(
  nodes: WorkflowNodeDef[],
  edges: WorkflowEdge[],
  detectId: string,
): string | undefined {
  const defaultEdge = findDetectDefaultEdge(edges, detectId);
  if (defaultEdge?.to) {
    return defaultEdge.to;
  }
  const preferred = [...nodes]
    .reverse()
    .find(
      (node) =>
        node.id !== detectId &&
        (node.action === 'summarize' || node.action === 'generate_and_push'),
    );
  return preferred?.id ?? nodes.find((node) => node.id !== detectId)?.id;
}

function newEdgeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function ensureDetectDefaultEdge(
  edges: WorkflowEdge[],
  detectId: string,
  mergeNodeId: string,
): WorkflowEdge[] {
  const existing = findDetectDefaultEdge(edges, detectId);
  if (existing) {
    if (existing.to === mergeNodeId) {
      return edges;
    }
    return edges.map((edge) =>
      edge.id === existing.id ? { ...edge, to: mergeNodeId } : edge,
    );
  }
  return [
    ...edges,
    {
      id: newEdgeId('e_default'),
      from: detectId,
      to: mergeNodeId,
      kind: 'default',
    },
  ];
}

/** 分支末梢标记：状态识别只产出状态节点，末梢无业务动作，需用户再点 + 选择动作 */
export const BRANCH_TIP_FLAG = '__branchTip';

export function isBranchTipNode(
  node: Pick<WorkflowNodeDef, 'input'> | null | undefined,
): boolean {
  return node?.input?.[BRANCH_TIP_FLAG] === true;
}

function createDefaultBranchTip(tipId: string): WorkflowNodeDef {
  return {
    id: tipId,
    action: 'summarize',
    name: '未命中',
    objective: '未命中任一状态时的处理',
    input: {
      [BRANCH_TIP_FLAG]: true,
      mode: 'final',
      stream: true,
    },
  };
}

/**
 * 确保未命中兜底也是一条独立分支（default 边 + tip），
 * 由用户在 tip 下点 + 挂业务节点，而不是从已有节点里下拉选。
 */
export function ensureDetectDefaultBranch(
  nodes: WorkflowNodeDef[],
  edges: WorkflowEdge[],
  detectId: string,
): { nodes: WorkflowNodeDef[]; edges: WorkflowEdge[] } {
  const existing = findDetectDefaultEdge(edges, detectId);
  if (existing) {
    const target = nodes.find((node) => node.id === existing.to);
    if (target) {
      return { nodes, edges };
    }
    // 边悬空：重建 tip 并改写 to
    let tipId = 'branch_default';
    if (nodes.some((node) => node.id === tipId)) {
      tipId = `${tipId}_${Date.now()}`;
    }
    return {
      nodes: [...nodes, createDefaultBranchTip(tipId)],
      edges: ensureDetectDefaultEdge(edges, detectId, tipId),
    };
  }

  let tipId = 'branch_default';
  if (nodes.some((node) => node.id === tipId)) {
    tipId = `${tipId}_${Date.now()}`;
  }
  return {
    nodes: [...nodes, createDefaultBranchTip(tipId)],
    edges: ensureDetectDefaultEdge(edges, detectId, tipId),
  };
}

/** 状态识别只产出分支：生成 clue 边 + 轻量状态节点 */
export function createDetectBranch(
  nodes: WorkflowNodeDef[],
  edges: WorkflowEdge[],
  detectId: string,
  clue: { key: string; description: string },
): { nodes: WorkflowNodeDef[]; edges: WorkflowEdge[] } {
  const key = clue.key.trim();
  const description = clue.description.trim();
  const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_') || 'branch';
  let tipId = `branch_${safeKey}`;
  if (nodes.some((node) => node.id === tipId)) {
    tipId = `${tipId}_${Date.now()}`;
  }

  const tip: WorkflowNodeDef = {
    id: tipId,
    // action 占位，落库前用户应再点 + 换成真实动作；渲染为轻量「状态」节点
    action: 'summarize',
    name: key || '新状态',
    objective: description || '',
    input: {
      [BRANCH_TIP_FLAG]: true,
      mode: 'final',
      stream: true,
    },
  };

  const clueEdge: WorkflowEdge = {
    id: newEdgeId(`e_clue_${safeKey}`),
    from: detectId,
    to: tipId,
    kind: 'clue',
    clue: { key, description },
  };

  // 新增状态分支时同步保证有未命中兜底 tip，避免再从现有节点里选
  return ensureDetectDefaultBranch(
    [...nodes, tip],
    [...edges, clueEdge],
    detectId,
  );
}

/** 把状态分支末梢换成真实业务节点，保留 id 使 clue 边继续有效；不复制其它分支的节点 */
export function materializeBranchTip(
  nodes: WorkflowNodeDef[],
  tipId: string,
  action: WorkflowActionKind,
): WorkflowNodeDef[] {
  return nodes.map((node) => {
    if (node.id !== tipId || !isBranchTipNode(node)) {
      return node;
    }
    const label = node.name?.trim() || action.replace(/_/g, ' ');
    return {
      id: tipId,
      action,
      name: label,
      objective: node.objective?.trim() || label,
      input: defaultInputForAction(action),
    };
  });
}

export function addDetectClue(
  nodes: WorkflowNodeDef[],
  edges: WorkflowEdge[],
  detectId: string,
  clue: { key: string; description: string },
  options: {
    targetNodeId: string;
  },
): { nodes: WorkflowNodeDef[]; edges: WorkflowEdge[] } {
  const targetId = options.targetNodeId.trim();
  if (!targetId) {
    return { nodes, edges };
  }

  const clueEdge: WorkflowEdge = {
    id: newEdgeId(`e_clue_${clue.key || 'new'}`),
    from: detectId,
    to: targetId,
    kind: 'clue',
    clue: {
      key: clue.key.trim(),
      description: clue.description.trim(),
    },
  };
  return { nodes, edges: [...edges, clueEdge] };
}

export function updateDetectClueEdge(
  nodes: WorkflowNodeDef[],
  edges: WorkflowEdge[],
  edgeId: string,
  patch: {
    key?: string;
    description?: string;
    to?: string;
  },
): { nodes: WorkflowNodeDef[]; edges: WorkflowEdge[] } {
  const prev = edges.find((edge) => edge.id === edgeId);
  const nextEdges = edges.map((edge) => {
    if (edge.id !== edgeId) {
      return edge;
    }
    return {
      ...edge,
      to: patch.to ?? edge.to,
      clue: {
        key: patch.key ?? edge.clue?.key ?? '',
        description: patch.description ?? edge.clue?.description ?? '',
      },
    };
  });

  let nextNodes = nodes;
  const nextTo = patch.to ?? prev?.to;
  if (prev?.to && nextTo && prev.to !== nextTo) {
    const orphanId = prev.to;
    const stillUsed = nextEdges.some(
      (edge) => edge.to === orphanId || edge.from === orphanId,
    );
    if (!stillUsed && isBranchTipNode(nodes.find((n) => n.id === orphanId))) {
      nextNodes = nextNodes.filter((node) => node.id !== orphanId);
    }
  }

  return { nodes: nextNodes, edges: nextEdges };
}

export function removeDetectClueEdge(
  nodes: WorkflowNodeDef[],
  edges: WorkflowEdge[],
  detectId: string,
  edgeId: string,
  options?: { cascadeLeaf?: boolean },
): { nodes: WorkflowNodeDef[]; edges: WorkflowEdge[] } {
  const removed = edges.find((edge) => edge.id === edgeId);
  let nextEdges = edges.filter((edge) => edge.id !== edgeId);
  let nextNodes = nodes;

  if (options?.cascadeLeaf !== false && removed?.to) {
    const leafId = removed.to;
    const leaf = nodes.find((node) => node.id === leafId);
    // 仅级联删除未落地的分支末梢；业务节点由用户自行决定去留
    if (isBranchTipNode(leaf)) {
      const inCount = edges.filter(
        (edge) => edge.to === leafId && edge.id !== edgeId,
      ).length;
      if (inCount === 0) {
        nextEdges = nextEdges.filter(
          (edge) => edge.from !== leafId && edge.to !== leafId,
        );
        nextNodes = nextNodes.filter((node) => node.id !== leafId);
      }
    }
  }

  const remainingClues = listDetectClueEdges(nextEdges, detectId);
  if (remainingClues.length === 0) {
    const defaultEdge = findDetectDefaultEdge(nextEdges, detectId);
    nextEdges = nextEdges.filter(
      (edge) =>
        !(edge.from === detectId && (edge.kind ?? 'always') === 'default'),
    );
    // 无状态时一并收掉未落地的兜底 tip
    if (defaultEdge?.to) {
      const tipId = defaultEdge.to;
      if (isBranchTipNode(nextNodes.find((node) => node.id === tipId))) {
        const stillUsed = nextEdges.some(
          (edge) => edge.to === tipId || edge.from === tipId,
        );
        if (!stillUsed) {
          nextNodes = nextNodes.filter((node) => node.id !== tipId);
        }
      }
    }
  }

  return { nodes: nextNodes, edges: nextEdges };
}

export function appendNodePreservingEdges(
  nodes: WorkflowNodeDef[],
  edges: WorkflowEdge[],
  node: WorkflowNodeDef,
): { nodes: WorkflowNodeDef[]; edges: WorkflowEdge[] } {
  const nextNodes = [...nodes, node];
  if (nodes.length === 0) {
    return { nodes: nextNodes, edges: [] };
  }
  // Prefer append from a terminal (no out) non-detect node; else from last node via always
  const outSources = new Set(edges.map((edge) => edge.from));
  const terminal =
    [...nodes]
      .reverse()
      .find(
        (item) =>
          item.action !== 'detect_clues' && !outSources.has(item.id),
      ) ?? nodes[nodes.length - 1];

  if (terminal.action === 'detect_clues') {
    // Do not create always from detect; leave unconnected for operator wiring
    return { nodes: nextNodes, edges };
  }

  return {
    nodes: nextNodes,
    edges: [
      ...edges,
      {
        id: newEdgeId(`e_${terminal.id}_${node.id}`),
        from: terminal.id,
        to: node.id,
        kind: 'always',
      },
    ],
  };
}
