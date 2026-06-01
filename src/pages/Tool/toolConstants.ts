import type { ToolHttpMethod, ToolRiskLevel } from '@/types/tool';

export const SEARCH_DEBOUNCE_MS = 300;
export const DEFAULT_TOOL_METHOD: ToolHttpMethod = 'Get';
export const DEFAULT_TOOL_RISK: ToolRiskLevel = 'L1';
export const DEFAULT_EMPTY_SCHEMA = { type: 'object', properties: {} } as const;
