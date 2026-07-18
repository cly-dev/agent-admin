import { useProjectRoute } from '@/hooks/useProjectRoute';
import {
  FlowController_listMigrationCandidates,
  FlowController_migrateFromWorkflow,
  FlowController_previewMigrateFromWorkflow,
} from '@/services/flow';
import type {
  FlowMigratePreview,
  FlowMigrationCandidate,
} from '@/types/flow';
import { history, useIntl } from '@umijs/max';
import { Form, Input, Switch, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { formatFlowSaveError } from '../flowApiError';
import { FLOW_LIST_PATH } from '../useFlowList';

export function useFlowMigrate() {
  const intl = useIntl();
  const { projectId } = useProjectRoute();
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<FlowMigrationCandidate[]>([]);
  const [selected, setSelected] = useState<FlowMigrationCandidate | null>(null);
  const [preview, setPreview] = useState<FlowMigratePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [form] = Form.useForm<{
    flowKey: string;
    rebindBindings: boolean;
    deactivateSource: boolean;
    changeNote?: string;
  }>();

  const loadCandidates = useCallback(async () => {
    if (!projectId) {
      setCandidates([]);
      return;
    }
    setLoading(true);
    try {
      const list =
        await FlowController_listMigrationCandidates(projectId);
      setCandidates(list);
    } catch (error: unknown) {
      message.error(
        formatFlowSaveError(intl, error, 'flow.migrate.loadFailed'),
      );
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [intl, projectId]);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  const openPreview = async (row: FlowMigrationCandidate) => {
    setSelected(row);
    setPreview(null);
    form.setFieldsValue({
      flowKey: row.workflowKey,
      rebindBindings: true,
      deactivateSource: true,
      changeNote: '',
    });
    setPreviewLoading(true);
    try {
      const result = await FlowController_previewMigrateFromWorkflow(
        row.workflowId,
        row.workflowKey,
      );
      setPreview(result);
      form.setFieldsValue({
        flowKey: result.suggestedFlowKey || row.workflowKey,
      });
    } catch (error: unknown) {
      message.error(
        formatFlowSaveError(intl, error, 'flow.migrate.previewFailed'),
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const refreshPreview = async () => {
    if (!selected) {
      return;
    }
    const flowKey = form.getFieldValue('flowKey')?.trim();
    setPreviewLoading(true);
    try {
      const result = await FlowController_previewMigrateFromWorkflow(
        selected.workflowId,
        flowKey || undefined,
      );
      setPreview(result);
    } catch (error: unknown) {
      message.error(
        formatFlowSaveError(intl, error, 'flow.migrate.previewFailed'),
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmMigrate = async () => {
    if (!selected || !preview?.canMigrate) {
      return;
    }
    const values = await form.validateFields();
    setMigrating(true);
    try {
      const result = await FlowController_migrateFromWorkflow(
        selected.workflowId,
        {
          flowKey: values.flowKey?.trim() || undefined,
          rebindBindings: values.rebindBindings !== false,
          deactivateSource: values.deactivateSource !== false,
          changeNote: values.changeNote?.trim() || undefined,
        },
      );
      message.success(
        intl.formatMessage(
          { id: 'flow.migrate.success' },
          {
            skills: result.rebind.skillsUpdated,
            pages: result.rebind.pageActionsUpdated,
          },
        ),
      );
      history.push(`/flow/assets/detail/${result.flow.id}`);
    } catch (error: unknown) {
      message.error(
        formatFlowSaveError(intl, error, 'flow.migrate.failed'),
      );
    } finally {
      setMigrating(false);
    }
  };

  const closePreview = () => {
    setSelected(null);
    setPreview(null);
  };

  const goToList = () => {
    history.push(FLOW_LIST_PATH);
  };

  return {
    projectId,
    loading,
    candidates,
    selected,
    preview,
    previewLoading,
    migrating,
    form,
    loadCandidates,
    openPreview,
    refreshPreview,
    confirmMigrate,
    closePreview,
    goToList,
  };
}
