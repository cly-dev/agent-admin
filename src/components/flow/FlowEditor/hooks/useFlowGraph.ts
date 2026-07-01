import { useEffect, useRef } from "react";
import React from "react";
import { Graph } from "@antv/x6";
import type { Cell, Node, Edge } from "@antv/x6";
import type { FlowNodeData } from "@/types";
import { message } from "antd";
import { buildBackendPayload } from "../utils/flowDataTransformer";
import { applyNodeStatusStyle } from "../utils/nodeConfig";
import { useAppStore } from "@/stores";

export interface UseFlowGraphCallbacks {
  onNodeClick?: (node: Node, e: MouseEvent) => void;
  onNodeDblClick?: (node: Node) => void;
  onEdgeClick?: (edge: Edge, e: MouseEvent) => void;
  onBlankClick?: () => void;
  onNodeContextMenu?: (node: Node, e: MouseEvent) => void;
  onCellsChanged?: () => void;
  onScale?: () => void;
  onTranslate?: () => void;
  onSetSelection?: (cell: Cell, addToSelection: boolean) => void;
  onClearSelection?: () => void;
  onUpdateJson?: (graph: Graph) => void;
  onSyncNoOutputAndPlusPositions?: (graph: Graph) => void;
}

export interface UseFlowGraphOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  selectedIdsRef: React.MutableRefObject<Set<string>>;
  setHasSelection: (hasSelection: boolean) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setPreferredConditionGroupId: (groupId: string | null) => void;
  setContextMenu: (menu: { x: number; y: number; nodeId: string } | null) => void;
  setGraphJson: (json: string) => void;
  setBackendPayloadJson: (json: string) => void;
  setNodeIdsWithNoOutput: (ids: string[]) => void;
  setPlusButtonPositions: (positions: { id: string; left: number; top: number }[]) => void;
  nodeIdsWithNoOutputRef: React.MutableRefObject<string[]>;
  updatePlusAndOverlayRef: React.MutableRefObject<() => void>;
  setOverlayTransform: (transform: { scale: number; tx: number; ty: number }) => void;
  setReady: (ready: boolean) => void;
  /** 画布结构/节点数据变化并写入 backend payload 后回调（用于未保存离开提示） */
  onBackendPayloadJsonChange?: (payloadJson: string) => void;
}

/**
 * 初始化演示流程：从模板 JSON 还原（节点位置、连线及端口与导出一致）
 */
function initDemoFlow(graph: Graph): void {
  // graph.fromJSON(
  //   INIT_FLOW_TEMPLATE as unknown as Parameters<Graph["fromJSON"]>[0]
  // );
  graph.getNodes().forEach((node) => {
    const data = node.getData() as FlowNodeData | undefined;
    if (data) applyNodeStatusStyle(node, data);
  });
}

/** 目标节点的指定入口是否已有连线（重连时排除当前边） */
function isTargetInletOccupied(
  graph: Graph,
  targetNode: Node,
  targetPort: string | null | undefined,
  excludeEdge: Edge | null | undefined
): boolean {
  const port = targetPort ?? "in";
  const excludeId = excludeEdge?.id;
  return graph.getEdges().some((e) => {
    if (excludeId != null && e.id === excludeId) {
      return false;
    }
    if (e.getTargetCellId() !== targetNode.id) {
      return false;
    }
    const tp = e.getTargetPortId() ?? "in";
    return tp === port;
  });
}

/**
 * 画布管理 Hook
 * 负责画布的初始化、事件监听和数据同步
 */
