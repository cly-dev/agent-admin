import { PlusOutlined } from '@ant-design/icons';
import type { HostTool } from '@/types/host-tool';
import type { Tool } from '@/types/tool';
import type {
  WorkflowActionKind,
  WorkflowEdge,
  WorkflowNodeDef,
} from '@/types/workflow';
import { useIntl } from '@umijs/max';
import type { Graph } from '@antv/x6';
import { Dropdown, Form, Input, Modal, message } from 'antd';
import type { MenuProps } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlowCanvasToolbar } from '@/components/flow/FlowEditor/components/FlowCanvasToolbar';
import {
  formatCanvas,
  type FlowCanvasOrientation,
} from '@/components/flow/FlowEditor/utils/flowCanvasFormatter';
import {
  actionsGroupedByPhase,
  defaultActionForProfile,
  type WorkflowNodePhase,
} from '../workflowNodePhase';
import { createEmptyWorkflowNode } from '../workflowShared';
import {
  appendNodePreservingEdges,
  BRANCH_TIP_FLAG,
  buildClueBranchTemplate,
  createDetectBranch,
  isBranchTipNode,
  removeDetectClueEdge,
  synthesizeAlwaysEdges,
  updateDetectClueEdge,
} from '../workflowGraph';
import styles from '../index.module.scss';
import WorkflowEdgePropertyDrawer from './WorkflowEdgePropertyDrawer';
import WorkflowNodePropertyDrawer from './WorkflowNodePropertyDrawer';
import {
  buildWorkflowActionMenuItems,
  WorkflowFlowPlusOverlay,
} from './WorkflowFlowPlusOverlay';
import WorkflowPhaseLegend from './WorkflowPhaseLegend';
import {
  applyWorkflowGraphToCanvas,
  extractWorkflowGraphFromCanvas,
  graphSignature,
  insertWorkflowNodeAfter,
  readEdgeData,
  removeWorkflowNode,
  updateWorkflowEdgeVisual,
} from './workflowFlowAdapter';
import { useWorkflowFlowGraph } from './useWorkflowFlowGraph';
import {
  resetWorkflowFlowNodeLabelResolver,
  setWorkflowFlowEdgeLabelResolver,
  setWorkflowFlowGateHintResolver,
  setWorkflowFlowNodeLabelResolver,
} from './workflowFlowLabels';
import './workflowFlowShapes';

export type WorkflowGraphChange = {
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdge[];
  entryNodeId?: string;
};

type WorkflowFlowCanvasProps = {
  profile: string;
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdge[];
  entryNodeId?: string;
  tools: Tool[];
  hostTools: HostTool[];
  toolsLoading?: boolean;
  disabled?: boolean;
  onChange: (graph: WorkflowGraphChange) => void;
};

