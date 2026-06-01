import { CodeOutlined, PlayCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Input } from 'antd';
import { useMemo } from 'react';
import ApiTestParamsEditor from './ApiTestParamsEditor';
import ApiTestResultViewer from './ApiTestResultViewer';
import type { ApiTestPanelProps } from './types';
import styles from './index.module.scss';

const ApiTestPanel: React.FC<ApiTestPanelProps> = ({
  title,
  params,
  onParamsChange,
  apiKey = '',
  onApiKeyChange,
  running = false,
  paramsDisabled = false,
  runDisabled = false,
  result = null,
  onRun,
  onSyncParams,
  syncParamsLabel,
  hideSync = false,
  onGenerateSchemas,
  generateSchemasLabel,
  generatingSchemas = false,
  generateSchemasDisabled = false,
  className,
}) => {
  const intl = useIntl();

  const panelTitle = title ?? intl.formatMessage({ id: 'apiTestPanel.title' });
  const syncLabel = syncParamsLabel ?? intl.formatMessage({ id: 'apiTestPanel.syncParams' });
  const generateLabel =
    generateSchemasLabel ?? intl.formatMessage({ id: 'apiTestPanel.generateSchemas' });

  const footerStatus = useMemo(() => {
    if (running) {
      return intl.formatMessage({ id: 'apiTestPanel.running' });
    }
    if (result) {
      return intl.formatMessage(
        {
          id: result.ok ? 'apiTestPanel.footerSuccess' : 'apiTestPanel.footerFailed',
        },
        { status: result.statusCode ?? '—' },
      );
    }
    return intl.formatMessage({ id: 'apiTestPanel.ready' });
  }, [intl, result, running]);

  return (
    <section className={[styles.panel, className].filter(Boolean).join(' ')}>
      <header className={styles.header}>
        <div className={styles.title}>
          <CodeOutlined />
          <h3>{panelTitle}</h3>
        </div>
        <div className={styles.headerActions}>
          {onGenerateSchemas ? (
            <button
              type="button"
              className={styles.generateButton}
              disabled={generateSchemasDisabled || generatingSchemas || running}
              onClick={() => void onGenerateSchemas()}
            >
              <ThunderboltOutlined />
              {generateLabel}
            </button>
          ) : null}
          <button
            type="button"
            className={styles.runButton}
            disabled={runDisabled || running || generatingSchemas}
            onClick={() => void onRun()}
          >
            <PlayCircleOutlined />
            {intl.formatMessage({ id: 'apiTestPanel.run' })}
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.block}>
          <div className={styles.labelRow}>
            <span className={styles.label}>
              <CodeOutlined />
              {intl.formatMessage({ id: 'apiTestPanel.request' })}
            </span>
            {!hideSync && onSyncParams ? (
              <button
                type="button"
                className={styles.syncButton}
                disabled={paramsDisabled}
                onClick={onSyncParams}
              >
                {syncLabel}
              </button>
            ) : null}
          </div>

          <div className={styles.apiKeyRow}>
            <span className={styles.apiKeyLabel}>
              {intl.formatMessage({ id: 'apiTestPanel.apiKey' })}
            </span>
            <Input.Password
              className={styles.apiKeyInput}
              disabled={paramsDisabled}
              value={apiKey}
              placeholder={intl.formatMessage({ id: 'apiTestPanel.apiKeyPlaceholder' })}
              visibilityToggle
              onChange={(event) => onApiKeyChange?.(event.target.value)}
            />
            <p className={styles.apiKeyHint}>
              {intl.formatMessage({ id: 'apiTestPanel.apiKeyHint' })}
            </p>
          </div>

          <ApiTestParamsEditor
            value={params}
            disabled={paramsDisabled}
            onChange={onParamsChange}
          />
        </div>

        <div className={styles.block}>
          <span className={styles.label}>
            <CodeOutlined />
            {intl.formatMessage({ id: 'apiTestPanel.response' })}
          </span>
          <ApiTestResultViewer result={result} running={running} />
        </div>
      </div>

      <footer className={styles.footer}>
        <span className={styles.status}>
          <span
            className={`${styles.statusDot} ${
              running
                ? styles.statusDotRunning
                : result?.ok
                  ? styles.statusDotOk
                  : result
                    ? styles.statusDotError
                    : ''
            }`}
          />
          {footerStatus}
        </span>
        {result?.durationMs !== undefined ? <span>{result.durationMs}ms</span> : null}
      </footer>
    </section>
  );
};

export default ApiTestPanel;
