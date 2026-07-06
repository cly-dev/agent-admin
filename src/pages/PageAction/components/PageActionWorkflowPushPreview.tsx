import type { HostTool } from '@/types/host-tool';
import { CheckCircleFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Alert } from 'antd';
import styles from '../index.module.scss';
import { formatHostToolOptionLabel } from '../pageActionShared';

type PageActionWorkflowPushPreviewProps = {
  hasPushNode: boolean;
  pushHostToolId: number | null;
  hostTools: HostTool[];
};

const PageActionWorkflowPushPreview: React.FC<
  PageActionWorkflowPushPreviewProps
> = ({
  hasPushNode,
  pushHostToolId,
  hostTools,
}) => {
  const intl = useIntl();

  if (!hasPushNode) {
    return null;
  }

  const pushTool = pushHostToolId
    ? hostTools.find((tool) => tool.id === pushHostToolId)
    : undefined;

  return (
    <div className={styles.workflowPushPreview}>
      <div className={styles.workflowPushPreviewHeader}>
        <span className={styles.workflowPushPreviewLabel}>
          {intl.formatMessage({
            id: 'pageAction.form.workflowPushPreview.label',
          })}
        </span>
        <span className={styles.hostToolAppliedBadge}>
          <CheckCircleFilled />
          {intl.formatMessage({
            id: 'pageAction.form.workflowPushPreview.badge',
          })}
        </span>
      </div>

      {pushHostToolId ? (
        <p className={styles.workflowPushPreviewValue}>
          {pushTool
            ? formatHostToolOptionLabel(pushTool)
            : intl.formatMessage(
                { id: 'pageAction.form.workflowPushPreview.fallback' },
                { hostToolId: pushHostToolId },
              )}
        </p>
      ) : (
        <Alert
          type="warning"
          showIcon
          message={intl.formatMessage({
            id: 'pageAction.form.workflowPushPreview.missingHostToolId',
          })}
        />
      )}

      <p className={styles.workflowPushPreviewHint}>
        {intl.formatMessage({ id: 'pageAction.form.workflowPushPreview.hint' })}
      </p>
    </div>
  );
};

export default PageActionWorkflowPushPreview;
