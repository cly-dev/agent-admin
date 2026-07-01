import type { Node } from "@antv/x6";
import type { FlowNodeData, FlowNodeType } from "@/types";
import type { ReactNode } from "react";
import { onePortIn, twoPorts } from "./nodeShapes";
import {
  NODE_ICON_MAP,
  NODE_VISUAL_TOKENS,
} from "./nodeVisualConfig";

/** 流程节点样式预设（用于演示流程与统一风格） */
export const FLOW_NODE_PRESETS: Record<
  string,
  {
    shape: string;
    data?: Partial<FlowNodeData>;
    ports?: typeof onePortIn | typeof twoPorts;
    attrs?: {
      body?: { fill?: string; stroke?: string };
      [key: string]: unknown;
    };
  }
> = {
  start: {
    // 使用 React 节点形状
    shape: "flow-node-react",
    data: { nodeType: "start", status: "config" },
    attrs: {
      body: {
        fill: NODE_VISUAL_TOKENS.start.fill,
        stroke: NODE_VISUAL_TOKENS.start.stroke,
      },
    },
  },
  execute: {
    shape: "flow-node-react",
    data: { nodeType: "execute", status: "unconfig" },
    attrs: {
      body: {
        fill: NODE_VISUAL_TOKENS.execute.fill,
        stroke: NODE_VISUAL_TOKENS.execute.stroke,
      },
    },
  },
  conditionCheck: {
    // 条件检查节点：使用与条件节点类似的视觉风格
    shape: "flow-node-react",
    data: { nodeType: "conditionCheck", status: "unconfig" },
    attrs: {
      body: {
        fill: NODE_VISUAL_TOKENS.conditionCheck.fill,
        stroke: NODE_VISUAL_TOKENS.conditionCheck.stroke,
      },
    },
  },
  wait: {
    shape: "flow-node-react",
    data: { nodeType: "wait", status: "config" },
    attrs: {
      body: {
        fill: NODE_VISUAL_TOKENS.wait.fill,
        stroke: NODE_VISUAL_TOKENS.wait.stroke,
      },
    },
  },
  /** 分支出口小圆：仅能接在条件节点输出后 */
  branch: {
    shape: "flow-node-branch-react",
    data: { nodeType: "branch", status: "config" },
    attrs: {
      body: {
        fill: NODE_VISUAL_TOKENS.branch.fill,
        stroke: NODE_VISUAL_TOKENS.branch.stroke,
      },
    },
  },
  /** 条件组分支节点：仅由条件检查节点驱动生成，只读展示 */
  conditionGroupBranch: {
    // 条件组分支节点使用独立的直角矩形形状
    shape: "flow-node-condition-group-branch-react",
    data: { nodeType: "conditionGroupBranch", status: "config" },
    attrs: {
      body: {
        fill: NODE_VISUAL_TOKENS.conditionGroupBranch.fill,
        stroke: NODE_VISUAL_TOKENS.conditionGroupBranch.stroke,
      },
    },
  },
  /** 高亮样式（如数据校验等） */
  highlight: {
    shape: "flow-node",
    attrs: { body: { fill: "#FFF3E0", stroke: "#FF9800" } },
  },
};

/** 节点语义类型（左侧 - 按类型添加，使用 FLOW_NODE_PRESETS 预设样式） */
export const NODE_TYPES: {
  nodeType: FlowNodeType;
  preset: keyof typeof FLOW_NODE_PRESETS;
  label: string;
  icon: ReactNode;
}[] = [
  {
    nodeType: "start",
    preset: "start",
    label: "Trigger",
    icon: NODE_ICON_MAP.start,
  },
  {
    nodeType: "conditionCheck",
    preset: "conditionCheck",
    label: "Check conditions",
    icon: NODE_ICON_MAP.conditionCheck,
  },
  {
    nodeType: "execute",
    preset: "execute",
    label: "Action",
    icon: NODE_ICON_MAP.execute,
  },
  {
    nodeType: "wait",
    preset: "wait",
    label: "Wait",
    icon: NODE_ICON_MAP.wait,
  },
];

/** 更新节点 icon 文本（显示在节点左侧的小图标） */
function updateNodeIcon(node: Node, data: FlowNodeData): void {
  const type = data.nodeType as FlowNodeType | undefined;
  if (!type) return;
  // 对于使用 React 组件的节点，主要依赖 React 渲染 icon，这里仅保留占位符逻辑
  if (type === "branch") {
    node.attr("icon/text", "");
    node.attr("icon/display", "none");
  }
}

/** 条件节点自动生成的两条边（是/否）标记，此类边不可删除 */
export const CONDITION_BRANCH_EDGE_DATA_KEY = "isConditionBranch";

/** 更新节点描述文本（显示在节点下方） */
export function updateNodeDescription(node: Node, data: FlowNodeData): void {
  const description = data.description?.trim();
  console.log("[updateNodeDescription] description:", description, "data:", data);
  if (description && description.length > 0) {
    // 限制描述文本长度，避免节点过宽
    const maxLength = 20;
    const displayText = description.length > maxLength 
      ? description.substring(0, maxLength) + "..." 
      : description;
    console.log("[updateNodeDescription] Setting description text:", displayText);
    node.attr("description/text", displayText);
    node.attr("description/display", "");
    // 强制刷新节点
    node.setAttrByPath("description/text", displayText);
    node.setAttrByPath("description/display", "");
  } else {
    console.log("[updateNodeDescription] Hiding description");
    node.attr("description/text", "");
    node.attr("description/display", "none");
    node.setAttrByPath("description/text", "");
    node.setAttrByPath("description/display", "none");
  }
}

/** 根据节点 data 应用状态样式（未配置/已配置/错误/禁用） */
export function applyNodeStatusStyle(node: Node, data: FlowNodeData): void {
  const disabled = data.disabled;
  const status = data.status ?? "unconfig";
  const nodeType = data.nodeType;

  // 更新节点描述 & icon
  updateNodeDescription(node, data);
  updateNodeIcon(node, data);

  if (disabled) {
    node.attr("body/fill", "#f5f5f5");
    node.attr("body/stroke", "#d4d4d8");
    node.attr("body/strokeDasharray", "4 2");
    return;
  }

  // 分支小圆节点：保持预设配色，仅在错误状态时覆盖
  if (nodeType === "branch" && status !== "error") {
    return;
  }

  // 错误状态统一红色高亮
  switch (status) {
    case "error":
      node.attr("body/fill", "#fef2f2");
      node.attr("body/stroke", "#ef4444");
      node.attr("body/strokeDasharray", "");
      return;
    default:
      break;
  }

  const visual =
    (nodeType && NODE_VISUAL_TOKENS[nodeType]) || {
      fill: "#ffffff",
      stroke: "#e5e7eb",
      dashed: false,
    };

  node.attr("body/fill", visual.fill);
  node.attr("body/stroke", visual.stroke);
  node.attr("body/strokeDasharray", visual.dashed === true ? "4 2" : "");
}
