import type { Graph, Node, Edge } from "@antv/x6";
import type { FlowNodeData } from "@/types";
import { FLOW_NODE_PRESETS, CONDITION_BRANCH_EDGE_DATA_KEY } from "../utils/nodeConfig";
import { applyNodeStatusStyle } from "../utils/nodeConfig";

/**
 * 为条件节点创建分支节点和连线
 * 条件节点：自动生成「是」「否」两条不可删除的连线及两个分支小圆节点
 */
export function createConditionBranchNodesAndEdges(
  graph: Graph,
  conditionNode: Node
): { nodeYes: Node; nodeNo: Node; edgeYes: Edge; edgeNo: Edge } {
  const pos = conditionNode.getPosition();
  const bbox = conditionNode.getBBox();
  // 分支 Pill 相对条件节点的偏移：先按条件节点宽度偏移一小段，具体位置再根据分支自身尺寸微调
  const gapX = 100; // 条件节点右侧空隙
  const offsetY = 100; // YES/NO 之间的垂直间距（中心到中心）
  const branchPreset = FLOW_NODE_PRESETS.branch!;
  const baseX = pos.x + bbox.width + gapX;
  const centerY = pos.y + bbox.height / 2;

  // 先创建节点，再根据自身 bbox 精确对齐到条件节点中心附近
  const nodeYes = graph.addNode({
    shape: branchPreset.shape,
    x: baseX,
    y: centerY,
    label: "Yes",
    data: {
      ...branchPreset.data,
      name: "Yes",
      nodeType: "branch",
    },
    ...(branchPreset.attrs != null && {
      attrs: branchPreset.attrs as Record<string, Record<string, string>>,
    }),
  }) as Node;
  const nodeNo = graph.addNode({
    shape: branchPreset.shape,
    x: baseX,
    y: centerY,
    label: "No",
    data: {
      ...branchPreset.data,
      name: "No",
      nodeType: "branch",
    },
    ...(branchPreset.attrs != null && {
      attrs: branchPreset.attrs as Record<string, Record<string, string>>,
    }),
  }) as Node;
  // 使用节点自身尺寸重新计算精确位置
  const yesBox = nodeYes.getBBox();
  const noBox = nodeNo.getBBox();
  // YES 在上方，NO 在下方，二者相对条件节点中心对称
  nodeYes.position(baseX - yesBox.width / 2, centerY - offsetY - yesBox.height / 2);
  nodeNo.position(baseX - noBox.width / 2, centerY + offsetY - noBox.height / 2);
  applyNodeStatusStyle(nodeYes, nodeYes.getData() as FlowNodeData);
  applyNodeStatusStyle(nodeNo, nodeNo.getData() as FlowNodeData);

  // 「否」分支节点使用红色主色背景，以与「是」分支区分
  nodeNo.attr("body/fill", "#fef2f2");
  nodeNo.attr("body/stroke", "#dc2626");

  // 条件节点分支连线样式：与全局统一，细线 1px
  const edgeAttrs = {
    line: {
      stroke: "#5F95FF",
      strokeWidth: 1,
      targetMarker: { name: "classic", size: 8 },
    },
  };
  const edgeYes = graph.addEdge({
    source: { cell: conditionNode.id, port: "out" },
    target: { cell: nodeYes.id, port: "in" },
    attrs: edgeAttrs,
    router: { name: "manhattan" },
    connector: { name: "rounded", args: { radius: 8 } },
    zIndex: 0,
  }) as Edge;
  edgeYes.setData({ [CONDITION_BRANCH_EDGE_DATA_KEY]: true });

  const edgeNo = graph.addEdge({
    source: { cell: conditionNode.id, port: "out" },
    target: { cell: nodeNo.id, port: "in" },
    attrs: edgeAttrs,
    router: { name: "manhattan" },
    connector: { name: "rounded", args: { radius: 8 } },
    zIndex: 0,
  }) as Edge;
  edgeNo.setData({ [CONDITION_BRANCH_EDGE_DATA_KEY]: true });

  return { nodeYes, nodeNo, edgeYes, edgeNo };
}

/**
 * 为条件节点创建分支节点和连线（用于 handleAddNodeAfter）
 */
export function createConditionBranchNodesAndEdgesAfter(
  graph: Graph,
  conditionNode: Node
): { nodeYes: Node; nodeNo: Node; edgeYes: Edge; edgeNo: Edge } {
  const pos = conditionNode.getPosition();
  const bbox = conditionNode.getBBox();
  // 与上方函数保持一致的偏移策略，稍微再向右一些，避免与后续节点重叠
  const gapX = 50;
  const offsetY = 40;
  const branchPreset = FLOW_NODE_PRESETS.branch!;
  const centerY = pos.y + bbox.height / 2;
  const baseX = pos.x + bbox.width + gapX;

  const nodeYes = graph.addNode({
    shape: branchPreset.shape,
    x: baseX,
    y: centerY,
    label: "是",
    data: { ...branchPreset.data, name: "是", nodeType: "branch" },
    ...(branchPreset.attrs != null && {
      attrs: branchPreset.attrs as Record<string, Record<string, string>>,
    }),
  }) as Node;
  const nodeNo = graph.addNode({
    shape: branchPreset.shape,
    x: baseX,
    y: centerY,
    label: "否",
    data: { ...branchPreset.data, name: "否", nodeType: "branch" },
    ...(branchPreset.attrs != null && {
      attrs: branchPreset.attrs as Record<string, Record<string, string>>,
    }),
  }) as Node;
  const yesBox = nodeYes.getBBox();
  const noBox = nodeNo.getBBox();
  nodeYes.position(baseX - yesBox.width / 2, centerY - offsetY - yesBox.height / 2);
  nodeNo.position(baseX - noBox.width / 2, centerY + offsetY - noBox.height / 2);
  applyNodeStatusStyle(nodeYes, nodeYes.getData() as FlowNodeData);
  applyNodeStatusStyle(nodeNo, nodeNo.getData() as FlowNodeData);

  // 「否」分支节点使用红色主色背景，以与「是」分支区分
  nodeNo.attr("body/fill", "#fef2f2");
  nodeNo.attr("body/stroke", "#dc2626");
  // handleAddNodeAfter 场景下的分支连线同样统一为 1px
  const edgeAttrs = {
    line: {
      stroke: "#5F95FF",
      strokeWidth: 1,
      targetMarker: { name: "classic", size: 8 },
    },
  };
  const edgeYes = graph.addEdge({
    source: { cell: conditionNode.id, port: "out" },
    target: { cell: nodeYes.id, port: "in" },
    attrs: edgeAttrs,
    router: { name: "manhattan" },
    connector: { name: "rounded", args: { radius: 8 } },
    zIndex: 0,
  }) as Edge;
  edgeYes.setData({ [CONDITION_BRANCH_EDGE_DATA_KEY]: true });
  const edgeNo = graph.addEdge({
    source: { cell: conditionNode.id, port: "out" },
    target: { cell: nodeNo.id, port: "in" },
    attrs: edgeAttrs,
    router: { name: "manhattan" },
    connector: { name: "rounded", args: { radius: 8 } },
    zIndex: 0,
  }) as Edge;
  edgeNo.setData({ [CONDITION_BRANCH_EDGE_DATA_KEY]: true });

  return { nodeYes, nodeNo, edgeYes, edgeNo };
}
