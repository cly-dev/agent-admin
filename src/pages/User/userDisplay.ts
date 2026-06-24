import type { User } from '@/types/user';
import { useIntl } from '@umijs/max';

type AppIntl = ReturnType<typeof useIntl>;

export function formatUserType(
  intl: AppIntl,
  value?: User['userType'],
): string {
  if (!value) return '—';
  const id = `user.userType.${value}`;
  const text = intl.formatMessage({ id, defaultMessage: '' });
  return text || value;
}

export function formatUserRole(intl: AppIntl, user: User): string {
  if (user.userRole) {
    const id = `user.userRole.${user.userRole}`;
    const text = intl.formatMessage({ id, defaultMessage: '' });
    if (text) return text;
    return user.userRole;
  }
  return user.role || '—';
}
