import type { ReactNode } from 'react';
import { Tooltip } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

export interface FlowExecutionPeriodPanelProps {
    /** 画布统计信息 */
    canvasStats: {
        totalNodes: number;
        businessNodes: number;
        configuredNodes: number;
        unconfiguredNodes: number;
        /** 与保存校验一致：未完成配置的节点名称列表 */
        unconfiguredNodeNames: string[];
        validationResult: { isValid: boolean; errors: string[] } | null;
    };
}

/**
 * Flow 底部信息面板
 * 仅负责展示画布统计与结构验证结果（周期配置改由 Trigger 节点内置）
 */
function buildUnconfiguredTooltipContent(names: string[]): ReactNode {
    if (names.length === 0) {
        return null;
    }
    return (
        <div className="max-w-[280px] text-left text-xs">
            <div className="mb-1 font-medium">未完成配置的节点</div>
            <ul className="mb-0 max-h-[220px] list-disc overflow-y-auto pl-4">
                {names.map((name, index) => (
                    <li key={`${name}-${String(index)}`}>{name}</li>
                ))}
            </ul>
        </div>
    );
}

export function FlowExecutionPeriodPanel({
    canvasStats,
}: FlowExecutionPeriodPanelProps) {
    return (
        <div
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white/95 px-3 py-2 shadow-[0_6px_18px_rgba(15,23,42,0.16)]"
        >
            {/* 画布统计信息 */}
            <div className="flex items-center gap-3">
                {/* 节点数量 */}
                <Tooltip title={`共 ${canvasStats.totalNodes} 个节点（${canvasStats.businessNodes} 个业务节点）`}>
                    <div className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                        <InfoCircleOutlined className="text-gray-400" />
                        <span>{canvasStats.businessNodes} 节点</span>
                    </div>
                </Tooltip>
                
                {/* 配置状态 */}
                {canvasStats.businessNodes > 0 && (
                    <Tooltip
                        title={
                            canvasStats.unconfiguredNodes > 0
                                ? buildUnconfiguredTooltipContent(
                                      canvasStats.unconfiguredNodeNames,
                                  )
                                : '所有业务节点均已配置'
                        }
                    >
                        <div className="flex items-center gap-1 text-xs">
                            {canvasStats.unconfiguredNodes > 0 ? (
                                <>
                                    <CloseCircleOutlined className="text-orange-500" />
                                    <span className="text-orange-600 cursor-pointer">
                                        {canvasStats.unconfiguredNodes} 未配置
                                    </span>
                                </>
                            ) : (
                                <>
                                    <CheckCircleOutlined className="text-green-500" />
                                    <span className="text-green-600">已配置</span>
                                </>
                            )}
                        </div>
                    </Tooltip>
                )}

                {/* 验证状态 */}
                {canvasStats.validationResult && (
                    <Tooltip
                        title={
                            canvasStats.validationResult.isValid
                                ? 'Flow 结构验证通过'
                                : canvasStats.validationResult.errors.length > 0
                                ? canvasStats.validationResult.errors.slice(0, 3).join('；') +
                                  (canvasStats.validationResult.errors.length > 3
                                      ? `（共${canvasStats.validationResult.errors.length}个问题）`
                                      : '')
                                : 'Flow 结构验证失败'
                        }
                    >
                        <div className="flex items-center gap-1 text-xs">
                            {canvasStats.validationResult.isValid ? (
                                <>
                                    <CheckCircleOutlined className="text-green-500" />
                                    <span className="text-green-600">验证通过</span>
                                </>
                            ) : (
                                <>
                                    <CloseCircleOutlined className="text-red-500" />
                                    <span className="text-red-600 cursor-pointer">验证失败</span>
                                </>
                            )}
                        </div>
                    </Tooltip>
                )}
            </div>
        </div>
    );
}
