import { DeleteOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Form, Input, Select } from 'antd';
import { useMemo } from 'react';
import type { ToolCoreFieldRow, ToolOutputSchemaField } from '../useTools';
import { normalizeOutputFieldPath } from '../useTools';
import styles from '../index.module.scss';

function defaultLabelFromPath(path: string): string {
  const tokens = path.split(/[.[\]]+/).filter(Boolean);
  return tokens.length > 0 ? tokens[tokens.length - 1] : path;
}

function createProfileFieldRow(
  path: string,
  outputSchemaFields: ToolOutputSchemaField[],
): ToolCoreFieldRow {
  const schemaField = outputSchemaFields.find(
    (field) => normalizeOutputFieldPath(field.name) === path,
  );
  return {
    id: `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    path,
    label: defaultLabelFromPath(path),
    description: schemaField?.description?.trim() ?? '',
    keywords: [],
  };
}

type Props = {
  listName:
    | 'responseCoreFields'
    | 'responseOptionalFields'
    | 'responseListMetaFields';
  title: string;
  description?: string;
  emptyText: string;
  pickerPlaceholder: string;
  noCandidatesText: string;
  showKeywords?: boolean;
  disabled?: boolean;
  outputSchemaFields: ToolOutputSchemaField[];
  siblingPaths: string[];
};

const ResponseProfileFieldList: React.FC<Props> = ({
  listName,
  title,
  description,
  emptyText,
  pickerPlaceholder,
  noCandidatesText,
  showKeywords = false,
  disabled,
  outputSchemaFields,
  siblingPaths,
}) => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const currentRows = (Form.useWatch(listName, form) as ToolCoreFieldRow[] | undefined) ?? [];

  const typeByPath = useMemo(() => {
    const map = new Map<string, ToolOutputSchemaField['type']>();
    outputSchemaFields.forEach((field) => {
      const path = normalizeOutputFieldPath(field.name);
      if (path) map.set(path, field.type);
    });
    return map;
  }, [outputSchemaFields]);

  const usedPaths = useMemo(() => {
    const set = new Set<string>();
    currentRows.forEach((row) => {
      const path = normalizeOutputFieldPath(row.path);
      if (path) set.add(path);
    });
    siblingPaths.forEach((path) => {
      const normalized = normalizeOutputFieldPath(path);
      if (normalized) set.add(normalized);
    });
    return set;
  }, [currentRows, siblingPaths]);

  const pickerOptions = useMemo(
    () =>
      outputSchemaFields
        .map((field) => normalizeOutputFieldPath(field.name))
        .filter((path) => path && !usedPaths.has(path))
        .map((path) => ({
          value: path,
          label: `${path} · ${typeByPath.get(path) ?? 'string'}`,
        })),
    [outputSchemaFields, typeByPath, usedPaths],
  );

  return (
    <div className={styles.toolResponseProfileSection}>
      <span className={styles.toolResponseProfileTitle}>{title}</span>
      {description ? <p className={styles.toolDetailFieldHint}>{description}</p> : null}
      <Form.List name={listName}>
        {(fields, { add, remove }) => (
          <div className={styles.toolResponseProfileTableWrap}>
            {fields.length === 0 ? (
              <p className={styles.toolParamsEmpty}>{emptyText}</p>
            ) : (
              <table className={styles.toolResponseProfileTable}>
                <thead>
                  <tr>
                    <th>{intl.formatMessage({ id: 'tool.response.profileField.path' })}</th>
                    <th>{intl.formatMessage({ id: 'tool.response.profileField.type' })}</th>
                    <th>{intl.formatMessage({ id: 'tool.response.profileField.label' })}</th>
                    <th>{intl.formatMessage({ id: 'tool.response.profileField.description' })}</th>
                    {showKeywords ? (
                      <th>{intl.formatMessage({ id: 'tool.response.profileField.keywords' })}</th>
                    ) : null}
                    <th aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => {
                    const path = normalizeOutputFieldPath(currentRows[field.name]?.path ?? '');
                    const fieldType = path ? typeByPath.get(path) : undefined;
                    return (
                      <tr key={field.key}>
                        <td>
                          <Form.Item {...field} name={[field.name, 'id']} hidden noStyle>
                            <Input />
                          </Form.Item>
                          <Form.Item {...field} name={[field.name, 'path']} hidden noStyle>
                            <Input />
                          </Form.Item>
                          <span className={styles.toolResponseProfilePath}>{path || '—'}</span>
                        </td>
                        <td>
                          {fieldType ? (
                            <span className={styles.toolResponseProfileType}>
                              {intl.formatMessage({ id: `tool.params.type.${fieldType}` })}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <Form.Item
                            {...field}
                            name={[field.name, 'label']}
                            className={styles.toolParamsCellField}
                          >
                            <Input
                              className={`app-input ${styles.toolResponsePathInput}`}
                              disabled={disabled}
                              placeholder={intl.formatMessage({
                                id: 'tool.response.profileField.labelPlaceholder',
                              })}
                            />
                          </Form.Item>
                        </td>
                        <td>
                          <Form.Item
                            {...field}
                            name={[field.name, 'description']}
                            className={styles.toolParamsCellField}
                          >
                            <Input
                              className={`app-input ${styles.toolResponsePathInput}`}
                              disabled={disabled}
                              placeholder={intl.formatMessage({
                                id: 'tool.response.profileField.descriptionPlaceholder',
                              })}
                            />
                          </Form.Item>
                        </td>
                        {showKeywords ? (
                          <td>
                            <Form.Item
                              {...field}
                              name={[field.name, 'keywords']}
                              className={styles.toolParamsCellField}
                            >
                              <Select
                                mode="tags"
                                disabled={disabled}
                                open={false}
                                tokenSeparators={[',', '，']}
                                placeholder={intl.formatMessage({
                                  id: 'tool.response.profileField.keywordsPlaceholder',
                                })}
                              />
                            </Form.Item>
                          </td>
                        ) : null}
                        <td>
                          <button
                            type="button"
                            className={styles.toolParamsDelete}
                            disabled={disabled}
                            onClick={() => remove(field.name)}
                            aria-label={intl.formatMessage({ id: 'tool.response.profileField.remove' })}
                          >
                            <DeleteOutlined />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <Select
              showSearch
              allowClear
              disabled={disabled || pickerOptions.length === 0}
              placeholder={pickerOptions.length === 0 ? noCandidatesText : pickerPlaceholder}
              options={pickerOptions}
              optionFilterProp="label"
              className={styles.toolResponseProfilePicker}
              value={null}
              onChange={(path) => {
                if (!path) return;
                add(createProfileFieldRow(path, outputSchemaFields));
              }}
            />
          </div>
        )}
      </Form.List>
    </div>
  );
};

export default ResponseProfileFieldList;
