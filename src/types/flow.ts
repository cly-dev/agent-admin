import type {
  WorkflowDeliverable,
  WorkflowPresetCatalogEntry,
  WorkflowPresetConfig,
  WorkflowPresetKind,
  WorkflowProfile,
} from '@/types/workflow';

export type FlowProfile = WorkflowProfile;
export type FlowDeliverable = WorkflowDeliverable;

export type FlowToolBinding = {
  id?: number;
  toolId: number;
  isRequired: boolean;
  tool?: {
    id: number;
    name?: string;
    path?: string;
    method?: string;
    definitionKey?: string;
  };
};

export type FlowHostToolBinding = {
  id?: number;
  hostToolId: number;
  isRequired: boolean;
  hostTool?: {
    id: number;
    name: string;
    pageScope?: string | null;
    definitionKey?: string;
  };
};

export type FlowListItem = {
  id: number;
  appClientId: number;
  appClientName: string;
  flowKey: string;
  name: string;
  description: string | null;
  profile: string;
  deliverable: string;
  version: number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  skillRefCount: number;
  pageActionRefCount: number;
  irNodeCount: number;
};

export type Flow = {
  id: number;
  appClientId: number;
  appClientName: string;
  flowKey: string;
  name: string;
  description: string | null;
  goal: string | null;
  profile: string;
  deliverable: string;
  intent: unknown;
  ir: unknown;
  version: number;
  constraints: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  flowTools: FlowToolBinding[];
  flowHostTools: FlowHostToolBinding[];
  skillRefCount: number;
  pageActionRefCount: number;
  revisionCount: number;
};

export type FlowListQuery = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  profile?: FlowProfile;
  isActive?: boolean;
};

export type CreateFlowDto = {
  appClientId: number;
  flowKey: string;
  name: string;
  description?: string | null;
  goal?: string | null;
  profile: FlowProfile;
  deliverable?: FlowDeliverable;
  preset?: WorkflowPresetKind;
  presetConfig?: WorkflowPresetConfig;
  intent?: Record<string, unknown>;
  constraints?: string[];
  isActive?: boolean;
  sortOrder?: number;
  changeNote?: string;
};

export type UpdateFlowDto = {
  name?: string;
  description?: string | null;
  goal?: string | null;
  deliverable?: FlowDeliverable;
  preset?: WorkflowPresetKind;
  presetConfig?: WorkflowPresetConfig;
  intent?: Record<string, unknown>;
  constraints?: string[];
  isActive?: boolean;
  sortOrder?: number;
  changeNote?: string;
};

export type FlowRevisionSummary = {
  id: number;
  flowId: number;
  version: number;
  deliverable: string;
  changeNote: string | null;
  createdAt: string;
  isCurrent: boolean;
};

export type FlowRevision = FlowRevisionSummary & {
  intent: unknown;
  ir: unknown;
  constraints: string[];
};

export type FlowRevisionListQuery = {
  limit?: number;
  summary?: boolean;
};

/** Reuse workflow preset catalog shape (expandedOperations → expandedActions). */
export type FlowPresetCatalogEntry = WorkflowPresetCatalogEntry;

export type FlowMigrationCandidate = {
  workflowId: number;
  workflowKey: string;
  name: string;
  profile: string;
  isActive: boolean;
  skillRefCount: number;
  pageActionRefCount: number;
  previewPath: string;
  migratePath: string;
};

export type FlowMigratePreview = {
  sourceWorkflowId: number;
  suggestedFlowKey: string;
  profile: string;
  canMigrate: boolean;
  lossy: boolean;
  matchedPattern: string | null;
  warnings: string[];
  intent: unknown | null;
  error: { code: string; message: string } | null;
  flowKeyAvailable: boolean;
  rebind: {
    skillCount: number;
    pageActionCount: number;
  };
};

export type MigrateFlowFromWorkflowDto = {
  flowKey?: string;
  rebindBindings?: boolean;
  deactivateSource?: boolean;
  changeNote?: string;
};

export type MigrateFlowFromWorkflowResult = {
  flow: Flow;
  sourceWorkflowId: number;
  matchedPattern: string;
  warnings: string[];
  rebind: {
    skillsUpdated: number;
    pageActionsUpdated: number;
  };
  sourceDeactivated: boolean;
};

export type FlowBindingValue = {
  flowId?: number | null;
  flowVersion?: number | null;
};
