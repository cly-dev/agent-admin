import { useAuthModeOptions } from '@/hooks/useAuthModeOptions';
import type { Integration } from '@/types/integration';
import type { ToolRiskLevel } from '@/types/tool';
import { CloseOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Collapse, Drawer, Form, Input, Radio, Select, Switch } from 'antd';
import { useEffect } from 'react';
import styles from '../index.module.scss';
import {
  DEFAULT_IMPORT_FORM_VALUES,
  type ImportToolsFromSwaggerFormValues,
  type SwaggerIntegrationMode,
} from '../importSwagger';

const RISK_LEVELS: ToolRiskLevel[] = ['L1', 'L2', 'L3'];

type ImportToolsFromSwaggerModalProps = {
  open: boolean;
  submitting?: boolean;
  integrations: Integration[];
  integrationsLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ImportToolsFromSwaggerFormValues) => Promise<boolean>;
};

const ImportToolsFromSwaggerModal: React.FC<ImportToolsFromSwaggerModalProps> = ({
  open,
  submitting = false,
  integrations,
  integrationsLoading = false,
  onOpenChange,
  onSubmit,
}) => {
  const intl = useIntl();
  const authModeOptions = useAuthModeOptions();
  const [form] = Form.useForm<ImportToolsFromSwaggerFormValues>();
  const integrationMode = Form.useWatch('integrationMode', form) as
    | SwaggerIntegrationMode
    | undefined;

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue({
      ...DEFAULT_IMPORT_FORM_VALUES,
      integrationId: integrations[0]?.id,
    });
  }, [form, integrations, open]);

  const handleFinish = async (values: ImportToolsFromSwaggerFormValues) => {
    const ok = await onSubmit(values);
    if (ok) {
      form.resetFields();
      onOpenChange(false);
    }
  };

  return (
    <Drawer
      className={styles.toolImportDrawer}
      title={
        <div className={styles.toolImportDrawerHead}>
          <h2 className={styles.toolImportDrawerTitle}>
            {intl.formatMessage({ id: 'tool.import.title' })}
          </h2>
          <p className={styles.toolImportDrawerSubtitle}>
            {intl.formatMessage({ id: 'tool.import.subtitle' })}
          </p>
        </div>
      }
      extra={
        <button
          type="button"
          className={styles.toolImportDrawerClose}
          disabled={submitting}
          aria-label={intl.formatMessage({ id: 'common.close' })}
          onClick={() => onOpenChange(false)}
        >
          <CloseOutlined />
        </button>
      }
      placement="right"
      open={open}
      width={480}
      destroyOnClose
      closable={false}
      maskClosable={!submitting}
      onClose={() => onOpenChange(false)}
      footer={
        <div className="flex justify-end gap-2">
          <Button disabled={submitting} onClick={() => onOpenChange(false)}>
            {intl.formatMessage({ id: 'common.cancel' })}
          </Button>
          <Button type="primary" loading={submitting} onClick={() => form.submit()}>
            {intl.formatMessage({ id: 'tool.import.submit' })}
          </Button>
        </div>
      }
    >
      <Form<ImportToolsFromSwaggerFormValues>
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={DEFAULT_IMPORT_FORM_VALUES}
        onFinish={(values) => void handleFinish(values)}
      >
        <Form.Item
          name="specUrl"
          label={intl.formatMessage({ id: 'tool.import.specUrl' })}
          rules={[
            { required: true, message: intl.formatMessage({ id: 'tool.import.specUrlRequired' }) },
            { type: 'url', message: intl.formatMessage({ id: 'tool.import.specUrlInvalid' }) },
          ]}
        >
          <Input
            className="app-input"
            placeholder={intl.formatMessage({ id: 'tool.import.specUrlPlaceholder' })}
          />
        </Form.Item>

        <Form.Item
          name="integrationMode"
          label={intl.formatMessage({ id: 'tool.import.integrationMode' })}
        >
          <Radio.Group>
            <Radio value="auto">{intl.formatMessage({ id: 'tool.import.modeAuto' })}</Radio>
            <Radio value="existing">
              {intl.formatMessage({ id: 'tool.import.modeExisting' })}
            </Radio>
          </Radio.Group>
        </Form.Item>

        {integrationMode === 'existing' ? (
          <Form.Item
            name="integrationId"
            label={intl.formatMessage({ id: 'tool.form.integration' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'tool.form.integrationRequired' }),
              },
            ]}
          >
            <Select
              loading={integrationsLoading}
              placeholder={intl.formatMessage({ id: 'tool.form.integrationPlaceholder' })}
              options={integrations.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
              notFoundContent={intl.formatMessage({ id: 'tool.form.integrationEmpty' })}
            />
          </Form.Item>
        ) : (
          <>
            <Form.Item
              name="integrationName"
              label={intl.formatMessage({ id: 'tool.import.integrationName' })}
            >
              <Input
                className="app-input"
                placeholder={intl.formatMessage({
                  id: 'tool.import.integrationNamePlaceholder',
                })}
              />
            </Form.Item>
            <Form.Item
              name="integrationBaseUrl"
              label={intl.formatMessage({ id: 'tool.import.integrationBaseUrl' })}
            >
              <Input
                className="app-input"
                placeholder={intl.formatMessage({
                  id: 'tool.import.integrationBaseUrlPlaceholder',
                })}
              />
            </Form.Item>
            <Form.Item
              name="integrationAuthMode"
              label={intl.formatMessage({ id: 'integration.form.authMode' })}
            >
              <Select options={authModeOptions} />
            </Form.Item>
            <Form.Item
              name="integrationApiKey"
              label={intl.formatMessage({ id: 'integration.form.apiKey' })}
            >
              <Input.Password
                className="app-input"
                placeholder={intl.formatMessage({ id: 'integration.form.apiKeyPlaceholder' })}
              />
            </Form.Item>
          </>
        )}

        <Form.Item name="riskLevel" label={intl.formatMessage({ id: 'tool.form.riskLevel' })}>
          <Select
            options={RISK_LEVELS.map((level) => ({
              value: level,
              label: level,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="dryRun"
          label={intl.formatMessage({ id: 'tool.import.dryRun' })}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Collapse
          ghost
          items={[
            {
              key: 'advanced',
              label: intl.formatMessage({ id: 'tool.import.advanced' }),
              children: (
                <>
                  <Form.Item name="tags" label={intl.formatMessage({ id: 'tool.import.tags' })}>
                    <Input.TextArea
                      className="app-input"
                      rows={2}
                      placeholder={intl.formatMessage({ id: 'tool.import.listPlaceholder' })}
                    />
                  </Form.Item>
                  <Form.Item name="ops" label={intl.formatMessage({ id: 'tool.import.ops' })}>
                    <Input.TextArea
                      className="app-input"
                      rows={2}
                      placeholder={intl.formatMessage({ id: 'tool.import.opsPlaceholder' })}
                    />
                  </Form.Item>
                  <Form.Item
                    name="pathInclude"
                    label={intl.formatMessage({ id: 'tool.import.pathInclude' })}
                  >
                    <Input.TextArea
                      className="app-input"
                      rows={2}
                      placeholder={intl.formatMessage({ id: 'tool.import.listPlaceholder' })}
                    />
                  </Form.Item>
                  <Form.Item
                    name="pathExclude"
                    label={intl.formatMessage({ id: 'tool.import.pathExclude' })}
                  >
                    <Input.TextArea
                      className="app-input"
                      rows={2}
                      placeholder={intl.formatMessage({ id: 'tool.import.listPlaceholder' })}
                    />
                  </Form.Item>
                  <Form.Item
                    name="noDefaultPathExclude"
                    label={intl.formatMessage({ id: 'tool.import.noDefaultPathExclude' })}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <Form.Item
                    name="insecure"
                    label={intl.formatMessage({ id: 'tool.import.insecure' })}
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </>
              ),
            },
          ]}
        />
      </Form>
    </Drawer>
  );
};

export default ImportToolsFromSwaggerModal;
