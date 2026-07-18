import type { FlowProfile } from './flow';

export type FlowIntentOperation = 'read' | 'judge' | 'deliver' | 'mutate';
export type FlowDeliverChannel = 'speak' | 'fill';

export type FlowImageEvidenceCapability = {
  enabled: boolean;
  hint?: string;
  from?: 'upstream' | 'page_context' | 'all';
  maxCells?: number;
  cellPx?: number;
  maxGroups?: number;
  maxCellsPerGroup?: number;
  onFailure?: 'degrade' | 'fail';
  cacheTtlSec?: number;
};

export type FlowIntentStep = {
  id: string;
  name?: string;
  objective?: string;
  operation: FlowIntentOperation;
  /** deliver */
  channel?: FlowDeliverChannel;
  completeWhen?: 'first_success' | 'fetch_all_pages';
  summarizeMode?: 'brief' | 'detailed' | 'draft' | 'final';
  stream?: boolean;
  presentMode?: 'brief' | 'detailed';
  confirmKind?: 'mutation' | 'generic';
  summarizeAfter?: boolean;
  /** mutate 高级：确认前说明，默认不传 / false */
  explainBeforeConfirm?: boolean;
  readToolIds?: number[];
  fillHostToolIds?: number[];
  writeToolId?: number;
  policyHint?: string;
  images?: FlowImageEvidenceCapability;
  /**
   * 判定分支末梢占位（仅前端）。
   * 在节点里定义状态时自动生成；用户再点 + 物化为真实步骤。serialize 时丢弃。
   */
  branchTip?: boolean;
};

export type FlowIntentEdge = {
  id: string;
  from: string;
  to: string;
  kind?: 'always' | 'state' | 'default';
  state?: { key: string; description: string };
  /**
   * 运营填写的状态名称（仅前端；serialize 时丢弃）。
   * 用于 state-keys 分配与画布标签，禁止写入服务端 Intent。
   */
  uiLabel?: string;
};

export type FlowIntent = {
  version: 1;
  profile: FlowProfile;
  entryStepId: string;
  steps: FlowIntentStep[];
  edges: FlowIntentEdge[];
};
