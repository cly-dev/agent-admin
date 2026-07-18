import { useProjectRoute } from '@/hooks/useProjectRoute';
import {
  buildFlowPresetConfigPayload,
  catalogEntryForPreset,
  emptyPresetConfig,
  FLOW_PRODUCT_PRESET_KINDS,
  validatePresetForm,
  type WorkflowConfigMode,
  type WorkflowPresetFormState,
} from '@/pages/Workflow/workflowPreset';
import {
  FlowController_allocateStateKeys,
  FlowController_create,
  FlowController_findOne,
  FlowController_getRevision,
  FlowController_listPresetsCatalog,
  FlowController_listRevisions,
  FlowController_update,
} from '@/services/flow';
import {
  HOST_TOOL_MAX_PAGE_SIZE,
  HostToolController_findByAppClient,
} from '@/services/host-tool';
import { ToolController_findByAppClient } from '@/services/tool';
import type {
  CreateFlowDto,
  Flow,
  FlowDeliverable,
  FlowPresetCatalogEntry,
  FlowProfile,
  FlowRevision,
  FlowRevisionSummary,
  UpdateFlowDto,
} from '@/types/flow';
import type { FlowIntent } from '@/types/flow-intent';
import type { HostTool } from '@/types/host-tool';
import type { Tool } from '@/types/tool';
import {
  history,
  useIntl,
  useLocation,
  useParams,
  useSearchParams,
} from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { formatFlowSaveError } from './flowApiError';
import {
  filterFlowProductCatalog,
  flowAllowsMutate,
  parseFlowBindEntry,
} from './flowBindEntry';
import {
  allocateIntentStateKeys,
  emptyIntent,
  parseIntent,
  serializeIntent,
  validateIntentDraft,
} from './flowIntentEditor';
import { FLOW_LIST_PATH } from './useFlowList';

export type FlowFormValues = {
  flowKey: string;
  name: string;
  description?: string;
  goal?: string;
  profile: FlowProfile;
  deliverable: FlowDeliverable;
  isActive: boolean;
  sortOrder: number;
  changeNote?: string;
};

export type FlowConfigMode = 'preset' | 'intent';
/** Edit surface: view Intent SSOT, or rebuild via Preset / edit Intent */
export type FlowEditSurface = 'view' | 'preset' | 'intent';

function trimFormString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function formatRevisionLabel(version: number, changeNote?: string | null) {
  const note = changeNote?.trim();
  return note ? `v${version} · ${note}` : `v${version}`;
}

