import { useEffect, useRef } from 'react';
import { Graph } from '@antv/x6';
import type { Cell, Edge, Node } from '@antv/x6';
import type { FlowCanvasOrientation } from '@/components/flow/FlowEditor/utils/flowCanvasFormatter';
import type { WorkflowFlowNodeData } from './workflowFlowVisual';

const WORKFLOW_CANVAS_MIN_HEIGHT_PX = 420;

function readContainerSize(container: HTMLElement): { width: number; height: number } {
  const height = Math.max(container.offsetHeight, WORKFLOW_CANVAS_MIN_HEIGHT_PX);
  return {
    width: container.offsetWidth || 800,
    height,
  };
}

export interface UseWorkflowFlowGraphOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  disabled?: boolean;
  /** 为 true 时忽略结构变更回调（加载/布局中） */
  suppressEmitRef?: React.MutableRefObject<boolean>;
  onCellsChanged?: () => void;
  onNodeSelect?: (nodeId: string | null) => void;
  onNodeDblClick?: (nodeId: string) => void;
  onNodeContextMenu?: (
    nodeId: string,
    clientX: number,
    clientY: number,
  ) => void;
  onEdgeSelect?: (edgeId: string | null) => void;
  onEdgeDblClick?: (edgeId: string) => void;
  setPlusButtonPositions: (
    positions: { id: string; left: number; top: number }[],
  ) => void;
  nodeIdsWithNoOutputRef: React.MutableRefObject<string[]>;
  setOverlayTransform: (transform: {
    scale: number;
    tx: number;
    ty: number;
  }) => void;
  onReady?: (ready: boolean) => void;
}

