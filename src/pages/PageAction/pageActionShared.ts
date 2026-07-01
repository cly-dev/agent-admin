import type { HostTool } from '@/types/host-tool';

export const PAGE_ACTION_SYSTEM_PROMPT_MAX = 8192;

export const DEFAULT_PAGE_ACTION_SYSTEM_PROMPT = `你是 {业务场景} 助手，负责为页面输入框生成可直接使用的正文。

输出要求（硬性）：
- 只输出连续正文本身，不要 JSON，不要 Markdown，不要代码围栏
- 不要标题、不要「结论摘要」等分段结构，除非 instruction 明确要求
- 正文必须可直接写入 host 工具的 string 字段
- 仅依据 user 消息中的 page_context 与 context；缺失信息时用通用礼貌表述，禁止编造数字或 ID
- 使用与用户 request 相同的语言`;

export function inferPageScopeFromActionKey(actionKey: string): string | undefined {
  const trimmed = actionKey.trim();
  const dot = trimmed.indexOf('.');
  if (dot <= 0) {
    return undefined;
  }
  return trimmed.slice(0, dot);
}

export function formatHostToolOptionLabel(tool: HostTool): string {
  const scope =
    tool.pageScope?.trim() ||
    (tool.hostPageId ? tool.pageScope : null) ||
    'generic';
  return `${tool.name} (${scope})`;
}

const STREAM_FILL_FIELD_HINTS = new Set([
  'text',
  'content',
  'value',
  'draft',
  'body',
]);

/** HostTool argsSchema 是否含可流式 append 的 string 字段（运营提示用） */
export function hostToolHasStreamFillField(tool: HostTool): boolean {
  return hasStringArgField(tool.argsSchema);
}

function hasStringArgField(schema: unknown): boolean {
  if (typeof schema !== 'object' || schema === null) {
    return false;
  }
  const properties = (schema as Record<string, unknown>).properties;
  if (typeof properties !== 'object' || properties === null) {
    return false;
  }

  return Object.entries(properties as Record<string, unknown>).some(
    ([key, value]) => {
      if (typeof value !== 'object' || value === null) {
        return false;
      }
      const type = (value as Record<string, unknown>).type;
      return type === 'string' || STREAM_FILL_FIELD_HINTS.has(key);
    },
  );
}
