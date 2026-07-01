import { message, Modal } from "antd";
import type { Graph, Node, Edge } from "@antv/x6";
import type {
  FlowConditionItem,
  FlowNodeData,
  FlowNodeType,
  FlowNodeStatus,
} from "@/types";
import type { NodePropertyFormValues } from "@/components/FlowConditionDrawer/types";
import {
  FLOW_NODE_PRESETS,
  CONDITION_BRANCH_EDGE_DATA_KEY,
  applyNodeStatusStyle,
} from "../utils/nodeConfig";
import {
  twoPortsHorizontal,
  twoPortsVertical,
  onePortOutHorizontal,
  onePortOutVertical,
} from "../utils/nodeShapes";
import {
  formatCanvasSilent,
  type FlowCanvasOrientation,
} from "../utils/flowCanvasFormatter";
import { resolveWaitTimerType } from "@/utils/flowWaitType";

const CONDITION_GROUP_BRANCH_EDGE_DATA_KEY = "isConditionGroupBranchEdge";

function normalizeConditionItems(
  items: FlowConditionItem[] | undefined
): FlowConditionItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }
  const seen = new Set<string>();
  const normalized: FlowConditionItem[] = [];
  for (const item of items) {
    const id = String(item.id ?? "").trim();
    const attributeKey = String(item.attributeKey ?? "").trim();
    if (!id || !attributeKey || seen.has(id)) {
      continue;
    }
    seen.add(id);
    normalized.push({ ...item, id, attributeKey });
  }
  return normalized;
}

function getSubtreeBottom(graph: Graph, rootNodeId: string): number {
  const visited = new Set<string>();
  const queue: string[] = [rootNodeId];
  let maxBottom = Number.NEGATIVE_INFINITY;

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const cell = graph.getCellById(current);
    if (cell && cell.isNode()) {
      const bbox = (cell as Node).getBBox();
      const bottom = bbox.y + bbox.height;
      if (bottom > maxBottom) {
        maxBottom = bottom;
      }
    }

    graph
      .getEdges()
      .filter((e) => e.getSourceCellId() === current)
      .forEach((e) => {
        const targetId = e.getTargetCellId();
        if (!visited.has(targetId)) {
          queue.push(targetId);
        }
      });
  }

  return maxBottom === Number.NEGATIVE_INFINITY ? 0 : maxBottom;
}

function collectDescendantNodeIds(graph: Graph, rootNodeId: string): string[] {
  const visited = new Set<string>();
  const queue: string[] = [rootNodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    graph
      .getEdges()
      .filter((e) => e.getSourceCellId() === current)
      .forEach((e) => {
        const targetId = e.getTargetCellId();
        const targetCell = graph.getCellById(targetId);
        if (targetCell?.isNode() && !visited.has(targetId)) {
          queue.push(targetId);
        }
      });
  }

  return Array.from(visited);
}

