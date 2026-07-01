import type {
  HostTool,
  HostToolSkillTrigger,
  SkillHostToolBindingItemDto,
  SkillHostToolBindingRecord,
} from '@/types/host-tool';

export type SkillHostToolTabKey = 'mutation' | 'plan';

export const PLAN_TRIGGER_OPTIONS: HostToolSkillTrigger[] = [
  'ON_PLAN_STEP',
  'LLM_SCOPED',
];

export type SkillHostToolTabRow = {
  hostToolId: number;
  name: string;
  description?: string;
  pageScope?: string | null;
  enabled: boolean;
  trigger: HostToolSkillTrigger;
  priority: number;
  isRequired: boolean;
  argsTemplateJson: string;
};

function stringifyJson(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '';
  }
}

export function isMutationTrigger(trigger?: string): boolean {
  return trigger === 'ON_MUTATION_SUCCESS';
}

export function isPlanTrigger(trigger?: string): boolean {
  return trigger === 'ON_PLAN_STEP' || trigger === 'LLM_SCOPED';
}

export function buildMutationTabRows(
  agentHostTools: HostTool[],
  bindings: SkillHostToolBindingRecord[],
): SkillHostToolTabRow[] {
  const bindingMap = new Map(
    bindings
      .filter((item) => isMutationTrigger(item.trigger))
      .map((item) => [item.hostToolId, item] as const),
  );

  return agentHostTools
    .filter((tool) => tool.id > 0)
    .map((tool) => {
      const binding = bindingMap.get(tool.id);
      return {
        hostToolId: tool.id,
        name: tool.name,
        description: tool.description,
        pageScope: tool.pageScope,
        enabled: Boolean(binding),
        trigger: 'ON_MUTATION_SUCCESS',
        priority: binding?.priority ?? 0,
        isRequired: binding?.isRequired ?? false,
        argsTemplateJson: stringifyJson(binding?.skillArgsTemplate),
      };
    });
}

export function buildPlanTabRows(
  agentHostTools: HostTool[],
  bindings: SkillHostToolBindingRecord[],
): SkillHostToolTabRow[] {
  const bindingMap = new Map(
    bindings
      .filter((item) => isPlanTrigger(item.trigger))
      .map((item) => [item.hostToolId, item] as const),
  );

  return agentHostTools
    .filter((tool) => tool.id > 0)
    .map((tool) => {
      const binding = bindingMap.get(tool.id);
      const trigger =
        binding?.trigger === 'LLM_SCOPED' || binding?.trigger === 'ON_PLAN_STEP'
          ? binding.trigger
          : 'ON_PLAN_STEP';
      return {
        hostToolId: tool.id,
        name: tool.name,
        description: tool.description,
        pageScope: tool.pageScope,
        enabled: Boolean(binding),
        trigger,
        priority: binding?.priority ?? 0,
        isRequired: binding?.isRequired ?? false,
        argsTemplateJson: stringifyJson(binding?.skillArgsTemplate),
      };
    });
}

export function hasCustomSkillHostToolConfig(
  bindings: SkillHostToolBindingRecord[] | undefined,
): boolean {
  return (bindings?.length ?? 0) > 0;
}

export function parseArgsTemplateJson(
  value: string,
): Record<string, unknown> | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export function buildSkillHostToolsPayload(
  mutationRows: SkillHostToolTabRow[],
  planRows: SkillHostToolTabRow[],
): SkillHostToolBindingItemDto[] {
  const items: SkillHostToolBindingItemDto[] = [];

  for (const row of mutationRows) {
    if (!row.enabled) {
      continue;
    }
    const argsTemplate = parseArgsTemplateJson(row.argsTemplateJson);
    if (argsTemplate === null) {
      throw new Error('invalid argsTemplate');
    }
    items.push({
      hostToolId: row.hostToolId,
      trigger: 'ON_MUTATION_SUCCESS',
      priority: row.priority,
      isRequired: row.isRequired,
      argsTemplate,
    });
  }

  for (const row of planRows) {
    if (!row.enabled) {
      continue;
    }
    const argsTemplate = parseArgsTemplateJson(row.argsTemplateJson);
    if (argsTemplate === null) {
      throw new Error('invalid argsTemplate');
    }
    items.push({
      hostToolId: row.hostToolId,
      trigger: row.trigger,
      priority: row.priority,
      isRequired: row.isRequired,
      argsTemplate,
    });
  }

  return items;
}
