import {
  buildDebugToolRequest,
  buildInitSchemasFromDebugRequest,
  createEmptyApiTestParams,
  findInvalidApiTestBodyParam,
  type ApiTestParamsByIn,
  type ApiTestRunResult,
} from '@/components/ApiTestPanel';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import { IntegrationController_findByAppClient } from '@/services/integration';
import {
  ToolController_create,
  ToolController_debug,
  ToolController_findOne,
  ToolController_initSchemasFromDebug,
  ToolController_update,
} from '@/services/tool';
import type { Integration } from '@/types/integration';
import type {
  InitToolSchemasFromDebugResult,
  Tool,
  ToolArrayLimits,
  ToolHttpMethod,
  ToolResponseProfile,
  ToolRiskLevel,
} from '@/types/tool';
import { history, useIntl, useLocation, useParams } from '@umijs/max';
import { Form, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  isAgentMetadataFormComplete,
  normalizeAgentMetadata,
  syncParamFormatHintsWithParameters,
} from '../toolAgentMetadata';
import {
  DEFAULT_TOOL_METHOD,
  DEFAULT_TOOL_RISK,
  isToolCreateRoute,
} from '../toolConstants';
import {
  buildTestParamsFromToolParameters,
  getParameterValidationMessage,
  mergeTestParamsWithToolParameters,
  parametersFromToolSchemas,
  validateToolParameters,
} from '../toolSchema';
import type { ToolFormValues, ToolOutputSchemaField } from '../useTools';
import {
  buildCreateToolPayload,
  buildOutputSchemaFromFields,
  buildUpdateToolPayload,
  extractOutputSchemaFromAny,
  normalizeOutputSchemaFields,
  outputSchemaToFields,
  profileFieldsToRows,
  rowsToListMetaFields,
  rowsToProfileFields,
} from '../useTools';

function resolveArrayLimitsList(
  arrayLimits: ToolArrayLimits | undefined,
): number | undefined {
  if (!arrayLimits || typeof arrayLimits !== 'object') {
    return undefined;
  }
  if (typeof arrayLimits.list === 'number' && arrayLimits.list > 0) {
    return arrayLimits.list;
  }
  const legacy = (arrayLimits as Record<string, unknown>).maxItems;
  if (typeof legacy === 'number' && legacy > 0) {
    return legacy;
  }
  return undefined;
}

const HTTP_METHODS: ToolHttpMethod[] = ['Get', 'Post', 'Put', 'Delete'];
const RISK_LEVELS: ToolRiskLevel[] = ['L1', 'L2', 'L3'];

