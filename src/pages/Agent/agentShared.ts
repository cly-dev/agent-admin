import type { Agent } from '@/types/agent';
import type { useIntl } from '@umijs/max';

export type AgentListStatus = 'active' | 'inactive';

export type AgentListItem = Agent & {
  listStatus: AgentListStatus;
  updatedAtLabel: string;
  maxStepsLabel: string;
};

export function formatAgentUpdatedAt(
  value: string | undefined,
  intl: ReturnType<typeof useIntl>,
): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return intl.formatDate(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toAgentListItem(agent: Agent, intl: ReturnType<typeof useIntl>): AgentListItem {
  const maxSteps = agent.maxSteps ?? 8;

  return {
    ...agent,
    listStatus: agent.enableToolCall === false ? 'inactive' : 'active',
    updatedAtLabel: formatAgentUpdatedAt(agent.updatedAt ?? agent.createdAt, intl),
    maxStepsLabel: intl.formatMessage({ id: 'agent.card.maxSteps' }, { count: maxSteps }),
  };
}

export function getAgentListStatus(agent: Pick<Agent, 'enableToolCall'>): AgentListStatus {
  return agent.enableToolCall === false ? 'inactive' : 'active';
}

/** `/agent/create` has no :id param; `/agent/detail/create` uses id === 'create'. */
export function isAgentCreateRoute(pathname: string, routeId?: string): boolean {
  if (routeId === 'create') {
    return true;
  }
  return /\/agent\/create\/?$/.test(pathname);
}