const WorkflowFlowCanvas: React.FC<WorkflowFlowCanvasProps> = ({
  profile,
  nodes,
  edges,
  entryNodeId,
  tools,
  hostTools,
  toolsLoading = false,
  disabled = false,
  onChange,
}) => {
  const intl = useIntl();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const nodeIdsWithNoOutputRef = useRef<string[]>([]);
  const syncingFromPropsRef = useRef(false);
  const suppressEmitRef = useRef(false);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;
  const lastEmittedSignatureRef = useRef('');

  const [orientation, setOrientation] =
    useState<FlowCanvasOrientation>('vertical');
  const [zoomPercent, setZoomPercent] = useState(100);
  const [plusDropdownNodeId, setPlusDropdownNodeId] = useState<string | null>(
    null,
  );
  const [plusButtonPositions, setPlusButtonPositions] = useState<
    { id: string; left: number; top: number }[]
  >([]);
  const [overlayTransform, setOverlayTransform] = useState({
    scale: 1,
    tx: 0,
    ty: 0,
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [edgeDrawerOpen, setEdgeDrawerOpen] = useState(false);
  const [graphReady, setGraphReady] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [pendingDetectId, setPendingDetectId] = useState<string | null>(null);
  const [editingBranchEdgeId, setEditingBranchEdgeId] = useState<string | null>(
    null,
  );
  const [clueForm] = Form.useForm<{ key: string; description: string }>();
  const [tipContextMenu, setTipContextMenu] = useState<{
    nodeId: string;
    x: number;
    y: number;
  } | null>(null);

  const phaseGroups = useMemo(() => {
    const groups = actionsGroupedByPhase(profile);
    const hasDetect = nodes.some((node) => node.action === 'detect_clues');
    if (!hasDetect) {
      return groups;
    }
    return groups.map((group) => ({
      ...group,
      actions: group.actions.filter((action) => action !== 'detect_clues'),
    }));
  }, [nodes, profile]);

  useEffect(() => {
    setWorkflowFlowNodeLabelResolver((phase) =>
      intl.formatMessage({ id: `workflow.phase.${phase}.short` }),
    );
    setWorkflowFlowGateHintResolver(() =>
      intl.formatMessage({ id: 'workflow.node.awaitUserConfirmHint' }),
    );
    setWorkflowFlowEdgeLabelResolver((kind) => {
      // clue / default 文案在 tip 节点上，连线不标文字
      if (kind === 'clue' || kind === 'default') {
        return '';
      }
      return '';
    });
    return () => {
      resetWorkflowFlowNodeLabelResolver();
    };
  }, [intl]);

  const emitGraph = useCallback(() => {
    const graph = graphRef.current;
    if (!graph || syncingFromPropsRef.current || suppressEmitRef.current) {
      return;
    }
    const next = extractWorkflowGraphFromCanvas(graph);
    if (next.nodes.length === 0 && nodesRef.current.length > 0) {
      return;
    }
    const signature = graphSignature(next.nodes, next.edges);
    if (signature === lastEmittedSignatureRef.current) {
      return;
    }
    lastEmittedSignatureRef.current = signature;
    onChange({
      ...next,
      entryNodeId: entryNodeId ?? next.entryNodeId,
    });
  }, [entryNodeId, onChange]);

  const findClueEdgeForTip = useCallback(
    (tipId: string, sourceEdges: WorkflowEdge[]) =>
      sourceEdges.find(
        (edge) =>
          edge.to === tipId && (edge.kind ?? 'always') === 'clue',
      ),
    [],
  );

  const openEditBranch = useCallback(
    (edgeId: string) => {
      if (disabled) {
        return;
      }
      const resolvedEdges =
        edges.length > 0 ? edges : synthesizeAlwaysEdges(nodes);
      const edge = resolvedEdges.find((item) => item.id === edgeId);
      if (!edge) {
        return;
      }
      setEditingBranchEdgeId(edgeId);
      setPendingDetectId(edge.from);
      clueForm.setFieldsValue({
        key: edge.clue?.key ?? '',
        description: edge.clue?.description ?? '',
      });
      setTipContextMenu(null);
    },
    [clueForm, disabled, edges, nodes],
  );

  const openEditTipByNodeId = useCallback(
    (nodeId: string) => {
      const resolvedEdges =
        edges.length > 0 ? edges : synthesizeAlwaysEdges(nodes);
      const edge = findClueEdgeForTip(nodeId, resolvedEdges);
      if (edge) {
        openEditBranch(edge.id);
      }
    },
    [edges, findClueEdgeForTip, nodes, openEditBranch],
  );

  const { graphRef: hookGraphRef } = useWorkflowFlowGraph({
    containerRef,
    disabled,
    suppressEmitRef,
    onCellsChanged: emitGraph,
    onNodeSelect: (nodeId) => {
      setSelectedNodeId(nodeId);
      setTipContextMenu(null);
      if (nodeId) {
        setSelectedEdgeId(null);
        setEdgeDrawerOpen(false);
      }
    },
    onNodeDblClick: (nodeId) => {
      const node = nodesRef.current.find((item) => item.id === nodeId);
      if (node && isBranchTipNode(node)) {
        openEditTipByNodeId(nodeId);
        return;
      }
      setSelectedNodeId(nodeId);
      setSelectedEdgeId(null);
      setEdgeDrawerOpen(false);
      setDrawerOpen(true);
    },
    onNodeContextMenu: (nodeId, clientX, clientY) => {
      const node = nodesRef.current.find((item) => item.id === nodeId);
      if (!node || !isBranchTipNode(node) || disabled) {
        return;
      }
      setSelectedNodeId(nodeId);
      setTipContextMenu({ nodeId, x: clientX, y: clientY });
    },
    onEdgeSelect: (edgeId) => {
      setSelectedEdgeId(edgeId);
      setTipContextMenu(null);
      if (edgeId) {
        setSelectedNodeId(null);
        setDrawerOpen(false);
      }
    },
    onEdgeDblClick: (edgeId) => {
      setSelectedEdgeId(edgeId);
      setSelectedNodeId(null);
      setDrawerOpen(false);
      setEdgeDrawerOpen(true);
    },
    setPlusButtonPositions,
    nodeIdsWithNoOutputRef,
    setOverlayTransform,
    onReady: setGraphReady,
  });

  useEffect(() => {
    graphRef.current = hookGraphRef.current;
  }, [hookGraphRef]);

  const loadGenerationRef = useRef(0);

  const loadGraphToCanvas = useCallback(
    async (
      nextNodes: WorkflowNodeDef[],
      nextEdges: WorkflowEdge[],
      nextOrientation: FlowCanvasOrientation,
    ) => {
      const graph = graphRef.current;
      if (!graph) {
        return;
      }
      const generation = ++loadGenerationRef.current;
      syncingFromPropsRef.current = true;
      suppressEmitRef.current = true;
      try {
        await applyWorkflowGraphToCanvas(
          graph,
          nextNodes,
          nextEdges,
          nextOrientation,
        );
        // 被更新的加载抢占则丢弃收尾，避免 clear/add 交叉导致重影
        if (generation !== loadGenerationRef.current) {
          return;
        }
        lastEmittedSignatureRef.current = graphSignature(
          nextNodes,
          nextEdges.length > 0 ? nextEdges : synthesizeAlwaysEdges(nextNodes),
        );
        setZoomPercent(Math.round(graph.zoom() * 100));
      } finally {
        if (generation === loadGenerationRef.current) {
          syncingFromPropsRef.current = false;
          suppressEmitRef.current = false;
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!graphReady) {
      return;
    }
    const graph = graphRef.current;
    if (!graph) {
      return;
    }
    const resolvedEdges =
      edges.length > 0 ? edges : synthesizeAlwaysEdges(nodes);
    const incomingSignature = graphSignature(nodes, resolvedEdges);
    if (incomingSignature === lastEmittedSignatureRef.current) {
      return;
    }
    void loadGraphToCanvas(nodes, resolvedEdges, orientation);
  }, [edges, graphReady, intl.locale, loadGraphToCanvas, nodes, orientation]);

  const applyGraphChange = useCallback(
    (nextNodes: WorkflowNodeDef[], nextEdges: WorkflowEdge[]) => {
      const resolvedEdges =
        nextEdges.length > 0 ? nextEdges : synthesizeAlwaysEdges(nextNodes);
      // 只回写 state，由上方 effect 唯一负责刷画布，避免双重 load 重影
      onChange({
        nodes: nextNodes,
        edges: resolvedEdges,
        entryNodeId: nextNodes[0]?.id ?? entryNodeId,
      });
    },
    [entryNodeId, onChange],
  );

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !graphReady) {
      return;
    }
    graph.getNodes().forEach((cell) => {
      const data = (cell.getData() ?? {}) as { selected?: boolean };
      const nextSelected = cell.id === selectedNodeId;
      if (data.selected !== nextSelected) {
        cell.setData({ ...data, selected: nextSelected });
      }
    });
  }, [graphReady, selectedNodeId]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const resolvedSelectedEdge = useMemo(() => {
    if (!selectedEdgeId) {
      return null;
    }
    const fromEdges =
      edges.length > 0 ? edges : synthesizeAlwaysEdges(nodes);
    const found = fromEdges.find((edge) => edge.id === selectedEdgeId);
    if (found) {
      return found;
    }
    const graph = graphRef.current;
    const cell = graph?.getCellById(selectedEdgeId);
    if (!cell?.isEdge()) {
      return null;
    }
    const data = readEdgeData(cell);
    return {
      id: data.workflowEdgeId,
      from: cell.getSourceCellId(),
      to: cell.getTargetCellId(),
      kind: data.kind,
      clue: data.clue,
    } satisfies WorkflowEdge;
  }, [edges, nodes, selectedEdgeId]);

  const selectedEdgeSourceIsDetect = useMemo(() => {
    if (!resolvedSelectedEdge) {
      return false;
    }
    return (
      nodes.find((node) => node.id === resolvedSelectedEdge.from)?.action ===
      'detect_clues'
    );
  }, [nodes, resolvedSelectedEdge]);

  const getActionLabel = useCallback(
    (action: WorkflowActionKind) =>
      intl.formatMessage({
        id: `workflow.action.${action}`,
        defaultMessage: action,
      }),
    [intl],
  );

  const getPhaseLabel = useCallback(
    (phase: WorkflowNodePhase) =>
      intl.formatMessage({
        id: `workflow.phase.${phase}`,
      }),
    [intl],
  );

  const allowedActions = useMemo(
    () => phaseGroups.flatMap((group) => group.actions),
    [phaseGroups],
  );

  const handleAddNodeWithAction = useCallback(
    (action: WorkflowActionKind) => {
      if (disabled) {
        return;
      }
      if (
        action === 'detect_clues' &&
        nodes.some((node) => node.action === 'detect_clues')
      ) {
        message.error(
          intl.formatMessage({
            id: 'workflow.graphValidation.multiple_detect_clues',
          }),
        );
        return;
      }
      const currentEdges =
        edges.length > 0 ? edges : synthesizeAlwaysEdges(nodes);
      const next = appendNodePreservingEdges(
        nodes,
        currentEdges,
        createEmptyWorkflowNode(action),
      );
      applyGraphChange(next.nodes, next.edges);
    },
    [applyGraphChange, disabled, edges, intl, nodes],
  );

  const handleDetectGraphChange = useCallback(
    (next: { nodes: WorkflowNodeDef[]; edges: WorkflowEdge[] }) => {
      applyGraphChange(next.nodes, next.edges);
    },
    [applyGraphChange],
  );

  const handleApplyClueTemplate = useCallback(() => {
    if (disabled) {
      return;
    }
    const template = buildClueBranchTemplate();
    applyGraphChange(template.nodes, template.edges);
    message.success(
      intl.formatMessage({ id: 'workflow.clueTemplate.applied' }),
    );
  }, [applyGraphChange, disabled, intl]);

  const addNodeMenuItems = useMemo(
    () =>
      buildWorkflowActionMenuItems(
        phaseGroups,
        getActionLabel,
        getPhaseLabel,
        (action) => {
          setAddMenuOpen(false);
          handleAddNodeWithAction(action);
        },
      ),
    [getActionLabel, getPhaseLabel, handleAddNodeWithAction, phaseGroups],
  );

  const handleDeleteBranch = useCallback(
    (edgeId: string) => {
      if (disabled) {
        return;
      }
      const resolvedEdges =
        edges.length > 0 ? edges : synthesizeAlwaysEdges(nodes);
      const edge = resolvedEdges.find((item) => item.id === edgeId);
      if (!edge) {
        return;
      }
      const next = removeDetectClueEdge(
        nodes,
        resolvedEdges,
        edge.from,
        edgeId,
        { cascadeLeaf: true },
      );
      applyGraphChange(next.nodes, next.edges);
      setTipContextMenu(null);
    },
    [applyGraphChange, disabled, edges, nodes],
  );

  const handleAddNodeAfter = async (
    fromNodeId: string,
    action: WorkflowActionKind,
  ) => {
    const graph = graphRef.current;
    if (!graph || disabled) {
      return;
    }
    if (
      action === 'detect_clues' &&
      nodes.some((node) => node.action === 'detect_clues')
    ) {
      message.error(
        intl.formatMessage({
          id: 'workflow.graphValidation.multiple_detect_clues',
        }),
      );
      setPlusDropdownNodeId(null);
      return;
    }

    // 分支矩形保留不动：在其下新增业务节点（always 边），不替换 tip
    const picked = allowedActions.includes(action)
      ? action
      : defaultActionForProfile(profile);
    const newNode = createEmptyWorkflowNode(picked);
    suppressEmitRef.current = true;
    try {
      await insertWorkflowNodeAfter(graph, fromNodeId, newNode, orientation);
    } finally {
      suppressEmitRef.current = false;
    }
    setPlusDropdownNodeId(null);
    emitGraph();
  };

  const handlePendingClueSave = async () => {
    const values = await clueForm.validateFields();
    const detectId = pendingDetectId;
    if (!detectId) {
      return;
    }
    const currentEdges =
      edges.length > 0 ? edges : synthesizeAlwaysEdges(nodes);

    if (editingBranchEdgeId) {
      const prev = currentEdges.find((edge) => edge.id === editingBranchEdgeId);
      let next = updateDetectClueEdge(
        nodes,
        currentEdges,
        editingBranchEdgeId,
        {
          key: values.key,
          description: values.description,
        },
      );
      if (prev?.to) {
        next = {
          ...next,
          nodes: next.nodes.map((node) =>
            node.id === prev.to && isBranchTipNode(node)
              ? {
                  ...node,
                  name: values.key.trim() || node.name,
                  objective:
                    values.description.trim() || node.objective,
                }
              : node,
          ),
        };
      }
      applyGraphChange(next.nodes, next.edges);
    } else {
      const next = createDetectBranch(nodes, currentEdges, detectId, {
        key: values.key,
        description: values.description,
      });
      applyGraphChange(next.nodes, next.edges);
    }
    setPendingDetectId(null);
    setEditingBranchEdgeId(null);
  };

  const handleSaveNode = (node: WorkflowNodeDef) => {
    const anchorId = selectedNodeId ?? node.id;
    const previous = nodes.find((item) => item.id === anchorId);
    const clearedInput =
      previous &&
      isBranchTipNode(previous) &&
      node.action !== previous.action
        ? Object.fromEntries(
            Object.entries(node.input ?? {}).filter(
              ([key]) => key !== BRANCH_TIP_FLAG,
            ),
          )
        : node.input;
    const nextNode = { ...node, input: clearedInput ?? {} };
    const nextNodes = nodes.map((item) =>
      item.id === anchorId ? nextNode : item,
    );
    const remappedEdges = (
      edges.length > 0 ? edges : synthesizeAlwaysEdges(nodes)
    ).map((edge) => ({
      ...edge,
      from: edge.from === anchorId ? nextNode.id : edge.from,
      to: edge.to === anchorId ? nextNode.id : edge.to,
    }));
    applyGraphChange(nextNodes, remappedEdges);
    if (nextNode.id !== anchorId) {
      setSelectedNodeId(nextNode.id);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    const graph = graphRef.current;
    if (!graph || disabled) {
      return;
    }
    const tip = nodes.find((node) => node.id === nodeId);
    if (tip && isBranchTipNode(tip)) {
      const resolvedEdges =
        edges.length > 0 ? edges : synthesizeAlwaysEdges(nodes);
      const clueEdge = findClueEdgeForTip(nodeId, resolvedEdges);
      if (clueEdge) {
        const next = removeDetectClueEdge(
          nodes,
          resolvedEdges,
          clueEdge.from,
          clueEdge.id,
          { cascadeLeaf: true },
        );
        applyGraphChange(next.nodes, next.edges);
        if (selectedNodeId === nodeId) {
          setSelectedNodeId(null);
        }
        return;
      }
    }
    suppressEmitRef.current = true;
    try {
      await removeWorkflowNode(graph, nodeId, orientation);
    } finally {
      suppressEmitRef.current = false;
    }
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
    emitGraph();
  };

  const handleSaveEdge = (nextEdge: WorkflowEdge) => {
    const graph = graphRef.current;
    const currentEdges =
      edges.length > 0 ? edges : synthesizeAlwaysEdges(nodes);
    const nextEdges = currentEdges.map((edge) =>
      edge.id === nextEdge.id ? nextEdge : edge,
    );
    if (graph) {
      const cell = graph.getCellById(nextEdge.id);
      if (cell?.isEdge()) {
        updateWorkflowEdgeVisual(cell, {
          workflowEdgeId: nextEdge.id,
          kind: nextEdge.kind ?? 'always',
          clue: nextEdge.clue,
        });
      }
    }
    applyGraphChange(nodes, nextEdges);
    setEdgeDrawerOpen(false);
  };

  const handleDeleteEdge = (edgeId: string) => {
    const graph = graphRef.current;
    if (graph) {
      const cell = graph.getCellById(edgeId);
      if (cell?.isEdge()) {
        graph.removeEdge(edgeId);
      }
    }
    const currentEdges =
      edges.length > 0 ? edges : synthesizeAlwaysEdges(nodes);
    applyGraphChange(
      nodes,
      currentEdges.filter((edge) => edge.id !== edgeId),
    );
    setSelectedEdgeId(null);
    setEdgeDrawerOpen(false);
  };

  const handleOrientationChange = (nextOrientation: FlowCanvasOrientation) => {
    const graph = graphRef.current;
    if (!graph) {
      setOrientation(nextOrientation);
      return;
    }
    setOrientation(nextOrientation);
    formatCanvas(graph, nextOrientation);
  };

  const handleZoomIn = () => {
    const graph = graphRef.current;
    if (!graph) {
      return;
    }
    graph.zoom(0.1);
    setZoomPercent(Math.round(graph.zoom() * 100));
  };

  const handleZoomOut = () => {
    const graph = graphRef.current;
    if (!graph) {
      return;
    }
    graph.zoom(-0.1);
    setZoomPercent(Math.round(graph.zoom() * 100));
  };

  const handleZoomFit = () => {
    const graph = graphRef.current;
    if (!graph) {
      return;
    }
    graph.zoomToFit({ padding: 24, maxScale: 1 });
    setZoomPercent(Math.round(graph.zoom() * 100));
  };

  const handleClear = () => {
    const graph = graphRef.current;
    if (!graph || disabled) {
      return;
    }
    suppressEmitRef.current = true;
    try {
      // 逐个 remove，勿 clearCells（React Shape 会残留重影）
      [...graph.getEdges()].forEach((edge) => {
        graph.removeEdge(edge.id);
      });
      [...graph.getNodes()].forEach((node) => {
        graph.removeNode(node.id);
      });
      lastEmittedSignatureRef.current = graphSignature([], []);
      onChange({ nodes: [], edges: [], entryNodeId: undefined });
    } finally {
      suppressEmitRef.current = false;
    }
  };

  const handleAutoLayout = () => {
    const graph = graphRef.current;
    if (!graph) {
      return;
    }
    formatCanvas(graph, orientation);
  };

  const tipContextMenuItems: MenuProps['items'] = (() => {
    if (!tipContextMenu) {
      return [];
    }
    const resolvedEdges =
      edges.length > 0 ? edges : synthesizeAlwaysEdges(nodes);
    const clueEdge = findClueEdgeForTip(
      tipContextMenu.nodeId,
      resolvedEdges,
    );
    // 未命中 tip 无 clue 可编辑；仅状态 tip 提供编辑/删除
    if (!clueEdge) {
      return [];
    }
    return [
      {
        key: 'edit',
        label: intl.formatMessage({ id: 'common.edit' }),
        onClick: () => openEditTipByNodeId(tipContextMenu.nodeId),
      },
      {
        key: 'delete',
        label: intl.formatMessage({ id: 'common.delete' }),
        danger: true,
        onClick: () => handleDeleteBranch(clueEdge.id),
      },
    ];
  })();

  return (
    <div className={styles.workflowFlowCanvas}>
      <div className={styles.workflowNodeEditorHeader}>
        <h3 className={styles.workflowNodeEditorTitle}>
          {intl.formatMessage({ id: 'workflow.nodes.title' })}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
            onClick={handleApplyClueTemplate}
          >
            {intl.formatMessage({ id: 'workflow.clueTemplate.apply' })}
          </button>
          <button
            type="button"
            className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
            onClick={handleAutoLayout}
          >
            {intl.formatMessage({ id: 'workflow.flowCanvas.autoLayout' })}
          </button>
          <Dropdown
            menu={{ items: addNodeMenuItems }}
            trigger={['click']}
            open={addMenuOpen}
            disabled={disabled}
            onOpenChange={setAddMenuOpen}
          >
            <button
              type="button"
              className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled}
            >
              <PlusOutlined />
              {intl.formatMessage({ id: 'workflow.nodes.add' })}
            </button>
          </Dropdown>
        </div>
      </div>

      <WorkflowPhaseLegend profile={profile} />

      <div className={styles.workflowFlowCanvasViewport}>
        {nodes.length === 0 ? (
          <div className={styles.workflowFlowCanvasEmpty}>
            <p>{intl.formatMessage({ id: 'workflow.nodes.empty' })}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold"
                disabled={disabled}
                onClick={handleApplyClueTemplate}
              >
                {intl.formatMessage({ id: 'workflow.clueTemplate.apply' })}
              </button>
              <Dropdown
                menu={{ items: addNodeMenuItems }}
                trigger={['click']}
                disabled={disabled}
              >
                <button
                  type="button"
                  className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold"
                  disabled={disabled}
                >
                  <PlusOutlined />
                  {intl.formatMessage({ id: 'workflow.nodes.add' })}
                </button>
              </Dropdown>
            </div>
          </div>
        ) : null}

        <div ref={containerRef} className={styles.workflowFlowCanvasSurface} />

        <WorkflowFlowPlusOverlay
          positions={plusButtonPositions}
          overlayTransform={overlayTransform}
          plusDropdownNodeId={plusDropdownNodeId}
          phaseGroups={phaseGroups}
          getActionLabel={getActionLabel}
          getPhaseLabel={getPhaseLabel}
          disabled={disabled}
          onOpenChange={setPlusDropdownNodeId}
          onAddNodeAfter={handleAddNodeAfter}
        />

        {tipContextMenu ? (
          <Dropdown
            menu={{ items: tipContextMenuItems }}
            open
            trigger={['contextMenu']}
            onOpenChange={(open) => {
              if (!open) {
                setTipContextMenu(null);
              }
            }}
          >
            <div
              className="pointer-events-auto fixed z-50 h-0 w-0"
              style={{ left: tipContextMenu.x, top: tipContextMenu.y }}
            />
          </Dropdown>
        ) : null}

        {nodes.length > 0 ? (
          <FlowCanvasToolbar
            placement="canvas"
            zoomPercent={zoomPercent}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoomFit={handleZoomFit}
            onClear={handleClear}
            orientation={orientation}
            onOrientationChange={handleOrientationChange}
          />
        ) : null}
      </div>

      <p className={styles.workflowFlowCanvasHint}>
        {intl.formatMessage({ id: 'workflow.flowCanvas.hint' })}
      </p>

      <WorkflowNodePropertyDrawer
        open={drawerOpen}
        node={selectedNode}
        profile={profile}
        nodes={nodes}
        edges={edges.length > 0 ? edges : synthesizeAlwaysEdges(nodes)}
        tools={tools}
        hostTools={hostTools}
        toolsLoading={toolsLoading}
        disabled={disabled}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
        onGraphChange={handleDetectGraphChange}
      />

      <WorkflowEdgePropertyDrawer
        open={edgeDrawerOpen}
        edge={resolvedSelectedEdge}
        sourceIsDetect={selectedEdgeSourceIsDetect}
        disabled={disabled}
        onClose={() => setEdgeDrawerOpen(false)}
        onSave={handleSaveEdge}
        onDelete={handleDeleteEdge}
      />

      <Modal
        className="app-modal"
        title={intl.formatMessage({
          id: editingBranchEdgeId
            ? 'workflow.detectClues.editTitle'
            : 'workflow.detectClues.addTitle',
        })}
        open={Boolean(pendingDetectId)}
        destroyOnClose
        okText={intl.formatMessage({ id: 'common.save' })}
        cancelText={intl.formatMessage({ id: 'common.cancel' })}
        onCancel={() => {
          setPendingDetectId(null);
          setEditingBranchEdgeId(null);
        }}
        onOk={() => void handlePendingClueSave()}
      >
        <p className="mb-3 mt-0 text-xs leading-relaxed text-on-surface/50">
          {intl.formatMessage({ id: 'workflow.detectClues.afterPlusHint' })}
        </p>
        <Form form={clueForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="key"
            label={intl.formatMessage({ id: 'workflow.edge.clueKey' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'workflow.edge.clueKeyRequired',
                }),
              },
            ]}
            extra={intl.formatMessage({ id: 'workflow.detectClues.keyExtra' })}
          >
            <Input className="app-input" placeholder="spam" />
          </Form.Item>
          <Form.Item
            name="description"
            label={intl.formatMessage({ id: 'workflow.edge.clueDescription' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'workflow.edge.clueDescriptionRequired',
                }),
              },
            ]}
          >
            <Input.TextArea
              className="app-input"
              rows={3}
              placeholder={intl.formatMessage({
                id: 'workflow.edge.clueDescriptionPlaceholder',
              })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkflowFlowCanvas;
