import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Empty, Form, Input, Select, Switch, Tree } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { DataNode } from 'antd/es/tree';
import ResponseProfileFieldList from './ResponseProfileFieldList';
import type { ToolCoreFieldRow, ToolOutputSchemaField } from '../useTools';
import { normalizeOutputFieldPath } from '../useTools';
import styles from '../index.module.scss';

const OUTPUT_TYPES: ToolOutputSchemaField['type'][] = [
  'string',
  'integer',
  'number',
  'boolean',
  'object',
  'array',
  'null',
];

function createEmptyOutputField(): ToolOutputSchemaField {
  return {
    id: `output_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    statusCode: '200',
    name: '',
    type: 'string',
    required: false,
    description: '',
  };
}

type Props = {
  disabled?: boolean;
  outputSchemaFields: ToolOutputSchemaField[];
  onOutputSchemaFieldsChange: (fields: ToolOutputSchemaField[]) => void;
};

function splitPath(path: string): string[] {
  return path
    .split('.')
    .map((token) => token.trim())
    .filter(Boolean);
}

function getParentPath(path: string): string | null {
  const normalized = normalizeOutputFieldPath(path);
  if (!normalized) return null;
  const tokens = splitPath(normalized);
  if (tokens.length <= 1) return null;
  return tokens.slice(0, -1).join('.');
}

function findChildren(rows: ToolOutputSchemaField[], path: string): ToolOutputSchemaField[] {
  return rows.filter((row) => getParentPath(row.name) === path);
}

const ToolResponseEditors: React.FC<Props> = ({
  disabled,
  outputSchemaFields,
  onOutputSchemaFieldsChange,
}) => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const coreRows = (Form.useWatch('responseCoreFields', form) as ToolCoreFieldRow[] | undefined) ?? [];
  const optionalRows =
    (Form.useWatch('responseOptionalFields', form) as ToolCoreFieldRow[] | undefined) ?? [];
  const corePaths = useMemo(
    () => coreRows.map((row) => row.path.trim()).filter(Boolean),
    [coreRows],
  );
  const optionalPaths = useMemo(
    () => optionalRows.map((row) => row.path.trim()).filter(Boolean),
    [optionalRows],
  );
  const outputRows = outputSchemaFields;
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(outputRows[0]?.id ?? null);

  const outputIndexById = useMemo(() => {
    const map = new Map<string, number>();
    outputRows.forEach((row, index) => {
      map.set(row.id, index);
    });
    return map;
  }, [outputRows]);

  const selectedOutputIndex =
    selectedOutputId && outputIndexById.has(selectedOutputId)
      ? (outputIndexById.get(selectedOutputId) as number)
      : -1;
  const selectedOutput = selectedOutputIndex >= 0 ? outputRows[selectedOutputIndex] : null;

  const { outputTreeData, treeKeyToRowId, rowIdToTreeKey } = useMemo(() => {
    const treeKeyToRowIdMap = new Map<string, string>();
    const rowIdToTreeKeyMap = new Map<string, string>();

    const buildNode = (
      row: ToolOutputSchemaField,
      statusCode: string,
      rowsByStatus: ToolOutputSchemaField[],
    ): DataNode => {
      const path = normalizeOutputFieldPath(row.name);
      const rowIndex = outputRows.findIndex((item) => item === row);
      const treeKey = `status:${statusCode}|path:${path}|index:${rowIndex}`;
      treeKeyToRowIdMap.set(treeKey, row.id);
      if (!rowIdToTreeKeyMap.has(row.id)) {
        rowIdToTreeKeyMap.set(row.id, treeKey);
      }
      const childrenRows = findChildren(rowsByStatus, path);
      const labelTokens = path.split('.').filter(Boolean);
      const label = labelTokens.length > 0 ? labelTokens[labelTokens.length - 1] : path;
      return {
        key: treeKey,
        title: `${label || '(empty)'} · ${row.type}`,
        children: childrenRows.map((child) => buildNode(child, statusCode, rowsByStatus)),
      };
    };

    const byStatus = new Map<string, ToolOutputSchemaField[]>();
    outputRows.forEach((row) => {
      const status = row.statusCode.trim() || '200';
      byStatus.set(status, [...(byStatus.get(status) ?? []), row]);
    });

    const treeData = Array.from(byStatus.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([statusCode, rows]) => {
        let roots = rows.filter((row) => getParentPath(row.name) === null);
        if (roots.length === 0 && rows.length > 0) {
          roots = rows;
        }
        return {
          key: `status_${statusCode}`,
          title: `HTTP ${statusCode}`,
          selectable: false,
          children: roots.map((row) => buildNode(row, statusCode, rows)),
        } as DataNode;
      })
      .filter((group) => (group.children?.length ?? 0) > 0);
    return {
      outputTreeData: treeData,
      treeKeyToRowId: treeKeyToRowIdMap,
      rowIdToTreeKey: rowIdToTreeKeyMap,
    };
  }, [outputRows]);

  useEffect(() => {
    if (outputRows.length === 0) {
      if (selectedOutputId !== null) {
        setSelectedOutputId(null);
      }
      return;
    }
    if (!selectedOutputId || !outputRows.some((row) => row.id === selectedOutputId)) {
      setSelectedOutputId(outputRows[0]?.id ?? null);
    }
  }, [outputRows, selectedOutputId]);

  const setOutputRows = (nextRows: ToolOutputSchemaField[]) => {
    onOutputSchemaFieldsChange(nextRows);
  };

  const addOutputRoot = () => {
    const row = createEmptyOutputField();
    row.name = `field_${outputRows.length + 1}`;
    setOutputRows([...outputRows, row]);
    setSelectedOutputId(row.id);
  };

  const addOutputChild = () => {
    if (!selectedOutput) return;
    const row = createEmptyOutputField();
    row.statusCode = selectedOutput.statusCode;
    row.name = `${selectedOutput.name}.child`;
    setOutputRows([...outputRows, row]);
    setSelectedOutputId(row.id);
  };

  const removeOutputNode = () => {
    if (!selectedOutput) return;
    const path = normalizeOutputFieldPath(selectedOutput.name);
    const next = outputRows.filter((row) => {
      const candidate = normalizeOutputFieldPath(row.name);
      return !(candidate === path || candidate.startsWith(`${path}.`));
    });
    setOutputRows(next);
    setSelectedOutputId(next[0]?.id ?? null);
  };

  const updateSelectedField = (patch: Partial<ToolOutputSchemaField>) => {
    if (selectedOutputIndex < 0) return;
    const next = outputRows.map((row, index) =>
      index === selectedOutputIndex ? { ...row, ...patch } : row,
    );
    setOutputRows(next);
  };

  return (
    <div className={styles.toolResponseEditors}>
      <div className={styles.toolDetailSchemaField}>
        <span className={styles.toolDetailLabel}>
          {intl.formatMessage({ id: 'tool.detail.outputSchema' })}
        </span>
        <div className={styles.toolResponseTreeEditor}>
          <div className={styles.toolResponseTreePanel}>
            <p className={styles.toolResponseTreeHint}>
              {intl.formatMessage(
                { id: 'tool.response.output.treeHint' },
                { count: outputRows.length, groups: outputTreeData.length },
              )}
            </p>
            {outputTreeData.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={intl.formatMessage({ id: 'tool.response.output.empty' })}
              />
            ) : (
              <Tree
                treeData={outputTreeData}
                selectedKeys={
                  selectedOutputId && rowIdToTreeKey.has(selectedOutputId)
                    ? [rowIdToTreeKey.get(selectedOutputId) as string]
                    : []
                }
                onSelect={(keys) => {
                  if (!keys[0]) return;
                  const key = keys[0] as string;
                  const rowId = treeKeyToRowId.get(key) ?? null;
                  if (rowId) setSelectedOutputId(rowId);
                }}
              />
            )}
            <div className={styles.toolResponseTreeActions}>
              <Button
                type="dashed"
                disabled={disabled}
                icon={<PlusOutlined />}
                onClick={addOutputRoot}
              >
                {intl.formatMessage({ id: 'tool.response.output.add' })}
              </Button>
              <Button
                type="dashed"
                disabled={disabled || !selectedOutput}
                icon={<PlusOutlined />}
                onClick={addOutputChild}
              >
                {intl.formatMessage({ id: 'tool.response.output.addChild' })}
              </Button>
              <Button
                danger
                disabled={disabled || !selectedOutput}
                icon={<DeleteOutlined />}
                onClick={removeOutputNode}
              >
                {intl.formatMessage({ id: 'tool.response.output.removeNode' })}
              </Button>
            </div>
          </div>

          <div key={selectedOutputId ?? 'none'} className={styles.toolResponseFormPanel}>
            {!selectedOutput || selectedOutputIndex < 0 ? (
              <p className={styles.toolDetailFieldHint}>
                {intl.formatMessage({ id: 'tool.response.output.selectNode' })}
              </p>
            ) : (
              <>
                <div className={styles.toolResponseField}>
                  <span className={styles.toolDetailLabel}>
                    {intl.formatMessage({ id: 'tool.response.field.statusCode' })}
                  </span>
                  <Input
                    className={`app-input ${styles.toolResponsePathInput}`}
                    disabled={disabled}
                    value={selectedOutput.statusCode}
                    placeholder={intl.formatMessage({
                      id: 'tool.response.field.statusCodePlaceholder',
                    })}
                    onChange={(event) => updateSelectedField({ statusCode: event.target.value })}
                  />
                </div>
                <div className={styles.toolResponseField}>
                  <span className={styles.toolDetailLabel}>
                    {intl.formatMessage({ id: 'tool.response.field.name' })}
                  </span>
                  <Input
                    className={`app-input ${styles.toolResponsePathInput}`}
                    disabled={disabled}
                    value={selectedOutput.name}
                    placeholder={intl.formatMessage({ id: 'tool.response.field.namePlaceholder' })}
                    onChange={(event) => updateSelectedField({ name: event.target.value })}
                  />
                </div>
                <div className={styles.toolResponseField}>
                  <span className={styles.toolDetailLabel}>
                    {intl.formatMessage({ id: 'tool.response.field.type' })}
                  </span>
                  <Select
                    disabled={disabled}
                    value={selectedOutput.type}
                    options={OUTPUT_TYPES.map((type) => ({
                      value: type,
                      label: intl.formatMessage({ id: `tool.params.type.${type}` }),
                    }))}
                    onChange={(type) => updateSelectedField({ type })}
                  />
                </div>
                <div className={styles.toolResponseField}>
                  <span className={styles.toolDetailLabel}>
                    {intl.formatMessage({ id: 'tool.response.field.required' })}
                  </span>
                  <Switch
                    disabled={disabled}
                    checked={selectedOutput.required}
                    onChange={(required) => updateSelectedField({ required })}
                  />
                </div>
                <div className={styles.toolResponseField}>
                  <span className={styles.toolDetailLabel}>
                    {intl.formatMessage({ id: 'tool.response.field.description' })}
                  </span>
                  <Input.TextArea
                    rows={4}
                    className={`app-input ${styles.toolResponseDescInput}`}
                    disabled={disabled}
                    value={selectedOutput.description}
                    placeholder={intl.formatMessage({
                      id: 'tool.response.field.descriptionPlaceholder',
                    })}
                    onChange={(event) => updateSelectedField({ description: event.target.value })}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.toolDetailSchemaField}>
        <span className={styles.toolDetailLabel}>
          {intl.formatMessage({ id: 'tool.detail.responseProfile' })}
        </span>
        <p className={styles.toolDetailFieldHint}>
          {intl.formatMessage({ id: 'tool.detail.responseProfileDesc' })}
        </p>
        <div className={styles.toolResponseProfileGroups}>
          <ResponseProfileFieldList
            listName="responseCoreFields"
            title={intl.formatMessage({ id: 'tool.response.coreField.section' })}
            description={intl.formatMessage({ id: 'tool.response.coreField.sectionDesc' })}
            emptyText={intl.formatMessage({ id: 'tool.response.coreField.empty' })}
            pickerPlaceholder={intl.formatMessage({ id: 'tool.response.coreField.pickerPlaceholder' })}
            noCandidatesText={intl.formatMessage({ id: 'tool.response.profileField.noCandidates' })}
            disabled={disabled}
            outputSchemaFields={outputSchemaFields}
            siblingPaths={optionalPaths}
          />
          <ResponseProfileFieldList
            listName="responseOptionalFields"
            title={intl.formatMessage({ id: 'tool.response.optionalField.section' })}
            description={intl.formatMessage({ id: 'tool.response.optionalField.sectionDesc' })}
            emptyText={intl.formatMessage({ id: 'tool.response.optionalField.empty' })}
            pickerPlaceholder={intl.formatMessage({
              id: 'tool.response.optionalField.pickerPlaceholder',
            })}
            noCandidatesText={intl.formatMessage({ id: 'tool.response.profileField.noCandidates' })}
            showKeywords
            disabled={disabled}
            outputSchemaFields={outputSchemaFields}
            siblingPaths={corePaths}
          />
        </div>
      </div>
    </div>
  );
};

export default ToolResponseEditors;
