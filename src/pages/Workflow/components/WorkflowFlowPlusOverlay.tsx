import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { WorkflowActionKind } from '@/types/workflow';
import type { WorkflowActionPhaseGroup } from '../workflowNodePhase';
import { WORKFLOW_ACTION_VISUAL } from './workflowFlowVisual';

export interface WorkflowPlusButtonPosition {
  id: string;
  left: number;
  top: number;
}

export interface WorkflowFlowPlusOverlayProps {
  positions: WorkflowPlusButtonPosition[];
  overlayTransform: { scale: number; tx: number; ty: number };
  plusDropdownNodeId: string | null;
  phaseGroups: WorkflowActionPhaseGroup[];
  getActionLabel: (action: WorkflowActionKind) => string;
  getPhaseLabel: (phase: WorkflowActionPhaseGroup['phase']) => string;
  disabled?: boolean;
  onOpenChange: (nodeId: string | null) => void;
  onAddNodeAfter: (fromNodeId: string, action: WorkflowActionKind) => void;
}

function buildGroupedMenuItems(
  phaseGroups: WorkflowActionPhaseGroup[],
  getActionLabel: (action: WorkflowActionKind) => string,
  getPhaseLabel: (phase: WorkflowActionPhaseGroup['phase']) => string,
  onPick: (action: WorkflowActionKind) => void,
): MenuProps['items'] {
  return phaseGroups.map((group) => ({
    type: 'group' as const,
    label: getPhaseLabel(group.phase),
    children: group.actions.map((action) => ({
      key: action,
      label: getActionLabel(action),
      icon: WORKFLOW_ACTION_VISUAL[action]?.icon,
      onClick: () => onPick(action),
    })),
  }));
}

export function buildWorkflowActionMenuItems(
  phaseGroups: WorkflowActionPhaseGroup[],
  getActionLabel: (action: WorkflowActionKind) => string,
  getPhaseLabel: (phase: WorkflowActionPhaseGroup['phase']) => string,
  onPick: (action: WorkflowActionKind) => void,
): MenuProps['items'] {
  return buildGroupedMenuItems(
    phaseGroups,
    getActionLabel,
    getPhaseLabel,
    onPick,
  );
}

export function WorkflowFlowPlusOverlay({
  positions,
  overlayTransform,
  plusDropdownNodeId,
  phaseGroups,
  getActionLabel,
  getPhaseLabel,
  disabled = false,
  onOpenChange,
  onAddNodeAfter,
}: WorkflowFlowPlusOverlayProps) {
  if (disabled) {
    return null;
  }

  const transformKey = `${overlayTransform.scale.toFixed(3)}_${Math.round(
    overlayTransform.tx / 10,
  )}_${Math.round(overlayTransform.ty / 10)}`;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      {positions.map(({ id, left, top }) => {
        const menuItems = buildGroupedMenuItems(
          phaseGroups,
          getActionLabel,
          getPhaseLabel,
          (action) => onAddNodeAfter(id, action),
        );

        return (
          <Dropdown
            key={plusDropdownNodeId === id ? `${id}_${transformKey}` : id}
            menu={{ items: menuItems }}
            trigger={['click']}
            open={plusDropdownNodeId === id}
            onOpenChange={(open) => {
              const next = open ? id : null;
              if (next === plusDropdownNodeId) {
                return;
              }
              onOpenChange(next);
            }}
          >
            <div
              className="pointer-events-auto absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 shadow hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
              style={{ left, top }}
              onClick={(event) => event.stopPropagation()}
            >
              <PlusOutlined className="text-sm" />
            </div>
          </Dropdown>
        );
      })}
    </div>
  );
}
