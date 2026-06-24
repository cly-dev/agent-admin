export type MessageFeedbackRating = 'up' | 'down';

export type MessageFeedbackDownReasonTag = {
  key: string;
  label: string;
};

export type MessageFeedbackMessageRef = {
  id: number;
  role: string;
  contentPreview: string | null;
  createdAt: string;
};

export type MessageFeedbackUserRef = {
  id: number;
  username: string;
  employeeId: string;
  email: string;
};

export type MessageFeedbackSessionRef = {
  id: string;
  title: string | null;
  agentId: number | null;
};

export type MessageFeedbackListItem = {
  id: number;
  messageId: number;
  sessionId: string;
  userId: number;
  appClientId: number;
  turnId: number | null;
  agentId: number | null;
  agentName: string | null;
  rating: MessageFeedbackRating;
  reasonTags: string[];
  reasonTagLabels: string[];
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  message: MessageFeedbackMessageRef;
  user: MessageFeedbackUserRef;
  session: MessageFeedbackSessionRef;
};

export type MessageFeedbackSummary = {
  windowDays: number;
  from: string;
  to: string;
  totals: {
    feedback: number;
    up: number;
    down: number;
    upRate: number;
  };
  downReasonTagCounts: Array<{
    key: string;
    label: string;
    count: number;
  }>;
  downByAgent: Array<{
    agentId: number;
    agentName: string;
    downCount: number;
  }>;
};

export type MessageFeedbackDownReasonTagsResult = {
  items: MessageFeedbackDownReasonTag[];
};

export type MessageFeedbackControllerFindPageParams = {
  page?: number;
  pageSize?: number;
  id?: number;
  rating?: MessageFeedbackRating;
  agentId?: number;
  userId?: number;
  sessionId?: string;
  messageId?: number;
  turnId?: number;
  reasonTag?: string;
  commentKeyword?: string;
  orderBy?: 'id' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
};
