import ContentEmpty from '@/components/ContentEmpty';
import ListPageHeader from '@/components/ListPageHeader';
import { PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Spin } from 'antd';
import LlmModelConfigCard from './components/LlmModelConfigCard';
import LlmModelConfigModal from './components/LlmModelConfigModal';
import styles from './index.module.scss';
import { useLlmModelConfig } from './useLlmModelConfig';

const LlmModelConfigPage: React.FC = () => {
  const intl = useIntl();
  const {
    form,
    loading,
    submitting,
    configs,
    editorOpen,
    editingConfig,
    openCreate,
    openEdit,
    closeEditor,
    handleSave,
  } = useLlmModelConfig();

  return (
    <PageContainer ghost className={styles.page}>
      <div className={styles.pageShell}>
        <div className={styles.pageCard}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'menu.settingLlmModel' })}
            description={intl.formatMessage({
              id: 'setting.llmModel.subtitle',
            })}
            meta={intl.formatMessage(
              { id: 'setting.llmModel.summary' },
              { count: configs.length },
            )}
            actions={
              <button
                type="button"
                className="app-button-primary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
                onClick={openCreate}
              >
                <PlusOutlined />
                {intl.formatMessage({ id: 'setting.llmModel.add' })}
              </button>
            }
          />

          <Spin spinning={loading}>
            <div className={styles.pageBody}>
              {!loading && configs.length === 0 ? (
                <ContentEmpty
                  title={intl.formatMessage({
                    id: 'setting.llmModel.empty.title',
                  })}
                  description={intl.formatMessage({
                    id: 'setting.llmModel.empty.desc',
                  })}
                  action={
                    <button
                      type="button"
                      className="app-button-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
                      onClick={openCreate}
                    >
                      <PlusOutlined />
                      {intl.formatMessage({ id: 'setting.llmModel.add' })}
                    </button>
                  }
                />
              ) : (
                <div className={styles.cardGrid}>
                  {configs.map((config) => (
                    <LlmModelConfigCard
                      key={config.kind}
                      config={config}
                      onConfigure={openEdit}
                    />
                  ))}
                  <button
                    type="button"
                    className={styles.addCard}
                    disabled={submitting}
                    onClick={openCreate}
                  >
                    <span className={styles.addCardIcon}>
                      <PlusOutlined />
                    </span>
                    <p className={styles.addCardTitle}>
                      {intl.formatMessage({ id: 'setting.llmModel.add' })}
                    </p>
                    <p className={styles.addCardDesc}>
                      {intl.formatMessage({
                        id: 'setting.llmModel.addCardDesc',
                      })}
                    </p>
                  </button>
                </div>
              )}
            </div>
          </Spin>
        </div>
      </div>

      <LlmModelConfigModal
        open={editorOpen}
        submitting={submitting}
        form={form}
        editingConfig={editingConfig}
        onCancel={closeEditor}
        onSubmit={() => void handleSave()}
      />
    </PageContainer>
  );
};

export default LlmModelConfigPage;
