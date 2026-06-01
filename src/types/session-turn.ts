export type SessionTurnStatus = 'running' | 'success' | 'failed';

export interface SessionTurnControllerFindPageBySessionIdParams {
  page?: number;
  pageSize?: number;
  id?: number;
  userId?: number;
  appClientId?: number;
  primaryAgentId?: number;
  status?: SessionTurnStatus;
  userInput?: string;
  keyword?: string;
  orderBy?:
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'startedAt'
    | 'finishedAt'
    | 'durationMs'
    | 'totalTokens';
  order?: 'asc' | 'desc';
}
