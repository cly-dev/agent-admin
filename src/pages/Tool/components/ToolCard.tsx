import type { Tool, ToolHttpMethod } from '@/types/tool';
import {
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Checkbox, Popconfirm } from 'antd';
import {
  formatIntegrationHost,
  getToolCategoryLabel,
  getToolStatus,
} from '../useTools';
import styles from '../index.module.scss';

type ToolCardProps = {
  tool: Tool;
  selected: boolean;
  onSelectChange: (checked: boolean) => void;
  onConfigure: (tool: Tool) => void;
  onToggleActive: (tool: Tool) => void;
  onDelete: (id: number) => void;
};

const METHOD_CARD_CLASS: Record<ToolHttpMethod, string> = {
  Get: styles.toolCardMethodGet,
  Post: styles.toolCardMethodPost,
  Put: styles.toolCardMethodPut,
  Delete: styles.toolCardMethodDelete,
};

const METHOD_ICON: Record<ToolHttpMethod, typeof SearchOutlined> = {
  Get: SearchOutlined,
  Post: SettingOutlined,
  Put: EditOutlined,
  Delete: DeleteOutlined,
};

const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  selected,
  onSelectChange,
  onConfigure,
  onToggleActive,
  onDelete,
}) => {
  const intl = useIntl();
  const status = getToolStatus(tool);
  const categoryLabel = getToolCategoryLabel(tool);
  const Icon = METHOD_ICON[tool.method];
  const methodClass = METHOD_CARD_CLASS[tool.method];
  const isConfigRequired = status === 'config_required';
  const isInactive = status === 'inactive';
  const endpointHint = tool.path || tool.integration?.baseUrl;

  const statusLabelId =
    status === 'active'
      ? 'tool.status.active'
      : status === 'config_required'
        ? 'tool.status.configRequired'
        : 'tool.status.inactive';

  return (
    <article
      className={[
        styles.toolCard,
        methodClass,
        isConfigRequired ? styles.toolCardWarning : '',
        isInactive ? styles.toolCardInactive : '',
        selected ? styles.toolCardSelected : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.toolCardInner}>
        <div className={styles.toolCardHeader}>
          <Checkbox
            className={styles.toolCardCheckbox}
            checked={selected}
            onChange={(event) => onSelectChange(event.target.checked)}
            onClick={(event) => event.stopPropagation()}
          />

          <div className={styles.toolCardIdentity}>
            <div className={styles.toolCardAvatar}>
              <Icon className="text-lg" />
            </div>
            <div className={styles.toolCardHeading}>
              <h3 className={styles.toolCardTitle} title={tool.name}>
                {tool.name}
              </h3>
              <div className={styles.toolCardMeta}>
                {categoryLabel ? (
                  <span className={styles.toolCardCategory}>{categoryLabel}</span>
                ) : null}
                <span
                  className={`${styles.toolCardStatus} ${
                    isConfigRequired ? styles.toolCardStatusWarning : ''
                  }`}
                >
                  <span
                    className={`${styles.toolCardStatusDot} ${
                      isConfigRequired
                        ? styles.toolCardStatusDotWarning
                        : isInactive
                          ? styles.toolCardStatusDotMuted
                          : ''
                    }`}
                  />
                  {intl.formatMessage({ id: statusLabelId })}
                </span>
                <span className={styles.toolCardRisk}>{tool.riskLevel}</span>
              </div>
            </div>
          </div>

          <div className={styles.toolCardActionsTop}>
            <Popconfirm
              title={intl.formatMessage({ id: 'tool.card.deleteTitle' })}
              description={intl.formatMessage({ id: 'tool.card.deleteDesc' })}
              okText={intl.formatMessage({ id: 'common.delete' })}
              cancelText={intl.formatMessage({ id: 'common.cancel' })}
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(tool.id)}
            >
              <button
                type="button"
                className={`${styles.toolCardIconAction} ${styles.toolCardIconActionDanger}`}
                aria-label={intl.formatMessage({ id: 'common.delete' })}
              >
                <DeleteOutlined />
              </button>
            </Popconfirm>
          </div>
        </div>

        <p className={styles.toolCardDescription}>
          {tool.description || intl.formatMessage({ id: 'tool.card.noDescription' })}
        </p>

        {endpointHint ? (
          <p className={styles.toolCardEndpoint} title={endpointHint}>
            <span className={styles.toolCardMethod}>{tool.method.toUpperCase()}</span>
            {tool.path
              ? tool.path
              : tool.integration?.baseUrl
                ? formatIntegrationHost(tool.integration.baseUrl)
                : ''}
          </p>
        ) : null}

        <div className={styles.toolCardFooter}>
          <button
            type="button"
            className={styles.toolCardActionConfigure}
            onClick={() => onConfigure(tool)}
          >
            {intl.formatMessage({ id: 'common.configure' })}
          </button>
          <button
            type="button"
            className={
              tool.isActive ? styles.toolCardActionDisable : styles.toolCardActionEnable
            }
            onClick={() => onToggleActive(tool)}
          >
            {tool.isActive
              ? intl.formatMessage({ id: 'tool.card.disable' })
              : intl.formatMessage({ id: 'tool.card.enable' })}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ToolCard;
