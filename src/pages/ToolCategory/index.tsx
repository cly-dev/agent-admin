import {
  AppQueryInput,
  AppQueryInputNumber,
  AppQueryPanel,
} from '@/components/AppQueryPanel';
import {
  AppTable,
  AppTableActions,
  AppTableButton,
} from '@/components/AppTable';
import ListPageHeader from '@/components/ListPageHeader';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import {
  ToolCategoryController_create,
  ToolCategoryController_findPage,
  ToolCategoryController_remove,
  ToolCategoryController_update,
} from '@/services/tool-category';
import type {
  CreateToolCategoryDto,
  ToolCategory,
  ToolCategoryControllerFindPageParams,
  UpdateToolCategoryDto,
} from '@/types/tool-category';
import { PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useIntl } from '@umijs/max';
import { Form, Input, InputNumber, Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useState } from 'react';
import styles from './index.module.scss';

type ToolCategoryFilterFormValues = {
  keyword?: string;
  id?: number;
  label?: string;
};

const DEFAULT_PAGE_SIZE = 20;

const ToolCategoryPage: React.FC = () => {
  const intl = useIntl();
  const { toPagePath } = useProjectRoute();
  const [filterForm] = Form.useForm<ToolCategoryFilterFormValues>();
  const [editorForm] = Form.useForm<CreateToolCategoryDto>();
  const [list, setList] = useState<ToolCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [appliedFilters, setAppliedFilters] =
    useState<ToolCategoryControllerFindPageParams>({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ToolCategory | null>(null);

  const loadList = useCallback(
    async (
      targetPage: number,
      targetPageSize: number,
      filters: ToolCategoryControllerFindPageParams,
    ) => {
      setLoading(true);
      try {
        const result = await ToolCategoryController_findPage({
          page: targetPage,
          pageSize: targetPageSize,
          ...filters,
          orderBy: 'sortOrder',
          order: 'asc',
        });
        setList(result.list);
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
      } catch (error: unknown) {
        message.error(
          error instanceof Error
            ? error.message
            : intl.formatMessage({ id: 'toolCategory.loadFailed' }),
        );
        setList([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [intl],
  );

  useEffect(() => {
    void loadList(1, DEFAULT_PAGE_SIZE, {});
  }, [loadList]);

  const normalizeFilters = (
    values: ToolCategoryFilterFormValues,
  ): ToolCategoryControllerFindPageParams => ({
    keyword: values.keyword?.trim() || undefined,
    id: values.id,
    label: values.label?.trim() || undefined,
  });

  const handleFilterSearch = (values: ToolCategoryFilterFormValues) => {
    const normalized = normalizeFilters(values);
    setAppliedFilters(normalized);
    void loadList(1, pageSize, normalized);
  };

  const handleFilterReset = () => {
    filterForm.resetFields();
    setAppliedFilters({});
    void loadList(1, pageSize, {});
  };

  const openCreate = () => {
    setEditing(null);
    editorForm.resetFields();
    editorForm.setFieldsValue({ sortOrder: 0 });
    setEditorOpen(true);
  };

  const openConfigure = (record: ToolCategory) => {
    history.push(toPagePath('tool', `category/detail/${record.id}`));
  };

  const handleEditorSubmit = async () => {
    const values = await editorForm.validateFields();
    setSubmitting(true);
    try {
      if (editing) {
        const payload: UpdateToolCategoryDto = {
          label: values.label.trim(),
          description: values.description?.trim() || undefined,
          sortOrder: values.sortOrder ?? 0,
        };
        await ToolCategoryController_update(editing.id, payload);
        message.success(intl.formatMessage({ id: 'toolCategory.updated' }));
      } else {
        const payload: CreateToolCategoryDto = {
          label: values.label.trim(),
          description: values.description?.trim() || undefined,
          sortOrder: values.sortOrder ?? 0,
        };
        await ToolCategoryController_create(payload);
        message.success(intl.formatMessage({ id: 'toolCategory.created' }));
      }
      setEditorOpen(false);
      void loadList(page, pageSize, appliedFilters);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'errorFields' in error
      ) {
        return;
      }
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'toolCategory.actionFailed' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await ToolCategoryController_remove(id);
      message.success(intl.formatMessage({ id: 'toolCategory.deleted' }));
      void loadList(page, pageSize, appliedFilters);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'toolCategory.deleteFailed' }),
      );
    }
  };

  const confirmDelete = (record: ToolCategory) => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'toolCategory.deleteTitle' }),
      centered: true,
      okButtonProps: { danger: true },
      onOk: async () => {
        await handleDelete(record.id);
      },
    });
  };

  const columns: ColumnsType<ToolCategory> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
    {
      title: intl.formatMessage({ id: 'toolCategory.column.label' }),
      dataIndex: 'label',
      key: 'label',
      width: 220,
    },
    {
      title: intl.formatMessage({ id: 'toolCategory.column.description' }),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value?: string) => value || '—',
    },
    {
      title: intl.formatMessage({ id: 'toolCategory.column.sortOrder' }),
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 120,
    },
    {
      title: intl.formatMessage({ id: 'toolCategory.column.updatedAt' }),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (value?: string) => value || '—',
    },
    {
      title: intl.formatMessage({ id: 'toolCategory.column.actions' }),
      key: 'actions',
      align: 'right',
      width: 180,
      render: (_, record) => (
        <AppTableActions>
          <AppTableButton onClick={() => openConfigure(record)}>
            {intl.formatMessage({ id: 'common.configure' })}
          </AppTableButton>
          <AppTableButton danger onClick={() => confirmDelete(record)}>
            {intl.formatMessage({ id: 'common.delete' })}
          </AppTableButton>
        </AppTableActions>
      ),
    },
  ];

  return (
    <PageContainer ghost className={styles.toolCategoryPage}>
      <div className={styles.toolCategoryPageShell}>
        <div className={styles.toolCategoryPageCard}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'toolCategory.title' })}
            description={intl.formatMessage({ id: 'toolCategory.subtitle' })}
            actions={
              <button
                type="button"
                className="app-button-primary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98]"
                onClick={openCreate}
              >
                <PlusOutlined />
                {intl.formatMessage({ id: 'toolCategory.add' })}
              </button>
            }
          />

          <AppQueryPanel<ToolCategoryFilterFormValues>
            form={filterForm}
            appliedFilters={appliedFilters as Record<string, unknown>}
            loading={loading}
            onSearch={handleFilterSearch}
            onReset={handleFilterReset}
            layout="list"
            keywordPlaceholder={intl.formatMessage({
              id: 'toolCategory.filter.keywordPlaceholder',
            })}
            keywordClassName="max-w-md"
            advancedContent={
              <AppQueryPanel.Grid>
                <Form.Item name="id" label="ID">
                  <AppQueryInputNumber
                    min={1}
                    placeholder={intl.formatMessage({
                      id: 'appQueryPanel.numberPlaceholder',
                    })}
                  />
                </Form.Item>
                <Form.Item
                  name="label"
                  label={intl.formatMessage({
                    id: 'toolCategory.column.label',
                  })}
                >
                  <AppQueryInput
                    placeholder={intl.formatMessage({
                      id: 'toolCategory.filter.labelPlaceholder',
                    })}
                  />
                </Form.Item>
              </AppQueryPanel.Grid>
            }
          />

          <AppTable<ToolCategory>
            rowKey="id"
            columns={columns}
            dataSource={list}
            loading={loading}
            pagination={{
              page,
              pageSize,
              total,
              pageSizeOptions: [20, 50, 100],
              onChange: (nextPage, nextPageSize) => {
                void loadList(nextPage, nextPageSize, appliedFilters);
              },
            }}
          />
        </div>
      </div>

      <Modal
        title={
          editing
            ? intl.formatMessage({ id: 'toolCategory.editTitle' })
            : intl.formatMessage({ id: 'toolCategory.createTitle' })
        }
        open={editorOpen}
        onCancel={() => setEditorOpen(false)}
        onOk={() => void handleEditorSubmit()}
        confirmLoading={submitting}
      >
        <Form<CreateToolCategoryDto>
          form={editorForm}
          layout="vertical"
          requiredMark={false}
        >
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
          <Form.Item
            name="sortOrder"
            label={intl.formatMessage({ id: 'toolCategory.column.sortOrder' })}
          >
            <InputNumber className="app-input w-full" controls={false} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ToolCategoryPage;
