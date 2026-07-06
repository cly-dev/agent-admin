import type { PageScopeOption } from '@/types/page-action';
import type { IntlShape } from '@umijs/max';

export function formatPageScopeOptionLabel(
  option: Pick<PageScopeOption, 'scope' | 'label'>,
): string {
  const scope = option.scope.trim();
  const label = option.label?.trim();
  if (label) {
    return `${label} (${scope})`;
  }
  return scope;
}

export function formatPageScopeOptionMeta(
  option: Pick<PageScopeOption, 'isActive'>,
  intl: IntlShape,
): string | undefined {
  if (option.isActive) {
    return undefined;
  }
  return intl.formatMessage({ id: 'pageScope.option.inactive' });
}

export function mergePageScopeOptions(
  options: PageScopeOption[],
  extraScopes: Array<string | null | undefined>,
): PageScopeOption[] {
  const map = new Map<string, PageScopeOption>();
  for (const option of options) {
    map.set(option.scope, option);
  }
  for (const raw of extraScopes) {
    const scope = raw?.trim();
    if (!scope || map.has(scope)) {
      continue;
    }
    map.set(scope, {
      scope,
      label: null,
      isActive: true,
    });
  }
  return Array.from(map.values()).sort((left, right) =>
    left.scope.localeCompare(right.scope),
  );
}
