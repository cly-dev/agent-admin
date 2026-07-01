import {
  EditOutlined,
  // CopyOutlined,
  DeleteOutlined,
  // StopOutlined,
} from "@ant-design/icons";
import { JSX } from "react";

export interface FlowContextMenuProps {
  x: number;
  y: number;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onToggleDisabled: () => void;
}

/**
 * 右键菜单组件
 */
export function FlowContextMenu({
  x,
  y,
  onEdit,
  // onCopy,
  onDelete,
  // _onToggleDisabled,
}: FlowContextMenuProps): JSX.Element {
  return (
    <div
      className="fixed z-[1000] bg-white rounded shadow-lg border border-gray-200 py-1 min-w-[120px]"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-sm"
        onClick={onEdit}
      >
        <EditOutlined /> 编辑属性
      </div>
      {/* <div
        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-sm"
        onClick={onCopy}
      >
        <CopyOutlined /> 复制
      </div> */}
      <div
        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-sm text-red-600"
        onClick={onDelete}
      >
        <DeleteOutlined /> 删除
      </div>
      {/* <Divider className="my-1" /> */}
      {/* <div
        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-sm"
        onClick={onToggleDisabled}
      >
        <StopOutlined /> 禁用/启用
      </div> */}
    </div>
  );
}
