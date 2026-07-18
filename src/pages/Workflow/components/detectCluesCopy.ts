export type DetectCluesCopyScope = 'workflow' | 'flow';

export type DetectCluesMessageIds = {
  listTitle: string;
  sectionLead: string;
  add: string;
  addTitle: string;
  editTitle: string;
  empty: string;
  canvasPlusHint: string;
  duplicateKey: string;
  keyUnset: string;
  needsKey: string;
  descUnset: string;
  wiredTo: string;
  tipPending: string;
  targetMissing: string;
  deleteConfirm: string;
  delete: string;
  key: string;
  keyRequired: string;
  keyExtra: string;
  description: string;
  descriptionRequired: string;
  descriptionPlaceholder: string;
  policyHint: string;
  policyHintExtra: string;
  policyHintPlaceholder: string;
  mergeTitle: string;
  mergeHint: string;
  mergeNeedBranches: string;
  mergeBranchHint: string;
  mergeCreateBranch: string;
};

const WORKFLOW_IDS: DetectCluesMessageIds = {
  listTitle: 'workflow.detectClues.listTitle',
  sectionLead: 'workflow.detectClues.sectionLead',
  add: 'workflow.detectClues.add',
  addTitle: 'workflow.detectClues.addTitle',
  editTitle: 'workflow.detectClues.editTitle',
  empty: 'workflow.detectClues.empty',
  canvasPlusHint: 'workflow.detectClues.canvasPlusHint',
  duplicateKey: 'workflow.detectClues.duplicateKey',
  keyUnset: 'workflow.detectClues.keyUnset',
  needsKey: 'workflow.detectClues.needsKey',
  descUnset: 'workflow.detectClues.descUnset',
  wiredTo: 'workflow.detectClues.wiredTo',
  tipPending: 'workflow.detectClues.tipPending',
  targetMissing: 'workflow.detectClues.targetMissing',
  deleteConfirm: 'workflow.detectClues.deleteConfirm',
  delete: 'workflow.detectClues.delete',
  key: 'workflow.edge.clueKey',
  keyRequired: 'workflow.edge.clueKeyRequired',
  keyExtra: 'workflow.detectClues.keyExtra',
  description: 'workflow.edge.clueDescription',
  descriptionRequired: 'workflow.edge.clueDescriptionRequired',
  descriptionPlaceholder: 'workflow.edge.clueDescriptionPlaceholder',
  policyHint: 'workflow.nodeInput.detectHint',
  policyHintExtra: 'workflow.nodeInput.detectHintExtra',
  policyHintPlaceholder: 'workflow.nodeInput.detectHintPlaceholder',
  mergeTitle: 'workflow.detectClues.mergeTitle',
  mergeHint: 'workflow.detectClues.mergeHint',
  mergeNeedBranches: 'workflow.detectClues.mergeNeedStates',
  mergeBranchHint: 'workflow.detectClues.mergeBranchHint',
  mergeCreateBranch: 'workflow.detectClues.mergeCreateBranch',
};

const FLOW_IDS: DetectCluesMessageIds = {
  listTitle: 'flow.judgeBranch.listTitle',
  sectionLead: 'flow.judgeBranch.sectionLead',
  add: 'flow.judgeBranch.add',
  addTitle: 'flow.judgeBranch.addTitle',
  editTitle: 'flow.judgeBranch.editTitle',
  empty: 'flow.judgeBranch.empty',
  canvasPlusHint: 'flow.judgeBranch.canvasPlusHint',
  duplicateKey: 'flow.judgeBranch.duplicateKey',
  keyUnset: 'flow.judgeBranch.keyUnset',
  needsKey: 'flow.judgeBranch.needsKey',
  descUnset: 'flow.judgeBranch.descUnset',
  wiredTo: 'flow.judgeBranch.wiredTo',
  tipPending: 'flow.judgeBranch.tipPending',
  targetMissing: 'flow.judgeBranch.targetMissing',
  deleteConfirm: 'flow.judgeBranch.deleteConfirm',
  delete: 'flow.judgeBranch.delete',
  key: 'flow.judgeBranch.key',
  keyRequired: 'flow.judgeBranch.keyRequired',
  keyExtra: 'flow.judgeBranch.keyExtra',
  description: 'flow.judgeBranch.description',
  descriptionRequired: 'flow.judgeBranch.descriptionRequired',
  descriptionPlaceholder: 'flow.judgeBranch.descriptionPlaceholder',
  policyHint: 'flow.judgeBranch.policyHint',
  policyHintExtra: 'flow.judgeBranch.policyHintExtra',
  policyHintPlaceholder: 'flow.judgeBranch.policyHintPlaceholder',
  mergeTitle: 'flow.judgeBranch.mergeTitle',
  mergeHint: 'flow.judgeBranch.mergeHint',
  mergeNeedBranches: 'flow.judgeBranch.mergeNeedBranches',
  mergeBranchHint: 'flow.judgeBranch.mergeBranchHint',
  mergeCreateBranch: 'flow.judgeBranch.mergeCreateBranch',
};

export function detectCluesMessageIds(
  scope: DetectCluesCopyScope = 'workflow',
): DetectCluesMessageIds {
  return scope === 'flow' ? FLOW_IDS : WORKFLOW_IDS;
}
