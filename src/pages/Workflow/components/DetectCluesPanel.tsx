import type { WorkflowEdge, WorkflowNodeDef } from '@/types/workflow';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Form, Input, Popconfirm } from 'antd';
import { useMemo, useState } from 'react';
import {
  createDetectBranch,
  ensureDetectDefaultBranch,
  findDetectDefaultEdge,
  isBranchTipNode,
  listDetectClueEdges,
  removeDetectClueEdge,
  updateDetectClueEdge,
} from '../workflowGraph';
import {
  detectCluesMessageIds,
  type DetectCluesCopyScope,
} from './detectCluesCopy';

type DetectCluesPanelProps = {
  detectId: string;
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdge[];
  disabled?: boolean;
  /** workflow=状态识别文案；flow=判定分流（不出现「状态」） */
  copyScope?: DetectCluesCopyScope;
  onChange: (next: { nodes: WorkflowNodeDef[]; edges: WorkflowEdge[] }) => void;
};

type ClueFormValues = {
  key: string;
  description: string;
};

type EditorMode = { type: 'create' } | { type: 'edit'; edgeId: string } | null;

function firstChildOf(
  nodeId: string,
  edges: WorkflowEdge[],
  nodes: WorkflowNodeDef[],
): WorkflowNodeDef | undefined {
  const out = edges.find((edge) => edge.from === nodeId);
  if (!out) {
    return undefined;
  }
  return nodes.find((node) => node.id === out.to);
}

