import { PlusOutlined } from '@ant-design/icons';
import { FlowCanvasToolbar } from '@/components/flow/FlowEditor/components/FlowCanvasToolbar';
import type { HostTool } from '@/types/host-tool';
import type { Tool } from '@/types/tool';
import type { FlowProfile } from '@/types/flow';
import type {
  FlowIntent,
  FlowIntentEdge,
  FlowIntentOperation,
  FlowIntentStep,
} from '@/types/flow-intent';
import { useIntl } from '@umijs/max';
import type { FlowCanvasOrientation } from '@/components/flow/FlowEditor/utils/flowCanvasFormatter';
import { Dropdown, Modal, message } from 'antd';
import type { MenuProps } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWorkflowFlowGraph } from '@/pages/Workflow/components/useWorkflowFlowGraph';
import styles from '../../Workflow/index.module.scss';
import {
  createDefaultStep,
} from '../flowIntentEditor';
import {
  isJudgeBranchTip,
  removeJudgeStateEdge,
} from '../judgeDetectBridge';
import {
  appendStepPreservingEdges,
  intentGraphSignature,
  removeStepFromGraph,
  resolveEntryStepId,
  resolveIntentEdges,
  updateStepInGraph,
} from '../intentGraph';
import {
  applyIntentGraphToCanvas,
  extractIntentGraphFromCanvas,
  insertIntentStepAfter,
  removeIntentStep,
} from './intentFlowAdapter';
import { INTENT_OPERATION_VISUAL, stepDisplayName } from './intentFlowVisual';
import IntentEdgePropertyDrawer from './IntentEdgePropertyDrawer';
import IntentStepPropertyDrawer from './IntentStepPropertyDrawer';
import './intentFlowShapes';
import type { FlowBindEntry } from '../flowBindEntry';
import { flowAllowsMutate } from '../flowBindEntry';

type IntentFlowCanvasProps = {
  value: FlowIntent;
  profile: FlowProfile;
  bindEntry?: FlowBindEntry | null;
  tools: Tool[];
  hostTools: HostTool[];
  toolsLoading?: boolean;
  disabled?: boolean;
  onChange: (next: FlowIntent) => void;
};

const ADDABLE_OPERATIONS: FlowIntentOperation[] = [
  'read',
  'judge',
  'deliver',
  'mutate',
];

function addableOperations(allowsMutate: boolean): FlowIntentOperation[] {
  if (allowsMutate) {
    return ADDABLE_OPERATIONS;
  }
  return ADDABLE_OPERATIONS.filter((operation) => operation !== 'mutate');
}

