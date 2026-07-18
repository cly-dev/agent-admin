import type { ToolDecisionRole } from '@/types/tool';
import { useIntl } from '@umijs/max';
import { Form, Input, InputNumber, Select } from 'antd';
import type { ToolOutputSchemaField } from '../useTools';
import ResponseProfileFieldList from './ResponseProfileFieldList';
import styles from '../index.module.scss';

const DECISION_ROLES: ToolDecisionRole[] = [
  'read-detail',
  'read-list',
  'read-stats',
  'write-single',
  'write-batch',
  'write-meta',
  'admin',
];

type Props = {
  disabled?: boolean;
  outputSchemaFields: ToolOutputSchemaField[];
};

const ToolResponseProfileMeta: React.FC<Props> = ({
  disabled,
  outputSchemaFields,
}) => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const listPath =
    (Form.useWatch('responseListPath', form) as string | undefined)?.trim() ??
    '';
  const decisionRole = Form.useWatch('responseDecisionRole', form) as
    | string
    | undefined;
  const showListMeta =
    Boolean(listPath) || decisionRole === 'read-list';

  const coreRows =
    (Form.useWatch('responseCoreFields', form) as
      | { path: string }[]
      | undefined) ?? [];
  const listMetaRows =
    (Form.useWatch('responseListMetaFields', form) as
      | { path: string }[]
      | undefined) ?? [];
  const optionalRows =
    (Form.useWatch('responseOptionalFields', form) as
      | { path: string }[]
      | undefined) ?? [];

  const corePaths = coreRows.map((row) => row.path.trim()).filter(Boolean);
  const listMetaPaths = listMetaRows
    .map((row) => row.path.trim())
    .filter(Boolean);
  const optionalPaths = optionalRows
    .map((row) => row.path.trim())
    .filter(Boolean);

  return (
    <div className={styles.toolResponseProfileMeta}>
      <div className={styles.toolResponseProfileMetaGrid}>
        <Form.Item
          name="responseEntityType"
          className={styles.toolDetailField}
          label={
            <span className={styles.toolDetailLabel}>
              {intl.formatMessage({ id: 'tool.response.entityType' })}
            </span>
          }
          tooltip={intl.formatMessage({ id: 'tool.response.entityTypeHint' })}
        >
          <Input
            className="app-input"
            disabled={disabled}
            placeholder={intl.formatMessage({
              id: 'tool.response.entityTypePlaceholder',
            })}
          />
        </Form.Item>

        <Form.Item
          name="responseDecisionRole"
          className={styles.toolDetailField}
          label={
            <span className={styles.toolDetailLabel}>
              {intl.formatMessage({ id: 'tool.response.decisionRole' })}
            </span>
          }
          tooltip={intl.formatMessage({ id: 'tool.response.decisionRoleHint' })}
        >
          <Select
            className="app-input"
            allowClear
            disabled={disabled}
            placeholder={intl.formatMessage({
              id: 'tool.response.decisionRolePlaceholder',
            })}
            options={DECISION_ROLES.map((role) => ({
              value: role,
              label: intl.formatMessage({
                id: `tool.response.decisionRole.${role}`,
              }),
            }))}
          />
        </Form.Item>

        <Form.Item
          name="responseListPath"
          className={`${styles.toolDetailField} ${styles.toolDetailFieldFull}`}
          label={
            <span className={styles.toolDetailLabel}>
              {intl.formatMessage({ id: 'tool.response.listPath' })}
            </span>
          }
          tooltip={intl.formatMessage({ id: 'tool.response.listPathHint' })}
        >
          <Input
            className="app-input"
            disabled={disabled}
            placeholder={intl.formatMessage({
              id: 'tool.response.listPathPlaceholder',
            })}
          />
        </Form.Item>

        {showListMeta ? (
          <Form.Item
            name="responseArrayLimitsList"
            className={styles.toolDetailField}
            label={
              <span className={styles.toolDetailLabel}>
                {intl.formatMessage({ id: 'tool.response.arrayLimitsList' })}
              </span>
            }
            tooltip={intl.formatMessage({
              id: 'tool.response.arrayLimitsListHint',
            })}
          >
            <InputNumber
              className="app-input w-full"
              min={1}
              disabled={disabled}
              placeholder={intl.formatMessage({
                id: 'tool.response.arrayLimitsListPlaceholder',
              })}
            />
          </Form.Item>
        ) : null}
      </div>

      {showListMeta ? (
        <ResponseProfileFieldList
          listName="responseListMetaFields"
          title={intl.formatMessage({
            id: 'tool.response.listMetaField.section',
          })}
          description={intl.formatMessage({
            id: 'tool.response.listMetaField.sectionDesc',
          })}
          emptyText={intl.formatMessage({
            id: 'tool.response.listMetaField.empty',
          })}
          pickerPlaceholder={intl.formatMessage({
            id: 'tool.response.listMetaField.pickerPlaceholder',
          })}
          noCandidatesText={intl.formatMessage({
            id: 'tool.response.profileField.noCandidates',
          })}
          disabled={disabled}
          outputSchemaFields={outputSchemaFields}
          siblingPaths={[...corePaths, ...optionalPaths]}
        />
      ) : null}
    </div>
  );
};

export default ToolResponseProfileMeta;
