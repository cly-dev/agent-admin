import type { ToolDecisionRole } from '@/types/tool';
import { useIntl } from '@umijs/max';
import { Form, Input, InputNumber, Select } from 'antd';
import type { ToolOutputSchemaField } from '../useTools';
import ResponseProfileFieldList from './ResponseProfileFieldList';
import styles from '../index.module.scss';

const DECISION_ROLES: ToolDecisionRole[] = ['read-list', 'read-detail'];

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
  const coreRows =
    (Form.useWatch('responseCoreFields', form) as { path: string }[] | undefined) ??
    [];
  const listMetaRows =
    (Form.useWatch('responseListMetaFields', form) as { path: string }[] | undefined) ??
    [];
  const optionalRows =
    (Form.useWatch('responseOptionalFields', form) as { path: string }[] | undefined) ??
    [];

  const corePaths = coreRows.map((row) => row.path.trim()).filter(Boolean);
  const listMetaPaths = listMetaRows.map((row) => row.path.trim()).filter(Boolean);
  const optionalPaths = optionalRows.map((row) => row.path.trim()).filter(Boolean);
  const allUsedPaths = [...corePaths, ...listMetaPaths, ...optionalPaths];

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
        >
          <Input
            className="app-input"
            disabled={disabled}
            placeholder={intl.formatMessage({
              id: 'tool.response.listPathPlaceholder',
            })}
          />
        </Form.Item>

        <Form.Item
          name="responseArrayLimitsMaxItems"
          className={styles.toolDetailField}
          label={
            <span className={styles.toolDetailLabel}>
              {intl.formatMessage({ id: 'tool.response.arrayLimitsMaxItems' })}
            </span>
          }
        >
          <InputNumber
            className="app-input w-full"
            min={1}
            disabled={disabled}
            placeholder={intl.formatMessage({
              id: 'tool.response.arrayLimitsMaxItemsPlaceholder',
            })}
          />
        </Form.Item>
      </div>

      <ResponseProfileFieldList
        listName="responseListMetaFields"
        title={intl.formatMessage({ id: 'tool.response.listMetaField.section' })}
        description={intl.formatMessage({
          id: 'tool.response.listMetaField.sectionDesc',
        })}
        emptyText={intl.formatMessage({ id: 'tool.response.listMetaField.empty' })}
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
    </div>
  );
};

export default ToolResponseProfileMeta;
