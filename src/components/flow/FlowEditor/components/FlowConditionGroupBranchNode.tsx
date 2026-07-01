import type { FC } from "react";
import type { Node } from "@antv/x6";
import type { FlowNodeData } from "@/types";

export interface FlowConditionGroupBranchNodeProps {
  node: Node;
}

export const FlowConditionGroupBranchNode: FC<FlowConditionGroupBranchNodeProps> = ({
  node,
}) => {
  const data = (node.getData() ?? {}) as FlowNodeData;
  const raw =
    (data.name as string | undefined) ??
    (node.attr("label/text") as string | undefined) ??
    "";
  const label = raw.trim() || "Group";

  return (
    <div className="h-full w-full bg-white">
      <div
        className="flex h-full w-full items-center justify-center border border-slate-300 bg-white px-2 text-[12px] text-slate-800"
        style={{ borderRadius: 0 }}
      >
        <span
          style={{
            maxWidth: 140,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};