export function useToolDetail() {
  const intl = useIntl();
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
  const { projectId } = useProjectRoute();
  const [form] = Form.useForm<ToolFormValues>();
  const [tool, setTool] = useState<Tool | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [generatingSchemas, setGeneratingSchemas] = useState(false);
  const [testResult, setTestResult] = useState<ApiTestRunResult | null>(null);
  const [testParams, setTestParams] = useState<ApiTestParamsByIn>(
    createEmptyApiTestParams,
  );
  const [testApiKey, setTestApiKey] = useState('');
  const [schemaHint, setSchemaHint] = useState('');
  const [outputSchemaFields, setOutputSchemaFields] = useState<
    ToolOutputSchemaField[]
  >([]);

  const isCreateMode = isToolCreateRoute(pathname, id);
  const toolId = isCreateMode ? 0 : Number(id);

  const applyToolToForm = useCallback(
    (detail: Tool) => {
      const parameters = parametersFromToolSchemas(
        detail.inputSchema,
        detail.schema,
      );
      const schemaCandidates: Array<unknown> = [
        detail.outputSchema,
        extractOutputSchemaFromAny(detail.outputSchema),
        extractOutputSchemaFromAny(detail as unknown),
        detail.schema,
      ];
      let fallbackOutputFields: ReturnType<typeof outputSchemaToFields> = [];
      for (let index = 0; index < schemaCandidates.length; index += 1) {
        const candidate = schemaCandidates[index];
        const next = outputSchemaToFields(candidate as object | undefined);
        if (next.length > 0) {
          fallbackOutputFields = next;
          break;
        }
      }
      if (fallbackOutputFields.length === 0) {
        const coreFields = Array.isArray(detail.responseProfile?.coreFields)
          ? detail.responseProfile?.coreFields
          : [];
        const listMetaFields = Array.isArray(
          (detail.responseProfile as Record<string, unknown> | undefined)
            ?.listMetaFields,
        )
          ? ((detail.responseProfile as Record<string, unknown>)
              .listMetaFields as unknown[])
          : [];

        const inferredPaths = [
          ...coreFields
            .map((item) => {
              if (typeof item === 'string') return item;
              if (typeof item === 'object' && item !== null && 'path' in item) {
                return String((item as Record<string, unknown>).path ?? '');
              }
              return '';
            })
            .filter(Boolean),
          ...listMetaFields
            .map((item) =>
              typeof item === 'object' && item !== null && 'path' in item
                ? String((item as Record<string, unknown>).path ?? '')
                : '',
            )
            .filter(Boolean),
        ];

        if (inferredPaths.length > 0) {
          fallbackOutputFields = inferredPaths.map((path, idx) => ({
            id: `infer_${idx}_${path}`,
            statusCode: '200',
            name:
              path.startsWith('data.') || path === 'data'
                ? path
                : `data.${path}`,
            type: 'string',
            required: false,
            description: 'inferred from responseProfile',
          }));
        }
      }
      const rawMeta = normalizeAgentMetadata(detail.agentMetadata);
      const agentMetadata = rawMeta
        ? {
            ...rawMeta,
            paramFormatHints: syncParamFormatHintsWithParameters(
              parameters,
              rawMeta.paramFormatHints,
            ),
          }
        : null;

      setTool(detail);
      setOutputSchemaFields(normalizeOutputSchemaFields(fallbackOutputFields));
      form.setFieldsValue({
        name: detail.name,
        definitionKey: detail.definitionKey ?? '',
        description: detail.description,
        method: detail.method,
        path: detail.path,
        integrationId: detail.integrationId,
        riskLevel: detail.riskLevel,
        isActive: detail.isActive,
        timeout: detail.timeout,
        parameters,
        outputSchemaFields: normalizeOutputSchemaFields(fallbackOutputFields),
        responseCoreFields: profileFieldsToRows(
          detail.responseProfile?.coreFields,
        ),
        responseOptionalFields: profileFieldsToRows(
          detail.responseProfile?.optionalFields,
        ),
        responseListMetaFields: profileFieldsToRows(
          detail.responseProfile?.listMetaFields,
        ),
        responseEntityType:
          typeof detail.responseProfile?.entityType === 'string'
            ? detail.responseProfile.entityType
            : undefined,
        responseDecisionRole:
          typeof detail.responseProfile?.decisionRole === 'string'
            ? detail.responseProfile.decisionRole
            : undefined,
        responseListPath:
          typeof detail.responseProfile?.listPath === 'string'
            ? detail.responseProfile.listPath
            : undefined,
        responseArrayLimitsList: resolveArrayLimitsList(
          detail.responseProfile?.arrayLimits,
        ),
        agentMetadata,
      });
      setTestParams(buildTestParamsFromToolParameters(parameters));
    },
    [form],
  );

  const loadData = useCallback(async () => {
    if (!projectId) {
      setTool(null);
      setIntegrations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const integrationResult = await IntegrationController_findByAppClient(
        projectId,
        {
          page: 1,
          pageSize: 100,
          orderBy: 'name',
          order: 'asc',
        },
      );
      setIntegrations(integrationResult.list);

      if (isCreateMode) {
        setTool(null);
        form.setFieldsValue({
          name: '',
          definitionKey: '',
          description: '',
          method: DEFAULT_TOOL_METHOD,
          path: '',
          integrationId: integrationResult.list[0]?.id,
          riskLevel: DEFAULT_TOOL_RISK,
          isActive: true,
          timeout: undefined,
          parameters: [],
          outputSchemaFields: [],
          responseCoreFields: [],
          responseOptionalFields: [],
          responseListMetaFields: [],
          agentMetadata: null,
        });
        setTestParams(createEmptyApiTestParams());
        setTestApiKey('');
        setSchemaHint('');
        setOutputSchemaFields([]);
        return;
      }

      if (!Number.isFinite(toolId) || toolId <= 0) {
        throw new Error(intl.formatMessage({ id: 'tool.detail.invalidId' }));
      }

      const detail = await ToolController_findOne(toolId);
      applyToolToForm(detail);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'tool.loadFailed' }),
      );
      history.push('/tool');
    } finally {
      setLoading(false);
    }
  }, [applyToolToForm, form, intl, isCreateMode, projectId, toolId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const integrationOptions = useMemo(
    () =>
      integrations.map((integration) => ({
        value: integration.id,
        label: integration.name,
      })),
    [integrations],
  );

  const watchedIntegrationId = Form.useWatch('integrationId', form);
  const watchedMethod = Form.useWatch('method', form);
  const watchedPath = Form.useWatch('path', form);
  const watchedIsActive = Form.useWatch('isActive', form);
  const watchedParameters = Form.useWatch('parameters', form);

  useEffect(() => {
    if (loading || !Array.isArray(watchedParameters)) {
      return;
    }
    setTestParams((current) =>
      mergeTestParamsWithToolParameters(current, watchedParameters),
    );
  }, [loading, watchedParameters]);

  const selectedIntegration = useMemo(() => {
    if (!watchedIntegrationId) {
      return tool?.integration;
    }
    const matched = integrations.find(
      (item) => item.id === watchedIntegrationId,
    );
    if (matched) {
      return matched;
    }
    return tool?.integration;
  }, [integrations, tool?.integration, watchedIntegrationId]);

  const handleDiscard = () => {
    history.push('/tool');
  };

  const handleSubmit = async (submitted: ToolFormValues) => {
    // 向导会卸载非当前步骤字段；onFinish 只带已挂载字段。
    // preserve 下需用 getFieldsValue(true) 合并完整表单值。
    const values: ToolFormValues = {
      ...form.getFieldsValue(true),
      ...submitted,
    };

    if (!projectId) {
      message.warning(intl.formatMessage({ id: 'tool.selectProject' }));
      return;
    }

    if (!values.integrationId) {
      message.warning(
        intl.formatMessage({ id: 'tool.form.integrationRequired' }),
      );
      return;
    }

    const parameterIssue = validateToolParameters(values.parameters ?? []);
    if (parameterIssue) {
      message.error(getParameterValidationMessage(parameterIssue, intl));
      return;
    }

    if (
      values.agentMetadata &&
      !isAgentMetadataFormComplete(values.agentMetadata)
    ) {
      message.error(intl.formatMessage({ id: 'tool.agentMetadata.invalid' }));
      return;
    }

    const outputSchema = isCreateMode
      ? undefined
      : buildOutputSchemaFromFields(
          values.outputSchemaFields?.length
            ? values.outputSchemaFields
            : outputSchemaFields,
        );
    let responseProfile: ToolResponseProfile | undefined;
    if (!isCreateMode) {
      const nextCoreFields = rowsToProfileFields(
        values.responseCoreFields ?? [],
      );
      const nextOptionalFields = rowsToProfileFields(
        values.responseOptionalFields ?? [],
        {
          includeKeywords: true,
        },
      );
      const nextListMetaFields = rowsToListMetaFields(
        values.responseListMetaFields ?? [],
      );
      const baseProfile =
        tool?.responseProfile && typeof tool.responseProfile === 'object'
          ? { ...tool.responseProfile }
          : {};

      if (nextCoreFields && nextCoreFields.length > 0) {
        baseProfile.coreFields = nextCoreFields;
      } else {
        delete (baseProfile as Record<string, unknown>).coreFields;
      }

      if (nextOptionalFields && nextOptionalFields.length > 0) {
        baseProfile.optionalFields = nextOptionalFields;
      } else {
        delete (baseProfile as Record<string, unknown>).optionalFields;
      }

      if (nextListMetaFields && nextListMetaFields.length > 0) {
        baseProfile.listMetaFields = nextListMetaFields;
      } else {
        delete (baseProfile as Record<string, unknown>).listMetaFields;
      }

      const entityType = values.responseEntityType?.trim();
      if (entityType) {
        baseProfile.entityType = entityType;
      } else {
        delete (baseProfile as Record<string, unknown>).entityType;
      }

      const decisionRole = values.responseDecisionRole;
      if (decisionRole) {
        baseProfile.decisionRole = decisionRole;
      } else {
        delete (baseProfile as Record<string, unknown>).decisionRole;
      }

      const listPath = values.responseListPath?.trim();
      if (listPath) {
        baseProfile.listPath = listPath;
      } else {
        delete (baseProfile as Record<string, unknown>).listPath;
      }

      if (
        typeof values.responseArrayLimitsList === 'number' &&
        values.responseArrayLimitsList > 0
      ) {
        baseProfile.arrayLimits = {
          list: values.responseArrayLimitsList,
        };
      } else {
        delete (baseProfile as Record<string, unknown>).arrayLimits;
      }

      responseProfile = Object.keys(baseProfile).length
        ? (baseProfile as ToolResponseProfile)
        : undefined;

      const isReadMode =
        values.agentMetadata?.mode === 'READ' || !values.agentMetadata?.mode;
      if (isReadMode && (!nextCoreFields || nextCoreFields.length === 0)) {
        message.error(
          intl.formatMessage({ id: 'tool.response.validation.coreRequired' }),
        );
        return;
      }
      const listPathForValidate = values.responseListPath?.trim();
      if (
        (values.responseDecisionRole === 'read-list' ||
          Boolean(listPathForValidate)) &&
        !listPathForValidate
      ) {
        message.error(
          intl.formatMessage({
            id: 'tool.response.validation.listPathRequired',
          }),
        );
        return;
      }
      if ((nextCoreFields?.length ?? 0) > 8) {
        message.warning(
          intl.formatMessage({ id: 'tool.response.validation.coreTooMany' }),
        );
      }
      if (
        values.agentMetadata?.mode === 'WRITE' &&
        (!values.agentMetadata.businessFields ||
          values.agentMetadata.businessFields.length === 0)
      ) {
        message.warning(
          intl.formatMessage({
            id: 'tool.response.validation.businessFieldsSuggested',
          }),
        );
      }
    }

    setSubmitting(true);
    try {
      if (isCreateMode) {
        await ToolController_create(buildCreateToolPayload(projectId, values));
        message.success(intl.formatMessage({ id: 'tool.created' }));
        history.replace('/tool');
        return;
      }

      if (!tool) {
        return;
      }

      await ToolController_update(
        tool.id,
        buildUpdateToolPayload(values, { outputSchema, responseProfile }),
      );
      message.success(intl.formatMessage({ id: 'tool.updated' }));
      history.replace('/tool');
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'tool.actionFailed' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunTest = async () => {
    if (isCreateMode || !tool) {
      message.warning(intl.formatMessage({ id: 'tool.detail.saveBeforeTest' }));
      return;
    }

    const invalidBody = findInvalidApiTestBodyParam(testParams);
    if (invalidBody) {
      message.error(
        intl.formatMessage(
          { id: 'apiTestPanel.bodyJsonInvalid' },
          { name: invalidBody },
        ),
      );
      return;
    }

    const debugPayload = buildDebugToolRequest(testParams, {
      apiKey: testApiKey,
    });

    setTesting(true);
    setTestResult(null);
    try {
      const result = await ToolController_debug(tool.id, debugPayload);
      setTestResult(result);
      if (result.ok) {
        message.success(
          intl.formatMessage(
            { id: 'tool.detail.testSuccess' },
            { status: result.statusCode ?? '—' },
          ),
        );
      } else {
        message.warning(
          intl.formatMessage(
            { id: 'tool.detail.testFailed' },
            { status: result.statusCode ?? '—', error: result.error ?? '' },
          ),
        );
      }
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'tool.actionFailed' }),
      );
    } finally {
      setTesting(false);
    }
  };

  const [initSchemasPreview, setInitSchemasPreview] =
    useState<InitToolSchemasFromDebugResult | null>(null);
  const [initSchemasPreviewOpen, setInitSchemasPreviewOpen] = useState(false);

  const applyInitSchemasResultToForm = useCallback(
    (result: InitToolSchemasFromDebugResult) => {
      const nextOutputFields = normalizeOutputSchemaFields(
        outputSchemaToFields(result.outputSchema as object | undefined),
      );
      setOutputSchemaFields(nextOutputFields);
      const profile = result.responseProfile;
      const rawMeta = normalizeAgentMetadata(result.agentMetadata);
      const parameters = form.getFieldValue('parameters') ?? [];
      const agentMetadata = rawMeta
        ? {
            ...rawMeta,
            paramFormatHints: syncParamFormatHintsWithParameters(
              parameters,
              rawMeta.paramFormatHints,
            ),
          }
        : (form.getFieldValue('agentMetadata') ?? null);

      form.setFieldsValue({
        outputSchemaFields: nextOutputFields,
        responseCoreFields: profileFieldsToRows(profile?.coreFields),
        responseOptionalFields: profileFieldsToRows(profile?.optionalFields),
        responseListMetaFields: profileFieldsToRows(profile?.listMetaFields),
        responseEntityType:
          typeof profile?.entityType === 'string'
            ? profile.entityType
            : undefined,
        responseDecisionRole:
          typeof profile?.decisionRole === 'string'
            ? profile.decisionRole
            : undefined,
        responseListPath:
          typeof profile?.listPath === 'string' ? profile.listPath : undefined,
        responseArrayLimitsList: resolveArrayLimitsList(profile?.arrayLimits),
        agentMetadata,
      });
    },
    [form],
  );

  const handleGenerateResponseSchemas = async () => {
    if (isCreateMode || !tool || !projectId) {
      message.warning(
        intl.formatMessage({ id: 'tool.detail.saveBeforeGenerateSchemas' }),
      );
      return;
    }

    const invalidBody = findInvalidApiTestBodyParam(testParams);
    if (invalidBody) {
      message.error(
        intl.formatMessage(
          { id: 'apiTestPanel.bodyJsonInvalid' },
          { name: invalidBody },
        ),
      );
      return;
    }

    const payload = buildInitSchemasFromDebugRequest(testParams, {
      apiKey: testApiKey,
      hint: schemaHint,
      persist: false,
    });

    setGeneratingSchemas(true);
    try {
      const result = await ToolController_initSchemasFromDebug(
        projectId,
        tool.id,
        payload,
      );
      setInitSchemasPreview(result);
      setInitSchemasPreviewOpen(true);
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'tool.detail.generateSchemasFailed' }),
      );
    } finally {
      setGeneratingSchemas(false);
    }
  };

  const handleApplyInitSchemasPreview = () => {
    if (!initSchemasPreview) {
      return;
    }
    applyInitSchemasResultToForm(initSchemasPreview);
    setInitSchemasPreviewOpen(false);
    message.success(
      intl.formatMessage({ id: 'tool.initSchemas.appliedToForm' }),
    );
  };

  const handleApplyAndPersistInitSchemas = async () => {
    if (isCreateMode || !tool || !projectId) {
      return;
    }
    const invalidBody = findInvalidApiTestBodyParam(testParams);
    if (invalidBody) {
      message.error(
        intl.formatMessage(
          { id: 'apiTestPanel.bodyJsonInvalid' },
          { name: invalidBody },
        ),
      );
      return;
    }
    setGeneratingSchemas(true);
    try {
      const result = await ToolController_initSchemasFromDebug(
        projectId,
        tool.id,
        buildInitSchemasFromDebugRequest(testParams, {
          apiKey: testApiKey,
          hint: schemaHint,
          persist: true,
        }),
      );
      if (result.tool) {
        applyToolToForm(result.tool);
      } else {
        applyInitSchemasResultToForm(result);
        const refreshed = await ToolController_findOne(tool.id);
        applyToolToForm(refreshed);
      }
      setInitSchemasPreviewOpen(false);
      setInitSchemasPreview(null);
      message.success(
        intl.formatMessage({ id: 'tool.detail.generateSchemasSuccess' }),
      );
    } catch (error: unknown) {
      message.error(
        error instanceof Error
          ? error.message
          : intl.formatMessage({ id: 'tool.detail.generateSchemasFailed' }),
      );
    } finally {
      setGeneratingSchemas(false);
    }
  };

  const fillTestParamsFromParameters = () => {
    const parameters = form.getFieldValue('parameters') ?? [];
    setTestParams(buildTestParamsFromToolParameters(parameters));
  };

  const handleOutputSchemaFieldsChange = useCallback(
    (fields: ToolOutputSchemaField[]) => {
      setOutputSchemaFields(fields);
      form.setFieldValue('outputSchemaFields', fields);
    },
    [form],
  );

  const handleFormValuesChange = useCallback(
    (_changed: Partial<ToolFormValues>, allValues: ToolFormValues) => {
      if (Array.isArray(allValues.outputSchemaFields)) {
        setOutputSchemaFields(allValues.outputSchemaFields);
      }
    },
    [],
  );

  return {
    form,
    tool,
    loading,
    submitting,
    testing,
    generatingSchemas,
    testResult,
    testParams,
    setTestParams,
    testApiKey,
    setTestApiKey,
    schemaHint,
    setSchemaHint,
    outputSchemaFields,
    handleOutputSchemaFieldsChange,
    handleFormValuesChange,
    watchedMethod,
    watchedPath,
    watchedIsActive,
    watchedIntegrationId,
    selectedIntegration,
    isCreateMode,
    projectId,
    integrationOptions,
    httpMethods: HTTP_METHODS,
    riskLevels: RISK_LEVELS,
    handleDiscard,
    handleSubmit,
    handleRunTest,
    handleGenerateResponseSchemas,
    initSchemasPreview,
    initSchemasPreviewOpen,
    setInitSchemasPreviewOpen,
    handleApplyInitSchemasPreview,
    handleApplyAndPersistInitSchemas,
    fillTestParamsFromParameters,
  };
}
