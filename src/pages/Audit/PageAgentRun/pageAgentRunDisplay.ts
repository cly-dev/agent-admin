import { formatDateTime } from '@/pages/Chat/chatTurnDisplay';

export const PAGE_AGENT_RUN_STATUSES = [
  'running',
  'success',
  'failed',
] as const;

export const PAGE_AGENT_RUN_STATUS_COLORS: Record<string, string> = {
  running: 'processing',
  success: 'success',
  failed: 'error',
};

export function formatAuditDateTime(value?: string | null): string {
  return formatDateTime(value ?? undefined);
}

export function formatAuditDuration(value?: number | null): string {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return '—';
  }
  if (value < 1000) return `${value}ms`;
  const seconds = Math.floor(value / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  return remSec > 0 ? `${minutes}m ${remSec}s` : `${minutes}m`;
}

export function formatAuditUser(
  username: string | null | undefined,
  email: string | null | undefined,
  userId: number,
): string {
  if (username?.trim()) {
    return email?.trim() ? `${username} (${email})` : username;
  }
  if (email?.trim()) return email;
  return `#${userId}`;
}

export function formatNullableNumber(value?: number | null): string {
  return value === undefined || value === null || !Number.isFinite(value)
    ? '—'
    : String(value);
}
