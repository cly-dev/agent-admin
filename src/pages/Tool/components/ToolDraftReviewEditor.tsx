import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Form, Input, Radio, Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import styles from '../index.module.scss';
import type { DraftReviewSimpleMode } from '../toolAgentMetadata';
import {
  applyDraftReviewSimpleMode,
  buildStringParamOptionsFromParameters,
  defaultDraftReviewPolicy,
  deriveDraftReviewSimpleMode,
} from '../toolAgentMetadata';
import type { ToolParameter } from '../toolSchema';

const SIMPLE_MODES: DraftReviewSimpleMode[] = [
  'content_only',
  'allowlisted',
  'readonly_confirm',
];

type ToolDraftReviewEditorProps = {
  disabled?: boolean;
  parameters: ToolParameter[];
  businessFieldOptions: Array<{ value: string; label: string }>;
  hasInputParameters: boolean;
  isCreateMode?: boolean;
};

const ToolDraftReviewEditor: React.FC<ToolDraftReviewEditorProps> = ({
  disabled = false,
  parameters,
  businessFieldOptions,
  hasInputParameters,
  isCreateMode = false,
}) => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const draftReview = Form.useWatch(['agentMetadata', 'draftReview'], form);
  const submitPath = draftReview?.submitPath?.trim() ?? '';

  const [simpleMode, setSimpleMode] = useState<DraftReviewSimpleMode>(() =>
    deriveDraftReviewSimpleMode(
      form.getFieldValue(['agentMetadata', 'draftReview']),
    ),
  );

  useEffect(() => {
    const current = form.getFieldValue(['agentMetadata', 'draftReview']);
    if (!current) {
      form.setFieldValue(
        ['agentMetadata', 'draftReview'],
        defaultDraftReviewPolicy(),
      );
    }
  }, [form]);

  useEffect(() => {
    setSimpleMode(deriveDraftReviewSimpleMode(draftReview));
  }, [draftReview]);

  const stringPathOptions = useMemo(
    () => buildStringParamOptionsFromParameters(parameters),
    [parameters],
  );

  const fieldOverridePathOptions = useMemo(
    () =>
      buildStringParamOptionsFromParameters(parameters).map((item) => ({
        value: item.value,
        label: item.label,
      })),
    [parameters],
  );

  const renderFieldHint = (id: string) => (
    <p className={styles.toolDetailFieldHint}>{intl.formatMessage({ id })}</p>
  );

  const renderStep = (
    step: number,
    titleId: string,
    children: React.ReactNode,
  ) => (
    <section className={styles.toolDraftReviewStep}>
      <div className={styles.toolDraftReviewStepHead}>
        <span className={styles.toolDraftReviewStepIndex}>{step}</span>
        <span className={styles.toolDetailLabel}>
          {intl.formatMessage({ id: titleId })}
        </span>
      </div>
      <div className={styles.toolDraftReviewStepBody}>{children}</div>
    </section>
  );

  const handleSimpleModeChange = (mode: DraftReviewSimpleMode) => {
    setSimpleMode(mode);
    const current =
      form.getFieldValue(['agentMetadata', 'draftReview']) ??
      defaultDraftReviewPolicy();
    form.setFieldValue(
      ['agentMetadata', 'draftReview'],
      applyDraftReviewSimpleMode(mode, current),
    );
  };

  const handleSubmitPathChange = (path: string | undefined) => {
    form.setFieldValue(['agentMetadata', 'draftReview', 'submitPath'], path);
    if (simpleMode === 'readonly_confirm' && path) {
      const locked =
        (form.getFieldValue(['agentMetadata', 'draftReview', 'lockedPaths']) as
          | string[]
          | undefined) ?? [];
      if (!locked.includes(path)) {
        form.setFieldValue(
          ['agentMetadata', 'draftReview', 'lockedPaths'],
          [...locked, path],
        );
      }
    }
  };

  return (
    <div
      className={`${styles.toolDetailField} ${styles.toolDetailFieldFull} ${styles.toolDraftReviewSection}`}
    >
      <span className={styles.toolDetailLabel}>
        {intl.formatMessage({ id: 'tool.agentMetadata.draftReview.title' })}
      </span>
      {renderFieldHint('tool.agentMetadata.draftReview.desc')}

      <div className={styles.toolDraftReviewSteps}>
        {renderStep(
          1,
          'tool.agentMetadata.draftReview.step.businessFields',
          <>
            {renderFieldHint(
              'tool.agentMetadata.draftReview.step.businessFieldsHint',
            )}
            <Form.Item
              name={['agentMetadata', 'businessFields']}
              className={styles.toolDraftReviewStepField}
              extra={
                !hasInputParameters
                  ? renderFieldHint(
                      isCreateMode
                        ? 'tool.agentMetadata.businessFieldsEmptyCreate'
                        : 'tool.agentMetadata.businessFieldsEmpty',
                    )
                  : undefined
              }
            >
              <Select
                mode="multiple"
                disabled={disabled || !hasInputParameters}
                options={businessFieldOptions}
                placeholder={intl.formatMessage({
                  id: hasInputParameters
                    ? 'tool.agentMetadata.draftReview.step.businessFieldsPlaceholder'
                    : 'tool.agentMetadata.businessFieldsPlaceholderDisabled',
                })}
                showSearch
                optionFilterProp="label"
                maxTagCount="responsive"
              />
            </Form.Item>
          </>,
        )}

        {renderStep(
          2,
          'tool.agentMetadata.draftReview.step.userCanEdit',
          <>
            {renderFieldHint(
              'tool.agentMetadata.draftReview.step.userCanEditHint',
            )}
            <Radio.Group
              className={styles.toolDraftReviewRadioGroup}
              disabled={disabled}
              value={simpleMode}
              onChange={(event) =>
                handleSimpleModeChange(
                  event.target.value as DraftReviewSimpleMode,
                )
              }
            >
              {SIMPLE_MODES.map((mode) => (
                <Radio
                  key={mode}
                  value={mode}
                  className={styles.toolDraftReviewRadio}
                >
                  <span className={styles.toolDraftReviewRadioLabel}>
                    {intl.formatMessage({
                      id: `tool.agentMetadata.draftReview.simpleMode.${mode}`,
                    })}
                  </span>
                  <span className={styles.toolDetailFieldHint}>
                    {intl.formatMessage({
                      id: `tool.agentMetadata.draftReview.simpleModeHint.${mode}`,
                    })}
                  </span>
                </Radio>
              ))}
            </Radio.Group>

            {simpleMode === 'allowlisted' ? (
              <Form.Item
                name={['agentMetadata', 'draftReview', 'editablePaths']}
                className={styles.toolDraftReviewStepField}
                label={
                  <span className={styles.toolDetailLabel}>
                    {intl.formatMessage({
                      id: 'tool.agentMetadata.draftReview.step.editablePaths',
                    })}
                  </span>
                }
                extra={renderFieldHint(
                  'tool.agentMetadata.draftReview.step.editablePathsHint',
                )}
              >
                <Select
                  mode="multiple"
                  disabled={disabled}
                  options={stringPathOptions}
                  placeholder={intl.formatMessage({
                    id: 'tool.agentMetadata.draftReview.step.editablePathsPlaceholder',
                  })}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            ) : null}
          </>,
        )}

        {renderStep(
          3,
          'tool.agentMetadata.draftReview.step.submitPath',
          <>
            {renderFieldHint(
              'tool.agentMetadata.draftReview.step.submitPathHint',
            )}
            <Form.Item
              name={['agentMetadata', 'draftReview', 'submitPath']}
              className={styles.toolDraftReviewStepField}
            >
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                disabled={disabled || stringPathOptions.length === 0}
                options={stringPathOptions}
                placeholder={intl.formatMessage({
                  id: 'tool.agentMetadata.draftReview.step.submitPathPlaceholder',
                })}
                onChange={handleSubmitPathChange}
              />
            </Form.Item>
            {stringPathOptions.length === 0
              ? renderFieldHint(
                  'tool.agentMetadata.draftReview.step.submitPathEmpty',
                )
              : null}
            {simpleMode === 'readonly_confirm' && submitPath
              ? renderFieldHint(
                  'tool.agentMetadata.draftReview.step.readonlySubmitNote',
                )
              : null}
          </>,
        )}

        {renderStep(
          4,
          'tool.agentMetadata.draftReview.step.fieldLabels',
          <>
            {renderFieldHint(
              'tool.agentMetadata.draftReview.step.fieldLabelsHint',
            )}
            <Form.List
              name={['agentMetadata', 'draftReview', 'fieldOverrides']}
            >
              {(fields, { add, remove }) => (
                <div className={styles.toolParamsEditor}>
                  <div className={styles.toolParamsTableWrap}>
                    <table className={styles.toolParamsTable}>
                      <thead>
                        <tr>
                          <th>
                            {intl.formatMessage({
                              id: 'tool.agentMetadata.draftReview.override.path',
                            })}
                          </th>
                          <th>
                            {intl.formatMessage({
                              id: 'tool.agentMetadata.draftReview.override.label',
                            })}
                          </th>
                          <th aria-hidden />
                        </tr>
                      </thead>
                      <tbody>
                        {fields.length === 0 ? (
                          <tr>
                            <td colSpan={3} className={styles.toolParamsEmpty}>
                              {intl.formatMessage({
                                id: 'tool.agentMetadata.draftReview.fieldOverridesEmpty',
                              })}
                            </td>
                          </tr>
                        ) : (
                          fields.map((field) => (
                            <tr key={field.key}>
                              <td>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'path']}
                                  className={styles.toolParamsCellField}
                                  rules={[
                                    {
                                      required: true,
                                      message: intl.formatMessage({
                                        id: 'tool.agentMetadata.draftReview.override.pathRequired',
                                      }),
                                    },
                                  ]}
                                >
                                  <Select
                                    showSearch
                                    optionFilterProp="label"
                                    disabled={disabled}
                                    options={fieldOverridePathOptions}
                                  />
                                </Form.Item>
                              </td>
                              <td>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'label']}
                                  className={styles.toolParamsCellField}
                                >
                                  <Input
                                    disabled={disabled}
                                    className="app-input"
                                    placeholder={intl.formatMessage({
                                      id: 'tool.agentMetadata.draftReview.step.fieldLabelPlaceholder',
                                    })}
                                  />
                                </Form.Item>
                              </td>
                              <td className={styles.toolParamsActions}>
                                <button
                                  type="button"
                                  className={styles.toolParamsDelete}
                                  disabled={disabled}
                                  aria-label={intl.formatMessage({
                                    id: 'tool.params.remove',
                                  })}
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
                  <button
                    type="button"
                    className={`app-button-secondary inline-flex w-full items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${styles.toolParamsAdd}`}
                    disabled={disabled}
                    onClick={() =>
                      add({
                        path: fieldOverridePathOptions[0]?.value ?? '',
                        label: '',
                      })
                    }
                  >
                    <PlusOutlined />
                    {intl.formatMessage({
                      id: 'tool.agentMetadata.draftReview.fieldOverridesAdd',
                    })}
                  </button>
                </div>
              )}
            </Form.List>
          </>,
        )}
      </div>
    </div>
  );
};

export default ToolDraftReviewEditor;
