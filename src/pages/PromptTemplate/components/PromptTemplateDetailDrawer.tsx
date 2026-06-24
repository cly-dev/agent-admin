import { AppTableActions, AppTableButton } from '@/components/AppTable';
import type { PromptTemplateVersion } from '@/types/prompt-template';
import { useIntl } from '@umijs/max';
import { Drawer, Spin, Tag } from 'antd';
import styles from '../index.module.scss';

type PromptTemplateDetailDrawerProps = {
  open: boolean;
  loading: boolean;
  version: PromptTemplateVersion | null;
  publishSubmittingId?: number | null;
  onClose: () => void;
  onEdit: (record: PromptTemplateVersion) => void;
  onDelete: (record: PromptTemplateVersion) => void;
  onPublish: (versionId: number) => void;
};

const PromptTemplateDetailDrawer: React.FC<PromptTemplateDetailDrawerProps> = ({
  open,
  loading,
  version,
  publishSubmittingId = null,
  onClose,
  onEdit,
  onDelete,
  onPublish,
}) => {
  const intl = useIntl();

  return (
    <Drawer
      title={intl.formatMessage({ id: 'promptTemplate.detail.title' })}
      width={720}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      <Spin spinning={loading}>
        {version ? (
          <div className={styles.promptTemplateDetail}>
            <div className={styles.promptTemplateDetailToolbar}>
              <AppTableActions align="start">
                <AppTableButton variant="edit" onClick={() => onEdit(version)}>
                  {intl.formatMessage({ id: 'common.edit' })}
                </AppTableButton>
                {!version.isActive ? (
                  <>
                    <AppTableButton
                      variant="primary"
                      disabled={publishSubmittingId === version.id}
                      onClick={() => onPublish(version.id)}
                    >
                      {intl.formatMessage({
                        id: 'promptTemplate.action.publish',
                      })}
                    </AppTableButton>
                    <AppTableButton
                      variant="danger"
                      onClick={() => onDelete(version)}
                    >
                      {intl.formatMessage({ id: 'common.delete' })}
                    </AppTableButton>
                  </>
                ) : null}
              </AppTableActions>
            </div>

            <dl className={styles.promptTemplateDetailMeta}>
              <div>
                <dt>
                  {intl.formatMessage({ id: 'promptTemplate.column.key' })}
                </dt>
                <dd>{version.key}</dd>
              </div>
              <div>
                <dt>
                  {intl.formatMessage({ id: 'promptTemplate.column.title' })}
                </dt>
                <dd>{version.title || '—'}</dd>
              </div>
              <div>
                <dt>
                  {intl.formatMessage({ id: 'promptTemplate.column.locale' })}
                </dt>
                <dd>{version.locale || '—'}</dd>
              </div>
              <div>
                <dt>
                  {intl.formatMessage({ id: 'promptTemplate.column.category' })}
                </dt>
                <dd>{version.category || '—'}</dd>
              </div>
              <div>
                <dt>
                  {intl.formatMessage({ id: 'promptTemplate.column.version' })}
                </dt>
                <dd>
                  {version.version !== undefined ? `v${version.version}` : '—'}
                </dd>
              </div>
              <div>
                <dt>
                  {intl.formatMessage({ id: 'promptTemplate.column.isActive' })}
                </dt>
                <dd>
                  {version.isActive ? (
                    <Tag color="success">
                      {intl.formatMessage({
                        id: 'promptTemplate.status.active',
                      })}
                    </Tag>
                  ) : (
                    <Tag>
                      {intl.formatMessage({
                        id: 'promptTemplate.status.inactive',
                      })}
                    </Tag>
                  )}
                </dd>
              </div>
              <div>
                <dt>
                  {intl.formatMessage({
                    id: 'promptTemplate.column.appClientId',
                  })}
                </dt>
                <dd>
                  {version.appClientId
                    ? `#${version.appClientId}`
                    : intl.formatMessage({ id: 'promptTemplate.scope.global' })}
                </dd>
              </div>
              <div>
                <dt>
                  {intl.formatMessage({ id: 'promptTemplate.column.agentId' })}
                </dt>
                <dd>
                  {version.agentId
                    ? `#${version.agentId}`
                    : intl.formatMessage({ id: 'promptTemplate.scope.global' })}
                </dd>
              </div>
              <div>
                <dt>
                  {intl.formatMessage({
                    id: 'promptTemplate.column.updatedAt',
                  })}
                </dt>
                <dd>{version.updatedAt || '—'}</dd>
              </div>
            </dl>

            <section className={styles.promptTemplateDetailSection}>
              <h3 className={styles.promptTemplateDetailSectionTitle}>
                {intl.formatMessage({
                  id: 'promptTemplate.column.description',
                })}
              </h3>
              <p className={styles.promptTemplateDetailDescription}>
                {version.description || '—'}
              </p>
            </section>

            <section className={styles.promptTemplateDetailSection}>
              <h3 className={styles.promptTemplateDetailSectionTitle}>
                {intl.formatMessage({ id: 'promptTemplate.column.content' })}
              </h3>
              <pre className={styles.promptTemplateDetailContent}>
                {version.content || '—'}
              </pre>
            </section>
          </div>
        ) : null}
      </Spin>
    </Drawer>
  );
};

export default PromptTemplateDetailDrawer;
