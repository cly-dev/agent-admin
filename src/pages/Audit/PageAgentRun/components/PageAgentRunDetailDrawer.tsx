import type { PageAgentLlmProxyAuditDetail } from '@/types/page-agent-llm-proxy-audit';
import { useIntl } from '@umijs/max';
import { Alert, Descriptions, Drawer, Spin, Tag, Typography } from 'antd';
import styles from '../index.module.scss';
import {
  PAGE_AGENT_RUN_STATUS_COLORS,
  formatAuditDateTime,
  formatAuditDuration,
  formatAuditUser,
  formatNullableNumber,
} from '../pageAgentRunDisplay';

type PageAgentRunDetailDrawerProps = {
  open: boolean;
  loading?: boolean;
  detail: PageAgentLlmProxyAuditDetail | null;
  onClose: () => void;
};

function stringifyJson(value: unknown): string {
  if (value === undefined || value === null) {
    return '—';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

const PageAgentRunDetailDrawer: React.FC<PageAgentRunDetailDrawerProps> = ({
  open,
  loading = false,
  detail,
  onClose,
}) => {
  const intl = useIntl();

  return (
    <Drawer
      open={open}
      width={720}
      title={
        detail
          ? intl.formatMessage(
              { id: 'pageAgentRun.detail.titleWithId' },
              { id: detail.id },
            )
          : intl.formatMessage({ id: 'pageAgentRun.detail.title' })
      }
      onClose={onClose}
      destroyOnClose
    >
      {loading && !detail ? (
        <div className={styles.detailLoading}>
          <Spin />
        </div>
      ) : detail ? (
        <div className={styles.detailStack}>
          <section className={styles.detailHero}>
            <div className={styles.detailHeroMain}>
              <Typography.Text className={styles.detailHeroTitle}>
                {detail.providerModel || detail.requestedModel || '—'}
              </Typography.Text>
              <Tag
                color={PAGE_AGENT_RUN_STATUS_COLORS[detail.status] ?? 'default'}
              >
                {intl.formatMessage({
                  id: `pageAgentRun.status.${detail.status}`,
                  defaultMessage: detail.status,
                })}
              </Tag>
            </div>
            <p className={styles.detailHeroMeta}>
              {formatAuditUser(
                detail.username,
                detail.userEmail,
                detail.userId,
              )}
              {' · '}
              {formatAuditDateTime(detail.createdAt)}
            </p>
          </section>

          {detail.status === 'failed' && detail.errorMessage ? (
            <Alert
              type="error"
              showIcon
              message={intl.formatMessage({
                id: 'pageAgentRun.detail.errorTitle',
              })}
              description={detail.errorMessage}
            />
          ) : null}

          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'pageAgentRun.column.provider' })}
            >
              {detail.provider || '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({
                id: 'pageAgentRun.column.providerModel',
              })}
            >
              {detail.providerModel || '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({
                id: 'pageAgentRun.column.requestedModel',
              })}
            >
              {detail.requestedModel || '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({
                id: 'pageAgentRun.column.modelConfigId',
              })}
            >
              {detail.modelConfigId ? `#${detail.modelConfigId}` : '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({
                id: 'pageAgentRun.column.upstreamStatus',
              })}
            >
              {formatNullableNumber(detail.upstreamStatus)}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({
                id: 'pageAgentRun.column.durationMs',
              })}
            >
              {formatAuditDuration(detail.durationMs)}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'pageAgentRun.column.tokens' })}
            >
              {intl.formatMessage(
                { id: 'pageAgentRun.detail.tokensValue' },
                {
                  total: formatNullableNumber(detail.totalTokens),
                  prompt: formatNullableNumber(detail.promptTokens),
                  completion: formatNullableNumber(detail.completionTokens),
                },
              )}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({
                id: 'pageAgentRun.column.finishedAt',
              })}
            >
              {formatAuditDateTime(detail.finishedAt)}
            </Descriptions.Item>
          </Descriptions>

          <section className={styles.detailPanel}>
            <h3 className={styles.detailPanelTitle}>
              {intl.formatMessage({ id: 'pageAgentRun.detail.requestMeta' })}
            </h3>
            <pre className={styles.jsonBlock}>
              {stringifyJson(detail.requestMeta)}
            </pre>
          </section>
        </div>
      ) : null}
    </Drawer>
  );
};

export default PageAgentRunDetailDrawer;
