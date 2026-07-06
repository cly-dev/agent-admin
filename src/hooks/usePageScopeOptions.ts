import { PageActionController_findPageScopesByAppClient } from '@/services/page-action';
import type { PageScopeOption } from '@/types/page-action';
import {
  formatPageScopeOptionLabel,
  formatPageScopeOptionMeta,
  mergePageScopeOptions,
} from '@/utils/page-scope';
import { useIntl } from '@umijs/max';
import { useEffect, useMemo, useState } from 'react';

type UsePageScopeOptionsParams = {
  appClientId?: number;
  activeOnly?: boolean;
  extraScopes?: Array<string | null | undefined>;
};

export function usePageScopeOptions({
  appClientId,
  activeOnly = true,
  extraScopes = [],
}: UsePageScopeOptionsParams) {
  const intl = useIntl();
  const [options, setOptions] = useState<PageScopeOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!appClientId) {
      setOptions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void PageActionController_findPageScopesByAppClient(appClientId, {
      activeOnly,
    })
      .then((list) => {
        if (!cancelled) {
          setOptions(list);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOptions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeOnly, appClientId]);

  const mergedOptions = useMemo(
    () => mergePageScopeOptions(options, extraScopes),
    [extraScopes, options],
  );

  const selectOptions = useMemo(
    () =>
      mergedOptions.map((option) => {
        const inactiveMeta = formatPageScopeOptionMeta(option, intl);
        return {
          value: option.scope,
          label: inactiveMeta
            ? `${formatPageScopeOptionLabel(option)} · ${inactiveMeta}`
            : formatPageScopeOptionLabel(option),
        };
      }),
    [intl, mergedOptions],
  );

  return {
    options: mergedOptions,
    selectOptions,
    loading,
  };
}
