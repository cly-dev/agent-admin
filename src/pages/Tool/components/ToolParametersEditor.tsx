import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Form, Input, Select, Switch } from 'antd';
import type { ToolParameterIn, ToolParameterType } from '../toolSchema';
import { createEmptyParameter } from '../toolSchema';
import styles from '../index.module.scss';

const PARAMETER_INS: ToolParameterIn[] = ['path', 'query', 'header', 'body'];

const PARAMETER_TYPES: ToolParameterType[] = [
  'string',
  'integer',
  'number',
  'boolean',
  'object',
  'array',
];

type ToolParametersEditorProps = {
  disabled?: boolean;
};

const ToolParametersEditor: React.FC<ToolParametersEditorProps> = ({ disabled }) => {
  const intl = useIntl();

  return (
    <Form.List name="parameters">
      {(fields, { add, remove }) => (
        <div className={styles.toolParamsEditor}>
          <div className={styles.toolParamsTableWrap}>
            <table className={styles.toolParamsTable}>
              <thead>
                <tr>
                  <th>{intl.formatMessage({ id: 'tool.params.in' })}</th>
                  <th>{intl.formatMessage({ id: 'tool.params.name' })}</th>
                  <th>{intl.formatMessage({ id: 'tool.params.type' })}</th>
                  <th>{intl.formatMessage({ id: 'tool.params.format' })}</th>
                  <th>{intl.formatMessage({ id: 'tool.params.required' })}</th>
                  <th>{intl.formatMessage({ id: 'tool.params.description' })}</th>
                  <th aria-hidden />
                </tr>
              </thead>
              <tbody>
                {fields.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.toolParamsEmpty}>
                      {intl.formatMessage({ id: 'tool.params.empty' })}
                    </td>
                  </tr>
                ) : (
                  fields.map((field) => (
                    <tr key={field.key}>
                      <td>
                        <Form.Item
                          {...field}
                          name={[field.name, 'id']}
                          hidden
                          noStyle
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, 'in']}
                          className={styles.toolParamsCellField}
                        >
                          <Select
                            disabled={disabled}
                            options={PARAMETER_INS.map((paramIn) => ({
                              value: paramIn,
                              label: intl.formatMessage({ id: `tool.params.in.${paramIn}` }),
                            }))}
                          />
                        </Form.Item>
                      </td>
                      <td>
                        <Form.Item
                          {...field}
                          name={[field.name, 'name']}
                          rules={[
                            {
                              required: true,
                              whitespace: true,
                              message: intl.formatMessage({ id: 'tool.params.nameRequired' }),
                            },
                          ]}
                          className={styles.toolParamsCellField}
                        >
                          <Input
                            className={`app-input ${styles.toolParamsNameInput}`}
                            disabled={disabled}
                            placeholder={intl.formatMessage({ id: 'tool.params.namePlaceholder' })}
                          />
                        </Form.Item>
                      </td>
                      <td>
                        <Form.Item
                          {...field}
                          name={[field.name, 'type']}
                          className={styles.toolParamsCellField}
                        >
                          <Select
                            disabled={disabled}
                            options={PARAMETER_TYPES.map((type) => ({
                              value: type,
                              label: intl.formatMessage({ id: `tool.params.type.${type}` }),
                            }))}
                          />
                        </Form.Item>
                      </td>
                      <td>
                        <Form.Item
                          {...field}
                          name={[field.name, 'format']}
                          className={styles.toolParamsCellField}
                        >
                          <Input
                            className={`app-input ${styles.toolParamsFormatInput}`}
                            disabled={disabled}
                            placeholder={intl.formatMessage({ id: 'tool.params.formatPlaceholder' })}
                          />
                        </Form.Item>
                      </td>
                      <td>
                        <Form.Item
                          {...field}
                          name={[field.name, 'required']}
                          valuePropName="checked"
                          className={styles.toolParamsCellField}
                        >
                          <Switch disabled={disabled} />
                        </Form.Item>
                      </td>
                      <td>
                        <Form.Item
                          {...field}
                          name={[field.name, 'description']}
                          className={styles.toolParamsCellField}
                        >
                          <Input
                            className="app-input"
                            disabled={disabled}
                            placeholder={intl.formatMessage({
                              id: 'tool.params.descriptionPlaceholder',
                            })}
                          />
                        </Form.Item>
                      </td>
                      <td className={styles.toolParamsActions}>
                        <button
                          type="button"
                          className={styles.toolParamsDelete}
                          disabled={disabled}
                          aria-label={intl.formatMessage({ id: 'tool.params.remove' })}
                          onClick={() => remove(field.name)}
                        >
                          <DeleteOutlined />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Button
            type="dashed"
            block
            disabled={disabled}
            className={styles.toolParamsAdd}
            icon={<PlusOutlined />}
            onClick={() => add(createEmptyParameter())}
          >
            {intl.formatMessage({ id: 'tool.params.add' })}
          </Button>
        </div>
      )}
    </Form.List>
  );
};

export default ToolParametersEditor;
