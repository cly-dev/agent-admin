import type { IntegrationAuthMode } from '@/types/integration';
import type { ImportToolsFromSwaggerDto, ToolRiskLevel } from '@/types/tool';
import { DEFAULT_TOOL_RISK } from './toolConstants';

export type SwaggerIntegrationMode = 'existing' | 'auto';

export type ImportToolsFromSwaggerFormValues = {
  specUrl: string;
  integrationMode: SwaggerIntegrationMode;
  integrationId?: number;
  integrationName?: string;
  integrationBaseUrl?: string;
  integrationApiKey?: string;
  integrationAuthMode?: IntegrationAuthMode;
  riskLevel?: ToolRiskLevel;
  dryRun?: boolean;
  tags?: string;
  ops?: string;
  pathInclude?: string;
  pathExclude?: string;
  noDefaultPathExclude?: boolean;
  insecure?: boolean;
};

export const DEFAULT_IMPORT_FORM_VALUES: ImportToolsFromSwaggerFormValues = {
  specUrl: '',
  integrationMode: 'auto',
  integrationAuthMode: 'USER_PREFERRED',
  riskLevel: DEFAULT_TOOL_RISK,
  dryRun: false,
  noDefaultPathExclude: false,
  insecure: false,
};

function parseListField(value?: string): string[] | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const items = value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : undefined;
}

export function buildImportToolsFromSwaggerDto(
  projectId: number,
  values: ImportToolsFromSwaggerFormValues,
): ImportToolsFromSwaggerDto {
  const payload: ImportToolsFromSwaggerDto = {
    specUrl: values.specUrl.trim(),
    riskLevel: values.riskLevel ?? DEFAULT_TOOL_RISK,
    dryRun: Boolean(values.dryRun),
    noDefaultPathExclude: Boolean(values.noDefaultPathExclude),
    insecure: Boolean(values.insecure),
    tags: parseListField(values.tags),
    ops: parseListField(values.ops),
    pathInclude: parseListField(values.pathInclude),
    pathExclude: parseListField(values.pathExclude),
  };

  if (values.integrationMode === 'existing') {
    payload.integrationId = values.integrationId;
  } else {
    payload.autoIntegration = true;
    payload.appClientId = projectId;

    const integrationName = values.integrationName?.trim();
    const integrationBaseUrl = values.integrationBaseUrl?.trim();
    const integrationApiKey = values.integrationApiKey?.trim();

    if (integrationName) {
      payload.integrationName = integrationName;
    }
    if (integrationBaseUrl) {
      payload.integrationBaseUrl = integrationBaseUrl;
    }
    if (integrationApiKey) {
      payload.integrationApiKey = integrationApiKey;
    }
    if (values.integrationAuthMode) {
      payload.integrationAuthMode = values.integrationAuthMode;
    }
  }

  return payload;
}
