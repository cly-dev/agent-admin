import type { MouseEvent } from 'react';

/** 行点击时忽略交互控件，避免与按钮/链接冲突 */
export function shouldIgnoreTableRowClick(event: MouseEvent<HTMLElement>): boolean {
  const target = event.target as HTMLElement;
  return Boolean(
    target.closest('button') ||
      target.closest('a') ||
      target.closest('.ant-popover') ||
      target.closest('.ant-dropdown'),
  );
}