const IntentFlowCanvas: React.FC<IntentFlowCanvasProps> = ({
  value,
  profile,
  bindEntry = null,
  tools,
  hostTools,
  toolsLoading = false,
  disabled = false,
  onChange,
}) => {
  const intl = useIntl();
  const allowsMutate = flowAllowsMutate(bindEntry);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeIdsWithNoOutputRef = useRef<string[]>([]);
  const syncingFromPropsRef = useRef(false);
  const suppressEmitRef = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;
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
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [edgeDrawerOpen, setEdgeDrawerOpen] = useState(false);
  const [graphReady, setGraphReady] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [pendingJudgeEdgeId, setPendingJudgeEdgeId] = useState<string | null>(
    null,
  );

  const formatStepLabel = useCallback(
    (step: FlowIntentStep) => stepDisplayName(step, intl.formatMessage),
    [intl],
  );

  const applyIntentChange = useCallback(
    (next: {
      steps: FlowIntentStep[];
      edges: FlowIntent['edges'];
      entryStepId?: string;
    }) => {
      // 只回写 state，由下方 effect 唯一负责刷画布（与 Workflow 一致）
      // 不要在这里写 lastEmittedSignatureRef，否则 effect 会跳过 load
      onChange({
        ...valueRef.current,
        profile,
        steps: next.steps,
        edges: next.edges,
        entryStepId: resolveEntryStepId(
          next.steps,
          next.edges,
          next.entryStepId ?? valueRef.current.entryStepId,
        ),
      });
    },
    [onChange, profile],
  );

  const emitGraphRef = useRef<() => void>(() => undefined);

  // 直接使用 hook 的 graphRef，避免二次拷贝时 graphReady 已 true 但本地 ref 仍为 null
  const { graphRef } = useWorkflowFlowGraph({
    containerRef,
    disabled,
    suppressEmitRef,
    onCellsChanged: () => emitGraphRef.current(),
    onNodeSelect: (nodeId) => {
      setSelectedStepId(nodeId);
      if (nodeId) {
        setSelectedEdgeId(null);
        setEdgeDrawerOpen(false);
        setDrawerOpen(false);
      }
    },
    onNodeDblClick: (nodeId) => {
      const tip = valueRef.current.steps.find((item) => item.id === nodeId);
      if (tip && isJudgeBranchTip(tip)) {
        message.info(
          intl.formatMessage({ id: 'flow.judgeBranch.tipPending' }),
        );
        return;
      }
      setSelectedStepId(nodeId);
      setSelectedEdgeId(null);
      setEdgeDrawerOpen(false);
      setDrawerOpen(true);
    },
    onEdgeSelect: (edgeId) => {
      setSelectedEdgeId(edgeId);
      if (edgeId) {
        setSelectedStepId(null);
        setDrawerOpen(false);
      }
    },
    onEdgeDblClick: (edgeId) => {
      setSelectedEdgeId(edgeId);
      setSelectedStepId(null);
      setDrawerOpen(false);
      setEdgeDrawerOpen(true);
    },
    setPlusButtonPositions,
    nodeIdsWithNoOutputRef,
    setOverlayTransform,
    onReady: setGraphReady,
  });

  emitGraphRef.current = () => {
    const graph = graphRef.current;
    if (!graph || syncingFromPropsRef.current || suppressEmitRef.current) {
      return;
    }
    const map = new Map(
      valueRef.current.steps.map((step) => [step.id, step]),
    );
    const next = extractIntentGraphFromCanvas(graph, map);
    if (next.steps.length === 0 && valueRef.current.steps.length > 0) {
      return;
    }

    const prevIds = new Set(valueRef.current.edges.map((edge) => edge.id));
    const stepById = new Map(next.steps.map((step) => [step.id, step]));
    let edges = next.edges.map((edge) => {
      const from = stepById.get(edge.from);
      if (from?.operation === 'judge' && (edge.kind ?? 'always') === 'always') {
        return { ...edge, kind: 'state' as const };
      }
      return edge;
    });

    // 禁止第二条 default：新连线若已是 default 且已有 default，降级为 state 待填
    const newEdges = edges.filter((edge) => !prevIds.has(edge.id));
    let promptEdgeId: string | null = null;
    for (const edge of newEdges) {
      const from = stepById.get(edge.from);
      if (from?.operation !== 'judge') {
        continue;
      }
      const hasDefault = edges.some(
        (item) =>
          item.from === edge.from &&
          item.kind === 'default' &&
          item.id !== edge.id,
      );
      if (edge.kind === 'default' && hasDefault) {
        edges = edges.map((item) =>
          item.id === edge.id ? { ...item, kind: 'state' as const } : item,
        );
        message.warning(
          intl.formatMessage({
            id: 'flow.edge.duplicateDefault',
          }),
        );
      }
      promptEdgeId = edge.id;
    }

    const signature = intentGraphSignature(
      next.steps,
      resolveIntentEdges(next.steps, edges),
    );
    if (signature === lastEmittedSignatureRef.current) {
      return;
    }
    lastEmittedSignatureRef.current = signature;
    applyIntentChange({ ...next, edges });
    if (promptEdgeId) {
      setPendingJudgeEdgeId(promptEdgeId);
    }
  };

  const loadGenerationRef = useRef(0);

  const loadGraphToCanvas = useCallback(
    async (
      steps: FlowIntentStep[],
      edges: FlowIntent['edges'],
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
        await applyIntentGraphToCanvas(
          graph,
          steps,
          edges,
          nextOrientation,
          formatStepLabel,
        );
        if (generation !== loadGenerationRef.current) {
          return;
        }
        lastEmittedSignatureRef.current = intentGraphSignature(
          steps,
          resolveIntentEdges(steps, edges),
        );
        setZoomPercent(Math.round(graph.zoom() * 100));
      } finally {
        if (generation === loadGenerationRef.current) {
          syncingFromPropsRef.current = false;
          suppressEmitRef.current = false;
        }
      }
    },
    [formatStepLabel, graphRef],
  );

  useEffect(() => {
    if (!graphReady) {
      return;
    }
    const incomingSignature = intentGraphSignature(
      value.steps,
      resolveIntentEdges(value.steps, value.edges),
    );
    if (incomingSignature === lastEmittedSignatureRef.current) {
      return;
    }
    void loadGraphToCanvas(value.steps, value.edges, orientation);
  }, [
    graphReady,
    loadGraphToCanvas,
    orientation,
    value.edges,
    value.steps,
  ]);

  const handleAddOperation = useCallback(
    (operation: FlowIntentOperation) => {
      if (disabled) {
        return;
      }
      if (operation === 'mutate' && !allowsMutate) {
        message.info(
          intl.formatMessage({ id: 'flow.intent.mutateBlocked' }),
        );
        return;
      }
      const step = createDefaultStep(
        operation,
        profile,
        valueRef.current.steps,
        bindEntry,
      );
      const next = appendStepPreservingEdges(
        valueRef.current.steps,
        valueRef.current.edges,
        step,
      );
      applyIntentChange(next);
      setAddMenuOpen(false);
    },
    [applyIntentChange, bindEntry, disabled, intl, profile],
  );

  const handleAddAfter = useCallback(
    async (fromStepId: string, operation: FlowIntentOperation) => {
      if (disabled) {
        return;
      }
      if (operation === 'mutate' && !allowsMutate) {
        message.info(
          intl.formatMessage({ id: 'flow.intent.mutateBlocked' }),
        );
        return;
      }
      const fromStep = valueRef.current.steps.find(
        (item) => item.id === fromStepId,
      );
      // 分支末梢：在其下新增业务节点（always 边），保留小矩形 tip（与 Workflow 一致）
      if (fromStep && isJudgeBranchTip(fromStep)) {
        const graph = graphRef.current;
        if (!graph) {
          return;
        }
        const step = createDefaultStep(
          operation,
          profile,
          valueRef.current.steps,
          bindEntry,
        );
        suppressEmitRef.current = true;
        try {
          await insertIntentStepAfter(
            graph,
            fromStepId,
            step,
            orientation,
            formatStepLabel,
          );
          const map = new Map(
            [...valueRef.current.steps, step].map((item) => [item.id, item]),
          );
          const next = extractIntentGraphFromCanvas(graph, map);
          applyIntentChange(next);
        } finally {
          suppressEmitRef.current = false;
        }
        setPlusDropdownNodeId(null);
        return;
      }

      const graph = graphRef.current;
      if (!graph) {
        return;
      }
      const step = createDefaultStep(
        operation,
        profile,
        valueRef.current.steps,
        bindEntry,
      );
      suppressEmitRef.current = true;
      try {
        const { edgeId } = await insertIntentStepAfter(
          graph,
          fromStepId,
          step,
          orientation,
          formatStepLabel,
        );
        const map = new Map(
          [...valueRef.current.steps, step].map((item) => [item.id, item]),
        );
        const next = extractIntentGraphFromCanvas(graph, map);
        applyIntentChange(next);
        // 从 judge 直接 + 仍走 state 边；优先引导在节点里配状态
        if (fromStep?.operation === 'judge') {
          setSelectedEdgeId(edgeId);
          setEdgeDrawerOpen(true);
        }
      } finally {
        suppressEmitRef.current = false;
      }
      setPlusDropdownNodeId(null);
    },
    [applyIntentChange, bindEntry, disabled, formatStepLabel, intl, orientation, profile],
  );

  const handleGraphChange = useCallback(
    (next: { steps: FlowIntentStep[]; edges: FlowIntent['edges'] }) => {
      applyIntentChange({
        ...next,
        entryStepId: resolveEntryStepId(
          next.steps,
          next.edges,
          valueRef.current.entryStepId,
        ),
      });
    },
    [applyIntentChange],
  );

  const handleSaveStep = useCallback(
    (step: FlowIntentStep) => {
      applyIntentChange({
        steps: updateStepInGraph(valueRef.current.steps, step),
        edges: valueRef.current.edges,
        entryStepId: valueRef.current.entryStepId,
      });
    },
    [applyIntentChange],
  );

  const handleSaveEdge = useCallback(
    (edge: FlowIntentEdge) => {
      const edges = resolveIntentEdges(
        valueRef.current.steps,
        valueRef.current.edges,
      );
      const nextEdges = edges.some((item) => item.id === edge.id)
        ? edges.map((item) => (item.id === edge.id ? edge : item))
        : [...edges, edge];
      applyIntentChange({
        steps: valueRef.current.steps,
        edges: nextEdges,
        entryStepId: valueRef.current.entryStepId,
      });
    },
    [applyIntentChange],
  );

  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      if (disabled) {
        return;
      }
      const edges = resolveIntentEdges(
        valueRef.current.steps,
        valueRef.current.edges,
      ).filter((edge) => edge.id !== edgeId);
      applyIntentChange({
        steps: valueRef.current.steps,
        edges,
        entryStepId: valueRef.current.entryStepId,
      });
      setEdgeDrawerOpen(false);
      setSelectedEdgeId(null);
    },
    [applyIntentChange, disabled],
  );

  const handleSetEntry = useCallback(() => {
    if (disabled || !selectedStepId) {
      return;
    }
    applyIntentChange({
      steps: valueRef.current.steps,
      edges: valueRef.current.edges,
      entryStepId: selectedStepId,
    });
    message.success(
      intl.formatMessage({ id: 'flow.intent.canvas.entrySet' }),
    );
  }, [applyIntentChange, disabled, intl, selectedStepId]);

  const handleDeleteStep = useCallback(
    async (stepId: string) => {
      if (disabled) {
        return;
      }
      const tip = valueRef.current.steps.find((step) => step.id === stepId);
      if (tip && isJudgeBranchTip(tip)) {
        const edges = resolveIntentEdges(
          valueRef.current.steps,
          valueRef.current.edges,
        );
        const branchEdge = edges.find(
          (edge) =>
            edge.to === stepId &&
            (edge.kind === 'state' || edge.kind === 'default'),
        );
        if (branchEdge && branchEdge.kind === 'state') {
          const next = removeJudgeStateEdge(
            valueRef.current.steps,
            edges,
            branchEdge.id,
            profile,
          );
          applyIntentChange({
            ...next,
            entryStepId: valueRef.current.entryStepId,
          });
          setDrawerOpen(false);
          setSelectedStepId(null);
          return;
        }
        // default tip：整枝删掉会破坏「恰好 1 default」，改为只清 tip 下游？直接删 tip 并去掉边
        if (branchEdge) {
          applyIntentChange({
            steps: valueRef.current.steps.filter((step) => step.id !== stepId),
            edges: edges.filter(
              (edge) => edge.id !== branchEdge.id && edge.from !== stepId,
            ),
            entryStepId: valueRef.current.entryStepId,
          });
          setDrawerOpen(false);
          setSelectedStepId(null);
          return;
        }
      }
      const graph = graphRef.current;
      if (graph) {
        suppressEmitRef.current = true;
        try {
          await removeIntentStep(graph, stepId, orientation);
          const next = removeStepFromGraph(
            valueRef.current.steps,
            valueRef.current.edges,
            stepId,
          );
          applyIntentChange(next);
        } finally {
          suppressEmitRef.current = false;
        }
      } else {
        applyIntentChange(
          removeStepFromGraph(
            valueRef.current.steps,
            valueRef.current.edges,
            stepId,
          ),
        );
      }
      setDrawerOpen(false);
      setSelectedStepId(null);
    },
    [applyIntentChange, disabled, orientation, profile],
  );

  const handleClear = useCallback(() => {
    if (disabled) {
      return;
    }
    applyIntentChange({ steps: [], edges: [], entryStepId: '' });
  }, [applyIntentChange, disabled]);

  const addMenuItems = useMemo<MenuProps['items']>(
    () =>
      addableOperations(allowsMutate).map((operation) => ({
        key: operation,
        label: intl.formatMessage({
          id:
            operation === 'judge'
              ? 'flow.intent.add.judge'
              : `flow.intent.add.${operation}`,
        }),
        icon: INTENT_OPERATION_VISUAL[operation]?.icon,
        onClick: () => handleAddOperation(operation),
      })),
    [allowsMutate, handleAddOperation, intl],
  );

  const selectedStep = selectedStepId
    ? value.steps.find((step) => step.id === selectedStepId) ?? null
    : null;

  const selectedEdge = useMemo(() => {
    if (!selectedEdgeId) {
      return null;
    }
    const edges = resolveIntentEdges(value.steps, value.edges);
    return edges.find((edge) => edge.id === selectedEdgeId) ?? null;
  }, [selectedEdgeId, value.edges, value.steps]);

  const selectedEdgeSource = selectedEdge
    ? value.steps.find((step) => step.id === selectedEdge.from) ?? null
    : null;

  const hasOtherDefault = useMemo(() => {
    if (!selectedEdge || selectedEdgeSource?.operation !== 'judge') {
      return false;
    }
    return resolveIntentEdges(value.steps, value.edges).some(
      (edge) =>
        edge.from === selectedEdge.from &&
        edge.kind === 'default' &&
        edge.id !== selectedEdge.id,
    );
  }, [selectedEdge, selectedEdgeSource, value.edges, value.steps]);

  const pendingJudgeEdge = useMemo(() => {
    if (!pendingJudgeEdgeId) {
      return null;
    }
    return (
      resolveIntentEdges(value.steps, value.edges).find(
        (edge) => edge.id === pendingJudgeEdgeId,
      ) ?? null
    );
  }, [pendingJudgeEdgeId, value.edges, value.steps]);

  const pendingJudgeHasDefault = useMemo(() => {
    if (!pendingJudgeEdge) {
      return false;
    }
    return resolveIntentEdges(value.steps, value.edges).some(
      (edge) =>
        edge.from === pendingJudgeEdge.from &&
        edge.kind === 'default' &&
        edge.id !== pendingJudgeEdge.id,
    );
  }, [pendingJudgeEdge, value.edges, value.steps]);

  const clearPendingJudgeEdge = useCallback(() => {
    setPendingJudgeEdgeId(null);
  }, []);

  const removePendingJudgeEdge = useCallback(() => {
    if (!pendingJudgeEdgeId) {
      return;
    }
    const edgeId = pendingJudgeEdgeId;
    clearPendingJudgeEdge();
    const edges = resolveIntentEdges(
      valueRef.current.steps,
      valueRef.current.edges,
    ).filter((edge) => edge.id !== edgeId);
    applyIntentChange({
      steps: valueRef.current.steps,
      edges,
      entryStepId: valueRef.current.entryStepId,
    });
  }, [applyIntentChange, clearPendingJudgeEdge, pendingJudgeEdgeId]);

  const choosePendingJudgeKind = useCallback(
    (kind: 'state' | 'default') => {
      if (!pendingJudgeEdgeId || !pendingJudgeEdge) {
        return;
      }
      if (kind === 'default' && pendingJudgeHasDefault) {
        message.warning(
          intl.formatMessage({ id: 'flow.edge.duplicateDefault' }),
        );
        return;
      }
      const edgeId = pendingJudgeEdgeId;
      const edges = resolveIntentEdges(
        valueRef.current.steps,
        valueRef.current.edges,
      ).map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              kind,
              ...(kind === 'default'
                ? { state: undefined, uiLabel: undefined }
                : {}),
            }
          : edge,
      );
      clearPendingJudgeEdge();
      applyIntentChange({
        steps: valueRef.current.steps,
        edges,
        entryStepId: valueRef.current.entryStepId,
      });
      setSelectedEdgeId(edgeId);
      setSelectedStepId(null);
      setDrawerOpen(false);
      if (kind === 'state') {
        setEdgeDrawerOpen(true);
      } else {
        setEdgeDrawerOpen(false);
      }
    },
    [
      applyIntentChange,
      clearPendingJudgeEdge,
      intl,
      pendingJudgeEdge,
      pendingJudgeEdgeId,
      pendingJudgeHasDefault,
    ],
  );

  return (
    <div className={styles.workflowFlowCanvas}>
      <div className={styles.workflowFlowCanvasViewport}>
        {value.steps.length > 0 ? (
          <div className="absolute left-3 top-3 z-[4] flex items-center gap-2">
            <Dropdown
              open={addMenuOpen}
              disabled={disabled}
              menu={{ items: addMenuItems }}
              trigger={['click']}
              onOpenChange={setAddMenuOpen}
            >
              <button
                type="button"
                className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold"
                disabled={disabled}
              >
                <PlusOutlined />
                {intl.formatMessage({ id: 'flow.intent.canvas.addStep' })}
              </button>
            </Dropdown>
            {selectedStepId && !disabled ? (
              <button
                type="button"
                className="app-button-secondary px-3 py-1.5 text-sm font-semibold"
                onClick={handleSetEntry}
              >
                {intl.formatMessage({ id: 'flow.intent.canvas.setEntry' })}
                {value.entryStepId === selectedStepId
                  ? ` · ${intl.formatMessage({ id: 'flow.intent.entry' })}`
                  : ''}
              </button>
            ) : null}
          </div>
        ) : null}

        <div ref={containerRef} className={styles.workflowFlowCanvasSurface} />
        {value.steps.length === 0 ? (
          <div className={styles.workflowFlowCanvasEmpty}>
            <p>{intl.formatMessage({ id: 'flow.intent.canvas.empty' })}</p>
            <Dropdown
              disabled={disabled}
              menu={{ items: addMenuItems }}
              trigger={['click']}
            >
              <button
                type="button"
                className="app-button-primary px-4 py-2 text-sm font-semibold"
              >
                <PlusOutlined />{' '}
                {intl.formatMessage({ id: 'flow.intent.canvas.addFirst' })}
              </button>
            </Dropdown>
          </div>
        ) : null}

        {!disabled && plusButtonPositions.length > 0 ? (
          <div
            className="pointer-events-none absolute inset-0 z-[3]"
            aria-hidden={false}
          >
            {plusButtonPositions.map((pos) => (
              <Dropdown
                key={`${pos.id}-${overlayTransform.scale}`}
                open={plusDropdownNodeId === pos.id}
                menu={{
                  items: addableOperations(allowsMutate)
                    .filter(
                    (operation) =>
                      !(
                        plusDropdownNodeId &&
                        isJudgeBranchTip(
                          value.steps.find(
                            (step) => step.id === plusDropdownNodeId,
                          ),
                        ) &&
                        operation === 'judge'
                      ),
                  ).map((operation) => ({
                    key: operation,
                    label: intl.formatMessage({
                      id:
                        operation === 'judge'
                          ? 'flow.intent.add.judge'
                          : `flow.intent.add.${operation}`,
                    }),
                    icon: INTENT_OPERATION_VISUAL[operation]?.icon,
                    onClick: () => {
                      void handleAddAfter(pos.id, operation);
                    },
                  })) as MenuProps['items'],
                }}
                trigger={['click']}
                onOpenChange={(open) =>
                  setPlusDropdownNodeId(open ? pos.id : null)
                }
              >
                <button
                  type="button"
                  className="pointer-events-auto absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm hover:border-primary hover:text-primary"
                  style={{ left: pos.left, top: pos.top }}
                  aria-label="add step"
                >
                  <PlusOutlined className="text-xs" />
                </button>
              </Dropdown>
            ))}
          </div>
        ) : null}

        {value.steps.length > 0 ? (
          <FlowCanvasToolbar
            placement="canvas"
            zoomPercent={zoomPercent}
            onZoomIn={() => {
              const graph = graphRef.current;
              if (!graph) return;
              graph.zoom(0.1);
              setZoomPercent(Math.round(graph.zoom() * 100));
            }}
            onZoomOut={() => {
              const graph = graphRef.current;
              if (!graph) return;
              graph.zoom(-0.1);
              setZoomPercent(Math.round(graph.zoom() * 100));
            }}
            onZoomFit={() => {
              const graph = graphRef.current;
              if (!graph) return;
              graph.zoomToFit({ padding: 40, maxScale: 1 });
              setZoomPercent(Math.round(graph.zoom() * 100));
            }}
            onClear={handleClear}
            orientation={orientation}
            onOrientationChange={(next) => {
              setOrientation(next);
              void loadGraphToCanvas(value.steps, value.edges, next);
            }}
          />
        ) : null}
      </div>

      <p className={styles.workflowFlowCanvasHint}>
        {intl.formatMessage({ id: 'flow.intent.canvas.hint' })}
      </p>

      <IntentStepPropertyDrawer
        open={drawerOpen}
        step={selectedStep}
        steps={value.steps}
        edges={resolveIntentEdges(value.steps, value.edges)}
        profile={profile}
        bindEntry={bindEntry}
        tools={tools}
        hostTools={hostTools}
        toolsLoading={toolsLoading}
        disabled={disabled}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSaveStep}
        onGraphChange={handleGraphChange}
        onDelete={handleDeleteStep}
      />

      <IntentEdgePropertyDrawer
        open={edgeDrawerOpen}
        edge={selectedEdge}
        sourceStep={selectedEdgeSource}
        hasOtherDefault={hasOtherDefault}
        disabled={disabled}
        onClose={() => setEdgeDrawerOpen(false)}
        onSave={handleSaveEdge}
        onDelete={handleDeleteEdge}
      />

      <Modal
        open={Boolean(pendingJudgeEdgeId)}
        title={intl.formatMessage({ id: 'flow.edge.judgePickTitle' })}
        onCancel={removePendingJudgeEdge}
        footer={null}
        destroyOnClose
        centered
      >
        <p className="mb-4 text-sm text-on-surface/60">
          {intl.formatMessage({ id: 'flow.edge.judgePickHint' })}
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="app-button-primary w-full px-3 py-2 text-sm font-semibold"
            onClick={() => choosePendingJudgeKind('state')}
          >
            {intl.formatMessage({ id: 'flow.edge.kind.state' })}
          </button>
          <button
            type="button"
            className="app-button-secondary w-full px-3 py-2 text-sm font-semibold disabled:opacity-50"
            disabled={pendingJudgeHasDefault}
            onClick={() => choosePendingJudgeKind('default')}
          >
            {intl.formatMessage({ id: 'flow.edge.kind.default' })}
          </button>
          {pendingJudgeHasDefault ? (
            <p className="text-xs text-amber-700">
              {intl.formatMessage({ id: 'flow.edge.duplicateDefault' })}
            </p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};

export default IntentFlowCanvas;
