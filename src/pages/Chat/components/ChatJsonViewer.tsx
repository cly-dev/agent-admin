import { normalizeJsonTreeValue } from '@/components/ApiTestPanel';
import JsonView from '@uiw/react-json-view';
import type { CSSProperties } from 'react';
import styles from '../index.module.scss';

const jsonViewTheme = {
  '--w-rjv-font-family': 'var(--font-mono)',
  '--w-rjv-background-color': 'transparent',
  '--w-rjv-curlybraces-color': 'rgb(0 87 194 / 0.75)',
  '--w-rjv-colon-color': 'rgb(25 28 30 / 0.45)',
  '--w-rjv-brackets-color': 'rgb(0 87 194 / 0.65)',
  '--w-rjv-arrow-color': 'rgb(25 28 30 / 0.4)',
  '--w-rjv-info-color': 'rgb(25 28 30 / 0.38)',
  '--w-rjv-type-string-color': 'rgb(154 52 18 / 0.92)',
  '--w-rjv-type-int-color': 'rgb(22 101 52 / 0.92)',
  '--w-rjv-type-float-color': 'rgb(22 101 52 / 0.92)',
  '--w-rjv-type-bigint-color': 'rgb(22 101 52 / 0.92)',
  '--w-rjv-type-boolean-color': 'rgb(161 98 7 / 0.92)',
  '--w-rjv-type-date-color': 'rgb(109 40 217 / 0.88)',
  '--w-rjv-type-null-color': 'rgb(185 28 28 / 0.88)',
  '--w-rjv-type-undefined-color': 'rgb(185 28 28 / 0.7)',
} as CSSProperties;

type ChatJsonViewerProps = {
  value: unknown;
  collapsed?: number | boolean;
  className?: string;
};

export function ChatJsonViewer({
  value,
  collapsed = 2,
  className,
}: ChatJsonViewerProps) {
  if (value === null || value === undefined) {
    return <span className={styles.chatDetailJsonEmpty}>—</span>;
  }

  return (
    <div className={`${styles.chatDetailJsonTree} ${className ?? ''}`.trim()}>
      <JsonView
        value={normalizeJsonTreeValue(value)}
        style={jsonViewTheme}
        collapsed={collapsed}
        displayDataTypes={false}
        shortenTextAfterLength={64}
      />
    </div>
  );
}
