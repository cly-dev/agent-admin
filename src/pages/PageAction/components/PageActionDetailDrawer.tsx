import type { PageAction } from '@/types/page-action';
import { Link, history, useIntl } from '@umijs/max';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import { Drawer, Spin, Tag } from 'antd';
import { buildPageActionEditPath } from '../pageActionFormShared';
import styles from '../index.module.scss';

type PageActionDetailDrawerProps = {
  open: boolean;
  loading?: boolean;
  record: PageAction | null;
  onClose: () => void;
};

const PageActionDetailDrawer: React.FC<PageActionDetailDrawerProps> = ({
  open,
  loading = false,
  record,
  onClose,
}) => {
  const intl = useIntl();
  const { toPagePath } = useProjectRoute();

  return (
    <Drawer
      open={open}
      width={680}
      title={record?.name ?? intl.formatMessage({ id: 'pageAction.detail.title' })}
      onClose={onClose}
      destroyOnClose
      extra={
        record ? (
          <div className="flex items-center gap-2">
            <Link
              to={`${toPagePath('workflow', 'page-action-run')}?pageActionId=${record.id}`}
              className="app-button-secondary px-3 py-1.5 text-sm font-semibold"
              onClick={onClose}
            >
              {intl.formatMessage({ id: 'pageAction.viewRuns' })}
            </Link>
            <button
              type="button"
              className="app-button-primary px-3 py-1.5 text-sm font-semibold"
              onClick={() => {
                onClose();
                history.push(buildPageActionEditPath(record.id));
              }}
            >
              {intl.formatMessage({ id: 'common.edit' })}
            </button>
          </div>
        ) : null
      }
    >
      {loading || !record ? (
        <div className={styles.detailLoading}>
          <Spin />
        </div>
      ) : (
        <>
          <section className={styles.detailHero}>
            <p className={styles.detailHeroKey}>{record.actionKey}</p>
            <p className={styles.detailHeroName}>{record.name}</p>
          </section>

          <dl className={styles.detailMeta}>
            <div>
              <dt>{intl.formatMessage({ id: 'pageAction.column.hostToolName' })}</dt>
              <dd>{record.hostToolName}</dd>
            </div>
            <div>
              <dt>{intl.formatMessage({ id: 'pageAction.column.pageScope' })}</dt>
              <dd>
                {record.pageScope ??
                  intl.formatMessage({ id: 'pageAction.pageScope.generic' })}
              </dd>
            </div>
            <div>
              <dt>{intl.formatMessage({ id: 'pageAction.column.isActive' })}</dt>
              <dd>
                <Tag color={record.isActive ? 'success' : 'default'}>
                  {intl.formatMessage({
                    id: record.isActive
                      ? 'pageAction.status.active'
                      : 'pageAction.status.inactive',
                  })}
                </Tag>
              </dd>
            </div>
            <div>
              <dt>{intl.formatMessage({ id: 'pageAction.column.sortOrder' })}</dt>
              <dd>{record.sortOrder}</dd>
            </div>
            <div>
              <dt>
                {intl.formatMessage({ id: 'pageAction.column.allowCustomInstruction' })}
              </dt>
              <dd>
                {intl.formatMessage({
                  id: record.allowCustomInstruction
                    ? 'agent.tools.filter.yes'
                    : 'agent.tools.filter.no',
                })}
              </dd>
            </div>
          </dl>

          {record.description ? (
            <section className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>
                {intl.formatMessage({ id: 'pageAction.column.description' })}
              </h3>
              <p className={styles.detailDescription}>{record.description}</p>
            </section>
          ) : null}

          <section className={styles.detailSection}>
            <h3 className={styles.detailSectionTitle}>
              {intl.formatMessage({ id: 'pageAction.column.systemPrompt' })}
            </h3>
            <pre className={styles.detailPrompt}>{record.systemPrompt}</pre>
          </section>
        </>
      )}
    </Drawer>
  );
};

export default PageActionDetailDrawer;
