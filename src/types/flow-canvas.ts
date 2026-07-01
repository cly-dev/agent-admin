/** Minimal flow-canvas types shared by FlowEditor visuals and workflow canvas. */

export type FlowNodeType =
  | 'start'
  | 'execute'
  | 'wait'
  | 'conditionCheck'
  | 'branch'
  | 'conditionGroupBranch';

export type FlowNodeStatus = 'config' | 'unconfig' | 'error';

export type FlowCanvasOrientation = 'horizontal' | 'vertical';

export interface FlowNodeData {
  nodeType?: FlowNodeType;
  status?: FlowNodeStatus;
  name?: string;
  description?: string;
  disabled?: boolean;
  layoutOrientation?: FlowCanvasOrientation;
  parentNodeId?: string;
  conditionGroupId?: string | number;
  [key: string]: unknown;
}
