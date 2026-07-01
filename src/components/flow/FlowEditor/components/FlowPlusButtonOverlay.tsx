import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { FlowNodeType } from "@/types";
import { NODE_TYPES } from "../utils/nodeConfig";

export interface PlusButtonPosition {
  id: string;
  left: number;
  top: number;
}

export interface FlowPlusButtonOverlayProps {
  positions: PlusButtonPosition[];
  overlayTransform: { scale: number; tx: number; ty: number };
  plusDropdownNodeId: string | null;
  onOpenChange: (nodeId: string | null) => void;
  onAddNodeAfter: (fromNodeId: string, nodeType: FlowNodeType) => void;
}

/**
 * 加号按钮覆盖层组件
 * 显示在无输出连线的节点右侧，用于快速添加下一节点
 */
export function FlowPlusButtonOverlay({
  positions,
  overlayTransform,
  plusDropdownNodeId,
  onOpenChange,
  onAddNodeAfter,
}: FlowPlusButtonOverlayProps) {
  // 粗粒度量化：避免画布 translate/scale 时 key 过于频繁变化导致 Dropdown 内部重复触发回调
  const transformKey = `${overlayTransform.scale.toFixed(3)}_${Math.round(
    overlayTransform.tx / 10,
  )}_${Math.round(overlayTransform.ty / 10)}`;
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden z-[1]"
      aria-hidden
    >
      {positions.map(({ id, left, top }) => {
        const menuItems: MenuProps["items"] = NODE_TYPES
          // 加号不允许新增开始节点或结构性节点，仅保留业务节点
          .filter(
            ({ nodeType }) =>
              nodeType !== "start" &&
              nodeType !== ("branch" as FlowNodeType) &&
              nodeType !== ("conditionGroupBranch" as FlowNodeType)
          )
          .map(({ nodeType, label, icon }) => ({
            key: nodeType,
            label,
            icon,
            onClick: () => onAddNodeAfter(id, nodeType),
          }));
        return (
          <Dropdown
            // 在画布平移/缩放时，强制让当前打开的 Dropdown remount，
            // 让 antd 在新的 trigger 位置重新计算 popup 坐标
            key={plusDropdownNodeId === id ? `${id}_${transformKey}` : id}
            menu={{ items: menuItems }}
            trigger={["click"]}
            open={plusDropdownNodeId === id}
            onOpenChange={(open) => {
              const next = open ? id : null;
              // next 不变化时不触发 setState，避免 Dropdown 重挂载导致的重复循环
              if (next === plusDropdownNodeId) return;
              onOpenChange(next);
            }}
          >
            <div
              className="absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-white border border-gray-300 shadow cursor-pointer pointer-events-auto hover:bg-blue-50 hover:border-blue-400 text-gray-600 hover:text-blue-600"
              style={{ left, top }}
              onClick={(e) => e.stopPropagation()}
            >
              <PlusOutlined className="text-sm" />
            </div>
          </Dropdown>
        );
      })}
    </div>
  );
}