export function useFlowGraph(options: UseFlowGraphOptions): {
  graphRef: React.MutableRefObject<Graph | null>;
} {
  const {
    containerRef,
    selectedIdsRef,
    setHasSelection,
    setSelectedNodeId,
    setPreferredConditionGroupId,
    setContextMenu,
    setGraphJson,
    setBackendPayloadJson,
    setNodeIdsWithNoOutput,
    setPlusButtonPositions,
    nodeIdsWithNoOutputRef,
    updatePlusAndOverlayRef,
    setOverlayTransform,
    setReady,
    onBackendPayloadJsonChange,
  } = options;

  const graphRef = useRef<Graph | null>(null);
  const { collapsed } = useAppStore();

  useEffect(() => {
    if (!containerRef.current) return;

    // 创建画布（先声明类型，createEdge 内会引用 graph）
    const container = containerRef.current;
    let graph: Graph;
    /** 入口占满提示节流，避免拖拽连线时 message 刷屏 */
    const inletOccupiedHintAtRef = { current: 0 };
    graph = new Graph({
      container,
      width: container.offsetWidth || 800,
      height: container.offsetHeight || 500,
      background: {
        color: "#F5F7FA",
      },
      grid: {
        size: 10,
        visible: true,
        type: "dot",
        args: {
          color: "#D0D5DD",
          thickness: 1,
        },
      },
      // 启用画布平移
      panning: {
        enabled: true,
        eventTypes: ["leftMouseDown", "mouseWheel"],
      },
      // 启用鼠标滚轮缩放
      mousewheel: {
        enabled: true,
        modifiers: "ctrl",
        factor: 1.1,
        maxScale: 3,
        minScale: 0.5,
      },
      // 节点连接规则
      connecting: {
        // 使用默认直线连接（去掉 manhattan 避免强制折线）
        // 如需轻微圆角可改为 connector: { name: "smooth" }
        connector: {
          name: "normal",
        },
        anchor: "center",
        connectionPoint: "boundary",
        allowBlank: false,
        allowPort: true,
        allowNode: false, // 仅允许从端口连接，避免从节点中心拖拽
        snap: { radius: 20 },
        createEdge(): Edge {
          return graph.createEdge({
            attrs: {
              line: {
                stroke: "#5F95FF",
                // 全局统一连线粗细：1px
                strokeWidth: 1,
                targetMarker: { name: "classic", size: 8 },
              },
            },
            zIndex: 0,
          });
        },
        validateMagnet() {
          return true; // 允许从任意端口开始拖拽
        },
        validateConnection(args) {
          const {
            sourceCell,
            targetCell,
            sourcePort,
            targetPort,
            targetMagnet,
          } = args;
          const edge = (args as { edge?: Edge | null }).edge;
          if (!targetMagnet) return false;
          if (!sourceCell?.isNode() || !targetCell?.isNode()) return true;
          if (sourceCell.id === targetCell.id) return false; // 禁止自连
          // 只能从输出口连到输入口：起点用 out，终点用 in（若未传 port 则放行以兼容）
          if (
            sourcePort != null &&
            targetPort != null &&
            (sourcePort !== "out" || targetPort !== "in")
          )
            return false;
          const srcData = (sourceCell.getData() ?? {}) as FlowNodeData;
          const tgtData = (targetCell.getData() ?? {}) as FlowNodeData;
          const srcType = srcData.nodeType;
          const tgtType = tgtData.nodeType;
          // 触发器（开始）节点只能作为连线起点，且下游类型受限
          if (srcType === "start") {
            if (tgtType === "start") {
              message.warning("触发器节点不能连接到另一个触发器节点");
              return false;
            }
            const allowedNext: Array<FlowNodeData["nodeType"]> = [
              "conditionCheck",
              "wait",
              "execute",
            ];
            if (!allowedNext.includes(tgtType)) {
              return false;
            }
          }
          // 分支小圆节点当前仅作为历史兼容使用，不再新建条件节点，因此不再限制其上游类型为 condition
          // 条件组分支节点的输入只能接条件检查节点的输出
          if (tgtType === "conditionGroupBranch" && srcType !== "conditionCheck")
            return false;
          // 每个节点入口（in）仅允许一条入边；调整连线终点时排除当前边
          if (
            isTargetInletOccupied(graph, targetCell, targetPort, edge ?? null)
          ) {
            const now = Date.now();
            if (now - inletOccupiedHintAtRef.current > 700) {
              inletOccupiedHintAtRef.current = now;
            }
            return false;
          }
          return true;
        },
      },
      // 必须开启 magnetConnectable，才能从端口拖拽创建连线
      // 不允许在画布上随意拖动已有连线（改路径 / 拖箭头改端点）；删除请用右键或业务操作
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
      // 高亮选项
      highlighting: {
        magnetAdsorbed: {
          name: "stroke",
          args: {
            attrs: {
              fill: "#5F95FF",
              stroke: "#5F95FF",
            },
          },
        },
      },
    });

    graphRef.current = graph;

    /** 清除当前选中样式并清空选中状态 */
    const clearSelection = () => {
      selectedIdsRef.current.forEach((id) => {
        const cell = graph.getCellById(id);
        if (cell?.isNode()) {
          cell.attr("body/strokeWidth", 1);
        } else if (cell?.isEdge()) {
          // 未选中状态下的连线保持统一细线
          cell.attr("line/strokeWidth", 1);
        }
      });
      selectedIdsRef.current.clear();
      setHasSelection(false);
    };

    /** 设置选中：仅保留当前点击的 cell（Ctrl 为多选） */
    const setSelection = (cell: Cell, addToSelection: boolean) => {
      if (!addToSelection) clearSelection();
      const id = cell.id;
      if (selectedIdsRef.current.has(id)) {
        if (addToSelection) {
          selectedIdsRef.current.delete(id);
          if (cell.isNode()) cell.attr("body/strokeWidth", 1);
          else if (cell.isEdge()) cell.attr("line/strokeWidth", 1);
        }
      } else {
        selectedIdsRef.current.add(id);
        if (cell.isNode()) cell.attr("body/strokeWidth", 2);
        else if (cell.isEdge()) cell.attr("line/strokeWidth", 1);
      }
      setHasSelection(selectedIdsRef.current.size > 0);
    };

    // 添加示例节点与连线
    initDemoFlow(graph);

    // 节点单击：仅选中/取消选中（Ctrl 多选）
    graph.on("node:click", ({ node, e }: { node: Node; e: MouseEvent }) => {
      setSelection(node, e.ctrlKey || e.metaKey);
    });

    // 节点双击：打开右侧属性面板（分支节点不允许编辑；条件组分支节点联动父节点抽屉）
    graph.on("node:dblclick", ({ node }: { node: Node }) => {
      const data = (node.getData() ?? {}) as FlowNodeData;
      if (data.nodeType === "branch") return;
      if (data.nodeType === "conditionGroupBranch") {
        const parentId = data.parentNodeId;
        if (parentId) {
          const parent = graph.getCellById(parentId) as Node | undefined;
          if (parent?.isNode()) {
            setSelection(parent, false);
            setPreferredConditionGroupId(
              data.conditionGroupId != null ? String(data.conditionGroupId) : null
            );
            setSelectedNodeId(parent.id);
          }
        }
        return;
      }
      setSelection(node, false);
      setPreferredConditionGroupId(null);
      setSelectedNodeId(node.id);
    });

    // 边点击：选中/取消选中（Ctrl 多选）
    graph.on("edge:click", ({ edge, e }: { edge: Edge; e: MouseEvent }) => {
      setSelection(edge, e.ctrlKey || e.metaKey);
    });

    // 画布空白处点击：取消选中、关闭属性面板与右键菜单
    graph.on("blank:click", () => {
      clearSelection();
      setPreferredConditionGroupId(null);
      setSelectedNodeId(null);
      setContextMenu(null);
    });

    // 节点右键：打开快捷菜单（分支节点与条件组分支节点不弹菜单）
    graph.on(
      "node:contextmenu",
      ({ node, e }: { node: Node; e: MouseEvent }) => {
        e.preventDefault();
        const data = (node.getData() ?? {}) as FlowNodeData;
        if (
          data.nodeType === "branch" ||
          data.nodeType === "conditionGroupBranch"
        ) {
          return;
        }
        setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
      }
    );

    // 实时同步画布数据到 JSON 状态（供底部数据框展示）+ 转换后给后端的 payload
    const updateJson = () => {
      setGraphJson(JSON.stringify(graph.toJSON(), null, 2));
      const backendJson = JSON.stringify(buildBackendPayload(graph), null, 2);
      setBackendPayloadJson(backendJson);
      onBackendPayloadJsonChange?.(backendJson);
    };
    updateJson();

    // 无输出连线的节点：用于右侧显示加号
    const getNodeIdsWithNoOutput = () => {
      const nodes = graph.getNodes();
      const edges = graph.getEdges();
      const outCount = new Map<string, number>();
      nodes.forEach((n) => outCount.set(n.id, 0));
      edges.forEach((e) => {
        const src = e.getSourceCellId();
        if (outCount.has(src)) outCount.set(src, (outCount.get(src) ?? 0) + 1);
      });
      return nodes
        .filter((n) => {
          if ((outCount.get(n.id) ?? 0) !== 0) {
            return false;
          }
          const data = (n.getData() ?? {}) as FlowNodeData;
          // Check conditions 节点不允许直接通过自身加号新增下游节点，
          // 只能由条件组分支节点继续新增。
          if (data.nodeType === "conditionCheck") {
            return false;
          }
          return true;
        })
        .map((n) => n.id);
    };
    // 更新加号图坐标 + overlay transform（节点/连线变化时调用）
    const updatePlusAndOverlay = () => {
      const ids = nodeIdsWithNoOutputRef.current;
      const g = graphRef.current;
      if (!g || ids.length === 0 || !containerRef.current) return;
      const scale = g.zoom();
      const t = (
        g as Graph & {
          transform: { getTranslation: () => { tx: number; ty: number } };
        }
      ).transform.getTranslation();
      setOverlayTransform({ scale, tx: t.tx, ty: t.ty });
      
      // 获取容器相对于窗口的位置
      const containerRect = containerRef.current.getBoundingClientRect();
      
      const positions: { id: string; left: number; top: number }[] = [];
      ids.forEach((id) => {
        const node = g.getCellById(id) as Node | undefined;
        if (!node?.isNode()) return;
        const pos = node.getPosition();
        const bbox = node.getBBox();
        const data = (node.getData() ?? {}) as FlowNodeData;
        // 优先使用节点自身的布局方向；否则默认跟随全局默认的纵向布局
        const orientation = data.layoutOrientation ?? "vertical";

        // 根据当前节点的布局方向计算加号在图坐标系中的位置：
        // - 横向：显示在节点右侧中点
        // - 纵向：显示在节点下方中点
        const graphX =
          orientation === "horizontal"
            ? pos.x + bbox.width + 16
            : pos.x + bbox.width / 2;
        const graphY =
          orientation === "horizontal"
            ? pos.y + bbox.height / 2
            : pos.y + bbox.height + 16;
        // 将图坐标转换为窗口坐标
        const windowPos = g.localToClient(graphX, graphY);
        // 转换为相对于容器的坐标
        positions.push({
          id,
          left: windowPos.x - containerRect.left,
          top: windowPos.y - containerRect.top,
        });
      });
      setPlusButtonPositions(positions);
    };
    // 暴露给外部（例如布局方向切换后手动调用），用于重新计算加号位置
    updatePlusAndOverlayRef.current = () => {
      if (nodeIdsWithNoOutputRef.current.length === 0) return;
      updatePlusAndOverlay();
    };

    const syncNoOutputAndPlusPositions = () => {
      const ids = getNodeIdsWithNoOutput();
      nodeIdsWithNoOutputRef.current = ids;
      setNodeIdsWithNoOutput(ids);
      if (ids.length === 0) {
        setPlusButtonPositions([]);
        return;
      }
      updatePlusAndOverlay();
    };
    const onCellsChanged = () => {
      updateJson();
      requestAnimationFrame(syncNoOutputAndPlusPositions);
    };
    graph.on("cell:added", onCellsChanged);
    graph.on("cell:removed", onCellsChanged);
    graph.on("cell:changed", onCellsChanged);
    graph.on("scale", () =>
      requestAnimationFrame(syncNoOutputAndPlusPositions)
    );
    graph.on("translate", () =>
      requestAnimationFrame(syncNoOutputAndPlusPositions)
    );
    requestAnimationFrame(() => syncNoOutputAndPlusPositions());
    const parentContainer = container.parentElement;
    let ro: ResizeObserver | null = null;
   
    if (parentContainer) {
      // 容器尺寸变化时重设画布大小（窗口缩放等场景）
      ro = new ResizeObserver(() => {
        if (containerRef.current && graphRef.current) {
          const width = parentContainer.offsetWidth;
          const height = parentContainer.offsetHeight;
          graphRef.current.resize(width, height);
          requestAnimationFrame(syncNoOutputAndPlusPositions);
        }
      });
      ro.observe(parentContainer);
    }
    setReady(true);

    // 清理
    return () => {
      if (ro) {
        ro.disconnect();
      }
      graph.dispose();
    };
  }, [
    containerRef,
    selectedIdsRef,
    setHasSelection,
    setSelectedNodeId,
    setContextMenu,
    setGraphJson,
    setBackendPayloadJson,
    setNodeIdsWithNoOutput,
    setPlusButtonPositions,
    nodeIdsWithNoOutputRef,
    updatePlusAndOverlayRef,
    setOverlayTransform,
    setReady,
    onBackendPayloadJsonChange,
  ]);

  /**
   * 左侧菜单折叠状态变化时，强制根据当前容器尺寸调整一次画布，
   * 不依赖 ResizeObserver（因为菜单动画可能只用 transform，不改变实际布局）。
   */
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !containerRef.current) return;
    const width = containerRef.current.offsetWidth;
    const height = containerRef.current.offsetHeight;
    graph.resize(width, height);
    // 使用 centerContent 而不是 zoomToFit，避免缩放比例被强行重置太突兀
    graph.centerContent();
  }, [collapsed, containerRef]);

  return { graphRef };
}
