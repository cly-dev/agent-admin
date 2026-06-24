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
}
