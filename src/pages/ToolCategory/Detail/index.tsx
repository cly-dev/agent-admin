import { AppDetailPage } from '@/components/AppDetailHeader';
import ContentEmpty from '@/components/ContentEmpty';
import ListScopeBar from '@/components/ListScopeBar';
import { useIntl } from '@umijs/max';
import { Form, Input, InputNumber } from 'antd';
import CategoryToolsTable from '../components/CategoryToolsTable';
import styles from '../index.module.scss';
import type { ToolCategoryFormValues } from '../useToolCategoryDetail';
import { useToolCategoryDetail } from '../useToolCategoryDetail';

const ToolCategoryDetailPage: React.FC = () => {
  const intl = useIntl();
  const {
    form,
    category,
    categoryLoading,
    saving,
    isValidCategoryId,
    projectId,
    tools,
    toolsLoading,
    page,
    pageSize,
    total,
    onToolsPageChange,
    handleSave,
    handleBack,
    openToolDetail,
  } = useToolCategoryDetail();

  const pageTitle = category?.label
    ? intl.formatMessage(
        { id: 'toolCategory.detail.titleWithLabel' },
        { label: category.label },
      )
    : intl.formatMessage({ id: 'toolCategory.detail.title' });

  const subtitle = category
    ? intl.formatMessage(
        { id: 'toolCategory.detail.subtitle' },
        { id: category.id },
      )
    : undefined;

  let body: React.ReactNode = null;

  if (!isValidCategoryId) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'toolCategory.detail.invalidId' })}
        description={intl.formatMessage({
          id: 'toolCategory.detail.notFoundDesc',
        })}
        action={
          <button
            type="button"
            className="app-button-secondary px-4 py-2 text-sm font-semibold"
            onClick={handleBack}
          >
            {intl.formatMessage({ id: 'toolCategory.detail.back' })}
          </button>
        }
      />
    );
  } else if (!categoryLoading && !category) {
    body = (
      <ContentEmpty
        title={intl.formatMessage({ id: 'toolCategory.detail.notFound' })}
        description={intl.formatMessage({
          id: 'toolCategory.detail.notFoundDesc',
        })}
        action={
          <button
            type="button"
            className="app-button-secondary px-4 py-2 text-sm font-semibold"
            onClick={handleBack}
          >
            {intl.formatMessage({ id: 'toolCategory.detail.back' })}
          </button>
        }
      />
    );
  } else if (category) {
    body = (
      <div className={styles.toolCategoryDetailBody}>
        <section className={styles.toolCategoryDetailSection}>
          <h2 className={styles.toolCategoryDetailSectionTitle}>
            {intl.formatMessage({ id: 'toolCategory.detail.infoTitle' })}
          </h2>
          <Form<ToolCategoryFormValues>
            form={form}
            layout="vertical"
            requiredMark={false}
            className={styles.toolCategoryDetailForm}
          >
            <div className={styles.toolCategoryDetailFormGrid}>
              <Form.Item
                name="label"
                label={intl.formatMessage({ id: 'toolCategory.column.label' })}
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'toolCategory.form.labelRequired',
                    }),
                  },
                ]}
              >
                <Input
                  className="app-input"
                  placeholder={intl.formatMessage({
                    id: 'toolCategory.form.labelPlaceholder',
                  })}
                  maxLength={64}
                />
              </Form.Item>
              <Form.Item
                name="sortOrder"
                label={intl.formatMessage({
                  id: 'toolCategory.column.sortOrder',
                })}
              >
                <InputNumber className="app-input w-full" controls={false} />
              </Form.Item>
            </div>
            <Form.Item
              name="description"
              label={intl.formatMessage({
                id: 'toolCategory.column.description',
              })}
            >
              <Input.TextArea
                className="app-input"
                placeholder={intl.formatMessage({
                  id: 'toolCategory.form.descriptionPlaceholder',
                })}
                autoSize={{ minRows: 2, maxRows: 4 }}
                maxLength={200}
              />
            </Form.Item>
          </Form>
        </section>

        <section className={styles.toolCategoryDetailSection}>
          <header className={styles.toolCategoryDetailToolsHeader}>
            <div>
              <h2 className={styles.toolCategoryDetailSectionTitle}>
                {intl.formatMessage({ id: 'toolCategory.detail.toolsTitle' })}
              </h2>
              <p className={styles.toolCategoryDetailToolsSubtitle}>
                {intl.formatMessage({
                  id: 'toolCategory.detail.toolsSubtitle',
                })}
              </p>
            </div>
          </header>

          <ListScopeBar />

          {!projectId ? (
            <ContentEmpty
              title={intl.formatMessage({ id: 'tool.empty.noProject.title' })}
              description={intl.formatMessage({
                id: 'tool.empty.noProject.desc',
              })}
            />
          ) : (
            <CategoryToolsTable
              tools={tools}
              loading={toolsLoading}
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={onToolsPageChange}
              onConfigure={openToolDetail}
            />
          )}
        </section>
      </div>
    );
  }

  return (
    <AppDetailPage
      pageClassName={styles.toolCategoryPage}
      loading={categoryLoading}
      title={pageTitle}
      subtitle={subtitle}
      onBack={handleBack}
      onSave={category ? () => void handleSave() : undefined}
      saveDisabled={saving}
      saveLoading={saving}
    >
      {body}
    </AppDetailPage>
  );
};

export default ToolCategoryDetailPage;
