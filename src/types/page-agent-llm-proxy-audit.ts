export type PageAgentLlmProxyAuditStatus = 'running' | 'success' | 'failed';

export type PageAgentLlmProxyAuditQuery = {
  page?: number;
  pageSize?: number;
  userId?: number;
  status?: PageAgentLlmProxyAuditStatus;
  modelConfigId?: number;
  upstreamStatus?: number;
};

export type PageAgentLlmProxyAuditRequestMeta = Record<string, unknown>;

export type PageAgentLlmProxyAuditListItem = {
  id: number;
  appClientId: number;
  appClientName?: string;
  userId: number;
  username: string | null;
  userEmail: string | null;
  modelConfigId: number | null;
  requestedModel: string | null;
  provider: string | null;
  providerModel: string | null;
  status: PageAgentLlmProxyAuditStatus | string;
  upstreamStatus: number | null;
  durationMs: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  createdAt: string;
  finishedAt: string | null;
};

export type PageAgentLlmProxyAuditDetail = PageAgentLlmProxyAuditListItem & {
  requestMeta: PageAgentLlmProxyAuditRequestMeta | null;
  errorMessage: string | null;
};
