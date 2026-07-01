/** react-mentions 中 HTTP 工具 mention 的 id 前缀 */
export const SKILL_TOOL_MENTION_PREFIX = 'tool';

/** react-mentions 中前端工具 mention 的 id 前缀 */
export const SKILL_HOST_TOOL_MENTION_PREFIX = 'hostTool';

const UNIFIED_MENTION_MARKUP_REGEX = /@\[([^\]]*)\]\(([^:]+):(\d+)\)/g;

export type SkillPromptToolOption = {
  toolId: number;
  name: string;
  description?: string;
  method?: string;
  path?: string;
};

export type SkillPromptHostToolOption = {
  hostToolId: number;
  name: string;
  description?: string;
  pageScope?: string | null;
};

export type SkillPromptMentionKind = 'tool' | 'hostTool';

export function buildSkillToolMentionId(toolId: number): string {
  return `${SKILL_TOOL_MENTION_PREFIX}:${toolId}`;
}

export function buildSkillHostToolMentionId(hostToolId: number): string {
  return `${SKILL_HOST_TOOL_MENTION_PREFIX}:${hostToolId}`;
}

export function parseSkillToolMentionId(raw: string): number | null {
  if (!raw.startsWith(`${SKILL_TOOL_MENTION_PREFIX}:`)) {
    return null;
  }
  const toolId = Number(raw.slice(SKILL_TOOL_MENTION_PREFIX.length + 1));
  return Number.isFinite(toolId) && toolId > 0 ? toolId : null;
}

export function parseSkillHostToolMentionId(raw: string): number | null {
  if (!raw.startsWith(`${SKILL_HOST_TOOL_MENTION_PREFIX}:`)) {
    return null;
  }
  const hostToolId = Number(
    raw.slice(SKILL_HOST_TOOL_MENTION_PREFIX.length + 1),
  );
  return Number.isFinite(hostToolId) && hostToolId > 0 ? hostToolId : null;
}

export function hasMentionMarkup(prompt: string, prefix: string): boolean {
  return prompt.includes(`](${prefix}:`);
}

function parseMentionIdsByPrefix(prompt: string, prefix: string): number[] {
  const ids: number[] = [];
  const seen = new Set<number>();
  let match: RegExpExecArray | null;

  const regex = new RegExp(UNIFIED_MENTION_MARKUP_REGEX.source, 'g');
  while ((match = regex.exec(prompt)) !== null) {
    if (match[2] !== prefix) {
      continue;
    }
    const id = Number(match[3]);
    if (Number.isFinite(id) && id > 0 && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }

  return ids;
}

/** 从带 markup 的文案解析被 @ 的 HTTP 工具 ID */
export function parseMentionToolIds(prompt: string): number[] {
  return parseMentionIdsByPrefix(prompt, SKILL_TOOL_MENTION_PREFIX);
}

/** 从带 markup 的文案解析被 @ 的前端工具 ID */
export function parseMentionHostToolIds(prompt: string): number[] {
  return parseMentionIdsByPrefix(prompt, SKILL_HOST_TOOL_MENTION_PREFIX);
}

/** 提交给后端的业务指引：将 mention markup 转为可读的 @工具名 */
export function promptMarkupToPlainText(prompt: string): string {
  return prompt.replace(
    UNIFIED_MENTION_MARKUP_REGEX,
    (_full, display: string) => {
      const label = typeof display === 'string' ? display.trim() : '';
      return label ? `@${label}` : '@';
    },
  );
}

export function buildToolMentionData(tools: SkillPromptToolOption[]) {
  return tools
    .filter((tool) => tool.toolId > 0)
    .map((tool) => ({
      id: buildSkillToolMentionId(tool.toolId),
      display: tool.name?.trim() || `#${tool.toolId}`,
      kind: 'tool' as const,
    }));
}

export function buildHostToolMentionData(
  hostTools: SkillPromptHostToolOption[],
) {
  return hostTools
    .filter((tool) => tool.hostToolId > 0)
    .map((tool) => ({
      id: buildSkillHostToolMentionId(tool.hostToolId),
      display: tool.name?.trim() || `#${tool.hostToolId}`,
      kind: 'hostTool' as const,
    }));
}

export function buildUnifiedMentionData(
  tools: SkillPromptToolOption[],
  hostTools: SkillPromptHostToolOption[],
) {
  return [
    ...buildToolMentionData(tools),
    ...buildHostToolMentionData(hostTools),
  ];
}

/** @deprecated 使用 buildToolMentionData */
export function buildMentionData(tools: SkillPromptToolOption[]) {
  return buildToolMentionData(tools);
}
