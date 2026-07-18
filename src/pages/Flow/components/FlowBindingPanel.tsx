import {
  FlowController_findByAppClient,
  FlowController_findOne,
  FlowController_listRevisions,
} from '@/services/flow';
import type {
  FlowBindingValue,
  FlowListItem,
  FlowRevisionSummary,
} from '@/types/flow';
import { compatibleProfilesForEntry } from '@/pages/Workflow/workflowShared';
import { filterFlowListForBinding, buildFlowCreatePath } from '../flowBindEntry';
import { LinkOutlined, PlusOutlined } from '@ant-design/icons';
import { Link, useIntl } from '@umijs/max';
import { Alert, Select, Spin } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FLOW_MIGRATE_PATH } from '../useFlowList';

type FlowBindingPanelProps = {
  projectId?: number;
  entry: 'skill' | 'page_action';
  value: FlowBindingValue;
  disabled?: boolean;
  /** Legacy workflowId still present without flowId */
  legacyWorkflowId?: number | null;
  onChange: (value: FlowBindingValue) => void;
};

function formatRevisionLabel(version: number, changeNote?: string | null) {
  const note = changeNote?.trim();
  return note ? `v${version} · ${note}` : `v${version}`;
}

const FlowBindingPanel: React.FC<FlowBindingPanelProps> = ({
  projectId,
  entry,
  value,
  disabled = false,
  legacyWorkflowId = null,
  onChange,
}) => {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [options, setOptions] = useState<FlowListItem[]>([]);
  const [revisionOptions, setRevisionOptions] = useState<
    FlowRevisionSummary[]
  >([]);
  const [meta, setMeta] = useState<{
    version: number;
    skillRefCount: number;
    pageActionRefCount: number;
  } | null>(null);

  const profileFilter = useMemo(
    () => compatibleProfilesForEntry(entry),
    [entry],
  );

  const loadOptions = useCallback(async () => {
    if (!projectId) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const result = await FlowController_findByAppClient(projectId, {
        page: 1,
        pageSize: 100,
        isActive: true,
      });
      setOptions(
        filterFlowListForBinding(
          result.list.filter((item) =>
            profileFilter.includes(
              item.profile as (typeof profileFilter)[number],
            ),
          ),
          entry,
        ),
      );
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [entry, profileFilter, projectId]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    if (!value.flowId) {
      setRevisionOptions([]);
      setMeta(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    void (async () => {
      try {
        const [detail, revisions] = await Promise.all([
          FlowController_findOne(value.flowId!),
          FlowController_listRevisions(value.flowId!, {
            summary: true,
            limit: 100,
          }),
        ]);
        if (cancelled) {
          return;
        }
        setRevisionOptions(revisions);
        setMeta({
          version: detail.version,
          skillRefCount: detail.skillRefCount,
          pageActionRefCount: detail.pageActionRefCount,
        });
      } catch {
        if (!cancelled) {
          setRevisionOptions([]);
          setMeta(null);
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value.flowId]);

  const selected = options.find((item) => item.id === value.flowId);
  const needsMigrate = Boolean(legacyWorkflowId) && !value.flowId;

  return (
    <div className="space-y-3">
      {needsMigrate ? (
        <Alert
          type="warning"
          showIcon
          message={intl.formatMessage({ id: 'flow.binding.legacyWarning' })}
          action={
            <Link
              to={FLOW_MIGRATE_PATH}
              className="text-sm font-semibold text-primary"
            >
              {intl.formatMessage({ id: 'flow.binding.goMigrate' })}
            </Link>
          }
        />
      ) : null}

      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-on-surface/70">
            {intl.formatMessage({ id: 'flow.binding.flow' })}
          </span>
          {projectId ? (
            <Link
              to={buildFlowCreatePath(entry)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
            >
              <PlusOutlined />
              {intl.formatMessage({ id: 'flow.binding.create' })}
            </Link>
          ) : null}
        </div>
        <Select
          className="app-input w-full"
          showSearch
          allowClear
          disabled={disabled || !projectId}
          loading={loading}
          placeholder={intl.formatMessage({
            id: 'flow.binding.flowPlaceholder',
          })}
          optionFilterProp="label"
          value={value.flowId ?? undefined}
          options={options.map((item) => ({
            value: item.id,
            label: `${item.name} (${item.flowKey})`,
          }))}
          onChange={(flowId) =>
            onChange({
              flowId: typeof flowId === 'number' ? flowId : null,
              flowVersion: null,
            })
          }
        />
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-on-surface/70">
          {intl.formatMessage({ id: 'flow.binding.version' })}
        </div>
        <Select
          className="app-input w-full"
          allowClear
          disabled={disabled || !value.flowId}
          loading={detailLoading}
          placeholder={intl.formatMessage({
            id: 'flow.binding.versionPlaceholder',
          })}
          value={value.flowVersion ?? undefined}
          options={revisionOptions.map((item) => ({
            value: item.version,
            label: formatRevisionLabel(item.version, item.changeNote),
          }))}
          onChange={(flowVersion) =>
            onChange({
              ...value,
              flowVersion:
                typeof flowVersion === 'number' ? flowVersion : null,
            })
          }
        />
        <p className="mt-1 mb-0 text-[11px] text-on-surface/40">
          {intl.formatMessage({ id: 'flow.binding.versionHint' })}
        </p>
      </div>

      {value.flowId && (selected || meta) ? (
        <div className="rounded-lg border border-black/6 bg-black/[0.02] px-3 py-2 text-xs text-on-surface/60">
          {detailLoading ? (
            <Spin size="small" />
          ) : (
            <>
              <div>
                {intl.formatMessage(
                  { id: 'flow.binding.selectedMeta' },
                  {
                    profile: selected?.profile ?? '—',
                    version: meta?.version ?? selected?.version ?? '—',
                    nodes: selected?.irNodeCount ?? '—',
                  },
                )}
              </div>
              <Link
                to={`/flow/assets/detail/${value.flowId}`}
                className="mt-1 inline-flex items-center gap-1 font-semibold text-primary"
              >
                <LinkOutlined />
                {intl.formatMessage({ id: 'flow.binding.openDetail' })}
              </Link>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default FlowBindingPanel;
