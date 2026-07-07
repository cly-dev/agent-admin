export const TOOL_MODE_OPTIONS = ['READ', 'WRITE', 'ADMIN'] as const;
export type ToolAgentMode = (typeof TOOL_MODE_OPTIONS)[number];

export const RESOURCE_TYPE_OPTIONS = [
  'PRODUCT',
  'PRICE',
  'INVENTORY',
  'SEO',
  'CATEGORY',
  'COLLECTION',
  'ORDER',
  'CUSTOMER',
  'UNKNOWN',
] as const;
export type ToolAgentResource = (typeof RESOURCE_TYPE_OPTIONS)[number];

export const OPERATION_TYPE_OPTIONS = [
  'DETAIL',
  'LIST',
  'SEARCH',
  'STATS',
  'CREATE',
  'UPDATE',
  'DELETE',
  'IMPORT',
  'EXPORT',
  'PUBLISH',
  'UNPUBLISH',
] as const;
export type ToolAgentOperation = (typeof OPERATION_TYPE_OPTIONS)[number];

/** OpenAPI 参数名 + 值格式说明，供 LLM 生成 tool_calls */
export interface ParamFormatHint {
  /** 与 inputSchema.parameters / requestBody 字段名一致 */
  param: string;
  /** 给 LLM 的格式说明 */
  hint: string;
  /** 可选示例值 */
  example?: string;
}

export const DRAFT_REVIEW_EDIT_MODES = [
  'preview_only',
  'allowlisted_fields',
  'full',
] as const;
export type DraftReviewEditMode = (typeof DRAFT_REVIEW_EDIT_MODES)[number];

export const DRAFT_REVIEW_FIELD_ROLES = [
  'content',
  'identifier',
  'scenario',
  'enum',
  'system',
] as const;
export type DraftReviewFieldRole = (typeof DRAFT_REVIEW_FIELD_ROLES)[number];

export const DRAFT_REVIEW_FIELD_WIDGETS = [
  'text',
  'textarea',
  'select',
  'hidden',
] as const;
export type DraftReviewFieldWidget = (typeof DRAFT_REVIEW_FIELD_WIDGETS)[number];

export type DraftReviewFieldOverride = {
  path: string;
  role?: DraftReviewFieldRole;
  label?: string;
  reason?: string;
  widget?: DraftReviewFieldWidget;
};

export type DraftReviewPolicy = {
  editMode?: DraftReviewEditMode;
  submitPath?: string;
  editablePaths?: string[];
  lockedPaths?: string[];
  fieldOverrides?: DraftReviewFieldOverride[];
  allowArgumentsPatch?: boolean;
};

export interface AgentMetadata {
  mode: ToolAgentMode;
  resource: ToolAgentResource;
  operation: ToolAgentOperation;
  businessFields: string[];
  aliases: string[];
  examples: string[];
  priority: number;
  isMutation: boolean;
  paramFormatHints: ParamFormatHint[];
  /** WRITE Tool 草稿评审策略（C 端写确认 / 审批收件箱） */
  draftReview?: DraftReviewPolicy | null;
}
