import { SaveOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Form, InputNumber, Select, Spin, Switch } from 'antd';
import styles from '../index.module.scss';
import { useIntentRecallConfig } from './useIntentRecallConfig';

const RECALL_MODE_OPTIONS = [
  { value: 'auto', labelId: 'setting.intentRecall.mode.auto' },
  { value: 'vector', labelId: 'setting.intentRecall.mode.vector' },
  { value: 'keyword', labelId: 'setting.intentRecall.mode.keyword' },
] as const;

const IntentRecallPage: React.FC = () => {
  const intl = useIntl();
  const { form, loading, submitting, handleSave } = useIntentRecallConfig();

  return (
    <PageContainer
      ghost
      title={intl.formatMessage({ id: 'menu.settingIntentRecall' })}
      subTitle={intl.formatMessage({ id: 'setting.intentRecall.subtitle' })}
    >
      <div className="p-6">
        <Spin spinning={loading}>
          <section className={`app-card ${styles.settingSection}`}>
            <header className={styles.settingSectionHeader}>
              <div>
                <h2 className={styles.settingSectionTitle}>
                  {intl.formatMessage({
                    id: 'setting.intentRecall.sectionTitle',
                  })}
                </h2>
                <p className={styles.settingSectionDesc}>
                  {intl.formatMessage({
                    id: 'setting.intentRecall.sectionHint',
                  })}
                </p>
              </div>
              <button
                type="button"
                className="app-button-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                disabled={submitting}
                onClick={() => void handleSave()}
              >
                <SaveOutlined />
                {intl.formatMessage({ id: 'setting.intentRecall.save' })}
              </button>
            </header>

            <Form
              form={form}
              layout="vertical"
              className={styles.settingForm}
              disabled={submitting}
            >
              <div className={styles.settingFormGrid}>
                <Form.Item
                  name="recallMode"
                  label={intl.formatMessage({
                    id: 'setting.intentRecall.field.recallMode',
                  })}
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({
                        id: 'setting.intentRecall.field.recallModeRequired',
                      }),
                    },
                  ]}
                >
                  <Select
                    options={RECALL_MODE_OPTIONS.map((option) => ({
                      value: option.value,
                      label: intl.formatMessage({ id: option.labelId }),
                    }))}
                  />
                </Form.Item>
                <Form.Item
                  name="vectorTopK"
                  label={intl.formatMessage({
                    id: 'setting.intentRecall.field.vectorTopK',
                  })}
                >
                  <InputNumber className="w-full" min={1} precision={0} />
                </Form.Item>
                <Form.Item
                  name="vectorMinScore"
                  label={intl.formatMessage({
                    id: 'setting.intentRecall.field.vectorMinScore',
                  })}
                >
                  <InputNumber className="w-full" min={0} max={1} step={0.01} />
                </Form.Item>
                <Form.Item
                  name="bindToolsMax"
                  label={intl.formatMessage({
                    id: 'setting.intentRecall.field.bindToolsMax',
                  })}
                >
                  <InputNumber className="w-full" min={1} precision={0} />
                </Form.Item>
                <Form.Item
                  name="fallbackToKeyword"
                  label={intl.formatMessage({
                    id: 'setting.intentRecall.field.fallbackToKeyword',
                  })}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </div>
            </Form>
          </section>
        </Spin>
      </div>
    </PageContainer>
  );
};

export default IntentRecallPage;
