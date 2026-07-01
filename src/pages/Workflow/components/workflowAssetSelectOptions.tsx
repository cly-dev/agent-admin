import type { HostTool } from '@/types/host-tool';
import type { Tool } from '@/types/tool';
import type { SelectProps } from 'antd';
import styles from '../index.module.scss';

export type WorkflowAssetSelectOption = {
  value: number;
  label: string;
  description?: string;
};

export function buildToolSelectOptions(tools: Tool[]): WorkflowAssetSelectOption[] {
  return tools.map((tool) => ({
    value: tool.id,
    label: `${tool.name} (#${tool.id})`,
    description: tool.description?.trim() || undefined,
  }));
}

export function buildHostToolSelectOptions(
  hostTools: HostTool[],
): WorkflowAssetSelectOption[] {
  return hostTools.map((tool) => ({
    value: tool.id,
    label: `${tool.name} (#${tool.id})`,
    description: tool.description?.trim() || undefined,
  }));
}

export const workflowAssetSelectFilterOption: NonNullable<
  SelectProps<number, WorkflowAssetSelectOption>['filterOption']
> = (input, option) => {
  const query = input.trim().toLowerCase();
  if (!query) {
    return true;
  }
  const label = String(option?.label ?? '').toLowerCase();
  const description = String(option?.description ?? '').toLowerCase();
  return label.includes(query) || description.includes(query);
};

export function renderWorkflowAssetSelectOption(
  option: WorkflowAssetSelectOption,
): React.ReactNode {
  return (
    <div className={styles.workflowAssetSelectOption}>
      <span className={styles.workflowAssetSelectOptionTitle}>{option.label}</span>
      {option.description ? (
        <span className={styles.workflowAssetSelectOptionDesc}>{option.description}</span>
      ) : null}
    </div>
  );
}

export const workflowAssetSelectProps = {
  showSearch: true,
  filterOption: workflowAssetSelectFilterOption,
  optionRender: (option: { data: WorkflowAssetSelectOption; label?: React.ReactNode }) =>
    renderWorkflowAssetSelectOption(option.data),
} satisfies Partial<SelectProps<number, WorkflowAssetSelectOption>>;
