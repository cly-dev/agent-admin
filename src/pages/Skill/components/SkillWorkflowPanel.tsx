import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Select } from 'antd';
import type { WorkflowStep } from '../skillWorkflow';
import {
  createEmptyWorkflowStep,
  DELIVERABLE_OPTIONS,
  STOP_WHEN_OPTIONS,
  WORKFLOW_KIND_OPTIONS,
  WORKFLOW_PHASE_OPTIONS,
  type SkillWorkflowState,
} from '../skillWorkflow';

type SkillWorkflowPanelProps = {
  workflow: SkillWorkflowState;
  hostToolNameOptions: string[];
  saving?: boolean;
  onChange: (workflow: SkillWorkflowState) => void;
};

const SkillWorkflowPanel: React.FC<SkillWorkflowPanelProps> = ({
  workflow,
  hostToolNameOptions,
  saving = false,
  onChange,
}) => {
  const intl = useIntl();

  const updateStep = (stepId: string, patch: Partial<WorkflowStep>) => {
    onChange({
      ...workflow,
      steps: workflow.steps.map((step) =>
        step.id === stepId ? { ...step, ...patch } : step,
      ),
    });
  };

  const removeStep = (stepId: string) => {
    onChange({
      ...workflow,
      steps: workflow.steps.filter((step) => step.id !== stepId),
    });
  };

  const addStep = () => {
    onChange({
      ...workflow,
      steps: [...workflow.steps, createEmptyWorkflowStep()],
    });
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= workflow.steps.length) {
      return;
    }
    const steps = [...workflow.steps];
    const [item] = steps.splice(index, 1);
    steps.splice(nextIndex, 0, item);
    onChange({ ...workflow, steps });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-xs text-[var(--color-on-surface-variant)]">
        {intl.formatMessage({ id: 'skill.workflow.hint' })}
      </p>

      <div className="grid max-w-md grid-cols-1 gap-1">
        <label className="text-sm font-medium text-[var(--color-on-surface)]">
          {intl.formatMessage({ id: 'skill.workflow.deliverable' })}
        </label>
        <Select
          allowClear
          className="app-input"
          disabled={saving}
          placeholder={intl.formatMessage({
            id: 'skill.workflow.deliverablePlaceholder',
          })}
          value={workflow.deliverable}
          options={DELIVERABLE_OPTIONS.map((value) => ({
            value,
            label: intl.formatMessage({
              id: `skill.workflow.deliverable.${value}`,
            }),
          }))}
          onChange={(value) => onChange({ ...workflow, deliverable: value })}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <h3 className="m-0 text-sm font-semibold text-[var(--color-on-surface)]">
          {intl.formatMessage({ id: 'skill.workflow.stepsTitle' })}
        </h3>
        <button
          type="button"
          className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          disabled={saving}
          onClick={addStep}
        >
          <PlusOutlined />
          {intl.formatMessage({ id: 'skill.workflow.addStep' })}
        </button>
      </div>

      {workflow.steps.length === 0 ? (
        <p className="m-0 text-sm text-[var(--color-on-surface-variant)]">
          {intl.formatMessage({ id: 'skill.workflow.empty' })}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {workflow.steps.map((step, index) => (
            <div
              key={step.id}
              className="rounded-[var(--radius-ui)] border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--color-on-surface)]">
                  {intl.formatMessage(
                    { id: 'skill.workflow.stepLabel' },
                    { index: index + 1 },
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="small"
                    disabled={saving || index === 0}
                    onClick={() => moveStep(index, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    size="small"
                    disabled={saving || index === workflow.steps.length - 1}
                    onClick={() => moveStep(index, 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={saving}
                    onClick={() => removeStep(step.id)}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium">id</label>
                  <Input
                    className="app-input font-mono text-xs"
                    disabled={saving}
                    value={step.id}
                    onChange={(event) =>
                      updateStep(step.id, { id: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    phase
                  </label>
                  <Select
                    className="w-full"
                    disabled={saving}
                    value={step.phase}
                    options={WORKFLOW_PHASE_OPTIONS.map((value) => ({
                      value,
                      label: value,
                    }))}
                    onChange={(value) => updateStep(step.id, { phase: value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">kind</label>
                  <Select
                    className="w-full"
                    disabled={saving}
                    value={step.kind}
                    options={WORKFLOW_KIND_OPTIONS.map((value) => ({
                      value,
                      label: intl.formatMessage({
                        id: `skill.workflow.kind.${value}`,
                      }),
                    }))}
                    onChange={(value) => updateStep(step.id, { kind: value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    stopWhen
                  </label>
                  <Select
                    allowClear
                    className="w-full"
                    disabled={saving}
                    value={step.stopWhen}
                    options={STOP_WHEN_OPTIONS.map((value) => ({
                      value,
                      label: value,
                    }))}
                    onChange={(value) =>
                      updateStep(step.id, { stopWhen: value })
                    }
                  />
                </div>
              </div>

              {step.kind === 'tool' ? (
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-medium">
                    toolRole
                  </label>
                  <Input
                    className="app-input"
                    disabled={saving}
                    placeholder="read-list"
                    value={step.toolRole ?? ''}
                    onChange={(event) =>
                      updateStep(step.id, { toolRole: event.target.value })
                    }
                  />
                </div>
              ) : null}

              {step.kind === 'host_tool' ? (
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-medium">
                    hostToolNames
                  </label>
                  <Select
                    mode="tags"
                    className="w-full"
                    disabled={saving}
                    placeholder={intl.formatMessage({
                      id: 'skill.workflow.hostToolNamesPlaceholder',
                    })}
                    value={step.hostToolNames ?? []}
                    options={hostToolNameOptions.map((name) => ({
                      value: name,
                      label: name,
                    }))}
                    onChange={(value) =>
                      updateStep(step.id, { hostToolNames: value })
                    }
                  />
                </div>
              ) : null}

              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium">
                  objective
                </label>
                <Input.TextArea
                  className="app-input text-sm"
                  disabled={saving}
                  autoSize={{ minRows: 2, maxRows: 5 }}
                  value={step.objective}
                  onChange={(event) =>
                    updateStep(step.id, { objective: event.target.value })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillWorkflowPanel;
