import type { FlowListItem, FlowPresetCatalogEntry } from '@/types/flow';
import { FLOW_PRODUCT_PRESET_KINDS } from '@/pages/Workflow/workflowPreset';

/** 绑定入口：决定 mutate / mutation_submit 是否可用（非 Flow profile） */
export type FlowBindEntry = 'skill' | 'page_action';

export function parseFlowBindEntry(
  value: string | null | undefined,
): FlowBindEntry | null {
  if (value === 'skill' || value === 'page_action') {
    return value;
  }
  return null;
}

/** Skill / 通用创建：允许 mutate；PageAction：禁止 */
export function flowAllowsMutate(bindEntry: FlowBindEntry | null): boolean {
  return bindEntry !== 'page_action';
}

export function filterFlowProductCatalog(
  catalog: FlowPresetCatalogEntry[],
  bindEntry: FlowBindEntry | null = null,
): FlowPresetCatalogEntry[] {
  const allowed = new Set(FLOW_PRODUCT_PRESET_KINDS);
  let list = catalog.filter((item) =>
    allowed.has(item.kind as (typeof FLOW_PRODUCT_PRESET_KINDS)[number]),
  );
  if (bindEntry === 'page_action') {
    list = list.filter((item) => item.kind !== 'mutation_submit');
  }
  return list;
}

/** PageAction 绑定：排除含变更提交的 Flow */
export function filterFlowListForBinding(
  items: FlowListItem[],
  entry: FlowBindEntry,
): FlowListItem[] {
  if (entry !== 'page_action') {
    return items;
  }
  return items.filter((item) => item.deliverable !== 'mutation');
}

export function buildFlowCreatePath(bindEntry?: FlowBindEntry | null): string {
  const base = '/flow/assets/detail/create';
  if (bindEntry === 'skill' || bindEntry === 'page_action') {
    return `${base}?bindEntry=${bindEntry}`;
  }
  return base;
}