const DetectCluesPanel: React.FC<DetectCluesPanelProps> = ({
  detectId,
  nodes,
  edges,
  disabled = false,
  copyScope = 'workflow',
  onChange,
}) => {
  const intl = useIntl();
  const ids = useMemo(() => detectCluesMessageIds(copyScope), [copyScope]);
  const [editor, setEditor] = useState<EditorMode>(null);
  const [form] = Form.useForm<ClueFormValues>();

  const clues = useMemo(
    () => listDetectClueEdges(edges, detectId),
    [detectId, edges],
  );
  const defaultEdge = useMemo(
    () => findDetectDefaultEdge(edges, detectId),
    [detectId, edges],
  );
  const defaultTip = useMemo(
    () =>
      defaultEdge?.to
        ? nodes.find((node) => node.id === defaultEdge.to)
        : undefined,
    [defaultEdge?.to, nodes],
  );
  const defaultChild = useMemo(
    () =>
      defaultTip ? firstChildOf(defaultTip.id, edges, nodes) : undefined,
    [defaultTip, edges, nodes],
  );

  const editingEdgeId = editor?.type === 'edit' ? editor.edgeId : null;

  const openCreate = () => {
    form.setFieldsValue({ key: '', description: '' });
    setEditor({ type: 'create' });
  };

  const openEdit = (edgeId: string) => {
    const clue = clues.find((item) => item.edgeId === edgeId);
    if (!clue) {
      return;
    }
    form.setFieldsValue({
      key: clue.key,
      description: clue.description,
    });
    setEditor({ type: 'edit', edgeId });
  };

  const closeEditor = () => {
    setEditor(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingEdgeId) {
      const prev = edges.find((edge) => edge.id === editingEdgeId);
      let next = updateDetectClueEdge(nodes, edges, editingEdgeId, {
        key: values.key,
        description: values.description,
      });
      if (prev?.to) {
        next = {
          ...next,
          nodes: next.nodes.map((node) =>
            node.id === prev.to && isBranchTipNode(node)
              ? {
                  ...node,
                  name: values.key.trim() || node.name,
                  objective: values.description.trim() || node.objective,
                }
              : node,
          ),
        };
      }
      onChange(next);
    } else {
      onChange(
        createDetectBranch(nodes, edges, detectId, {
          key: values.key,
          description: values.description,
        }),
      );
    }
    closeEditor();
  };

  const handleDelete = (edgeId: string) => {
    onChange(
      removeDetectClueEdge(nodes, edges, detectId, edgeId, {
        cascadeLeaf: true,
      }),
    );
    if (editingEdgeId === edgeId) {
      closeEditor();
    }
  };

  const handleEnsureDefaultBranch = () => {
    onChange(ensureDetectDefaultBranch(nodes, edges, detectId));
  };

  const defaultStatusLabel = defaultChild
    ? intl.formatMessage({ id: ids.wiredTo }, { name: defaultChild.name || defaultChild.id })
    : defaultTip && isBranchTipNode(defaultTip)
      ? intl.formatMessage({ id: ids.tipPending })
      : defaultTip
        ? `${defaultTip.name || defaultTip.id}`
        : intl.formatMessage({ id: ids.targetMissing });

  return (
    <div className="mt-5 space-y-5 border-t border-black/6 pt-5">
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-on-surface/90">
              {intl.formatMessage({ id: ids.listTitle })}
            </div>
            <p className="mt-0.5 mb-0 text-[11px] leading-relaxed text-on-surface/45">
              {intl.formatMessage({ id: ids.sectionLead })}
            </p>
          </div>
          {!editor ? (
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/5 disabled:opacity-40"
              disabled={disabled}
              onClick={openCreate}
            >
              <PlusOutlined className="text-[10px]" />
              {intl.formatMessage({ id: ids.add })}
            </button>
          ) : null}
        </div>

        {/* 抽屉内联编辑，避免 Modal/Drawer 叠层打架 */}
        {editor ? (
          <div className="rounded-lg border border-primary/20 bg-primary/3 px-3 py-3">
            <div className="mb-2 text-xs font-semibold text-on-surface/75">
              {intl.formatMessage({
                id: editor.type === 'edit' ? ids.editTitle : ids.addTitle,
              })}
            </div>
            <Form form={form} layout="vertical" requiredMark={false} className="mb-0">
              <Form.Item
                name="key"
                className="mb-3"
                label={intl.formatMessage({ id: ids.key })}
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: ids.keyRequired,
                    }),
                  },
                  {
                    validator: async (_, value: string | undefined) => {
                      const key = value?.trim();
                      if (!key) {
                        return;
                      }
                      const duplicate = clues.some(
                        (clue) =>
                          clue.key.trim() === key &&
                          clue.edgeId !== editingEdgeId,
                      );
                      if (duplicate) {
                        throw new Error(
                          intl.formatMessage({
                            id: ids.duplicateKey,
                          }),
                        );
                      }
                    },
                  },
                ]}
                extra={intl.formatMessage({
                  id: ids.keyExtra,
                })}
              >
                <Input className="app-input" placeholder="spam" disabled={disabled} />
              </Form.Item>
              <Form.Item
                name="description"
                className="mb-3"
                label={intl.formatMessage({
                  id: ids.description,
                })}
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: ids.descriptionRequired,
                    }),
                  },
                ]}
              >
                <Input.TextArea
                  className="app-input"
                  rows={2}
                  disabled={disabled}
                  placeholder={intl.formatMessage({
                    id: ids.descriptionPlaceholder,
                  })}
                />
              </Form.Item>
            </Form>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-on-surface/55 hover:bg-black/4"
                onClick={closeEditor}
              >
                <CloseOutlined className="text-[10px]" />
                {intl.formatMessage({ id: 'common.cancel' })}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40"
                disabled={disabled}
                onClick={() => void handleSubmit()}
              >
                <CheckOutlined className="text-[10px]" />
                {intl.formatMessage({ id: 'common.save' })}
              </button>
            </div>
          </div>
        ) : null}

        {!editor && clues.length === 0 ? (
          <button
            type="button"
            disabled={disabled}
            onClick={openCreate}
            className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-black/12 bg-black/2 px-4 py-6 text-center transition-colors hover:border-primary/35 hover:bg-primary/3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-[13px] font-semibold text-on-surface/70">
              {intl.formatMessage({ id: ids.empty })}
            </span>
            <span className="max-w-[280px] text-[11px] leading-relaxed text-on-surface/40">
              {intl.formatMessage({ id: ids.canvasPlusHint })}
            </span>
          </button>
        ) : null}

        {clues.length > 0 ? (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {clues.map((clue, index) => {
              const tip = nodes.find((node) => node.id === clue.to);
              const tipOnly = isBranchTipNode(tip);
              const child = tip
                ? firstChildOf(tip.id, edges, nodes)
                : undefined;
              const keyMissing = !clue.key.trim();
              const isEditingThis =
                editor?.type === 'edit' && editor.edgeId === clue.edgeId;
              const statusLabel = child
                ? intl.formatMessage(
                    { id: ids.wiredTo },
                    { name: child.name || child.id },
                  )
                : tipOnly
                  ? intl.formatMessage({
                      id: ids.tipPending,
                    })
                  : tip
                    ? `${tip.name || tip.id}`
                    : intl.formatMessage({
                        id: ids.targetMissing,
                      });

              return (
                <li
                  key={clue.edgeId}
                  className={`rounded-lg border px-3 py-2.5 transition-colors ${
                    isEditingThis
                      ? 'border-primary/30 bg-primary/4'
                      : 'border-black/6 bg-white hover:border-black/10'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-black/4 text-[10px] font-semibold tabular-nums text-on-surface/40">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-mono text-[13px] font-semibold tracking-tight text-on-surface/90">
                          {clue.key ||
                            intl.formatMessage({
                              id: ids.keyUnset,
                            })}
                        </span>
                        {keyMissing ? (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            {intl.formatMessage({
                              id: ids.needsKey,
                            })}
                          </span>
                        ) : null}
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            child
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <p className="mt-1 mb-0 line-clamp-2 text-[12px] leading-snug text-on-surface/55">
                        {clue.description ||
                          intl.formatMessage({
                            id: ids.descUnset,
                          })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        className="rounded p-1.5 text-on-surface/35 transition-colors hover:bg-black/4 hover:text-on-surface/70 disabled:opacity-40"
                        disabled={disabled || Boolean(editor)}
                        title={intl.formatMessage({ id: 'common.edit' })}
                        onClick={() => openEdit(clue.edgeId)}
                      >
                        <EditOutlined className="text-xs" />
                      </button>
                      <Popconfirm
                        title={intl.formatMessage({
                          id: ids.deleteConfirm,
                        })}
                        okText={intl.formatMessage({ id: 'common.delete' })}
                        cancelText={intl.formatMessage({ id: 'common.cancel' })}
                        okButtonProps={{ danger: true }}
                        disabled={disabled}
                        onConfirm={() => handleDelete(clue.edgeId)}
                      >
                        <button
                          type="button"
                          className="rounded p-1.5 text-on-surface/35 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          disabled={disabled}
                          title={intl.formatMessage({
                            id: ids.delete,
                          })}
                        >
                          <DeleteOutlined className="text-xs" />
                        </button>
                      </Popconfirm>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      <section className="space-y-2 rounded-lg border border-black/6 bg-black/2 px-3 py-3">
        <Form.Item
          name="hint"
          className="mb-0"
          label={
            <span className="text-xs font-medium text-on-surface/70">
              {intl.formatMessage({ id: ids.policyHint })}
            </span>
          }
          extra={
            <span className="text-[11px] text-on-surface/40">
              {intl.formatMessage({ id: ids.policyHintExtra })}
            </span>
          }
        >
          <Input.TextArea
            className="app-input"
            rows={2}
            disabled={disabled}
            placeholder={intl.formatMessage({
              id: ids.policyHintPlaceholder,
            })}
          />
        </Form.Item>
      </section>

      <section className="space-y-2">
        <div>
          <div className="text-xs font-semibold text-on-surface/75">
            {intl.formatMessage({ id: ids.mergeTitle })}
            {clues.length > 0 ? (
              <span className="ml-1 font-normal text-red-500/80">*</span>
            ) : null}
          </div>
          <p className="mt-0.5 mb-0 text-[11px] leading-relaxed text-on-surface/40">
            {intl.formatMessage({ id: ids.mergeHint })}
          </p>
        </div>

        {clues.length === 0 ? (
          <div className="rounded-lg border border-dashed border-black/10 bg-black/2 px-3 py-3 text-[12px] text-on-surface/40">
            {intl.formatMessage({
              id: ids.mergeNeedBranches,
            })}
          </div>
        ) : defaultTip ? (
          <div className="rounded-lg border border-black/6 bg-white px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[13px] font-semibold text-on-surface/90">
                {defaultTip.name ||
                  intl.formatMessage({
                    id: ids.mergeTitle,
                  })}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  defaultChild
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {defaultStatusLabel}
              </span>
            </div>
            <p className="mt-1 mb-0 text-[12px] leading-snug text-on-surface/55">
              {intl.formatMessage({
                id: ids.mergeBranchHint,
              })}
            </p>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={handleEnsureDefaultBranch}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-black/12 px-3 py-2 text-xs font-semibold text-primary hover:border-primary/35 hover:bg-primary/3 disabled:opacity-40"
          >
            <PlusOutlined className="text-[10px]" />
            {intl.formatMessage({
              id: ids.mergeCreateBranch,
            })}
          </button>
        )}
      </section>
    </div>
  );
};

export default DetectCluesPanel;
