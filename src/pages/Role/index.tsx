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
import {
  RoleController_create,
  RoleController_findPage,
  RoleController_remove,
  RoleController_update,
} from '@/services/role';
import type {
  CreateRoleDto,
  Role,
  RoleControllerFindPageParams,
  RoleToolLevel,
  UpdateRoleDto,
} from '@/types/role';
import { ROLE_TOOL_LEVELS } from '@/types/role';
import { PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Form, Input, Modal, Select, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './index.module.scss';

type RoleFilterFormValues = {
  keyword?: string;
  id?: number;
  name?: string;
  allowToolLevel?: RoleToolLevel;
};

const DEFAULT_PAGE_SIZE = 20;

const RolePermissionPage: React.FC = () => {
  const intl = useIntl();
  const [filterForm] = Form.useForm<RoleFilterFormValues>();
  const [editorForm] = Form.useForm<CreateRoleDto>();
  const [list, setList] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [appliedFilters, setAppliedFilters] =
    useState<RoleControllerFindPageParams>({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);

  const toolLevelOptions = useMemo(
    () =>
      ROLE_TOOL_LEVELS.map((level) => ({
        value: level,
        label: intl.formatMessage({ id: `role.toolLevel.${level}` }),
      })),
    [intl],
  );

  const loadList = useCallback(
    async (
      targetPage: number,
      targetPageSize: number,
      filters: RoleControllerFindPageParams,
    ) => {
      setLoading(true);
      try {
        const result = await RoleController_findPage({
          page: targetPage,
          pageSize: targetPageSize,
          ...filters,
          orderBy: 'id',
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
            : intl.formatMessage({ id: 'role.loadFailed' }),
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
    values: RoleFilterFormValues,
  ): RoleControllerFindPageParams => ({
    keyword: values.keyword?.trim() || undefined,
    id: values.id,
    name: values.name?.trim() || undefined,
    allowToolLevel: values.allowToolLevel,
  });

  const handleFilterSearch = (values: RoleFilterFormValues) => {
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
    editorForm.setFieldsValue({ allowToolLevel: 'L1' });
    setEditorOpen(true);
  };

  const openEdit = (record: Role) => {
    setEditing(record);
    editorForm.setFieldsValue({
      name: record.name,
      description: record.description,
      allowToolLevel: record.allowToolLevel,
    });
    setEditorOpen(true);
  };

  const handleEditorSubmit = async () => {
    const values = await editorForm.validateFields();
    setSubmitting(true);
    try {
      if (editing) {
        const payload: UpdateRoleDto = {
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          allowToolLevel: values.allowToolLevel,
        };
        await RoleController_update(editing.id, payload);
        message.success(intl.formatMessage({ id: 'role.updated' }));
      } else {
        const payload: CreateRoleDto = {
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          allowToolLevel: values.allowToolLevel ?? 'L1',
        };
        await RoleController_create(payload);
        message.success(intl.formatMessage({ id: 'role.created' }));
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
          : intl.formatMessage({ id: 'role.actionFailed' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await RoleController_remove(id);
      message.success(intl.formatMessage({ id: 'role.deleted' }));
      void loadList(page, pageSize, appliedFilters);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'role.deleteFailed' }),
      );
    }
  };

  const confirmDelete = (record: Role) => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'role.deleteTitle' }),
      centered: true,
      okButtonProps: { danger: true },
      onOk: async () => {
        await handleDelete(record.id);
      },
    });
  };

  const columns: ColumnsType<Role> = [
    {
      title: intl.formatMessage({ id: 'role.column.id' }),
      dataIndex: 'id',
      key: 'id',
      width: 90,
    },
    {
      title: intl.formatMessage({ id: 'role.column.name' }),
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: intl.formatMessage({ id: 'role.column.description' }),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value?: string) => value || '—',
    },
    {
      title: intl.formatMessage({ id: 'role.column.allowToolLevel' }),
      dataIndex: 'allowToolLevel',
      key: 'allowToolLevel',
      width: 140,
      render: (value: RoleToolLevel) =>
        intl.formatMessage({ id: `role.toolLevel.${value}` }),
    },
    {
      title: intl.formatMessage({ id: 'role.column.updatedAt' }),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (value?: string) => value || '—',
    },
    {
      title: intl.formatMessage({ id: 'role.column.actions' }),
      key: 'actions',
      align: 'right',
      width: 160,
      render: (_, record) => (
        <AppTableActions>
          <AppTableButton variant="edit" onClick={() => openEdit(record)}>
            {intl.formatMessage({ id: 'common.edit' })}
          </AppTableButton>
          <AppTableButton
            variant="danger"
            onClick={() => confirmDelete(record)}
          >
            {intl.formatMessage({ id: 'common.delete' })}
          </AppTableButton>
        </AppTableActions>
      ),
    },
  ];

  return (
    <PageContainer ghost className={styles.rolePage}>
      <div className={styles.rolePageShell}>
        <div className={styles.rolePageCard}>
          <ListPageHeader
            title={intl.formatMessage({ id: 'role.title' })}
            description={intl.formatMessage({ id: 'role.subtitle' })}
            actions={
              <button
                type="button"
                className="app-button-primary inline-flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-semibold shadow-sm transition-transform active:scale-[0.98]"
                onClick={openCreate}
              >
                <PlusOutlined />
                {intl.formatMessage({ id: 'role.add' })}
              </button>
            }
          />

          <AppQueryPanel<RoleFilterFormValues>
            form={filterForm}
            appliedFilters={appliedFilters as Record<string, unknown>}
            loading={loading}
            onSearch={handleFilterSearch}
            onReset={handleFilterReset}
            layout="list"
            keywordPlaceholder={intl.formatMessage({
              id: 'role.filter.keywordPlaceholder',
            })}
            keywordClassName="max-w-md"
            advancedContent={
              <AppQueryPanel.Grid>
                <Form.Item
                  name="id"
                  label={intl.formatMessage({ id: 'role.column.id' })}
                >
                  <AppQueryInputNumber
                    min={1}
                    placeholder={intl.formatMessage({
                      id: 'appQueryPanel.numberPlaceholder',
                    })}
                  />
                </Form.Item>
                <Form.Item
                  name="name"
                  label={intl.formatMessage({ id: 'role.column.name' })}
                >
                  <AppQueryInput
                    placeholder={intl.formatMessage({
                      id: 'role.filter.namePlaceholder',
                    })}
                  />
                </Form.Item>
                <Form.Item
                  name="allowToolLevel"
                  label={intl.formatMessage({
                    id: 'role.column.allowToolLevel',
                  })}
                >
                  <Select
                    allowClear
                    placeholder={intl.formatMessage({
                      id: 'appQueryPanel.selectPlaceholder',
                    })}
                    options={toolLevelOptions}
                  />
                </Form.Item>
              </AppQueryPanel.Grid>
            }
          />

          <AppTable<Role>
            rowKey="id"
            columns={columns}
            dataSource={list}
            loading={loading}
            emptyText={intl.formatMessage({ id: 'role.empty.none' })}
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
            ? intl.formatMessage({ id: 'role.editTitle' })
            : intl.formatMessage({ id: 'role.createTitle' })
        }
        open={editorOpen}
        onCancel={() => setEditorOpen(false)}
        onOk={() => void handleEditorSubmit()}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form<CreateRoleDto>
          form={editorForm}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label={intl.formatMessage({ id: 'role.column.name' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: 'role.form.nameRequired' }),
              },
            ]}
          >
            <Input
              className="app-input"
              placeholder={intl.formatMessage({
                id: 'role.form.namePlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label={intl.formatMessage({ id: 'role.column.description' })}
          >
            <Input.TextArea
              className="app-input"
              rows={3}
              placeholder={intl.formatMessage({
                id: 'role.form.descriptionPlaceholder',
              })}
            />
          </Form.Item>
          <Form.Item
            name="allowToolLevel"
            label={intl.formatMessage({ id: 'role.column.allowToolLevel' })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'role.form.allowToolLevelRequired',
                }),
              },
            ]}
          >
            <Select options={toolLevelOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default RolePermissionPage;
