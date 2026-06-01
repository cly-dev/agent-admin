import { getIntl } from '@umijs/max';

export function formatAppMessage(
  id: string,
  values?: Record<string, string | number | boolean>,
): string {
  return getIntl().formatMessage({ id }, values);
}
