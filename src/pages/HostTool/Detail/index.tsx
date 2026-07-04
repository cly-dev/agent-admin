import { AppDetailPage } from '@/components/AppDetailHeader';
import ContentEmpty from '@/components/ContentEmpty';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import {
  HostPageController_findOne,
  HostPageController_update,
} from '@/services/host-page';
import type { HostPage, UpdateHostPageDto } from '@/types/host-page';
import { PlusOutlined } from '@ant-design/icons';
import { history, useIntl, useParams } from '@umijs/max';
import { Form, Input, Switch, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import HostToolFormModal from '../components/HostToolFormModal';
import HostToolTable from '../components/HostToolTable';
import styles from '../index.module.scss';
import { useHostToolList } from '../useHostToolList';

type HostPageFormValues = {
  scope: string;
  label: string;
  description?: string;
  routePattern?: string;
  isActive?: boolean;
};

const HostPageDetailPage: React.FC = () => {
  const intl = useIntl();
  const { id } = useParams<{ id: string }>();
  const pageId = Number(id);
  const { projectId } = useProjectRoute();
  const [form] = Form.useForm<HostPageFormValues>();
  const [hostPage, setHostPage] = useState<HostPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isValidId = Number.isFinite(pageId) && pageId > 0;

  const tools = useHostToolList({
    scope: hostPage?.scope,
    hostPageId: hostPage?.id,
  });

  const loadPage = useCallback(async () => {
    if (!isValidId) {
      setHostPage(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await HostPageController_findOne(pageId);
      setHostPage(data);
      form.setFieldsValue({
        scope: data.scope,
        label: data.label,
        description: data.description ?? '',
        routePattern: data.routePattern ?? '',
        isActive: data.isActive ?? true,
      });
    } catch {
      setHostPage(null);
    } finally {
      setLoading(false);
    }
  }, [form, isValidId, pageId]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const handleBack = () => {
    history.push('/tool/host-tool');
  };

  const handleSave = async () => {
    if (!hostPage) {
      return;
    }
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload: UpdateHostPageDto = {
        scope: values.scope.trim(),
        label: values.label.trim(),
        description: values.description?.trim() || null,
        routePattern: values.routePattern?.trim() || null,
        isActive: values.isActive,
      };
      const updated = await HostPageController_update(hostPage.id, payload);
      setHostPage(updated);
      message.success(intl.formatMessage({ id: 'hostPage.updated' }));
      history.replace('/tool/host-tool');
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'hostPage.actionFailed' }),
      );
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = hostPage?.label
    ? intl.formatMessage(
        { id: 'hostPage.detail.titleWithLabel' },
        { label: hostPage.label },
      )
    : intl.formatMessage({ id: 'hostPage.detail.title' });

  let body: React.ReactNode = null;

  if (!isValidId) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'hostPage.detail.invalidId' })}
        description={intl.formatMessage({ id: 'hostPage.detail.notFoundDesc' })}
        action={
          <button
            type="button"
            className="app-button-secondary px-4 py-2 text-sm font-semibold"
            onClick={handleBack}
          >
            {intl.formatMessage({ id: 'common.backToList' })}
          </button>
        }
      />
    );
  } else if (!loading && !hostPage) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'hostPage.detail.notFound' })}
        description={intl.formatMessage({ id: 'hostPage.detail.notFoundDesc' })}
        action={
          <button
            type="button"
            className="app-button-secondary px-4 py-2 text-sm font-semibold"
            onClick={handleBack}
          >
            {intl.formatMessage({ id: 'common.backToList' })}
          </button>
        }
      />
    );
  } else if (hostPage) {
    body = (
      <div className={styles.hostPageDetailBody}>
        <section className={styles.hostPageDetailSection}>
          <h2 className={styles.hostPageDetailSectionTitle}>
            {intl.formatMessage({ id: 'hostPage.detail.infoTitle' })}
          </h2>
          <Form<HostPageFormValues>
            form={form}
            layout="vertical"
            requiredMark={false}
          >
            <div className={styles.hostPageDetailFormGrid}>
              <Form.Item
                name="scope"
                label={intl.formatMessage({ id: 'hostPage.column.scope' })}
                rules={[{ required: true }]}
              >
                <Input className="app-input" />
              </Form.Item>
              <Form.Item
                name="label"
                label={intl.formatMessage({ id: 'hostPage.column.label' })}
                rules={[{ required: true }]}
              >
                <Input className="app-input" />
              </Form.Item>
            </div>
            <Form.Item
              name="routePattern"
              label={intl.formatMessage({ id: 'hostPage.column.routePattern' })}
            >
              <Input className="app-input" />
            </Form.Item>
            <Form.Item
              name="description"
              label={intl.formatMessage({ id: 'hostPage.column.description' })}
            >
              <Input.TextArea
                className="app-input"
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </Form.Item>
            <Form.Item
              name="isActive"
              label={intl.formatMessage({ id: 'hostPage.column.isActive' })}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Form>
        </section>

        <section className={styles.hostPageDetailSection}>
          <div className={styles.hostPageDetailToolsHeader}>
            <h2 className={styles.hostPageDetailSectionTitle}>
              {intl.formatMessage({ id: 'hostPage.detail.toolsTitle' })}
            </h2>
            <button
              type="button"
              className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!projectId}
              onClick={tools.openCreate}
            >
              <PlusOutlined />
              {intl.formatMessage({ id: 'hostTool.addPageTool' })}
            </button>
          </div>
          <HostToolTable
            list={tools.list}
            loading={tools.loading}
            page={tools.page}
            pageSize={tools.pageSize}
            total={tools.total}
            showPageScope={false}
            onPageChange={tools.onPageChange}
            onEdit={tools.openEdit}
            onDelete={tools.confirmDelete}
          />
        </section>
      </div>
    );
  }

  return (
    <>
      <AppDetailPage
        pageClassName={styles.hostToolPage}
        title={pageTitle}
        subtitle={
          hostPage
            ? intl.formatMessage(
                { id: 'hostPage.detail.subtitle' },
                { scope: hostPage.scope },
              )
            : undefined
        }
        loading={loading}
        backLabel={intl.formatMessage({ id: 'common.backToList' })}
        saveLabel={intl.formatMessage({ id: 'common.save' })}
        onBack={handleBack}
        onSave={hostPage ? () => void handleSave() : undefined}
        saveDisabled={saving || !hostPage}
        saveLoading={saving}
      >
        {body}
      </AppDetailPage>

      <HostToolFormModal
        open={tools.formOpen}
        submitting={tools.formSubmitting}
        editing={tools.editing}
        form={tools.toolForm}
        onCancel={() => tools.setFormOpen(false)}
        onSubmit={() => void tools.handleFormSubmit()}
      />
    </>
  );
};

export default HostPageDetailPage;