function syncConditionGroupBranchNodesAndEdges(args: {
  graph: Graph;
  conditionCheckNode: Node;
  groups: { id: string; name: string }[];
}): void {
  const { graph, conditionCheckNode, groups } = args;
  // 复用已有分支节点，避免编辑应用时“删掉再重建”导致分支与下游节点失去连线关联
  const existingBranchNodes = graph.getNodes().filter((n) => {
    const d = (n.getData() ?? {}) as FlowNodeData;
    return (
      d.nodeType === "conditionGroupBranch" &&
      d.parentNodeId === conditionCheckNode.id
    );
  });

  const branchNodesByGroupId = new Map<string, Node>();
  existingBranchNodes.forEach((n) => {
    const d = (n.getData() ?? {}) as FlowNodeData;
    if (typeof d.conditionGroupId === "string") {
      branchNodesByGroupId.set(d.conditionGroupId, n);
    }
  });

  const groupIdSet = new Set(groups.map((g) => g.id));

  // 如果条件组清空：删除所有旧分支节点（连线会一并被移除）
  if (groups.length === 0) {
    existingBranchNodes.forEach((n) => graph.removeCell(n));
    return;
  }

  // 删除已不存在的分支节点（对应条件组被移除）
  existingBranchNodes.forEach((n) => {
    const d = (n.getData() ?? {}) as FlowNodeData;
    if (typeof d.conditionGroupId === "string" && !groupIdSet.has(d.conditionGroupId)) {
      graph.removeCell(n);
    }
  });

  // 记录“条件检查 -> 条件组分支”的内部自动边，避免重复创建
  const internalEdges = graph.getEdges().filter((e) => {
    const d = (e.getData() ?? {}) as Record<string, unknown>;
    return d[CONDITION_GROUP_BRANCH_EDGE_DATA_KEY] === true;
  });
  const internalEdgeByTargetId = new Map<string, Edge>();
  internalEdges.forEach((e) => {
    internalEdgeByTargetId.set(e.getTargetCellId(), e as Edge);
  });

  const parentPos = conditionCheckNode.getPosition();
  const parentBox = conditionCheckNode.getBBox();
  const data = (conditionCheckNode.getData() ?? {}) as FlowNodeData;
  const orientation = data.layoutOrientation ?? "horizontal";
  const centerX = parentPos.x + parentBox.width / 2;
  const centerY = parentPos.y + parentBox.height / 2;
  const branchPreset = FLOW_NODE_PRESETS.conditionGroupBranch!;
  // 分支节点形状尺寸（与 reactNodeShapes 注册保持一致）
  const branchWidth = 160;
  const branchHeight = 44;
  const nodeGapFromParent = 100; // 父节点到底下子节点“排布带”的距离
  const siblingGap = 150; // 子节点之间的间距（左右/上下）

  const edgeAttrs = {
    line: {
      stroke: "#5F95FF",
      strokeWidth: 1,
      targetMarker: { name: "classic", size: 8 },
    },
  };

  const count = groups.length;
  // 纵向布局时：在父节点下方做一条“横向带”，子节点在这条水平线上左右对称排布
  const totalWidth = count * branchWidth + (count - 1) * siblingGap;
  const firstCenterX = centerX - totalWidth / 2 + branchWidth / 2;

  // 横向布局时：在父节点右侧做一条“竖直带”，子节点在这条竖线上上下对称排布
  const totalHeight = count * branchHeight + (count - 1) * siblingGap;
  const firstCenterY = centerY - totalHeight / 2 + branchHeight / 2;

  groups.forEach((g, index) => {
    // 规则：
    // - 横向布局（horizontal）：子节点与父节点在同一 X 轴竖直线（x 相同），上下对称排布；
    //   父节点右侧 100px 处为第一个子节点中心的基线，之后按 siblingGap+节点高度 累加
    // - 纵向布局（vertical）：子节点与父节点在同一 Y 轴水平线（y 相同），左右对称排布；
    //   父节点下方 100px 处为子节点行的 y，x 方向左右展开
    const nodeCenterX =
      orientation === "horizontal"
        ? parentPos.x + parentBox.width + nodeGapFromParent + branchWidth / 2
        : firstCenterX + index * (branchWidth + siblingGap);
    const nodeCenterY =
      orientation === "horizontal"
        ? firstCenterY + index * (branchHeight + siblingGap)
        : parentPos.y + parentBox.height + nodeGapFromParent + branchHeight / 2;

    const nodeX = nodeCenterX - branchWidth / 2;
    const nodeY = nodeCenterY - branchHeight / 2;

    const prevNode = branchNodesByGroupId.get(g.id);
    const currentNode = prevNode && graph.getCellById(prevNode.id)
      ? (graph.getCellById(prevNode.id) as Node)
      : null;

    const node =
      currentNode ??
      (graph.addNode({
        shape: branchPreset.shape,
        x: nodeX,
        y: nodeY,
        label: g.name,
        ports: orientation === "horizontal" ? twoPortsHorizontal : twoPortsVertical,
        data: {
          ...branchPreset.data,
          nodeType: "conditionGroupBranch",
          name: g.name,
          parentNodeId: conditionCheckNode.id,
          conditionGroupId: g.id,
        },
        ...(branchPreset.attrs != null && {
          attrs: branchPreset.attrs as Record<string, Record<string, string>>,
        }),
      }) as Node);

    // 更新名称与位置（保留原 node.id，避免断连）
    node.setData({
      ...(node.getData() ?? {}),
      nodeType: "conditionGroupBranch",
      name: g.name,
      parentNodeId: conditionCheckNode.id,
      conditionGroupId: g.id,
    } as FlowNodeData);
    node.setPosition(nodeX, nodeY);
    applyNodeStatusStyle(node, node.getData() as FlowNodeData);

    // 确保内部边存在：条件检查 -> 条件组分支
    if (!internalEdgeByTargetId.has(node.id)) {
      const edge = graph.addEdge({
        source: { cell: conditionCheckNode.id, port: "out" },
        target: { cell: node.id, port: "in" },
        attrs: edgeAttrs,
        // 条件组分支连线：使用直角（manhattan）但不再做圆角
        router: { name: "manhattan" },
        connector: { name: "normal" },
        zIndex: 0,
      }) as Edge;
      edge.setData({ [CONDITION_GROUP_BRANCH_EDGE_DATA_KEY]: true });
      internalEdgeByTargetId.set(node.id, edge);
    }
  });
}

