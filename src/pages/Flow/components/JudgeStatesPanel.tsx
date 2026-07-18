import type { FlowProfile } from '@/types/flow';
import type { FlowIntentEdge, FlowIntentStep } from '@/types/flow-intent';
import DetectCluesPanel from '@/pages/Workflow/components/DetectCluesPanel';
import { Form } from 'antd';
import { useMemo } from 'react';
import {
  detectGraphToIntent,
  intentEdgesToDetectEdges,
  intentStepsToDetectNodes,
} from '../judgeDetectBridge';

type JudgeStatesPanelProps = {
  judgeId: string;
  steps: FlowIntentStep[];
  edges: FlowIntentEdge[];
  profile: FlowProfile;
  disabled?: boolean;
  /** 同步判定说明（DetectCluesPanel hint → policyHint） */
  policyHint?: string;
  onPolicyHintChange?: (hint: string) => void;
  onChange: (next: {
    steps: FlowIntentStep[];
    edges: FlowIntentEdge[];
  }) => void;
};

/**
 * 判定分流状态面板：直接复用 Workflow「状态识别」DetectCluesPanel 与图规则。
 */
const JudgeStatesPanel: React.FC<JudgeStatesPanelProps> = ({
  judgeId,
  steps,
  edges,
  profile,
  disabled = false,
  policyHint = '',
  onPolicyHintChange,
  onChange,
}) => {
  const detectNodes = useMemo(
    () => intentStepsToDetectNodes(steps),
    [steps],
  );
  const detectEdges = useMemo(
    () => intentEdgesToDetectEdges(edges),
    [edges],
  );

  return (
    <Form
      layout="vertical"
      requiredMark={false}
      initialValues={{ hint: policyHint }}
      key={`${judgeId}:${policyHint}`}
      onValuesChange={(changed) => {
        if (typeof changed.hint === 'string') {
          onPolicyHintChange?.(changed.hint);
        }
      }}
    >
      <DetectCluesPanel
        detectId={judgeId}
        nodes={detectNodes}
        edges={detectEdges}
        copyScope="flow"
        disabled={disabled}
        onChange={(next) => {
          onChange(
            detectGraphToIntent(next.nodes, next.edges, steps, profile),
          );
        }}
      />
    </Form>
  );
};

export default JudgeStatesPanel;
