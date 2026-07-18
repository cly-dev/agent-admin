import type { InitToolSchemasFromDebugResult } from '@/types/tool';
import { useIntl } from '@umijs/max';
import { Alert, Modal, Tag } from 'antd';
import styles from '../index.module.scss';

type Props = {
  open: boolean;
  loading?: boolean;
  result: InitToolSchemasFromDebugResult | null;
  onCancel: () => void;
  onApply: () => void;
  onApplyAndPersist?: () => void;
};

function countCoreFields(
  profile: InitToolSchemasFromDebugResult['responseProfile'],
): number {
  return Array.isArray(profile?.coreFields) ? profile!.coreFields!.length : 0;
}

const ToolInitSchemasPreviewModal: React.FC<Props> = ({
  open,
  loading = false,
  result,
  onCancel,
  onApply,
  onApplyAndPersist,
}) => {
  const intl = useIntl();
  const profile = result?.responseProfile;
  const coreCount = countCoreFields(profile);
  const listPath =
    typeof profile?.listPath === 'string' ? profile.listPath.trim() : '';
  const decisionRole =
    typeof profile?.decisionRole === 'string' ? profile.decisionRole : '';
  const mode =
    result?.agentMetadata && typeof result.agentMetadata === 'object'
      ? String((result.agentMetadata as { mode?: string }).mode ?? '')
      : '';
  const operation =
    result?.agentMetadata && typeof result.agentMetadata === 'object'
      ? String((result.agentMetadata as { operation?: string }).operation ?? '')
      : '';

  const adjustments = (result?.adjustments ?? [])
    .map((item) =>
      typeof item === 'string'
        ? item
        : typeof item?.message === 'string'
          ? item.message
          : '',
    )
    .filter(Boolean);

  return (
    <Modal
      open={open}
      title={intl.formatMessage({ id: 'tool.initSchemas.previewTitle' })}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnClose
      width={640}
      footer={[
        <button
          key="cancel"
          type="button"
          className="app-button-secondary px-4 py-2 text-sm font-semibold"
          disabled={loading}
          onClick={onCancel}
        >
          {intl.formatMessage({ id: 'tool.initSchemas.discard' })}
        </button>,
        onApplyAndPersist ? (
          <button
            key="persist"
            type="button"
            className="app-button-secondary px-4 py-2 text-sm font-semibold"
            disabled={loading || !result}
            onClick={onApplyAndPersist}
          >
            {intl.formatMessage({ id: 'tool.initSchemas.applyAndSave' })}
          </button>
        ) : null,
        <button
          key="apply"
          type="button"
          className="app-button-primary px-4 py-2 text-sm font-semibold"
          disabled={loading || !result}
          onClick={onApply}
        >
          {intl.formatMessage({ id: 'tool.initSchemas.apply' })}
        </button>,
      ].filter(Boolean)}
    >
      {!result ? (
        <p className={styles.toolDetailFieldHint}>
          {intl.formatMessage({ id: 'tool.initSchemas.previewEmpty' })}
        </p>
      ) : (
        <div className={styles.toolInitSchemasPreview}>
          <div className={styles.toolInitSchemasSummary}>
            {decisionRole ? (
              <Tag>
                {intl.formatMessage({ id: 'tool.response.decisionRole' })}:{' '}
                {decisionRole}
              </Tag>
            ) : null}
            <Tag>
              {listPath
                ? intl.formatMessage(
                    { id: 'tool.initSchemas.listMode' },
                    { path: listPath },
                  )
                : intl.formatMessage({ id: 'tool.initSchemas.detailMode' })}
            </Tag>
            <Tag>
              {intl.formatMessage(
                { id: 'tool.initSchemas.coreCount' },
                { count: coreCount },
              )}
            </Tag>
            {mode || operation ? (
              <Tag>
                {[mode, operation].filter(Boolean).join(' · ')}
              </Tag>
            ) : null}
            {result.source ? (
              <Tag>
                {intl.formatMessage(
                  { id: 'tool.initSchemas.source' },
                  { source: result.source },
                )}
              </Tag>
            ) : null}
          </div>

          {adjustments.length > 0 ? (
            <Alert
              type="info"
              showIcon
              className="mb-3"
              message={intl.formatMessage({
                id: 'tool.initSchemas.adjustmentsTitle',
              })}
              description={
                <ul className="mb-0 pl-4">
                  {adjustments.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              }
            />
          ) : null}

          <p className={styles.toolDetailFieldHint}>
            {intl.formatMessage({ id: 'tool.initSchemas.previewHint' })}
          </p>
        </div>
      )}
    </Modal>
  );
};

export default ToolInitSchemasPreviewModal;