export function useWorkflowFlowGraph(options: UseWorkflowFlowGraphOptions): {
  graphRef: React.MutableRefObject<Graph | null>;
} {
  const {
    containerRef,
    disabled = false,
    suppressEmitRef,
    onCellsChanged,
    onNodeSelect,
    onNodeDblClick,
    onNodeContextMenu,
    onEdgeSelect,
    onEdgeDblClick,
    setPlusButtonPositions,
    nodeIdsWithNoOutputRef,
    setOverlayTransform,
    onReady,
  } = options;

  const graphRef = useRef<Graph | null>(null);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const callbacksRef = useRef({
    onCellsChanged,
    onNodeSelect,
    onNodeDblClick,
    onNodeContextMenu,
    onEdgeSelect,
    onEdgeDblClick,
  });
  callbacksRef.current = {
    onCellsChanged,
    onNodeSelect,
    onNodeDblClick,
    onNodeContextMenu,
    onEdgeSelect,
    onEdgeDblClick,
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let graph: Graph;
    const initialSize = readContainerSize(container);
    graph = new Graph({
      container,
      width: initialSize.width,
      height: initialSize.height,
      background: { color: 'transparent' },
      grid: {
        size: 10,
        visible: true,
        type: 'dot',
        args: { color: '#D0D5DD', thickness: 1 },
      },
      panning: {
        enabled: true,
        eventTypes: ['leftMouseDown', 'mouseWheel'],
      },
      mousewheel: {
        enabled: true,
        modifiers: 'ctrl',
        factor: 1.1,
        maxScale: 3,
        minScale: 0.5,
      },
      connecting: {
        connector: { name: 'rounded' },
        anchor: 'center',
        connectionPoint: 'boundary',
        allowBlank: false,
        allowPort: true,
        allowNode: false,
        snap: { radius: 20 },
        createEdge(): Edge {
          return graph.createEdge({
            attrs: {
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
            },
            connector: { name: 'rounded' },
            zIndex: 0,
          });
        },
        validateConnection(args): boolean {
          if (disabledRef.current) {
            return false;
          }
          const { sourceCell, targetCell, sourcePort, targetPort } = args;
          if (!sourceCell?.isNode() || !targetCell?.isNode()) {
            return false;
          }
          if (sourceCell.id === targetCell.id) {
            return false;
          }
          if (
            sourcePort != null &&
            targetPort != null &&
            (sourcePort !== 'out' || targetPort !== 'in')
          ) {
            return false;
          }
          // 允许多入边汇合；禁止同 from→to 重复
          const duplicate = graph.getEdges().some((edge: Edge) => {
            return (
              edge.getSourceCellId() === sourceCell.id &&
              edge.getTargetCellId() === targetCell.id
            );
          });
          return !duplicate;
        },
      },
      interacting: {
        nodeMovable: false,
        edgeMovable: false,
        arrowheadMovable: false,
        vertexMovable: false,
        vertexAddable: false,
        vertexDeletable: false,
        edgeLabelMovable: false,
        magnetConnectable: true,
      },
      highlighting: {
        magnetAdsorbed: {
          name: 'stroke',
          args: {
            attrs: { fill: '#5F95FF', stroke: '#5F95FF' },
          },
        },
      },
    });

    graphRef.current = graph;

    const getNodeIdsWithNoOutput = (): string[] =>
      graph
        .getNodes()
        .filter((node: Node) => {
          const data = (node.getData() ?? {}) as {
            workflowAction?: string;
            operation?: string;
          };
          // 判定分流本身不挂 +；新增分支走属性面板（与 Workflow 状态识别一致）
          if (
            data.workflowAction === 'detect_clues' ||
            data.operation === 'judge'
          ) {
            return false;
          }
          const hasOut = graph
            .getEdges()
            .some((edge: Edge) => edge.getSourceCellId() === node.id);
          return !hasOut;
        })
        .map((node: Node) => node.id);

    const updatePlusAndOverlay = () => {
      const ids = nodeIdsWithNoOutputRef.current;
      if (!containerRef.current || ids.length === 0) {
        setPlusButtonPositions([]);
        return;
      }

      const scale = graph.zoom();
      const translation = (
        graph as Graph & {
          transform: { getTranslation: () => { tx: number; ty: number } };
        }
      ).transform.getTranslation();
      setOverlayTransform({ scale, tx: translation.tx, ty: translation.ty });

      const containerRect = containerRef.current.getBoundingClientRect();
      const positions = ids.map((id) => {
        const node = graph.getCellById(id) as Node | undefined;
        if (!node?.isNode()) {
          return null;
        }
        const pos = node.getPosition();
        const bbox = node.getBBox();
        const data = (node.getData() ?? {}) as WorkflowFlowNodeData;
        const orientation = data.layoutOrientation ?? 'vertical';
        const graphX =
          orientation === 'horizontal'
            ? pos.x + bbox.width + 16
            : pos.x + bbox.width / 2;
        const graphY =
          orientation === 'horizontal'
            ? pos.y + bbox.height / 2
            : pos.y + bbox.height + 16;
        const windowPos = graph.localToClient(graphX, graphY);
        return {
          id,
          left: windowPos.x - containerRect.left,
          top: windowPos.y - containerRect.top,
        };
      });
      setPlusButtonPositions(
        positions.filter(
          (item): item is { id: string; left: number; top: number } =>
            item !== null,
        ),
      );
    };

    const syncNoOutputAndPlusPositions = () => {
      const ids = getNodeIdsWithNoOutput();
      nodeIdsWithNoOutputRef.current = ids;
      updatePlusAndOverlay();
    };

    const syncPlusOverlay = () => {
      requestAnimationFrame(syncNoOutputAndPlusPositions);
    };

    const handleStructureChanged = () => {
      if (!suppressEmitRef?.current) {
        callbacksRef.current.onCellsChanged?.();
      }
      syncPlusOverlay();
    };

    graph.on('node:click', ({ node }: { node: Node }) => {
      callbacksRef.current.onEdgeSelect?.(null);
      callbacksRef.current.onNodeSelect?.(node.id);
    });

    graph.on('node:dblclick', ({ node }: { node: Node }) => {
      callbacksRef.current.onNodeDblClick?.(node.id);
    });

    graph.on(
      'node:contextmenu',
      ({
        node,
        e,
      }: {
        node: Node;
        e: { preventDefault?: () => void; clientX?: number; clientY?: number };
      }) => {
        e.preventDefault?.();
        callbacksRef.current.onNodeContextMenu?.(
          node.id,
          e.clientX ?? 0,
          e.clientY ?? 0,
        );
      },
    );

    graph.on('edge:click', ({ edge }: { edge: Edge }) => {
      callbacksRef.current.onNodeSelect?.(null);
      callbacksRef.current.onEdgeSelect?.(edge.id);
    });

    graph.on('edge:dblclick', ({ edge }: { edge: Edge }) => {
      callbacksRef.current.onEdgeDblClick?.(edge.id);
    });

    graph.on('edge:connected', ({ edge }: { edge: Edge }) => {
      if (!edge.getData() || !(edge.getData() as { kind?: string }).kind) {
        const source = graph.getCellById(edge.getSourceCellId());
        const sourceData = source?.isNode()
          ? ((source.getData() ?? {}) as WorkflowFlowNodeData)
          : null;
        const kind =
          sourceData?.workflowAction === 'detect_clues' ? 'clue' : 'always';
        const data = {
          workflowEdgeId: edge.id,
          kind,
          clue:
            kind === 'clue'
              ? { key: '', description: '' }
              : undefined,
        };
        edge.setData(data);
        const stroke = '#94a3b8';
        edge.setAttrs({
          line: {
            stroke,
            strokeWidth: 1.5,
            targetMarker: {
              name: 'classic',
              size: 7,
              fill: stroke,
              stroke,
            },
          },
        });
        if (kind === 'clue') {
          edge.setLabels([]);
        }
      }
    });

    graph.on('blank:click', () => {
      callbacksRef.current.onNodeSelect?.(null);
      callbacksRef.current.onEdgeSelect?.(null);
    });

    graph.on('cell:added', handleStructureChanged);
    graph.on('cell:removed', handleStructureChanged);
    graph.on('cell:changed', syncPlusOverlay);
    graph.on('scale', syncPlusOverlay);
    graph.on('translate', syncPlusOverlay);

    const resizeGraph = () => {
      if (!containerRef.current || !graphRef.current) {
        return;
      }
      const nextSize = readContainerSize(containerRef.current);
      graphRef.current.resize(nextSize.width, nextSize.height);
      syncPlusOverlay();
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeGraph();
    });
    resizeObserver.observe(container);
    window.addEventListener('resize', resizeGraph);

    syncPlusOverlay();
    onReady?.(true);

    return () => {
      onReady?.(false);
      resizeObserver.disconnect();
      window.removeEventListener('resize', resizeGraph);
      graph.dispose();
      graphRef.current = null;
    };
  }, [
    containerRef,
    nodeIdsWithNoOutputRef,
    setOverlayTransform,
    setPlusButtonPositions,
    onReady,
    suppressEmitRef,
  ]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) {
      return;
    }
    graph.options.interacting = {
      nodeMovable: false,
      edgeMovable: false,
      arrowheadMovable: false,
      vertexMovable: false,
      vertexAddable: false,
      vertexDeletable: false,
      edgeLabelMovable: false,
      magnetConnectable: !disabled,
    };
  }, [disabled]);

  return { graphRef };
}

export function setGraphSelection(graph: Graph, nodeId: string | null): void {
  graph.getNodes().forEach((node: Cell) => {
    if (node.isNode()) {
      node.attr('body/strokeWidth', node.id === nodeId ? 2 : 1);
    }
  });
}
