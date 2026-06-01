import type { IntegrationAuthMode } from '@/types/integration';
import { useIntl } from '@umijs/max';
import { useMemo } from 'react';

const AUTH_MODES: IntegrationAuthMode[] = ['USER_PREFERRED', 'SYSTEM_ONLY', 'USER_ONLY'];

export function useAuthModeOptions() {
  const intl = useIntl();

  return useMemo(
    () =>
      AUTH_MODES.map((value) => ({
        value,
        label: intl.formatMessage({ id: `authMode.${value}` }),
      })),
    [intl],
  );
}

export function useAuthModeLabel(authMode: IntegrationAuthMode): string {
  const intl = useIntl();
  return intl.formatMessage({ id: `authMode.${authMode}` });
}
