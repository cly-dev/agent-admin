import type { Agent, AgentAllowedToolRef } from '@/types/agent';

export function normalizeAgent(raw: unknown): Agent {
  const item = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const toolIdsRaw = item.toolIds ?? item.tool_ids;
  const configRaw = item.config;

  return {
    id: Number(item.id),
    appClientId: Number(item.appClientId ?? item.app_client_id),
    name: String(item.name ?? ''),
    systemPrompt: String(item.systemPrompt ?? item.system_prompt ?? ''),
    description: typeof item.description === 'string' ? item.description : undefined,
    toolIds: Array.isArray(toolIdsRaw)
      ? toolIdsRaw.map((id) => Number(id)).filter((id) => Number.isFinite(id))
      : undefined,
    maxSteps:
      typeof item.maxSteps === 'number'
        ? item.maxSteps
        : typeof item.max_steps === 'number'
          ? item.max_steps
          : undefined,
    enableToolCall: Boolean(item.enableToolCall ?? item.enable_tool_call ?? true),
    config:
      typeof configRaw === 'object' && configRaw !== null
        ? (configRaw as Record<string, unknown>)
        : undefined,
    createdAt:
      typeof item.createdAt === 'string'
        ? item.createdAt
        : typeof item.created_at === 'string'
          ? item.created_at
          : undefined,
    updatedAt:
      typeof item.updatedAt === 'string'
        ? item.updatedAt
        : typeof item.updated_at === 'string'
          ? item.updated_at
          : undefined,
  };
}

function normalizeToolMethod(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }
  const upper = value.trim().toUpperCase();
  if (upper === 'GET') return 'GET';
  if (upper === 'POST') return 'POST';
  if (upper === 'PUT') return 'PUT';
  if (upper === 'DELETE') return 'DELETE';
  return upper;
}

export function normalizeAgentAllowedTool(raw: unknown): AgentAllowedToolRef {
  const item = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const toolRaw = item.tool;
  const tool =
    typeof toolRaw === 'object' && toolRaw !== null
      ? (toolRaw as Record<string, unknown>)
      : item;

  const toolId = Number(item.toolId ?? item.tool_id ?? tool.id ?? tool.toolId ?? tool.tool_id);
  const bindingId = Number(item.id ?? item.bindingId ?? item.binding_id ?? toolId);

  const definitionKeyRaw = tool.definitionKey ?? tool.definition_key;
  const isActiveRaw = tool.isActive ?? tool.is_active;

  return {
    bindingId: Number.isFinite(bindingId) ? bindingId : toolId,
    toolId: Number.isFinite(toolId) ? toolId : 0,
    name: String(tool.name ?? item.name ?? ''),
    description:
      typeof tool.description === 'string'
        ? tool.description
        : typeof item.description === 'string'
          ? item.description
          : undefined,
    path:
      typeof tool.path === 'string'
        ? tool.path
        : typeof item.path === 'string'
          ? item.path
          : undefined,
    method: normalizeToolMethod(tool.method ?? item.method),
    definitionKey:
      typeof definitionKeyRaw === 'string' && definitionKeyRaw.trim()
        ? definitionKeyRaw.trim()
        : undefined,
    isActive:
      typeof isActiveRaw === 'boolean'
        ? isActiveRaw
        : isActiveRaw !== undefined
          ? Boolean(isActiveRaw)
          : undefined,
  };
}
