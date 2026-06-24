import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Empty, Input, Select, Switch, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useEffect, useMemo, useState } from 'react';
import styles from '../index.module.scss';
import type {
  ToolParameter,
  ToolParameterIn,
  ToolParameterType,
} from '../toolSchema';
import {
  createEmptyBodyParameter,
  createEmptyParameter,
  getParameterParentPath,
  normalizeParameterPath,
  partitionParameters,
} from '../toolSchema';

const SIMPLE_PARAMETER_INS: ToolParameterIn[] = ['path', 'query', 'header'];

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
  value?: ToolParameter[];
  onChange?: (value: ToolParameter[]) => void;
};

function findBodyChildren(
  rows: ToolParameter[],
  path: string,
): ToolParameter[] {
  const normalized = normalizeParameterPath(path);
  return rows.filter((row) => getParameterParentPath(row.name) === normalized);
}

const ToolParametersEditor: React.FC<ToolParametersEditorProps> = ({
  disabled,
  value,
  onChange,
}) => {
  const intl = useIntl();
  const parameters = value ?? [];
  const { simple, body } = useMemo(
    () => partitionParameters(parameters),
    [parameters],
  );
  const [selectedBodyId, setSelectedBodyId] = useState<string | null>(
    body[0]?.id ?? null,
  );

  const selectedBodyParam = useMemo(
    () => body.find((row) => row.id === selectedBodyId) ?? null,
    [body, selectedBodyId],
  );

  const { bodyTreeData, treeKeyToRowId, rowIdToTreeKey } = useMemo(() => {
    const treeKeyToRowIdMap = new Map<string, string>();
    const rowIdToTreeKeyMap = new Map<string, string>();

    const buildNode = (row: ToolParameter): DataNode => {
      const path = normalizeParameterPath(row.name);
      const rowIndex = body.findIndex((item) => item.id === row.id);
      const treeKey = `body|path:${path}|index:${rowIndex}`;
      treeKeyToRowIdMap.set(treeKey, row.id);
      if (!rowIdToTreeKeyMap.has(row.id)) {
        rowIdToTreeKeyMap.set(row.id, treeKey);
      }
      const labelTokens = path.split('.').filter(Boolean);
      const label =
        labelTokens.length > 0 ? labelTokens[labelTokens.length - 1] : path;
      const childrenRows = findBodyChildren(body, path);
      return {
        key: treeKey,
        title: `${label || '(empty)'} · ${row.type}`,
        children: childrenRows.map((child) => buildNode(child)),
      };
    };

    let roots = body.filter((row) => getParameterParentPath(row.name) === null);
    if (roots.length === 0 && body.length > 0) {
      roots = body;
    }

    const treeData = roots.map((row) => buildNode(row));
    return {
      bodyTreeData: treeData,
      treeKeyToRowId: treeKeyToRowIdMap,
      rowIdToTreeKey: rowIdToTreeKeyMap,
    };
  }, [body]);

  useEffect(() => {
    if (body.length === 0) {
      if (selectedBodyId !== null) {
        setSelectedBodyId(null);
      }
      return;
    }
    if (!selectedBodyId || !body.some((row) => row.id === selectedBodyId)) {
      setSelectedBodyId(body[0]?.id ?? null);
    }
  }, [body, selectedBodyId]);

  const setParameters = (next: ToolParameter[]) => {
    onChange?.(next);
  };

  const setSimpleParameters = (nextSimple: ToolParameter[]) => {
    setParameters([...nextSimple, ...body]);
  };

  const setBodyParameters = (nextBody: ToolParameter[]) => {
    setParameters([...simple, ...nextBody]);
  };

  const updateSimpleParameter = (id: string, patch: Partial<ToolParameter>) => {
    setSimpleParameters(
      simple.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const removeSimpleParameter = (id: string) => {
    setSimpleParameters(simple.filter((row) => row.id !== id));
  };

  const addSimpleParameter = () => {
    setSimpleParameters([...simple, createEmptyParameter()]);
  };

  const updateBodyParameter = (id: string, patch: Partial<ToolParameter>) => {
    setBodyParameters(
      body.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const addBodyRoot = () => {
    const row = createEmptyBodyParameter(`field_${body.length + 1}`);
    row.type = 'object';
    setBodyParameters([...body, row]);
    setSelectedBodyId(row.id);
  };

  const addBodyChild = () => {
    if (!selectedBodyParam) {
      return;
    }
    const parentPath = normalizeParameterPath(selectedBodyParam.name);
    const row = createEmptyBodyParameter(`${parentPath}.child`);
    setBodyParameters([...body, row]);
    setSelectedBodyId(row.id);
  };

  const removeBodyNode = () => {
    if (!selectedBodyParam) {
      return;
    }
    const path = normalizeParameterPath(selectedBodyParam.name);
    const next = body.filter((row) => {
      const candidate = normalizeParameterPath(row.name);
      return !(candidate === path || candidate.startsWith(`${path}.`));
    });
    setBodyParameters(next);
    setSelectedBodyId(next[0]?.id ?? null);
  };

  return (
    <div className={styles.toolParamsEditor}>
      <div className={styles.toolParamsSection}>
        <div className={styles.toolParamsSectionHead}>
          <h4 className={styles.toolParamsSectionTitle}>
            {intl.formatMessage({ id: 'tool.params.simpleSection' })}
          </h4>
          <p className={styles.toolDetailFieldHint}>
            {intl.formatMessage({ id: 'tool.params.simpleSectionDesc' })}
          </p>
        </div>
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
              {simple.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.toolParamsEmpty}>
                    {intl.formatMessage({ id: 'tool.params.simpleEmpty' })}
                  </td>
                </tr>
              ) : (
                simple.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Select
                        disabled={disabled}
                        value={row.in}
                        options={SIMPLE_PARAMETER_INS.map((paramIn) => ({
                          value: paramIn,
                          label: intl.formatMessage({
                            id: `tool.params.in.${paramIn}`,
                          }),
                        }))}
                        onChange={(paramIn) =>
                          updateSimpleParameter(row.id, { in: paramIn })
                        }
                      />
                    </td>
                    <td>
                      <Input
                        className={`app-input ${styles.toolParamsNameInput}`}
                        disabled={disabled}
                        value={row.name}
                        placeholder={intl.formatMessage({
                          id: 'tool.params.namePlaceholder',
                        })}
                        onChange={(event) =>
                          updateSimpleParameter(row.id, {
                            name: event.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <Select
                        disabled={disabled}
                        value={row.type}
                        options={PARAMETER_TYPES.map((type) => ({
                          value: type,
                          label: intl.formatMessage({
                            id: `tool.params.type.${type}`,
                          }),
                        }))}
                        onChange={(type) =>
                          updateSimpleParameter(row.id, { type })
                        }
                      />
                    </td>
                    <td>
                      <Input
                        className={`app-input ${styles.toolParamsFormatInput}`}
                        disabled={disabled}
                        value={row.format ?? ''}
                        placeholder={intl.formatMessage({
                          id: 'tool.params.formatPlaceholder',
                        })}
                        onChange={(event) =>
                          updateSimpleParameter(row.id, {
                            format: event.target.value,
                          })
                        }
                      />
                    </td>
                    <td>
                      <Switch
                        disabled={disabled}
                        checked={row.required}
                        onChange={(required) =>
                          updateSimpleParameter(row.id, { required })
                        }
                      />
                    </td>
                    <td>
                      <Input
                        className="app-input"
                        disabled={disabled}
                        value={row.description}
                        placeholder={intl.formatMessage({
                          id: 'tool.params.descriptionPlaceholder',
                        })}
                        onChange={(event) =>
                          updateSimpleParameter(row.id, {
                            description: event.target.value,
                          })
                        }
                      />
                    </td>
                    <td className={styles.toolParamsActions}>
                      <button
                        type="button"
                        className={styles.toolParamsDelete}
                        disabled={disabled}
                        aria-label={intl.formatMessage({
                          id: 'tool.params.remove',
                        })}
                        onClick={() => removeSimpleParameter(row.id)}
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
          onClick={addSimpleParameter}
        >
          <PlusOutlined />
          {intl.formatMessage({ id: 'tool.params.add' })}
        </button>
      </div>

      <div className={styles.toolParamsSection}>
        <div className={styles.toolParamsSectionHead}>
          <h4 className={styles.toolParamsSectionTitle}>
            {intl.formatMessage({ id: 'tool.params.bodySection' })}
          </h4>
          <p className={styles.toolDetailFieldHint}>
            {intl.formatMessage({ id: 'tool.params.bodySectionDesc' })}
          </p>
        </div>
        <div className={styles.toolResponseTreeEditor}>
          <div className={styles.toolResponseTreePanel}>
            <p className={styles.toolResponseTreeHint}>
              {intl.formatMessage(
                { id: 'tool.params.body.treeHint' },
                { count: body.length, groups: bodyTreeData.length },
              )}
            </p>
            {bodyTreeData.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={intl.formatMessage({
                  id: 'tool.params.body.empty',
                })}
              />
            ) : (
              <Tree
                treeData={bodyTreeData}
                selectedKeys={
                  selectedBodyId && rowIdToTreeKey.has(selectedBodyId)
                    ? [rowIdToTreeKey.get(selectedBodyId) as string]
                    : []
                }
                onSelect={(keys) => {
                  if (!keys[0]) {
                    return;
                  }
                  const key = keys[0] as string;
                  const rowId = treeKeyToRowId.get(key) ?? null;
                  if (rowId) {
                    setSelectedBodyId(rowId);
                  }
                }}
              />
            )}
            <div className={styles.toolResponseTreeActions}>
              <button
                type="button"
                className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disabled}
                onClick={addBodyRoot}
              >
                <PlusOutlined />
                {intl.formatMessage({ id: 'tool.params.body.add' })}
              </button>
              <button
                type="button"
                className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disabled || !selectedBodyParam}
                onClick={addBodyChild}
              >
                <PlusOutlined />
                {intl.formatMessage({ id: 'tool.params.body.addChild' })}
              </button>
              <button
                type="button"
                className="app-button-delete inline-flex items-center gap-1.5 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disabled || !selectedBodyParam}
                onClick={removeBodyNode}
              >
                <DeleteOutlined />
                {intl.formatMessage({ id: 'tool.params.body.removeNode' })}
              </button>
            </div>
          </div>

          <div
            key={selectedBodyId ?? 'none'}
            className={styles.toolResponseFormPanel}
          >
            {!selectedBodyParam ? (
              <p className={styles.toolDetailFieldHint}>
                {intl.formatMessage({ id: 'tool.params.body.selectNode' })}
              </p>
            ) : (
              <>
                <div className={styles.toolResponseField}>
                  <span className={styles.toolDetailLabel}>
                    {intl.formatMessage({ id: 'tool.params.name' })}
                  </span>
                  <Input
                    className={`app-input ${styles.toolResponsePathInput}`}
                    disabled={disabled}
                    value={selectedBodyParam.name}
                    placeholder={intl.formatMessage({
                      id: 'tool.params.body.namePlaceholder',
                    })}
                    onChange={(event) =>
                      updateBodyParameter(selectedBodyParam.id, {
                        name: event.target.value,
                      })
                    }
                  />
                </div>
                <div className={styles.toolResponseField}>
                  <span className={styles.toolDetailLabel}>
                    {intl.formatMessage({ id: 'tool.params.type' })}
                  </span>
                  <Select
                    disabled={disabled}
                    value={selectedBodyParam.type}
                    options={PARAMETER_TYPES.map((type) => ({
                      value: type,
                      label: intl.formatMessage({
                        id: `tool.params.type.${type}`,
                      }),
                    }))}
                    onChange={(type) =>
                      updateBodyParameter(selectedBodyParam.id, { type })
                    }
                  />
                </div>
                <div className={styles.toolResponseField}>
                  <span className={styles.toolDetailLabel}>
                    {intl.formatMessage({ id: 'tool.params.format' })}
                  </span>
                  <Input
                    className={`app-input ${styles.toolParamsFormatInput}`}
                    disabled={disabled}
                    value={selectedBodyParam.format ?? ''}
                    placeholder={intl.formatMessage({
                      id: 'tool.params.formatPlaceholder',
                    })}
                    onChange={(event) =>
                      updateBodyParameter(selectedBodyParam.id, {
                        format: event.target.value,
                      })
                    }
                  />
                </div>
                <div className={styles.toolResponseField}>
                  <span className={styles.toolDetailLabel}>
                    {intl.formatMessage({ id: 'tool.params.required' })}
                  </span>
                  <Switch
                    disabled={disabled}
                    checked={selectedBodyParam.required}
                    onChange={(required) =>
                      updateBodyParameter(selectedBodyParam.id, { required })
                    }
                  />
                </div>
                <div className={styles.toolResponseField}>
                  <span className={styles.toolDetailLabel}>
                    {intl.formatMessage({ id: 'tool.params.description' })}
                  </span>
                  <Input.TextArea
                    rows={4}
                    className={`app-input ${styles.toolResponseDescInput}`}
                    disabled={disabled}
                    value={selectedBodyParam.description}
                    placeholder={intl.formatMessage({
                      id: 'tool.params.descriptionPlaceholder',
                    })}
                    onChange={(event) =>
                      updateBodyParameter(selectedBodyParam.id, {
                        description: event.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolParametersEditor;
