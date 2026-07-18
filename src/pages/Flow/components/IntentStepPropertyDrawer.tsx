import type { HostTool } from '@/types/host-tool';
import type { Tool } from '@/types/tool';
import type { FlowProfile } from '@/types/flow';
import type {
  FlowIntentEdge,
  FlowIntentStep,
} from '@/types/flow-intent';
import { useIntl } from '@umijs/max';
import { Button, Drawer } from 'antd';
import { useEffect, useState } from 'react';
import IntentStepPropertyForm from './IntentStepPropertyForm';
import JudgeStatesPanel from './JudgeStatesPanel';
import type { FlowBindEntry } from '../flowBindEntry';

type IntentStepPropertyDrawerProps = {
  open: boolean;
  step: FlowIntentStep | null;
  steps: FlowIntentStep[];
  edges: FlowIntentEdge[];
  profile: FlowProfile;
  bindEntry?: FlowBindEntry | null;
  tools: Tool[];
  hostTools: HostTool[];
  toolsLoading?: boolean;
  disabled?: boolean;
  onClose: () => void;
  onSave: (step: FlowIntentStep) => void;
  onGraphChange?: (next: {
    steps: FlowIntentStep[];
    edges: FlowIntentEdge[];
  }) => void;
  onDelete?: (stepId: string) => void;
};

const IntentStepPropertyDrawer: React.FC<IntentStepPropertyDrawerProps> = ({
  open,
  step,
  steps,
  edges,
  profile,
  bindEntry = null,
  tools,
  hostTools,
  toolsLoading = false,
  disabled = false,
  onClose,
  onSave,
  onGraphChange,
  onDelete,
}) => {
  const intl = useIntl();
  const [draft, setDraft] = useState<FlowIntentStep | null>(step);

  useEffect(() => {
    setDraft(step);
  }, [step]);

  return (
    <Drawer
      open={open}
      width={480}
      destroyOnClose
      title={
        step
          ? intl.formatMessage(
              { id: 'flow.intent.drawerTitle' },
              { operation: step.operation },
            )
          : intl.formatMessage({ id: 'flow.intent.selectStep' })
      }
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          {onDelete && step && !disabled ? (
            <Button danger onClick={() => onDelete(step.id)}>
              {intl.formatMessage({ id: 'common.delete' })}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button onClick={onClose}>
              {intl.formatMessage({ id: 'common.cancel' })}
            </Button>
            <Button
              type="primary"
              disabled={!draft || disabled}
              onClick={() => {
                if (draft) {
                  onSave(draft);
                }
                onClose();
              }}
            >
              {intl.formatMessage({ id: 'common.save' })}
            </Button>
          </div>
        </div>
      }
    >
      {draft ? (
        <>
          <IntentStepPropertyForm
            step={draft}
            profile={profile}
            bindEntry={bindEntry}
            tools={tools}
            hostTools={hostTools}
            toolsLoading={toolsLoading}
            disabled={disabled}
            onChange={setDraft}
          />
          {draft.operation === 'judge' && onGraphChange ? (
            <JudgeStatesPanel
              judgeId={draft.id}
              steps={steps.map((item) =>
                item.id === draft.id ? draft : item,
              )}
              edges={edges}
              profile={profile}
              disabled={disabled}
              policyHint={draft.policyHint ?? ''}
              onPolicyHintChange={(hint) =>
                setDraft({ ...draft, policyHint: hint })
              }
              onChange={(next) => {
                const nextDraft =
                  next.steps.find((item) => item.id === draft.id) ?? draft;
                setDraft(nextDraft);
                onGraphChange(next);
              }}
            />
          ) : null}
        </>
      ) : null}
    </Drawer>
  );
};

export default IntentStepPropertyDrawer;
