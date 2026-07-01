import { useEffect } from "react";

export interface UseFlowSelectionOptions {
  selectedIdsRef: React.MutableRefObject<Set<string>>;
  handleDeleteSelected: () => void;
}

/**
 * 选择管理 Hook
 * 负责键盘删除处理
 */
export function useFlowSelection(options: UseFlowSelectionOptions): void {
  const { selectedIdsRef, handleDeleteSelected } = options;

  /**
   * 键盘：Delete / Backspace 删除选中
   */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (selectedIdsRef.current.size === 0) return;
      // 节点属性抽屉打开时，Delete/Backspace 仅用于表单编辑，不触发节点删除。
      if (document.querySelector(".ant-drawer-open")) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;
      e.preventDefault();
      handleDeleteSelected();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedIdsRef, handleDeleteSelected]);
}
