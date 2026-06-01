export type ApiTestParamIn = 'path' | 'query' | 'header' | 'body';

export type ApiTestParamType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';

export type ApiTestParamRow = {
  id: string;
  name: string;
  in: ApiTestParamIn;
  value: string;
  enabled: boolean;
  paramType: ApiTestParamType;
  description?: string;
};

export type ApiTestParamsByIn = Record<ApiTestParamIn, ApiTestParamRow[]>;

export type ApiTestRunResult = {
  ok?: boolean;
  statusCode?: number;
  durationMs?: number;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  error?: string;
};

/** 与 DebugToolDto 对齐的调试请求体 */
export type ApiDebugToolRequest = {
  parameters?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  apiKey?: string;
  timeoutMs?: number;
};

/** 与 InitToolSchemasFromDebugDto 对齐 */
export type ApiInitSchemasFromDebugRequest = ApiDebugToolRequest & {
  persist?: boolean;
  hint?: string;
};

export type ApiTestPanelProps = {
  /** 面板标题，默认 i18n apiTestPanel.title */
  title?: string;
  params: ApiTestParamsByIn;
  onParamsChange: (next: ApiTestParamsByIn) => void;
  /** 临时覆盖 Integration 系统 apiKey */
  apiKey?: string;
  onApiKeyChange?: (value: string) => void;
  running?: boolean;
  /** 禁用参数编辑 */
  paramsDisabled?: boolean;
  /** 禁用运行按钮 */
  runDisabled?: boolean;
  result?: ApiTestRunResult | null;
  onRun: () => void | Promise<void>;
  /** 从外部配置同步参数（如工具参数表） */
  onSyncParams?: () => void;
  syncParamsLabel?: string;
  hideSync?: boolean;
  /** 生成响应 Schema（outputSchema / responseProfile） */
  onGenerateSchemas?: () => void | Promise<void>;
  generateSchemasLabel?: string;
  generatingSchemas?: boolean;
  generateSchemasDisabled?: boolean;
  className?: string;
};
