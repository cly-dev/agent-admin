import { register } from "@antv/x6-react-shape";
import type { FlowNodeType } from "@/types";
import { FlowNodeReact } from "../components/FlowNodeReact";
import { FlowForkPillNode } from "../components/FlowForkPillNode";
import { FlowConditionGroupBranchNode } from "../components/FlowConditionGroupBranchNode";
import { twoPorts } from "./nodeShapes";

/**
 * 使用 x6-react-shape 注册 React 节点形状
 *
 * - 主节点统一使用 flow-node-react
 * - 通过 ports 配置进/出/底部端口
 */

// 主节点公共 React 形状
register({
  shape: "flow-node-react",
  width: 260,
  height: 90,
  component: FlowNodeReact,
});

// 条件分支 Fork Pill（YES / NO 小胶囊）
register({
  shape: "flow-node-branch-react",
  width: 68,
  height: 32,
  component: FlowForkPillNode,
  ports: twoPorts,
});

// 条件组分支节点（直角矩形，无圆角）
register({
  shape: "flow-node-condition-group-branch-react",
  width: 160,
  height: 44,
  component: FlowConditionGroupBranchNode,
  ports: twoPorts,
});

export const REACT_NODE_SHAPES: FlowNodeType[] = [
  "start",
  "conditionCheck",
  "execute",
  "wait",
  "branch",
  "conditionGroupBranch",
];


