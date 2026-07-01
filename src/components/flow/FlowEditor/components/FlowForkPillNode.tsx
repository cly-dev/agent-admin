import type { FC } from "react";
import React from "react";
import type { Node } from "@antv/x6";
import type { FlowNodeData } from "@/types";

interface FlowForkPillNodeProps {
  node: Node;
}

export const FlowForkPillNode: FC<FlowForkPillNodeProps> = ({ node }) => {
  const data = (node.getData() ?? {}) as FlowNodeData;
  // label 里一般是 “是 YES” / “否 NO”
  const label =
    (node.attr("label/text") as string | undefined) ??
    (data.name as string | undefined) ??
    "";

  const isYes = /yes/i.test(label) || label.includes("是");
  const isNo = /no/i.test(label) || label.includes("否");

  const borderColor = isYes ? "#bbf7d0" : isNo ? "#fecaca" : "#e5e7eb";
  const textColor = isYes ? "#16a34a" : isNo ? "#dc2626" : "#6b7280";
  const dotColor = isYes ? "#16a34a" : isNo ? "#dc2626" : "#9ca3af";

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] shadow-sm"
      style={{
        border: `1.5px solid ${borderColor}`,
      }}
    >
      {/* 左侧状态圆点 */}
      <span
        className="inline-block h-[7px] w-[7px] rounded-full"
        style={{ backgroundColor: dotColor }}
      />
      {/* 标签文字 */}
      <span
        className="font-mono text-[11px]"
        style={{ color: textColor }}
      >
        {label || (isYes ? "YES" : isNo ? "NO" : "BRANCH")}
      </span>
    </div>
  );
};

