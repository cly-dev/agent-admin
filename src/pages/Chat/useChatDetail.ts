import { useProjectRoute } from '@/hooks/useProjectRoute';
import { AgentController_findOne } from '@/services/agent';
import { MessageTurnController_findPageBySessionId } from '@/services/message-turn';
import { SessionController_findOne } from '@/services/session';
import { UserController_findOne } from '@/services/user';
import type { Agent } from '@/types/agent';
import type { MessageTurn } from '@/types/message-turn';
import type { Session } from '@/types/session';
import type { User } from '@/types/user';
import { history, useIntl } from '@umijs/max';
import { message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { sortTurns } from './chatTurnDisplay';

const MAX_TURN_PAGE_SIZE = 100;

export function useChatDetail(sessionIdParam?: string) {
  const intl = useIntl();
  const { projectId, currentProject, toPagePath } = useProjectRoute();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [turns, setTurns] = useState<MessageTurn[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);

  const sessionId = (sessionIdParam ?? '').trim();
  const isValidSessionId = sessionId.length > 0;
  const listPath = toPagePath('chat', 'list');

  const loadDetail = useCallback(async () => {
    if (!isValidSessionId) {
      setSession(null);
      setTurns([]);
      setUser(null);
      setAgent(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const sessionDetail = await SessionController_findOne(sessionId);
      if (!sessionDetail.id) {
        setSession(null);
        setTurns([]);
        setUser(null);
        setAgent(null);
        return;
      }

      setSession(sessionDetail);

      const [turnResult, userResult, agentResult] = await Promise.all([
        MessageTurnController_findPageBySessionId(sessionId, {
          page: 1,
          pageSize: MAX_TURN_PAGE_SIZE,
          orderBy: 'id',
          order: 'asc',
        }),
        sessionDetail.userId
          ? UserController_findOne(sessionDetail.userId).catch(() => null)
          : Promise.resolve(null),
        sessionDetail.agentId
          ? AgentController_findOne(sessionDetail.agentId).catch(() => null)
          : Promise.resolve(null),
      ]);

      setTurns(sortTurns(turnResult.list));
      setUser(userResult);
      setAgent(agentResult);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'chat.detail.loadFailed' }),
      );
      setSession(null);
      setTurns([]);
      setUser(null);
      setAgent(null);
    } finally {
      setLoading(false);
    }
  }, [intl, isValidSessionId, sessionId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const firstTurn = turns[0];

  const userLabel = useMemo(() => {
    if (firstTurn?.user?.username) {
      return firstTurn.user.username;
    }
    if (firstTurn?.user?.email) {
      return firstTurn.user.email;
    }
    if (user?.email) {
      return user.email;
    }
    if (user?.username) {
      return user.username;
    }
    if (session?.userId) {
      return `#${session.userId}`;
    }
    return '—';
  }, [firstTurn?.user, session?.userId, user]);

  const agentLabel = useMemo(() => {
    if (firstTurn?.primaryAgent?.name) {
      return firstTurn.primaryAgent.name;
    }
    if (agent?.name) {
      return agent.name;
    }
    const agentId = session?.agentId ?? firstTurn?.primaryAgentId ?? agent?.id;
    if (agentId) {
      return `#${agentId}`;
    }
    return '—';
  }, [
    agent,
    firstTurn?.primaryAgent,
    firstTurn?.primaryAgentId,
    session?.agentId,
  ]);

  const projectLabel =
    currentProject?.name ?? (projectId ? `#${projectId}` : '—');

  const handleRate = (turnId: number, rating: number) => {
    setTurns((prev) =>
      prev.map((item) => (item.id === turnId ? { ...item, rating } : item)),
    );
  };

  const viewAgentRunDetail = useCallback(
    (runId: number) => {
      history.push(toPagePath('agent', `run/detail/${runId}`));
    },
    [toPagePath],
  );

  return {
    projectId,
    loading,
    session,
    turns,
    userLabel,
    agentLabel,
    projectLabel,
    isValidSessionId,
    listPath,
    sessionFeedbackPath: session?.id
      ? `${toPagePath('chat', 'feedback')}?sessionId=${encodeURIComponent(session.id)}`
      : undefined,
    handleRate,
    viewAgentRunDetail,
    reload: loadDetail,
  };
}