export function useFlowDetail() {
  const intl = useIntl();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projectId, currentProject } = useProjectRoute();
  const params = useParams<{ id?: string }>();

  const isCreateMode = location.pathname.endsWith('/flow/assets/detail/create');
  const flowId = Number(params.id);
  const isEditMode = !isCreateMode && Number.isFinite(flowId) && flowId > 0;

  const [form] = Form.useForm<FlowFormValues>();
  const profile = Form.useWatch('profile', form) as FlowProfile | undefined;

  const [flow, setFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editSurface, setEditSurface] = useState<FlowEditSurface>('view');
  const [configMode, setConfigMode] = useState<FlowConfigMode>('preset');
  const [presetForm, setPresetForm] = useState<WorkflowPresetFormState>({
    preset: null,
    config: emptyPresetConfig(),
  });
  const [presetCatalog, setPresetCatalog] = useState<FlowPresetCatalogEntry[]>(
    [],
  );
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [intentDraft, setIntentDraft] = useState<FlowIntent>(
    emptyIntent('shared'),
  );
  const [tools, setTools] = useState<Tool[]>([]);
  const [hostTools, setHostTools] = useState<HostTool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [revisionSummaries, setRevisionSummaries] = useState<
    FlowRevisionSummary[]
  >([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [revisionSnapshot, setRevisionSnapshot] = useState<FlowRevision | null>(
    null,
  );
  const [revisionLoading, setRevisionLoading] = useState(false);

  const showBindGuide = searchParams.get('bindGuide') === '1';
  const bindEntry = parseFlowBindEntry(searchParams.get('bindEntry'));
  const allowsMutate = flowAllowsMutate(bindEntry);

  const isViewingHistory =
    isEditMode &&
    selectedVersion !== null &&
    flow !== null &&
    selectedVersion !== flow.version;

  const displayIntent = isViewingHistory
    ? parseIntent(
        revisionSnapshot?.intent,
        (flow?.profile as FlowProfile) || 'shared',
      )
    : parseIntent(flow?.intent, (flow?.profile as FlowProfile) || 'shared');
  const displayIr = isViewingHistory ? revisionSnapshot?.ir : flow?.ir;

  const dismissBindGuide = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('bindGuide');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const loadRevisionSummaries = useCallback(async (id: number) => {
    const list = await FlowController_listRevisions(id, {
      summary: true,
      limit: 100,
    });
    setRevisionSummaries(list);
    return list;
  }, []);

  const resetToCurrentVersion = useCallback(() => {
    setSelectedVersion(null);
    setRevisionSnapshot(null);
  }, []);

  const handleVersionSelect = useCallback(
    async (version: number) => {
      if (!flow) {
        return;
      }
      if (version === flow.version) {
        resetToCurrentVersion();
        return;
      }
      setRevisionLoading(true);
      try {
        const snapshot = await FlowController_getRevision(flow.id, version);
        setRevisionSnapshot(snapshot);
        setSelectedVersion(version);
      } catch (error: unknown) {
        message.error(
          formatFlowSaveError(intl, error, 'flow.revision.loadFailed'),
        );
      } finally {
        setRevisionLoading(false);
      }
    },
    [flow, intl, resetToCurrentVersion],
  );

  const handleProfileChange = useCallback(
    (next: FlowProfile) => {
      const prev = form.getFieldValue('profile') as FlowProfile | undefined;
      form.setFieldValue('profile', next);
      if (prev && prev !== next && presetForm.preset) {
        const entry = catalogEntryForPreset(presetCatalog, presetForm.preset);
        if (entry && entry.profiles?.length && !entry.profiles.includes(next)) {
          setPresetForm({
            preset: null,
            config: emptyPresetConfig(),
          });
          message.info(
            intl.formatMessage({ id: 'flow.wizard.presetClearedOnProfile' }),
          );
        }
      }
      setIntentDraft((prev) => ({
        ...prev,
        profile: next,
      }));
    },
    [form, intl, presetCatalog, presetForm.preset],
  );

  const openPresetRebuild = useCallback(() => {
    setEditSurface('preset');
    setConfigMode('preset');
    const first =
      presetCatalog.find((item) => item.kind === 'page_auto_fill')?.kind ??
      FLOW_PRODUCT_PRESET_KINDS[0];
    setPresetForm({
      preset: first,
      config: emptyPresetConfig(),
    });
  }, [presetCatalog]);

  const openIntentEdit = useCallback(() => {
    setEditSurface('intent');
    setConfigMode('intent');
    if (flow?.intent) {
      setIntentDraft(
        parseIntent(flow.intent, (flow.profile as FlowProfile) || 'shared'),
      );
    }
  }, [flow?.intent, flow?.profile]);

  const cancelEditSurface = useCallback(() => {
    setEditSurface('view');
    setConfigMode('intent');
    if (flow?.intent) {
      setIntentDraft(
        parseIntent(flow.intent, (flow.profile as FlowProfile) || 'shared'),
      );
    }
    setPresetForm({
      preset: null,
      config: emptyPresetConfig(),
    });
  }, [flow?.intent, flow?.profile]);

  useEffect(() => {
    if (!projectId) {
      setTools([]);
      setHostTools([]);
      return;
    }
    let cancelled = false;
    setToolsLoading(true);
    void (async () => {
      try {
        const [toolPage, hostPage] = await Promise.all([
          ToolController_findByAppClient(projectId, {
            page: 1,
            pageSize: 100,
            isActive: true,
          }),
          HostToolController_findByAppClient(projectId, {
            page: 1,
            pageSize: HOST_TOOL_MAX_PAGE_SIZE,
            isActive: true,
          }),
        ]);
        if (!cancelled) {
          setTools(toolPage.list);
          setHostTools(hostPage.list);
        }
      } catch {
        if (!cancelled) {
          setTools([]);
          setHostTools([]);
        }
      } finally {
        if (!cancelled) {
          setToolsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    void (async () => {
      try {
        const catalog = filterFlowProductCatalog(
          await FlowController_listPresetsCatalog(),
          bindEntry,
        );
        if (cancelled) {
          return;
        }
        setPresetCatalog(catalog);
        setPresetForm((prev) => {
          if (
            prev.preset &&
            catalog.some((item) => item.kind === prev.preset)
          ) {
            return prev;
          }
          if (isCreateMode && configMode === 'preset') {
            const preferredKind =
              bindEntry === 'page_action'
                ? 'page_auto_fill'
                : bindEntry === 'skill'
                  ? 'fetch_and_answer'
                  : 'page_auto_fill';
            return {
              preset:
                catalog.find((item) => item.kind === preferredKind)?.kind ??
                catalog[0]?.kind ??
                null,
              config: emptyPresetConfig(),
            };
          }
          if (editSurface === 'preset') {
            return {
              preset:
                catalog.find((item) => item.kind === 'page_auto_fill')?.kind ??
                catalog[0]?.kind ??
                null,
              config: emptyPresetConfig(),
            };
          }
          return prev;
        });
      } catch {
        if (!cancelled) {
          setPresetCatalog([]);
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bindEntry, isCreateMode, configMode, editSurface]);

  useEffect(() => {
    if (isCreateMode) {
      setFlow(null);
      setEditSurface('view');
      form.setFieldsValue({
        flowKey: '',
        name: '',
        description: '',
        goal: '',
        profile: 'shared',
        isActive: true,
        sortOrder: 0,
        changeNote: '',
      });
      setConfigMode('preset');
      setPresetForm({
        preset: null,
        config: emptyPresetConfig(),
      });
      setIntentDraft(emptyIntent('shared'));
      setRevisionSummaries([]);
      resetToCurrentVersion();
      return;
    }
    if (!isEditMode) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const detail = await FlowController_findOne(flowId);
        if (cancelled) {
          return;
        }
        setFlow(detail);
        setEditSurface('view');
        form.setFieldsValue({
          flowKey: detail.flowKey,
          name: detail.name,
          description: detail.description ?? '',
          goal: detail.goal ?? '',
          profile: detail.profile as FlowProfile,
          deliverable: detail.deliverable as FlowDeliverable,
          isActive: detail.isActive,
          sortOrder: detail.sortOrder,
          changeNote: '',
        });
        setConfigMode('intent');
        setIntentDraft(
          parseIntent(detail.intent, detail.profile as FlowProfile),
        );
        setPresetForm({
          preset: null,
          config: emptyPresetConfig(),
        });
        await loadRevisionSummaries(detail.id);
        resetToCurrentVersion();
      } catch (error: unknown) {
        if (!cancelled) {
          message.error(formatFlowSaveError(intl, error, 'flow.loadFailed'));
          history.replace(FLOW_LIST_PATH);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    flowId,
    form,
    intl,
    isCreateMode,
    isEditMode,
    loadRevisionSummaries,
    resetToCurrentVersion,
  ]);

  const handleSave = async (options?: { metadataOnly?: boolean }) => {
    if (!projectId) {
      message.error(intl.formatMessage({ id: 'flow.empty.noProject.title' }));
      return;
    }
    const metadataOnly =
      options?.metadataOnly === true || (isEditMode && editSurface === 'view');

    try {
      const values = await form.validateFields();
      // In composer edit mode, name/flowKey inputs are disabled, so antd may omit them
      // from validateFields() results. Fallback to current flow snapshot.
      const nameFromForm = trimFormString(values.name);
      const flowKeyFromForm = trimFormString(values.flowKey);
      const name =
        nameFromForm || (flow?.name ? trimFormString(flow.name) : '');
      const flowKey =
        flowKeyFromForm || (flow?.flowKey ? trimFormString(flow.flowKey) : '');

      if (isCreateMode) {
        if (!name || !flowKey) {
          message.error(intl.formatMessage({ id: 'flow.form.nameRequired' }));
          return;
        }
      } else if (!name) {
        message.error(intl.formatMessage({ id: 'flow.form.nameRequired' }));
        return;
      }

      setSaving(true);
      const changeNote = trimFormString(values.changeNote) || undefined;
      const description = trimFormString(values.description) || null;
      const goal = trimFormString(values.goal) || null;

      const effectiveMode: FlowConfigMode = metadataOnly
        ? 'intent'
        : isCreateMode
          ? configMode
          : editSurface === 'preset'
            ? 'preset'
            : 'intent';

      if (!metadataOnly && effectiveMode === 'preset') {
        const presetIssues = validatePresetForm(
          presetForm.preset,
          presetForm.config,
          presetCatalog,
        );
        if (presetIssues.length > 0) {
          message.error(intl.formatMessage({ id: presetIssues[0].messageId }));
          setSaving(false);
          return;
        }
        if (!presetForm.preset) {
          message.error(intl.formatMessage({ id: 'flow.preset.required' }));
          setSaving(false);
          return;
        }
      }

      let intent: Record<string, unknown> | undefined;
      if (!metadataOnly && effectiveMode === 'intent') {
        const withKeys = await allocateIntentStateKeys(
          { ...intentDraft, profile: 'shared' },
          FlowController_allocateStateKeys,
        );
        setIntentDraft(withKeys);
        const issues = validateIntentDraft(withKeys, allowsMutate);
        if (issues.length > 0) {
          message.error(intl.formatMessage({ id: issues[0].messageId }));
          setSaving(false);
          return;
        }
        intent = serializeIntent(withKeys);
      }

      if (isCreateMode) {
        const createDto: CreateFlowDto = {
          appClientId: projectId,
          flowKey,
          name,
          description,
          goal,
          profile: 'shared',
          isActive: values.isActive,
          sortOrder: values.sortOrder ?? 0,
          changeNote,
          ...(effectiveMode === 'preset' && presetForm.preset
            ? {
                preset: presetForm.preset,
                presetConfig: buildFlowPresetConfigPayload(
                  presetForm.config,
                  presetForm.preset,
                ),
              }
            : { intent }),
        };
        const created = await FlowController_create(createDto);
        message.success(intl.formatMessage({ id: 'flow.created' }));
        history.replace(
          `/flow/assets/detail/${created.id}?bindGuide=1${
            bindEntry ? `&bindEntry=${bindEntry}` : ''
          }`,
        );
        return;
      }

      if (!flow) {
        return;
      }

      const updateDto: UpdateFlowDto = {
        name,
        description,
        goal,
        isActive: values.isActive,
        sortOrder: values.sortOrder ?? 0,
        changeNote,
      };

      if (!metadataOnly) {
        if (effectiveMode === 'preset' && presetForm.preset) {
          updateDto.preset = presetForm.preset;
          updateDto.presetConfig = buildFlowPresetConfigPayload(
            presetForm.config,
            presetForm.preset,
          );
        } else if (effectiveMode === 'intent' && intent) {
          updateDto.intent = intent;
        }
      }

      const updated = await FlowController_update(flow.id, updateDto);
      setFlow(updated);
      setIntentDraft(
        parseIntent(updated.intent, updated.profile as FlowProfile),
      );
      form.setFieldsValue({ changeNote: '' });
      await loadRevisionSummaries(updated.id);
      resetToCurrentVersion();
      setEditSurface('view');
      setConfigMode('intent');
      setPresetForm({
        preset: null,
        config: emptyPresetConfig(),
      });
      message.success(intl.formatMessage({ id: 'flow.updated' }));
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }
      message.error(formatFlowSaveError(intl, error, 'flow.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (isCreateMode) {
      await handleSave();
      return;
    }
    if (editSurface === 'view') {
      await handleSave({ metadataOnly: true });
      return;
    }
    await handleSave();
  };

  const handleBack = () => {
    history.push(FLOW_LIST_PATH);
  };

  const switchCreateToIntent = () => {
    setConfigMode('intent');
    setIntentDraft((prev) => ({
      ...prev,
      profile: (profile ?? prev.profile) as FlowProfile,
    }));
  };

  const switchCreateToPreset = () => {
    setConfigMode('preset');
  };

  const revisionOptions = revisionSummaries.map((item) => ({
    value: item.version,
    label: formatRevisionLabel(item.version, item.changeNote),
  }));

  const selectedPresetEntry = catalogEntryForPreset(
    presetCatalog,
    presetForm.preset,
  );

  return {
    projectId,
    currentProject,
    isCreateMode,
    isEditMode,
    flow,
    loading,
    saving,
    form,
    profile,
    editSurface,
    configMode,
    setConfigMode: (mode: FlowConfigMode | WorkflowConfigMode) => {
      setConfigMode(mode === 'nodes' ? 'intent' : (mode as FlowConfigMode));
    },
    presetForm,
    setPresetForm,
    presetCatalog,
    selectedPresetEntry,
    catalogLoading,
    intentDraft,
    setIntentDraft,
    tools,
    hostTools,
    toolsLoading,
    revisionSummaries,
    revisionOptions,
    selectedVersion,
    revisionLoading,
    isViewingHistory,
    displayIntent,
    displayIr,
    showBindGuide,
    bindEntry,
    allowsMutate,
    dismissBindGuide,
    handleProfileChange,
    openPresetRebuild,
    openIntentEdit,
    cancelEditSurface,
    handleVersionSelect,
    resetToCurrentVersion,
    handlePrimaryAction,
    handleSave,
    handleBack,
    switchCreateToIntent,
    switchCreateToPreset,
  };
}
