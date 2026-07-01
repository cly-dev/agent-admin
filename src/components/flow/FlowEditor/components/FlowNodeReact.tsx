import type { FC } from "react";
import type { Node } from "@antv/x6";
import type { FlowNodeData, FlowNodeType } from "@/types";
import { getCompactFlowTriggerTypeLine } from "@/utils/flowTriggerTypeUi";
import {
  NODE_ICON_MAP,
  NODE_STRIP_COLOR,
  NODE_ICON_COLOR,
} from "../utils/nodeVisualConfig";
import { useFlowEditorProgram } from "../context/FlowEditorProgramContext";

function getNodeType(node: Node): FlowNodeType {
  const data = (node.getData() ?? {}) as FlowNodeData;
  return (data.nodeType ?? "execute") as FlowNodeType;
}

export const FlowNodeReact: FC<{ node: Node }> = ({ node }) => {
  const data = (node.getData() ?? {}) as FlowNodeData;
  const nodeType = getNodeType(node);
  const { flowProgramTriggerType } = useFlowEditorProgram();

  const rawName =
    (data.name ??
      (node.attr("label/text") as string | undefined) ??
      (node.attr("text/text") as string | undefined) ??
      "") || " ";

  const description = data.description?.trim() ?? "";
  const programFlowTypeSecondaryLine =
    nodeType === "conditionCheck" || nodeType === "start"
      ? getCompactFlowTriggerTypeLine(flowProgramTriggerType)
      : "";
  const icon = NODE_ICON_MAP[nodeType] ?? null;
  const stripColor = NODE_STRIP_COLOR[nodeType];

  const name =
    nodeType === "start"
      ? (() => {
          const trimmed = rawName.trim();
          if (trimmed === "" || trimmed === "开始" || trimmed === "开始节点") {
            return "Trigger";
          }
          return rawName;
        })()
      : rawName;

  const isGroupBranch = nodeType === "conditionGroupBranch";
  const baseBorder = "border border-gray-200";

  return (
    <div
      className={[
        "flex h-full w-full items-stretch bg-white",
        isGroupBranch ? "rounded-none shadow-none" : "rounded-[10px] shadow-sm",
        "overflow-hidden text-[13px] text-gray-900",
        baseBorder,
      ].join(" ")}
    >
      {/* 左侧色条（所有节点都有，颜色按类型区分） */}
      <div
        style={{ backgroundColor: stripColor ?? "#e5e7eb" }}
        className="w-1.5 shrink-0"
      />

      <div className="flex flex-1 items-center px-3 py-2 gap-2">
        {/* 图标容器 */}
        {icon && (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[18px]"
            style={{
              backgroundColor: NODE_ICON_COLOR[nodeType].bg,
              color: NODE_ICON_COLOR[nodeType].fg,
            }}
          >
            {icon}
          </div>
        )}

        {/* 文本区域 */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className="text-[13px] font-medium text-slate-900"
            style={{
              maxWidth: 120,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </div>
          {(programFlowTypeSecondaryLine || description) && (
            <div className="mt-0.5 flex max-w-[180px] flex-col gap-0.5">
              {programFlowTypeSecondaryLine ? (
                <div className="truncate text-[11px] leading-snug text-slate-600">
                  {programFlowTypeSecondaryLine}
                </div>
              ) : null}
              {description ? (
                <div
                  className="text-[11px] leading-snug text-slate-500"
                  style={{
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                  }}
                >
                  {description}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

