import { PlusOutlined } from '@ant-design/icons';
import type { HostTool } from '@/types/host-tool';
import type { Tool } from '@/types/tool';
import type { WorkflowActionKind, WorkflowNodeDef } from '@/types/workflow';
import { useIntl } from '@umijs/max';
import type { Graph } from '@antv/x6';
import { Dropdown } from 'antd';
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
import styles from '../index.module.scss';
import WorkflowNodePropertyDrawer from './WorkflowNodePropertyDrawer';
import {
  buildWorkflowActionMenuItems,
  WorkflowFlowPlusOverlay,
} from './WorkflowFlowPlusOverlay';
import WorkflowPhaseLegend from './WorkflowPhaseLegend';
import {
  applyWorkflowNodesToGraph,
  extractWorkflowNodesFromGraph,
  insertWorkflowNodeAfter,
  nodesSignature,
  removeWorkflowNode,
} from './workflowFlowAdapter';
import { useWorkflowFlowGraph } from './useWorkflowFlowGraph';
import {
  resetWorkflowFlowNodeLabelResolver,
  setWorkflowFlowGateHintResolver,
  setWorkflowFlowNodeLabelResolver,
} from './workflowFlowLabels';
import './workflowFlowShapes';

type WorkflowFlowCanvasProps = {
  profile: string;
  nodes: WorkflowNodeDef[];
  tools: Tool[];
  hostTools: HostTool[];
  toolsLoading?: boolean;
  disabled?: boolean;
  onChange: (nodes: WorkflowNodeDef[]) => void;
};

const WorkflowFlowCanvas: React.FC<WorkflowFlowCanvasProps> = ({
  profile,
  nodes,
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
  nodesRef.current = nodes;
  const lastEmittedSignatureRef = useRef('');

  const [orientation, setOrientation] = useState<FlowCanvasOrientation>('vertical');
  const [zoomPercent, setZoomPercent] = useState(100);
  const [plusDropdownNodeId, setPlusDropdownNodeId] = useState<string | null>(null);
  const [plusButtonPositions, setPlusButtonPositions] = useState<
    { id: string; left: number; top: number }[]
  >([]);
  const [overlayTransform, setOverlayTransform] = useState({
    scale: 1,
    tx: 0,
    ty: 0,
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [graphReady, setGraphReady] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const phaseGroups = useMemo(
    () => actionsGroupedByPhase(profile),
    [profile],
  );

  useEffect(() => {
    setWorkflowFlowNodeLabelResolver((phase) =>
      intl.formatMessage({ id: `workflow.phase.${phase}.short` }),
    );
    setWorkflowFlowGateHintResolver(() =>
      intl.formatMessage({ id: 'workflow.node.awaitUserConfirmHint' }),
    );
    return () => {
      resetWorkflowFlowNodeLabelResolver();
    };
  }, [intl]);

  const emitGraphNodes = useCallback(() => {
    const graph = graphRef.current;
    if (!graph || syncingFromPropsRef.current || suppressEmitRef.current) {
      return;
    }
    const nextNodes = extractWorkflowNodesFromGraph(graph);
    if (nextNodes.length === 0 && nodesRef.current.length > 0) {
      return;
    }
    const signature = nodesSignature(nextNodes);
    if (signature === lastEmittedSignatureRef.current) {
      return;
    }
    lastEmittedSignatureRef.current = signature;
    onChange(nextNodes);
  }, [onChange]);

  const { graphRef: hookGraphRef } = useWorkflowFlowGraph({
    containerRef,
    disabled,
    suppressEmitRef,
    onCellsChanged: emitGraphNodes,
    onNodeSelect: setSelectedNodeId,
    onNodeDblClick: (nodeId) => {
      setSelectedNodeId(nodeId);
      setDrawerOpen(true);
    },
    setPlusButtonPositions,
    nodeIdsWithNoOutputRef,
    setOverlayTransform,
    onReady: setGraphReady,
  });

  useEffect(() => {
    graphRef.current = hookGraphRef.current;
  }, [hookGraphRef]);

  const loadNodesToGraph = useCallback(
    async (
      nextNodes: WorkflowNodeDef[],
      nextOrientation: FlowCanvasOrientation,
    ) => {
      const graph = graphRef.current;
      if (!graph) {
        return;
      }
      syncingFromPropsRef.current = true;
      suppressEmitRef.current = true;
      try {
        await applyWorkflowNodesToGraph(graph, nextNodes, nextOrientation);
        lastEmittedSignatureRef.current = nodesSignature(nextNodes);
        setZoomPercent(Math.round(graph.zoom() * 100));
      } finally {
        syncingFromPropsRef.current = false;
        suppressEmitRef.current = false;
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
    const incomingSignature = nodesSignature(nodes);
    if (
      incomingSignature === lastEmittedSignatureRef.current &&
      graph.getNodes().length > 0
    ) {
      return;
    }
    void loadNodesToGraph(nodes, orientation);
  }, [graphReady, intl.locale, loadNodesToGraph, nodes, orientation]);

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
      const nextNodes = [...nodes, createEmptyWorkflowNode(action)];
      lastEmittedSignatureRef.current = nodesSignature(nextNodes);
      onChange(nextNodes);
      if (graphReady) {
        loadNodesToGraph(nextNodes, orientation);
      }
    },
    [disabled, graphReady, loadNodesToGraph, nodes, onChange, orientation],
  );

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

  const handleAddNodeAfter = async (
    fromNodeId: string,
    action: WorkflowActionKind,
  ) => {
    const graph = graphRef.current;
    if (!graph || disabled) {
      return;
    }
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
    emitGraphNodes();
  };

  const handleSaveNode = (node: WorkflowNodeDef) => {
    const anchorId = selectedNodeId ?? node.id;
    const nextNodes = nodes.map((item) => (item.id === anchorId ? node : item));
    lastEmittedSignatureRef.current = nodesSignature(nextNodes);
    onChange(nextNodes);
    if (graphReady) {
      loadNodesToGraph(nextNodes, orientation);
    }
    if (node.id !== anchorId) {
      setSelectedNodeId(node.id);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    const graph = graphRef.current;
    if (!graph || disabled) {
      return;
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
    emitGraphNodes();
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
      graph.clearCells();
      lastEmittedSignatureRef.current = nodesSignature([]);
      onChange([]);
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

  return (
    <div className={styles.workflowFlowCanvas}>
      <div className={styles.workflowNodeEditorHeader}>
        <h3 className={styles.workflowNodeEditorTitle}>
          {intl.formatMessage({ id: 'workflow.nodes.title' })}
        </h3>
        <div className="flex items-center gap-2">
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
        tools={tools}
        hostTools={hostTools}
        toolsLoading={toolsLoading}
        disabled={disabled}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
      />
    </div>
  );
};

export default WorkflowFlowCanvas;
