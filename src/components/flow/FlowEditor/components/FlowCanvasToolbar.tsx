import { Tooltip } from 'antd';
import {
    ZoomInOutlined,
    ZoomOutOutlined,
    CompressOutlined,
    ClearOutlined,
} from '@ant-design/icons';
import type { FlowCanvasOrientation } from '../utils/flowCanvasFormatter';

export interface FlowCanvasToolbarProps {
    zoomPercent: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomFit: () => void;
    onClear: () => void;
    orientation: FlowCanvasOrientation;
    onOrientationChange: (orientation: FlowCanvasOrientation) => void;
    /** fixed：视口底部固定；canvas：相对画布容器底部 */
    placement?: 'fixed' | 'canvas';
}

export function FlowCanvasToolbar({
    zoomPercent,
    onZoomIn,
    onZoomOut,
    onZoomFit,
    onClear,
    orientation,
    onOrientationChange,
    placement = 'fixed',
}: FlowCanvasToolbarProps): JSX.Element {
    const positionClass =
        placement === 'canvas'
            ? 'absolute bottom-3 left-1/2 z-20 -translate-x-1/2'
            : 'fixed bottom-4 left-1/2 z-30 -translate-x-1/2';

    return (
        <div
            className={`pointer-events-auto ${positionClass} flex items-center gap-0 rounded-lg border border-gray-200 bg-white/95 px-2 py-1 backdrop-blur-sm`}
        >
            <Tooltip title="缩小" placement="top">
                <button
                    type="button"
                    className="cursor-pointer flex h-7 w-7 items-center justify-center text-xs text-gray-500 border-0 bg-transparent hover:text-blue-600"
                    onClick={onZoomOut}
                >
                    <ZoomOutOutlined />
                </button>
            </Tooltip>
            <div className="mx-1 h-5 w-px bg-gray-200" />
            <div className="px-2 text-[11px] font-mono text-gray-600 min-w-[40px] text-center">
                {zoomPercent}%
            </div>
            <div className="mx-1 h-5 w-px bg-gray-200" />
            <Tooltip title="放大" placement="top">
                <button
                    type="button"
                    className="cursor-pointer flex h-7 w-7 items-center justify-center text-xs text-gray-500 border-0 bg-transparent hover:text-blue-600"
                    onClick={onZoomIn}
                >
                    <ZoomInOutlined />
                </button>
            </Tooltip>
            <Tooltip title="适应画布" placement="top">
                <button
                    type="button"
                    className="ml-1 flex h-7 items-center justify-center px-3 text-[11px] font-mono text-gray-600 border-0 bg-transparent hover:text-blue-600"
                    onClick={onZoomFit}
                >
                    <CompressOutlined className="mr-1 text-xs" />
                </button>
            </Tooltip>
            <div className="mx-1 h-5 w-px bg-gray-200" />
            {/* 布局方向切换 */}
            <Tooltip title="纵向布局" placement="top">
                <button
                    type="button"
                    className={`cursor-pointer ml-1 flex h-7 items-center justify-center px-2 text-[11px] border-0 bg-transparent ${
                        orientation === 'vertical'
                            ? 'text-blue-600 font-semibold'
                            : 'text-gray-500 hover:text-blue-600'
                    }`}
                    onClick={() => onOrientationChange('vertical')}
                >
                    纵向
                </button>
            </Tooltip>
            <Tooltip title="横向布局" placement="top">
                <button
                    type="button"
                    className={`cursor-pointer flex h-7 items-center justify-center px-2 text-[11px] border-0 bg-transparent ${
                        orientation === 'horizontal'
                            ? 'text-blue-600 font-semibold'
                            : 'text-gray-500 hover:text-blue-600'
                    }`}
                    onClick={() => onOrientationChange('horizontal')}
                >
                    横向
                </button>
            </Tooltip>
            <div className="mx-1 h-5 w-px bg-gray-200" />
            <Tooltip title="清空画布" placement="top">
                <button
                    type="button"
                    className="cursor-pointer ml-1 flex h-7 items-center justify-center px-3 text-[11px] text-red-500 border-0 bg-transparent hover:text-red-600"
                    onClick={onClear}
                >
                    <ClearOutlined className="mr-1 text-xs" />
                </button>
            </Tooltip>
        </div>
    );
}