export interface UseFlowNodeOperationsOptions {
  graphRef: React.MutableRefObject<Graph | null>;
  selectedIdsRef: React.MutableRefObject<Set<string>>;
  setHasSelection: (hasSelection: boolean) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (nodeId: string | null) => void;
  canvasOrientation: FlowCanvasOrientation;
}

/**
 * 节点操作 Hook
 * 负责节点的添加、删除、编辑、复制等操作
 */
export function useFlowNodeOperations(
  options: UseFlowNodeOperationsOptions
): {
  handleAddNode: (
    shapeOrPreset?: string,
    nodeType?: FlowNodeType,
    defaultLabel?: string
  ) => void;
  handleAddNodeAtPosition: (
    shapeOrPreset: string,
    nodeType: FlowNodeType | undefined,
    defaultLabel: string | undefined,
    position: { x: number; y: number }
  ) => void;
  handleAddNodeAfter: (fromNodeId: string, nodeType: FlowNodeType) => void;
  handleDeleteSelected: () => void;
  handleDeleteCurrentNode: () => void;
  handleApplyProperty: (values: NodePropertyFormValues) => void;
  handleContextCopy: (nodeId: string) => void;
} {
  const {
    graphRef,
    selectedIdsRef,
    setHasSelection,
    selectedNodeId,
    setSelectedNodeId,
    canvasOrientation,
  } = options;

  const getPortsForPreset = (
    presetKey: keyof typeof FLOW_NODE_PRESETS,
    orientation: FlowCanvasOrientation
  ) => {
    const isStart = presetKey === "start";

    if (orientation === "horizontal") {
      if (isStart) return onePortOutHorizontal;
      return twoPortsHorizontal;
    }

    // vertical
    if (isStart) return onePortOutVertical;
    return twoPortsVertical;
  };

  /**
   * 内部通用：按给定坐标添加节点
   */
  const addNodeInternal = (
    shapeOrPreset: string,
    nodeType: FlowNodeType | undefined,
    defaultLabel: string | undefined,
    position: { x: number; y: number }
  ): void => {
    const graph = graphRef.current;
    if (!graph) return;

    // 只允许有一个开始节点
    if (nodeType === "start" || shapeOrPreset === "start") {
      const hasStart = graph
        .getNodes()
        .some(
          (n) => ((n.getData() ?? {}) as FlowNodeData).nodeType === "start"
        );
      if (hasStart) {
        message.warning("每个 Flow 只能有一个 Trigger 节点");
        return;
      }
    }

    const label = defaultLabel ?? "新节点";
    const preset = FLOW_NODE_PRESETS[shapeOrPreset];
    let node: Node;

    const baseX = position.x;
    const baseY = position.y;

    if (preset) {
      const ports = getPortsForPreset(
        shapeOrPreset as keyof typeof FLOW_NODE_PRESETS,
        canvasOrientation
      );
      node = graph.addNode({
        shape: preset.shape,
        x: baseX,
        y: baseY,
        label,
        ...(ports != null && { ports }),
        data: {
          ...preset.data,
          name: label,
          layoutOrientation: canvasOrientation,
          ...(nodeType != null && { nodeType }),
        },
        ...(preset.attrs != null && {
          attrs: preset.attrs as Record<string, Record<string, string>>,
        }),
      }) as Node;
      const data = node.getData() as FlowNodeData | undefined;
      if (data) applyNodeStatusStyle(node, data);
    } else {
      node = graph.addNode({
        shape: shapeOrPreset,
        x: baseX,
        y: baseY,
        label,
        data: nodeType
          ? {
              nodeType,
              status: "unconfig" as FlowNodeStatus,
              disabled: false,
              name: label,
            }
          : undefined,
      }) as Node;
      if (nodeType) {
        applyNodeStatusStyle(node, node.getData() as FlowNodeData);
      }
    }

    message.success("节点已添加");
  };

  /**
   * 添加节点：传预设 key 时用 FLOW_NODE_PRESETS 的样式；传形状名时按形状添加（可选 nodeType）
   * 使用视口中心 + 网格偏移作为默认位置
   */
  const handleAddNode = (
    shapeOrPreset: string = "flow-node",
    nodeType?: FlowNodeType,
    defaultLabel?: string
  ): void => {
    const graph = graphRef.current;
    if (!graph) return;

    const container = graph.container as HTMLElement;
    const viewportCenter = graph.clientToLocal({
      x: container.clientWidth / 2,
      y: container.clientHeight / 2,
    });
    const existingCount = graph.getNodes().length;
    const col = existingCount % 3;
    const row = Math.floor(existingCount / 3);
    const offsetX = col * 220;
    const offsetY = row * 140;
    const baseX = viewportCenter.x - 80 + offsetX;
    const baseY = viewportCenter.y - 60 + offsetY;

    addNodeInternal(shapeOrPreset, nodeType, defaultLabel, {
      x: baseX,
      y: baseY,
    });
  };

  /**
   * 按指定画布坐标添加节点（供拖拽落点使用）
   */
  const handleAddNodeAtPosition = (
    shapeOrPreset: string,
    nodeType: FlowNodeType | undefined,
    defaultLabel: string | undefined,
    position: { x: number; y: number }
  ): void => {
    addNodeInternal(shapeOrPreset, nodeType, defaultLabel, position);
  };

  /**
   * 从某节点右侧加号添加下一节点并连线（仅允许执行/条件/结束，不含开始）
   */
  const handleAddNodeAfter = (
    fromNodeId: string,
    nodeType: FlowNodeType
  ): void => {
    const graph = graphRef.current;
    if (!graph) return;
    if (nodeType === "start") return;

    const fromNode = graph.getCellById(fromNodeId) as Node | undefined;
    if (!fromNode?.isNode()) return;

    const presetKey: keyof typeof FLOW_NODE_PRESETS =
      nodeType === "execute"
        ? "execute"
        : nodeType === "conditionCheck"
        ? "conditionCheck"
        : "wait";
    const defaultLabel =
      nodeType === "execute"
        ? "Action"
        : nodeType === "conditionCheck"
        ? "Check conditions"
        : "Wait";
    const preset = FLOW_NODE_PRESETS[presetKey];
    const pos = fromNode.getPosition();
    const bbox = fromNode.getBBox();
    /** 加号添加下一节点时，与来源节点边界的间距 */
    const gap = 120;
    const newX =
      canvasOrientation === "horizontal"
        ? pos.x + bbox.width + gap
        : pos.x;
    let newY =
      canvasOrientation === "horizontal"
        ? pos.y
        : pos.y + bbox.height + gap;

    // 纵向布局下，当父节点是条件组分支节点时，
    // 新增子节点需要放在当前分支整棵子树的最底部之下，额外预留 gap，避免与已有子树重叠
    const fromData = (fromNode.getData() ?? {}) as FlowNodeData;
    if (
      canvasOrientation === "vertical" &&
      fromData.nodeType === "conditionGroupBranch"
    ) {
      const subtreeBottom = getSubtreeBottom(graph, fromNodeId);
      const fromBottom = bbox.y + bbox.height;
      const baseTop = Math.max(fromBottom, subtreeBottom) + gap;
      newY = baseTop;
    }

    const ports = preset!.ports ?? getPortsForPreset(presetKey, canvasOrientation);

    // 先添加节点，再根据自身高度与来源节点中心做对齐
    const newNode = graph.addNode({
      shape: preset!.shape,
      x: newX,
      y: newY,
      label: defaultLabel,
      ...(ports != null && { ports }),
      data: {
        ...preset!.data,
        name: defaultLabel,
        nodeType,
        layoutOrientation: canvasOrientation,
      },
      ...(preset!.attrs != null && {
        attrs: preset!.attrs as Record<string, Record<string, string>>,
      }),
    }) as Node;
    const data = newNode.getData() as FlowNodeData | undefined;
    if (data) applyNodeStatusStyle(newNode, data);

    // 对齐新节点中心到来源节点中心（解决高度不一致带来的偏差）
    const newBox = newNode.getBBox();
    if (canvasOrientation === "horizontal") {
      const fromCenterY = bbox.y + bbox.height / 2;
      const newYAligned = fromCenterY - newBox.height / 2;
      newNode.position(newX, newYAligned);
    } else {
      const fromCenterX = bbox.x + bbox.width / 2;
      const newXAligned = fromCenterX - newBox.width / 2;
      newNode.position(newXAligned, newY);
    }

    // 新连线样式与全局保持一致：细直线、统一箭头
    graph.addEdge({
      source: { cell: fromNodeId, port: "out" },
      target: { cell: newNode.id, port: "in" },
      attrs: {
        line: {
          stroke: "#5F95FF",
          strokeWidth: 1,
          targetMarker: { name: "classic", size: 8 },
        },
      },
      zIndex: 0,
    });

    // 新增后直接打开该节点属性抽屉
    setSelectedNodeId(newNode.id);

    message.success("已添加下一节点并连线");
  };

  /**
   * 删除当前选中的节点或连线（条件节点的「是/否」连线不可删除）
   */
  const handleDeleteSelected = (): void => {
    const graph = graphRef.current;
    if (!graph) return;

    const ids = Array.from(selectedIdsRef.current);
    if (ids.length === 0) {
      message.warning("请先选择要删除的节点或连线");
      return;
    }

    const toRemoveNodes = new Set<string>();
    const toRemoveEdges = new Set<string>();
    let skippedConditionEdges = 0;
    let skippedBranchNodes = 0;
    ids.forEach((id) => {
      const cell = graph.getCellById(id);
      if (!cell) return;
      if (cell.isEdge()) {
        const data = (cell as Edge).getData() ?? {};
        if (data[CONDITION_BRANCH_EDGE_DATA_KEY]) {
          skippedConditionEdges++;
          return;
        }
        toRemoveEdges.add(id);
        return;
      }
      if (cell.isNode()) {
        const data = (cell.getData() ?? {}) as FlowNodeData;
        if (data.nodeType === "start") {
          // 触发器节点不允许删除
          return;
        }
          if (data.nodeType === "branch" || data.nodeType === "conditionGroupBranch") {
          skippedBranchNodes++;
          return;
        }
        // 删除节点时，递归删除其所有后代子节点（直到最后一级）
        collectDescendantNodeIds(graph, id).forEach((nodeId) => {
          const node = graph.getCellById(nodeId);
          if (!node?.isNode()) return;
          const nodeData = (node.getData() ?? {}) as FlowNodeData;
          if (nodeData.nodeType === "start") return;
          toRemoveNodes.add(nodeId);
        });
      }
    });

    toRemoveEdges.forEach((edgeId) => {
      const cell = graph.getCellById(edgeId);
      if (cell?.isEdge()) graph.removeCell(cell);
    });
    toRemoveNodes.forEach((nodeId) => {
      const cell = graph.getCellById(nodeId);
      if (cell?.isNode()) graph.removeCell(cell);
    });
    selectedIdsRef.current.clear();
    setHasSelection(false);

    if (skippedConditionEdges > 0) {
      message.warning(
        `条件节点的「是/否」连线不可删除，已跳过 ${skippedConditionEdges} 条`
      );
    }
    if (skippedBranchNodes > 0) {
      message.warning(`分支节点不可单独删除，已跳过 ${skippedBranchNodes} 个`);
    }
    const removedCount = toRemoveNodes.size + toRemoveEdges.size;
    if (removedCount > 0) {
      message.success(`已删除 ${removedCount} 项`);
    }
  };

  /**
   * 在属性面板中直接删除当前打开的节点（带二次确认）
   */
  const handleDeleteCurrentNode = (): void => {
    const graph = graphRef.current;
    if (!graph || !selectedNodeId) return;

    const node = graph.getCellById(selectedNodeId) as Node | undefined;
    if (!node?.isNode()) return;
    const data = (node.getData() ?? {}) as FlowNodeData;
    if (data.nodeType === "start") {
      message.warning("Trigger 节点不可删除");
      return;
    }
    if (data.nodeType === "branch" || data.nodeType === "conditionGroupBranch") {
      message.warning("分支节点不可单独删除");
      return;
    }

    Modal.confirm({
      title: "确认删除",
      content:
        data.nodeType === "conditionCheck"
          ? "删除后该 Check conditions 节点及其条件组分支节点、连线将不可恢复，是否继续？"
          : "删除后该节点及其连线将不可恢复，是否继续？",
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: () => {
        const toRemove = collectDescendantNodeIds(graph, selectedNodeId).filter((id) => {
          const cell = graph.getCellById(id);
          if (!cell?.isNode()) return false;
          const nd = (cell.getData() ?? {}) as FlowNodeData;
          return nd.nodeType !== "start";
        });
        toRemove.forEach((id) => {
          const cell = graph.getCellById(id);
          if (cell?.isNode()) {
            graph.removeCell(cell);
          }
          selectedIdsRef.current.delete(id);
        });
        setHasSelection(selectedIdsRef.current.size > 0);
        setSelectedNodeId(null);
        message.success("节点已删除");
      },
    });
  };

  /**
   * 应用属性（由 NodePropertyDrawer onApply 回调传入表单值）
   */
  const handleApplyProperty = (values: NodePropertyFormValues): void => {
    const graph = graphRef.current;
    if (!graph || !selectedNodeId) return;

    const node = graph.getCellById(selectedNodeId) as Node | undefined;
    if (!node?.isNode()) return;

    const customPropsList = (values.customPropsList ?? []) as {
      key: string;
      value: string;
    }[];
    const customProps: Record<string, string> = {};
    customPropsList.forEach(({ key, value }) => {
      if (key && String(key).trim())
        customProps[String(key).trim()] = String(value ?? "");
    });
    const prevData = (node.getData() ?? {}) as FlowNodeData;
    const { label, customPropsList: _ignoredList, ...restValues } = values;

    const baseName = String(values.name ?? values.label ?? "").trim();
    const nodeType = values.nodeType ?? prevData.nodeType;

    let finalName = baseName;
    if (
      nodeType === "wait" &&
      resolveWaitTimerType(values as Record<string, unknown>) === "wait_for_some_time" &&
      values.waitDuration != null &&
      values.waitUnit
    ) {
      const unitTextMap: Record<string, string> = {
        minutes: "分钟",
        hours: "小时",
        days: "天",
        weeks: "周",
        months: "月",
      };
      const unitText = unitTextMap[values.waitUnit] ?? "";
      if (baseName === "" || baseName === "等待" || baseName === "等待事件") {
        finalName =
          nodeType === "wait"
            ? `等待 ${values.waitDuration}${unitText}`
            : `等待事件 ${values.waitDuration}${unitText}`;
      }
    }
    const nextData: FlowNodeData = {
      ...prevData,
      ...restValues,
      nodeType,
      customProps:
        Object.keys(customProps).length > 0 ? customProps : prevData.customProps,
      name: finalName || prevData.name,
    };
    // 条件字段按节点类型显式收敛，避免旧条件残留导致“已删除条件回显”
    if (nodeType === "start") {
      const normalizedItems = normalizeConditionItems(values.conditionGroup?.items);
      nextData.conditionGroup =
        normalizedItems.length > 0 ? { items: normalizedItems } : undefined;
      nextData.conditionGroups = undefined;
    } else if (nodeType === "conditionCheck") {
      nextData.conditionGroups = Array.isArray(values.conditionGroups)
        ? values.conditionGroups.map((group) => ({
            id: group.id,
            name: group.name,
            group: {
              items: normalizeConditionItems(group.group?.items),
            },
          }))
        : [];
      nextData.conditionGroup = undefined;
    } else if (nodeType === "wait") {
      const normalizedItems = normalizeConditionItems(values.conditionGroup?.items);
      const mode = resolveWaitTimerType({
        ...values,
        conditionGroup:
          normalizedItems.length > 0 ? { items: normalizedItems } : undefined,
      } as Record<string, unknown>);
      nextData.conditionGroup =
        mode === "wait_for_event_in_window" && normalizedItems.length > 0
          ? { items: normalizedItems }
          : undefined;
      nextData.waitType = mode;
      nextData.timerType = mode;
    }
    // 使用覆盖写入，避免 X6 默认 merge 导致旧数组尾项残留（例如 [A,B,C] -> [A,C,C]）
    node.setData(nextData, { overwrite: true });

    const nameForRender = (finalName || prevData.name || "").trim() || " ";
    const shape = node.shape;
    // 对于 React 节点，由 React 组件负责截断展示，不再写入 label/text，避免 X6 根据文本自动调整节点宽度
    if (shape !== "flow-node-react" && shape !== "flow-node-branch-react") {
      node.attr("label/text", nameForRender);
      node.attr("text/text", nameForRender);
    }
    applyNodeStatusStyle(node, nextData);
    // 条件检查节点：同步生成每个条件组的分支节点，并使用统一布局规则重排
    if (nodeType === "conditionCheck") {
      const groups = Array.isArray(nextData.conditionGroups) ? nextData.conditionGroups : [];
      syncConditionGroupBranchNodesAndEdges({
        graph,
        conditionCheckNode: node,
        groups: groups.map((g) => ({ id: g.id, name: g.name })),
      });
      // 全局格式化一次画布，保证 Check conditions 子树左右对称、结构稳定
      // 使用当前画布方向，而不是写死 vertical
      formatCanvasSilent(graph, canvasOrientation);
    }
    message.success("属性已应用");
    setSelectedNodeId(null);
  };

  /**
   * 右键菜单：复制节点
   */
  const handleContextCopy = (nodeId: string): void => {
    const graph = graphRef.current;
    if (!graph) return;
    const node = graph.getCellById(nodeId) as Node | undefined;
    if (!node?.isNode()) return;
    const pos = node.getPosition();
    const data = (node.getData() ?? {}) as FlowNodeData;
    const nodeType = data.nodeType as FlowNodeType | undefined;
    const label =
      data.name ??
      (node.attr("label/text") as string | undefined) ??
      (node.attr("text/text") as string | undefined) ??
      "新节点";

    const shapeOrPreset: string =
      nodeType != null && FLOW_NODE_PRESETS[nodeType]
        ? nodeType
        : node.shape;

    addNodeInternal(shapeOrPreset, nodeType, label, {
      x: pos.x + 30,
      y: pos.y + 30,
    });
    message.success("已复制节点");
  };

  return {
    handleAddNode,
    handleAddNodeAtPosition,
    handleAddNodeAfter,
    handleDeleteSelected,
    handleDeleteCurrentNode,
    handleApplyProperty,
    handleContextCopy,
  };
}
