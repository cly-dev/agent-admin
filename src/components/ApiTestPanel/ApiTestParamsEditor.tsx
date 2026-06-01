import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Input, Switch, Tabs } from 'antd';
import { useMemo } from 'react';
import type { ApiTestParamIn, ApiTestParamRow, ApiTestParamsByIn } from './types';
import { API_TEST_SECTIONS, createEmptyApiTestRow } from './utils';
import styles from './index.module.scss';

const { TextArea } = Input;

type ApiTestParamsEditorProps = {
  value: ApiTestParamsByIn;
  disabled?: boolean;
  onChange: (next: ApiTestParamsByIn) => void;
};

function isJsonBodyRow(row: ApiTestParamRow): boolean {
  return row.in === 'body' && (row.paramType === 'object' || row.paramType === 'array');
}

const ApiTestParamsEditor: React.FC<ApiTestParamsEditorProps> = ({ value, disabled, onChange }) => {
  const intl = useIntl();

  const updateSection = (section: ApiTestParamIn, rows: ApiTestParamRow[]) => {
    onChange({ ...value, [section]: rows });
  };

  const updateRow = (section: ApiTestParamIn, rowId: string, patch: Partial<ApiTestParamRow>) => {
    updateSection(
      section,
      value[section].map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    );
  };

  const removeRow = (section: ApiTestParamIn, rowId: string) => {
    updateSection(
      section,
      value[section].filter((row) => row.id !== rowId),
    );
  };

  const addRow = (section: ApiTestParamIn) => {
    updateSection(section, [...value[section], createEmptyApiTestRow(section)]);
  };

  const tabItems = useMemo(
    () =>
      API_TEST_SECTIONS.map((section) => {
        const rows = value[section];
        const label = intl.formatMessage({ id: `apiTestPanel.section.${section}` });
        const count = rows.length > 0 ? ` (${rows.length})` : '';

        return {
          key: section,
          label: `${label}${count}`,
          children: (
            <div className={styles.section}>
              {rows.length === 0 ? (
                <p className={styles.empty}>{intl.formatMessage({ id: 'apiTestPanel.noParams' })}</p>
              ) : (
                <div className={styles.kvTable}>
                  <div
                    className={`${styles.kvHead} ${isJsonBodyRow(rows[0]) && rows.length === 1 ? styles.kvHeadBody : ''}`}
                  >
                    <span />
                    <span>{intl.formatMessage({ id: 'apiTestPanel.key' })}</span>
                    <span>{intl.formatMessage({ id: 'apiTestPanel.value' })}</span>
                    <span aria-hidden />
                  </div>
                  {rows.map((row) => {
                    const jsonBody = isJsonBodyRow(row);

                    return (
                      <div
                        key={row.id}
                        className={`${styles.kvRow} ${jsonBody ? styles.kvRowBody : ''}`}
                      >
                        <Switch
                          size="small"
                          checked={row.enabled}
                          disabled={disabled}
                          onChange={(checked) => updateRow(section, row.id, { enabled: checked })}
                        />
                        <Input
                          className={`app-input ${styles.keyInput}`}
                          disabled={disabled}
                          value={row.name}
                          placeholder={intl.formatMessage({ id: 'apiTestPanel.keyPlaceholder' })}
                          onChange={(event) =>
                            updateRow(section, row.id, { name: event.target.value })
                          }
                        />
                        {jsonBody ? (
                          <TextArea
                            className={styles.bodyInput}
                            disabled={disabled}
                            rows={6}
                            value={row.value}
                            spellCheck={false}
                            placeholder="{}"
                            onChange={(event) =>
                              updateRow(section, row.id, { value: event.target.value })
                            }
                          />
                        ) : (
                          <Input
                            className={`app-input ${styles.valueInput}`}
                            disabled={disabled}
                            value={row.value}
                            placeholder={row.description}
                            onChange={(event) =>
                              updateRow(section, row.id, { value: event.target.value })
                            }
                          />
                        )}
                        <button
                          type="button"
                          className={styles.rowDelete}
                          disabled={disabled}
                          aria-label={intl.formatMessage({ id: 'apiTestPanel.removeRow' })}
                          onClick={() => removeRow(section, row.id)}
                        >
                          <DeleteOutlined />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                className={styles.addRow}
                disabled={disabled}
                onClick={() => addRow(section)}
              >
                <PlusOutlined />
                {intl.formatMessage({ id: 'apiTestPanel.addRow' })}
              </button>
            </div>
          ),
        };
      }),
    [disabled, intl, value],
  );

  const defaultActiveKey = useMemo(() => {
    const first = API_TEST_SECTIONS.find((section) => value[section].length > 0);
    return first ?? 'query';
  }, [value]);

  return (
    <Tabs
      className={styles.tabs}
      size="small"
      defaultActiveKey={defaultActiveKey}
      items={tabItems}
    />
  );
};

export default ApiTestParamsEditor;
