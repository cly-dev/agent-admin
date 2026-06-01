import { useIntl } from '@umijs/max';
import JsonView from '@uiw/react-json-view';
import { darkTheme } from '@uiw/react-json-view/dark';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { ApiTestRunResult } from './types';
import { buildApiTestResultView, normalizeJsonTreeValue } from './utils';
import styles from './index.module.scss';

type ApiTestResultViewerProps = {
  result: ApiTestRunResult | null;
  running?: boolean;
};

const jsonViewTheme = {
  ...darkTheme,
  '--w-rjv-font-family': 'var(--font-mono)',
  '--w-rjv-background-color': 'transparent',
  '--w-rjv-curlybraces-color': 'rgb(175 198 255 / 0.85)',
  '--w-rjv-colon-color': 'rgb(239 241 244 / 0.55)',
  '--w-rjv-brackets-color': 'rgb(175 198 255 / 0.75)',
  '--w-rjv-arrow-color': 'rgb(163 190 254 / 0.7)',
  '--w-rjv-edit-color': 'rgb(255 182 149 / 0.95)',
  '--w-rjv-info-color': 'rgb(239 241 244 / 0.45)',
  '--w-rjv-type-string-color': 'rgb(255 182 149 / 0.95)',
  '--w-rjv-type-int-color': 'rgb(134 239 172 / 0.95)',
  '--w-rjv-type-float-color': 'rgb(134 239 172 / 0.95)',
  '--w-rjv-type-bigint-color': 'rgb(134 239 172 / 0.95)',
  '--w-rjv-type-boolean-color': 'rgb(250 204 21 / 0.95)',
  '--w-rjv-type-date-color': 'rgb(196 181 253 / 0.95)',
  '--w-rjv-type-null-color': 'rgb(248 113 113 / 0.9)',
  '--w-rjv-type-undefined-color': 'rgb(248 113 113 / 0.75)',
} as CSSProperties;

const ApiTestResultViewer: React.FC<ApiTestResultViewerProps> = ({ result, running }) => {
  const intl = useIntl();
  const view = useMemo(() => buildApiTestResultView(result), [result]);

  const tabs = useMemo(() => {
    const items: { key: 'response' | 'request'; label: string; data: unknown }[] = [];
    if (view.response !== undefined) {
      items.push({
        key: 'response',
        label: intl.formatMessage({ id: 'apiTestPanel.resultTab.response' }),
        data: view.response,
      });
    }
    if (view.request !== undefined) {
      items.push({
        key: 'request',
        label: intl.formatMessage({ id: 'apiTestPanel.resultTab.request' }),
        data: view.request,
      });
    }
    return items;
  }, [intl, view.request, view.response]);

  const [activeTab, setActiveTab] = useState<'response' | 'request'>('response');

  useEffect(() => {
    if (view.response !== undefined) {
      setActiveTab('response');
      return;
    }
    if (view.request !== undefined) {
      setActiveTab('request');
    }
  }, [result, view.request, view.response]);

  const activeKey = tabs.some((tab) => tab.key === activeTab)
    ? activeTab
    : (tabs[0]?.key ?? 'response');

  const activeData = tabs.find((tab) => tab.key === activeKey)?.data;

  if (running) {
    return (
      <div className={`${styles.resultViewer} ${styles.resultViewerLoading}`}>
        {intl.formatMessage({ id: 'apiTestPanel.running' })}
      </div>
    );
  }

  if (!result) {
    return (
      <div className={`${styles.resultViewer} ${styles.resultViewerEmpty}`}>
        {intl.formatMessage({ id: 'apiTestPanel.outputPlaceholder' })}
      </div>
    );
  }

  const statusLabel =
    view.ok === true
      ? intl.formatMessage({ id: 'apiTestPanel.statusSuccess' }, { status: view.statusCode ?? '—' })
      : view.ok === false
        ? intl.formatMessage({ id: 'apiTestPanel.statusFailed' }, { status: view.statusCode ?? '—' })
        : view.statusCode !== undefined
          ? `HTTP ${view.statusCode}`
          : null;

  return (
    <div className={styles.resultViewer}>
      {(statusLabel || view.durationMs !== undefined || view.error) && (
        <div className={styles.resultMeta}>
          {statusLabel ? (
            <span
              className={`${styles.resultBadge} ${
                view.ok ? styles.resultBadgeOk : view.ok === false ? styles.resultBadgeError : ''
              }`}
            >
              {statusLabel}
            </span>
          ) : null}
          {view.durationMs !== undefined ? (
            <span className={styles.resultMetaItem}>{view.durationMs}ms</span>
          ) : null}
          {view.error ? <span className={styles.resultError}>{view.error}</span> : null}
        </div>
      )}

      {tabs.length > 1 ? (
        <div className={styles.resultTabs} role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeKey === tab.key}
              className={`${styles.resultTab} ${activeKey === tab.key ? styles.resultTabActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className={styles.jsonTree}>
        {activeData !== undefined ? (
          <JsonView
            value={normalizeJsonTreeValue(activeData)}
            style={jsonViewTheme}
            collapsed={2}
            displayDataTypes={false}
            shortenTextAfterLength={48}
          />
        ) : (
          <span className={styles.resultViewerEmpty}>
            {intl.formatMessage({ id: 'apiTestPanel.resultEmpty' })}
          </span>
        )}
      </div>
    </div>
  );
};

export default ApiTestResultViewer;
