import type {
  LlmModelConfig,
  LlmModelConfigKind,
} from '@/types/llm-model-config';
import {
  ApiOutlined,
  CheckCircleOutlined,
  CloudOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import styles from '../index.module.scss';
import {
  KIND_LABEL_IDS,
  formatBaseUrlHost,
  getContextLengthDisplay,
} from '../llmModelConfigShared';

const KIND_ICONS: Record<LlmModelConfigKind, React.ReactNode> = {
  chat: <ApiOutlined className="text-lg" />,
  transformers_embedding: <DatabaseOutlined className="text-lg" />,
  api_embedding: <CloudOutlined className="text-lg" />,
};

type LlmModelConfigCardProps = {
  config: LlmModelConfig;
  actionPending?: boolean;
  onConfigure: (config: LlmModelConfig) => void;
  onActivate: (config: LlmModelConfig) => void;
  onTestConnection: (config: LlmModelConfig) => void;
};

const LlmModelConfigCard: React.FC<LlmModelConfigCardProps> = ({
  config,
  actionPending = false,
  onConfigure,
  onActivate,
  onTestConnection,
}) => {
  const intl = useIntl();
  const isDisabled = config.enabled === false;
  const statusLabelId = isDisabled
    ? 'setting.llmModel.status.disabled'
    : 'setting.llmModel.status.enabled';
  const contextLength = getContextLengthDisplay(config);

  return (
    <article
      className={[styles.modelCard, isDisabled ? styles.modelCardInactive : '']
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className={styles.modelCardClickLayer}
        onClick={() => onConfigure(config)}
        aria-label={intl.formatMessage({ id: 'setting.llmModel.configure' })}
      />

      <div className={styles.modelCardInner}>
        <div className={styles.modelCardHeader}>
          <div className={styles.modelCardIdentity}>
            <div className={styles.modelCardAvatar}>
              {KIND_ICONS[config.kind]}
            </div>
            <div className={styles.modelCardHeading}>
              <h3 className={styles.modelCardTitle} title={config.model}>
                {config.model}
              </h3>
              <div className={styles.modelCardMeta}>
                <span className={styles.modelCardStatus}>
                  <span
                    className={`${styles.modelCardStatusDot} ${
                      isDisabled ? styles.modelCardStatusDotMuted : ''
                    }`}
                  />
                  {intl.formatMessage({ id: statusLabelId })}
                </span>
                <span className={styles.modelCardBadge}>
                  {intl.formatMessage({ id: KIND_LABEL_IDS[config.kind] })}
                </span>
                <span className={styles.modelCardBadge}>#{config.id}</span>
              </div>
            </div>
          </div>
        </div>

        <dl className={styles.modelCardFacts}>
          {config.provider ? (
            <div className={styles.modelCardFact}>
              <dt>
                {intl.formatMessage({ id: 'setting.llmModel.field.provider' })}
              </dt>
              <dd>{config.provider}</dd>
            </div>
          ) : null}
          <div className={styles.modelCardFact}>
            <dt>
              {intl.formatMessage({ id: 'setting.llmModel.field.baseUrl' })}
            </dt>
            <dd title={config.baseUrl}>{formatBaseUrlHost(config.baseUrl)}</dd>
          </div>
          {contextLength ? (
            <div className={styles.modelCardFact}>
              <dt>
                {intl.formatMessage({
                  id: 'setting.llmModel.field.contextLength',
                })}
              </dt>
              <dd>{contextLength.toLocaleString()}</dd>
            </div>
          ) : config.kind === 'chat' ? (
            <div className={styles.modelCardFact}>
              <dt>
                {intl.formatMessage({
                  id: 'setting.llmModel.field.contextLength',
                })}
              </dt>
              <dd className={styles.modelCardFactWarn}>
                {intl.formatMessage({
                  id: 'setting.llmModel.card.contextLengthMissing',
                })}
              </dd>
            </div>
          ) : null}
          {config.maxTokens ? (
            <div className={styles.modelCardFact}>
              <dt>
                {intl.formatMessage({ id: 'setting.llmModel.field.maxTokens' })}
              </dt>
              <dd>{config.maxTokens.toLocaleString()}</dd>
            </div>
          ) : null}
        </dl>

        <div className={styles.modelCardFooter}>
          {config.updatedAt ? (
            <p className={styles.modelCardMetaLine}>
              {intl.formatMessage(
                { id: 'setting.llmModel.card.updatedAt' },
                { time: config.updatedAt },
              )}
            </p>
          ) : (
            <span className={styles.modelCardMetaLinePlaceholder} />
          )}
          <div className={styles.modelCardActions}>
            {isDisabled ? (
              <button
                type="button"
                className={styles.modelCardActionSecondary}
                disabled={actionPending}
                onClick={(event) => {
                  event.stopPropagation();
                  onActivate(config);
                }}
              >
                <CheckCircleOutlined />
                {intl.formatMessage({ id: 'setting.llmModel.activate' })}
              </button>
            ) : null}
            <button
              type="button"
              className={styles.modelCardActionSecondary}
              disabled={actionPending}
              onClick={(event) => {
                event.stopPropagation();
                onTestConnection(config);
              }}
            >
              <ExperimentOutlined />
              {intl.formatMessage({ id: 'setting.llmModel.test' })}
            </button>
            <button
              type="button"
              className={styles.modelCardActionConfigure}
              onClick={(event) => {
                event.stopPropagation();
                onConfigure(config);
              }}
            >
              <SettingOutlined />
              {intl.formatMessage({ id: 'setting.llmModel.configure' })}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default LlmModelConfigCard;
