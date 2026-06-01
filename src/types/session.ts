export interface Session {
  /** Session ID */
  id: string;
  appClientId: number;
  userId: number;
  agentId?: number;
  title?: string;
  messageCount?: number;
  rated?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSessionDto {
  id?: string;
  userId: number;
  agentId?: number;
  title?: string;
}

export interface UpdateSessionDto {
  userId?: number;
  agentId?: number;
  title?: string;
}

export interface SessionControllerFindPageParams {
  page?: number;
  pageSize?: number;
  id?: string;
  userId?: number;
  agentId?: number;
  title?: string;
  keyword?: string;
  orderBy?: 'id' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}
