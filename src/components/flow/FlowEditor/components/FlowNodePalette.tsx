import type { FC } from "react";
import type { FlowNodeType } from "@/types";
import { NODE_TYPES } from "../utils/nodeConfig";
import { NODE_MENU_STYLE } from "../utils/nodeVisualConfig";

export interface FlowNodePaletteProps {
  onAddNode: (preset: string, nodeType: FlowNodeType, label: string) => void;
}

export const FlowNodePalette: FC<FlowNodePaletteProps> = ({ onAddNode }) => {
  return (
    <div
      className="hidden w-20 flex-col items-center border-r border-gray-200 bg-white py-3 shadow-sm md:flex"
      style={{ borderRight: "1px solid #e5e7eb" }}
    >
      <div className="mb-2 text-[12px] font-mono uppercase tracking-[0.12em] text-gray-400 ">
        节点
      </div>
      <div className="flex flex-1 flex-col items-center gap-1">
        {NODE_TYPES.map(({ nodeType, preset, label, icon }) => {
          const style = NODE_MENU_STYLE[nodeType] ?? NODE_MENU_STYLE.execute;
          return (
            <div
              key={nodeType}
              draggable
              onDragStart={(event) => {
                const payload = JSON.stringify({
                  preset,
                  nodeType,
                  label,
                });
                event.dataTransfer.setData(
                  "application/x-flow-node",
                  payload
                );
                event.dataTransfer.effectAllowed = "copy";
              }}
              className="flex w-[56px] flex-col items-center gap-1 rounded-md border border-transparent px-1.5 py-2 text-[11px] text-gray-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
              onClick={() => onAddNode(preset, nodeType, label)}
            >
              {/* 迷你节点卡片：左侧色条 + 图标（去掉灰色背景和阴影） */}
              <span className="flex h-10 w-full items-center rounded-[6px]">
                <span
                  className="h-full w-1 rounded-l-[6px]"
                  style={{ backgroundColor: style.strip }}
                />
                <span
                  className="flex h-full flex-1 items-center justify-center rounded-r-[6px] text-[14px]"
                  style={{
                    backgroundColor: style.iconBg,
                    color: style.iconFg,
                  }}
                >
                  {icon}
                </span>
              </span>
              <span className="truncate text-[11px] font-medium">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

