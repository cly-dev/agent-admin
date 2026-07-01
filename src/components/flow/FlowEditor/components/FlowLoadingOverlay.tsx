import type { FC } from "react";

interface FlowLoadingOverlayProps {
  visible: boolean;
}

const FlowLoadingOverlay: FC<FlowLoadingOverlayProps> = ({ visible }) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-[1px]">
      <div className="flex flex-col items-center gap-2">
        <div className="relative h-10 w-10">
          {/* 简单旋转边框 */}
          <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-sky-500/80 border-r-transparent" />
          {/* 中心火箭 emoji */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="translate-y-[1px] text-[20px]">🚀</span>
          </div>
        </div>
        <span className="text-sm text-sky-50">
          正在加载流程数据，请稍候片刻...
        </span>
        <span className="text-xs text-sky-200/80">
          我们会根据 Flow 定义恢复画布节点和连线。
        </span>
      </div>
      <style>
        {`
          .animate-spin-slow {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </div>
  );
};

export default FlowLoadingOverlay;

