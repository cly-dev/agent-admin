import { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import type { Ref } from 'react';
import { message } from 'antd';
import type {
    FlowNodeData,
    FlowNodeType,
} from '@/types';
import { applyNodeStatusStyle } from './utils/nodeConfig';
import { type FlowNodeBackendPayload, loadFlowFromBackend, buildBackendPayload } from './utils/flowDataTransformer';
import { validateFlowStructure } from '@/utils/flowValidation';
import { resolveWaitTimerType } from '@/utils/flowWaitType';
import {
    getUnconfiguredBusinessNodeNames,
    type FlowGraphPayloadNodeForm,
} from '@/utils/flowUnconfiguredNodes';
import { useFlowGraph } from './hooks/useFlowGraph';
import { useFlowSelection } from './hooks/useFlowSelection';
import { useFlowNodeOperations } from './hooks/useFlowNodeOperations';
import { FlowContextMenu } from './components/FlowContextMenu';
import { FlowPlusButtonOverlay } from './components/FlowPlusButtonOverlay';
import { FlowCanvasToolbar } from './components/FlowCanvasToolbar';
import { FlowExecutionPeriodPanel } from './components/FlowExecutionPeriodPanel';
import type { Graph, Node } from '@antv/x6';
import type { FlowCanvasOrientation } from './utils/flowCanvasFormatter';
import { formatCanvasSilent } from './utils/flowCanvasFormatter';
import {
    FLOW_CANVAS_MIN_HEIGHT_PX,
    FLOW_CANVAS_VIEWPORT_OFFSET_PX,
} from './constants/layout';
import './utils/nodeShapes';
import './utils/reactNodeShapes';
import { useFlowAttributes } from '@/components/FlowConditionDrawer/hooks/useFlowAttributes';
import { FlowEditorProgramProvider } from './context/FlowEditorProgramContext';

export interface FlowEditorProps {
    /** 程序名称（用于保存时一起提交） */
    programName?: string;
    /** 流程定义上的 Flow 触发类型（驱动 Trigger / Check 条件编辑模式） */
    flowProgramTriggerType?: FlowTriggerType | string | null;
    /** 流程定义上的实体类型（用于按实体拉取事件定义） */
    flowEntityType?: string | null;
    /** 实时回传触发器周期配置（用于右上角/标题显示） */
    onTriggerConfigChange?: (config: {
        triggerType: FlowWorkTriggerType | undefined;
        cronExpr: string;
    }) => void;
    /** 画布节点/连线变化后的后端 payload JSON（用于编排页「未保存」检测） */
    onBackendPayloadJsonChange?: (payloadJson: string) => void;
}

export interface FlowValidationResult {
    valid: boolean;
    errors: string[];
}

export interface FlowEditorHandle {
    /** 获取转换后给后端的 JSON 字符串（包含节点入口、出口、表单） */
    getBackendPayloadJson: () => string;
    /** 校验当前 Flow 配置是否符合基础规则（起止节点、命名等） */
    validateFlow: () => FlowValidationResult;
    /** 重置画布：清空所有节点和连线，并重置内部状态 */
    resetFlow: () => void;
    /** 从后端数据加载 Flow 到画布 */
    loadFromBackend: (detail: FlowDefinitionDetail) => void;
    /** 获取执行周期配置 */
    getTriggerConfig: () => {
        triggerType: FlowWorkTriggerType | undefined;
        cronExpr: string;
    };
    /** 设置执行周期配置 */
    setTriggerConfig: (
        triggerType: FlowWorkTriggerType | undefined,
        cronExpr: string
    ) => void;
}


function InnerFlowEditor(_props: FlowEditorProps, ref: Ref<FlowEditorHandle>) {
    const {
        onTriggerConfigChange,
        onBackendPayloadJsonChange,
        flowProgramTriggerType,
        flowEntityType,
    } = _props;
    const onBackendPayloadJsonChangeRef = useRef(onBackendPayloadJsonChange);
    onBackendPayloadJsonChangeRef.current = onBackendPayloadJsonChange;
    const stableOnBackendPayloadJsonChange = useMemo(
        () => (payloadJson: string) => {
            onBackendPayloadJsonChangeRef.current?.(payloadJson);
        },
        []
    );
    const containerRef = useRef<HTMLDivElement | null>(null);
    /** 当前选中的节点/边 ID，用于删除和键盘操作 */
    const selectedIdsRef = useRef<Set<string>>(new Set());
    
    // 获取属性列表（用于属性 key 迁移）

    /** 转换后给后端的 JSON（节点含入口、出口、表单），调试用，目前不展示 */
    const [_backendPayloadJson, setBackendPayloadJson] = useState<string>('{}');

    /** 当前选中节点 ID（由 NodePropertyDrawer 通过 onClose 等回调配合控制） */
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    /** 双击 condition 组分支节点时，抽屉应优先定位的条件组 id */
    const [preferredConditionGroupId, setPreferredConditionGroupId] = useState<string | null>(null);

    /** 触发类型 */
    const [triggerType, setTriggerType] = useState<FlowWorkTriggerType | undefined>(undefined);
    /** 后端 cronExpr（Quartz） */
    const [cronExpr, setCronExpr] = useState<string>('');

    /** 右键菜单 */
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        nodeId: string;
    } | null>(null);

    /** 无输出连线的节点 ID 列表（用于显示加号） */
    const nodeIdsWithNoOutputRef = useRef<string[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_nodeIdsWithNoOutput, setNodeIdsWithNoOutput] = useState<string[]>([]);

    /** 加号按钮位置（图坐标） */
    const [plusButtonPositions, setPlusButtonPositions] = useState<
        { id: string; left: number; top: number }[]
    >([]);

    /** Overlay transform（与画布同步，用于加号跟随） */
    const [overlayTransform, setOverlayTransform] = useState({
        scale: 1,
        tx: 0,
        ty: 0,
    });

    /** 加号下拉菜单当前打开的节点 ID */
    const [plusDropdownNodeId, setPlusDropdownNodeId] = useState<string | null>(null);

    /** 当前缩放百分比（仅用于 UI 展示） */
    const [zoomPercent, setZoomPercent] = useState<number>(100);

    /** 画布统计信息 */
    const [canvasStats, setCanvasStats] = useState<{
        totalNodes: number;
        businessNodes: number;
        configuredNodes: number;
        unconfiguredNodes: number;
        unconfiguredNodeNames: string[];
        validationResult: { isValid: boolean; errors: string[] } | null;
    }>({
        totalNodes: 0,
        businessNodes: 0,
        configuredNodes: 0,
        unconfiguredNodes: 0,
        unconfiguredNodeNames: [],
        validationResult: null,
    });

    const updatePlusAndOverlayRef = useRef<() => void>(() => {});

    /** 画布方向（纵向 / 横向） */
    const [canvasOrientation, setCanvasOrientationState] = useState<FlowCanvasOrientation>('vertical');
    const canvasMinHeight = `max(${FLOW_CANVAS_MIN_HEIGHT_PX}px, calc(100vh - ${FLOW_CANVAS_VIEWPORT_OFFSET_PX}px))`;

    // 初始化画布
    const { graphRef } = useFlowGraph({
        containerRef: containerRef as React.RefObject<HTMLDivElement>,
        selectedIdsRef,
        setSelectedNodeId,
        setPreferredConditionGroupId,
        setContextMenu,
        setBackendPayloadJson,
        setNodeIdsWithNoOutput,
        setPlusButtonPositions,
        nodeIdsWithNoOutputRef,
        updatePlusAndOverlayRef,
        setOverlayTransform,
        setReady,
        onBackendPayloadJsonChange: stableOnBackendPayloadJsonChange,
    });

    /** 分组分支打开后仅首帧需要 preferred；子组件 layout 同步完成后再清空，避免 initialValues 长期带 preferred */
    useEffect(() => {
        if (preferredConditionGroupId != null) {
            setPreferredConditionGroupId(null);
        }
    }, [selectedNodeId, preferredConditionGroupId]);

    // 节点操作
    const {
        handleAddNode,
        handleAddNodeAfter,
        handleDeleteSelected,
        handleDeleteCurrentNode,
        handleApplyProperty,
        handleContextCopy,
    } = useFlowNodeOperations({
        graphRef,
        selectedIdsRef,
        setHasSelection,
        selectedNodeId,
        setSelectedNodeId,
        canvasOrientation,
    });

    // 键盘删除处理
    useFlowSelection({
        selectedIdsRef,
        handleDeleteSelected,
    });

    /** 与 `deriveWaitTimerType` 一致：抽屉「等待方式」仅由统一规则从节点数据推导 */
    const resolveWaitDrawerWaitType = (data: FlowNodeData, nodeType: FlowNodeType): FlowWaitType | undefined => {
        if (nodeType !== 'wait') return data.waitType;
        return resolveWaitTimerType(data as unknown as Record<string, unknown>);
    };

    /** 属性弹窗初始值（由选中节点推导，供 NodePropertyDrawer 使用） */
    const getPropertyDrawerInitialValues = (): NodePropertyFormValues | undefined => {
        if (!selectedNodeId || !graphRef.current) return undefined;
        const node = graphRef.current.getCellById(selectedNodeId) as Node | undefined;
        if (!node) return undefined;
        const data = (node.getData() ?? {}) as FlowNodeData;
        const dataWithRuleRemark = data as FlowNodeData & { ruleRemark?: string };

        // 兼容历史数据：根据节点名称推断等待 / 等待事件节点类型
        const labelText =
            (node.attr('label/text') as string | undefined) ??
            (node.attr('text/text') as string | undefined) ??
            '';
        const rawName = data.name ?? labelText;

        const nodeType: FlowNodeType = data.nodeType ?? 'execute';

        return {
            id: node.id,
            nodeType,
            name: rawName,
            label: rawName,
            description: data.description,
            ruleRemark: dataWithRuleRemark.ruleRemark,
            status: data.status ?? 'unconfig',
            disabled: data.disabled ?? false,
            waitDuration: data.waitDuration,
            waitUnit: data.waitUnit,
            waitType: resolveWaitDrawerWaitType(data, nodeType),
            waitEventCategory: data.waitEventCategory,
            waitEventKey: data.waitEventKey,
            conditionGroup: data.conditionGroup,
            // 条件检查节点的多条件组配置一并传给属性抽屉，保证回显
            conditionGroups: data.conditionGroups,
            initialActiveConditionGroupId:
                nodeType === 'conditionCheck'
                    ? preferredConditionGroupId ?? undefined
                    : undefined,
            executeGroup: data.executeGroup,
            customPropsList: data.customProps
                ? Object.entries(data.customProps).map(([key, value]) => ({
                      key,
                      value: String(value ?? ''),
                  }))
                : [],
        };
    };

    /** 右键菜单：编辑属性（分支节点不允许编辑） */
    const handleContextEdit = (): void => {
        if (!contextMenu) return;
        const graph = graphRef.current;
        if (!graph) return;
        const node = graph.getCellById(contextMenu.nodeId) as Node | undefined;
        if (!node?.isNode()) {
            setContextMenu(null);
            return;
        }
        const data = (node.getData() ?? {}) as FlowNodeData;
        if (data.nodeType === 'branch' || data.nodeType === 'conditionGroupBranch') {
            // 分支节点不可编辑属性，直接关闭菜单
            setContextMenu(null);
            return;
        }
        setSelectedNodeId(contextMenu.nodeId);
        setPreferredConditionGroupId(null);
        setContextMenu(null);
    };

    /** 右键菜单：删除 */
    const handleContextDelete = (): void => {
        const graph = graphRef.current;
        if (!graph || !contextMenu) return;
        const collectDescendantNodeIds = (rootNodeId: string): string[] => {
            const visited = new Set<string>();
            const queue: string[] = [rootNodeId];

            while (queue.length > 0) {
                const current = queue.shift()!;
                if (visited.has(current)) continue;
                visited.add(current);

                graph
                    .getEdges()
                    .filter(e => e.getSourceCellId() === current)
                    .forEach(e => {
                        const targetId = e.getTargetCellId();
                        const targetCell = graph.getCellById(targetId);
                        if (targetCell?.isNode() && !visited.has(targetId)) {
                            queue.push(targetId);
                        }
                    });
            }

            return Array.from(visited);
        };

        const node = graph.getCellById(contextMenu.nodeId) as Node | undefined;
        if (!node?.isNode()) {
            setContextMenu(null);
            return;
        }
        const data = (node.getData() ?? {}) as FlowNodeData;
        if (data.nodeType === 'start') {
            message.warning('Trigger 节点不可删除');
            setContextMenu(null);
            return;
        }
        if (data.nodeType === 'branch' || data.nodeType === 'conditionGroupBranch') {
            message.warning('分支节点不可单独删除');
            setContextMenu(null);
            return;
        }
        const toRemoveIds = collectDescendantNodeIds(contextMenu.nodeId).filter(id => {
            const cell = graph.getCellById(id);
            if (!cell?.isNode()) return false;
            const nd = (cell.getData() ?? {}) as FlowNodeData;
            return nd.nodeType !== 'start';
        });
        toRemoveIds.forEach(id => {
            const cell = graph.getCellById(id);
            if (cell?.isNode()) graph.removeCell(cell);
        });
        setContextMenu(null);
        setSelectedNodeId(id => (id === contextMenu.nodeId ? null : id));
        message.success(`已删除 ${toRemoveIds.length} 个节点`);
    };

    /** 右键菜单：禁用/启用 */
    const handleContextToggleDisabled = (): void => {
        const graph = graphRef.current;
        if (!graph || !contextMenu) return;
        const node = graph.getCellById(contextMenu.nodeId) as Node | undefined;
        if (!node?.isNode()) return;
        const data = (node.getData() ?? {}) as FlowNodeData;
        const next: FlowNodeData = { ...data, disabled: !data.disabled };
        node.setData(next);
        applyNodeStatusStyle(node, next);
        setContextMenu(null);
        message.success(next.disabled ? '已禁用' : '已启用');
    };

    /** 关闭右键菜单（点击空白） */
    useEffect(() => {
        if (!contextMenu) return;
        const onClose = () => setContextMenu(null);
        document.addEventListener('click', onClose);
        return () => document.removeEventListener('click', onClose);
    }, [contextMenu]);

    const updateZoomPercent = (graph: Graph): void => {
        const currentZoom = graph.zoom();
        setZoomPercent(Math.round(currentZoom * 100));
    };

    function handleCanvasClear(): void {
        const graph = graphRef.current;
        if (!graph) return;
        graph.clearCells();
        message.info('画布已清空');
    }

    function handleZoomIn(): void {
        const graph = graphRef.current;
        if (!graph) return;
        const next = Math.min(graph.zoom() + 0.1, 3);
        graph.zoomTo(next);
        updateZoomPercent(graph);
    }

    function handleZoomOut(): void {
        const graph = graphRef.current;
        if (!graph) return;
        const next = Math.max(graph.zoom() - 0.1, 0.5);
        graph.zoomTo(next);
        updateZoomPercent(graph);
    }

    function handleZoomFit(): void {
        const graph = graphRef.current;
        if (!graph) return;
        graph.zoomToFit({ padding: 20 });
        updateZoomPercent(graph);
    }

    function handleOrientationChange(next: FlowCanvasOrientation): void {
        setCanvasOrientationState(next);
        const graph = graphRef.current;
        if (!graph) return;
        // 使用新的方向重新格式化画布
        formatCanvasSilent(graph, next);
        // 重新计算加号 overlay 位置，使加号始终贴合当前方向下的节点
        if (typeof updatePlusAndOverlayRef.current === 'function') {
            updatePlusAndOverlayRef.current();
        }
    }

    const validateFlow = (): FlowValidationResult => {
        try {
            const parsed = JSON.parse(_backendPayloadJson) as { nodes?: FlowNodeBackendPayload[] };
            const nodes = parsed.nodes ?? [];

            if (nodes.length === 0) {
                return {
                    valid: false,
                    errors: ['画布中没有任何节点，请先创建流程节点。'],
                };
            }

            const errors: string[] = [];

            const startNodes = nodes.filter(node => node.nodeType === 'start');

            if (startNodes.length === 0) {
                errors.push('缺少开始节点（start）。');
            }
            nodes.forEach((node, index) => {
                const name = (node.form.name as string | undefined) ?? '';
                if (!name.trim()) {
                    errors.push(`第 ${index + 1} 个节点未设置名称。`);
                }
                if (node.nodeType === 'start' && node.outlets.length === 0) {
                    errors.push(`开始节点「${name || node.id}」没有任何后继连线。`);
                }
            });

            return {
                valid: errors.length === 0,
                errors,
            };
        } catch {
            return {
                valid: false,
                errors: ['内部数据格式异常，无法校验，请刷新页面后重试。'],
            };
        }
    };

    const resetFlow = (): void => {
        const graph = graphRef.current;
        if (!graph) {
            message.error('画布尚未初始化，无法重置');
            return;
        }
        graph.clearCells();
        setSelectedNodeId(null);
        setContextMenu(null);
        nodeIdsWithNoOutputRef.current = [];
        setNodeIdsWithNoOutput([]);
        setPlusButtonPositions([]);
        setGraphJson('{}');
        setBackendPayloadJson('{}');
        setTriggerType(undefined);
        setCronExpr('');
        message.success('画布已重置');
    };

    const loadFromBackend = (detail: FlowDefinitionDetail): void => {
        const graph = graphRef.current;
        if (!graph) {
            message.error('画布尚未初始化，无法加载数据');
            return;
        }
        try {
            loadFlowFromBackend(graph, detail);
        } catch (error) {
            const err = error as { message?: string };
            message.error(err?.message || '加载流程数据失败');
        }
    };

    // 向外暴露实例方法
    useImperativeHandle(
        ref,
        () => ({
            getBackendPayloadJson: () => _backendPayloadJson,
            validateFlow,
            resetFlow,
            loadFromBackend,
            getTriggerConfig: () => ({
                triggerType,
                cronExpr,
            }),
            setTriggerConfig: (
                newTriggerType: FlowWorkTriggerType | undefined,
                newCronExpr: string
            ) => {
                setTriggerType(newTriggerType);
                setCronExpr(newCronExpr);
            },
        }),
        [
            _backendPayloadJson,
            triggerType,
            cronExpr,
        ]
    );

    // 触发器周期配置变化时回传给父级，实现实时展示
    useEffect(() => {
        onTriggerConfigChange?.({ triggerType, cronExpr });
    }, [onTriggerConfigChange, triggerType, cronExpr]);

    // 监听 X6 内部缩放事件（例如 Ctrl + 滚轮），同步百分比显示
    useEffect(() => {
        const graph = graphRef.current;
        if (!graph) return;
        const onScale = () => {
            updateZoomPercent(graph);
        };
        graph.on('scale', onScale);
        return () => {
            graph.off('scale', onScale);
        };
    }, [graphRef]);

    // 实时监听画布变化，更新统计信息
    useEffect(() => {
        const graph = graphRef.current;
        if (!graph) return;

        const updateStats = () => {
            const nodes = graph.getNodes();
            const allNodes = nodes;

            // 过滤业务节点（排除分支节点）
            const businessNodes = allNodes.filter((node) => {
                const data = (node.getData() ?? {}) as FlowNodeData;
                return data.nodeType !== 'branch';
            });

            let validationResult: { isValid: boolean; errors: string[] } | null = null;
            let unconfiguredNodeNames: string[] = [];

            try {
                const payload = buildBackendPayload(graph);
                unconfiguredNodeNames = getUnconfiguredBusinessNodeNames(
                    payload.nodes.map((node) => ({
                        id: node.id,
                        form: node.form as FlowGraphPayloadNodeForm,
                    })),
                );

                const nodesForValidation = payload.nodes.map((node) => ({
                    id: node.id,
                    nodeType: String(node.nodeType),
                    inlets: node.inlets,
                    outlets: node.outlets,
                    form: {
                        ...node.form,
                        name: node.form.name,
                        nodeType: node.form.nodeType,
                    } as { name?: string; nodeType?: string } & Record<string, unknown>,
                }));
                validationResult = validateFlowStructure(nodesForValidation, {
                    flowProgramTriggerType: flowProgramTriggerType ?? null,
                });
            } catch {
                validationResult = { isValid: false, errors: ['验证失败'] };
            }

            const unconfiguredCount = unconfiguredNodeNames.length;
            const configuredCount = businessNodes.length - unconfiguredCount;

            setCanvasStats({
                totalNodes: allNodes.length,
                businessNodes: businessNodes.length,
                configuredNodes: configuredCount,
                unconfiguredNodes: unconfiguredCount,
                unconfiguredNodeNames,
                validationResult,
            });
        };

        // 初始更新
        updateStats();

        // 监听画布变化
        const onCellsChanged = () => {
            updateStats();
        };

        graph.on('cell:added', onCellsChanged);
        graph.on('cell:removed', onCellsChanged);
        graph.on('cell:changed', onCellsChanged);

        return () => {
            graph.off('cell:added', onCellsChanged);
            graph.off('cell:removed', onCellsChanged);
            graph.off('cell:changed', onCellsChanged);
        };
    }, [graphRef, flowProgramTriggerType]);

    return (
        <FlowEditorProgramProvider flowProgramTriggerType={flowProgramTriggerType}>
        <div className="flex h-full flex-col bg-[#f5f7fa] w-full">
            {/* 主体：左侧节点栏 + 画布区域 */}
            <div className="flex min-h-0 flex-1">
                {/* 画布 + 右侧区域占位 */}
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="relative flex min-h-0 flex-1">
                        {/* 画布区域 */}
                        <div
                            className="relative flex w-full flex-1 itms-stretch justify-stretch"
                            style={{
                                minHeight: canvasMinHeight,
                                height: '100%',
                            }}
                        >
                            <div
                                className="relative flex-1 overflow-hidden  border border-gray-200 shadow-sm w-full h-full"
                                style={{
                                    backgroundColor: '#f0f4f9',
                                    backgroundImage:
                                        'radial-gradient(circle, rgba(22,119,255,0.12) 1px, transparent 1px)',
                                    backgroundSize: '20px 20px',
                                }}
                            >
                                <div
                                    ref={containerRef}
                                    className="flow-editor-canvas absolute inset-0"
                                />
                                {/* Get Trigger 空状态引导（无 Trigger 时展示） */}
                                {(() => {
                                    const graph = graphRef.current;
                                    const hasTrigger =
                                        !!graph &&
                                        graph
                                            .getNodes()
                                            .some(
                                                n =>
                                                    ((n.getData() ?? {}) as FlowNodeData)
                                                        .nodeType === 'start'
                                            );

                                    if (hasTrigger) return null;

                                    return (
                                        <div className="absolute inset-0 z-20 flex items-center justify-center">
                                            <div className="w-[420px] rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur">
                                                <div className="text-[18px] font-semibold text-slate-900">
                                                    Start here
                                                </div>
                                                <div className="mt-2 text-[13px] leading-6 text-slate-600">
                                                    Create a <span className="font-semibold">Trigger</span>{' '}
                                                    first. After it’s configured, you’ll add all
                                                    other nodes via the <span className="font-semibold">+</span>{' '}
                                                    buttons on the canvas.
                                                </div>
                                                <div className="mt-5 flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        className="inline-flex h-10 items-center justify-center rounded-xl bg-[#1677ff] px-5 text-[13px] font-semibold text-white shadow-[0_10px_20px_rgba(22,119,255,0.28)] transition hover:bg-[#0f66e0] active:scale-[0.99]"
                                                        onClick={() => {
                                                            handleAddNode(
                                                                'start',
                                                                'start',
                                                                'Trigger'
                                                            );
                                                            const g = graphRef.current;
                                                            if (!g) return;
                                                            // 等待节点创建后再选中并打开属性抽屉
                                                            queueMicrotask(() => {
                                                                const startNode = g
                                                                    .getNodes()
                                                                    .find(
                                                                        n =>
                                                                            ((n.getData() ??
                                                                                {}) as FlowNodeData)
                                                                                .nodeType ===
                                                                            'start'
                                                                    );
                                                                if (startNode) {
                                                                    setSelectedNodeId(startNode.id);
                                                                }
                                                            });
                                                        }}
                                                    >
                                                        Get Trigger
                                                    </button>
                                                    <div className="text-[12px] text-slate-500">
                                                        Required • one per Flow
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                                {/* 画布操作条：缩放 / 适配 / 清空 */}
                                <FlowCanvasToolbar
                                    zoomPercent={zoomPercent}
                                    onZoomIn={handleZoomIn}
                                    onZoomOut={handleZoomOut}
                                    onZoomFit={handleZoomFit}
                                    onClear={handleCanvasClear}
                                    orientation={canvasOrientation}
                                    onOrientationChange={handleOrientationChange}
                                />
                                {/* 无输出节点右侧加号 overlay */}
                                <FlowPlusButtonOverlay
                                    positions={plusButtonPositions}
                                    overlayTransform={overlayTransform}
                                    plusDropdownNodeId={plusDropdownNodeId}
                                    onOpenChange={setPlusDropdownNodeId}
                                    onAddNodeAfter={handleAddNodeAfter}
                                />
                            </div>
                            <style>{`
                .flow-editor-canvas .x6-node .x6-port { opacity: 0; transition: opacity 0.15s ease; }
                .flow-editor-canvas .x6-node:hover .x6-port { opacity: 1; }
              `}</style>
                        </div>

                        {/* 右键菜单 */}
                        {contextMenu && (
                            <FlowContextMenu
                                x={contextMenu.x}
                                y={contextMenu.y}
                                onEdit={handleContextEdit}
                                onCopy={() => {
                                    handleContextCopy(contextMenu.nodeId);
                                    setContextMenu(null);
                                }}
                                onDelete={handleContextDelete}
                                onToggleDisabled={handleContextToggleDisabled}
                            />
                        )}
                    </div>

                </div>
            </div>

            {/* 右下角常驻：画布统计与结构验证结果（固定在视口） */}
            <div className="pointer-events-auto fixed bottom-4 right-4 z-30 max-w-[420px]">
                <FlowExecutionPeriodPanel canvasStats={canvasStats} />
            </div>

            {/* 节点属性弹窗 */}
            <FlowConditionDrawer
                open={!!selectedNodeId}
                initialValues={getPropertyDrawerInitialValues()}
                onClose={() => setSelectedNodeId(null)}
                onApply={handleApplyProperty}
                onDelete={handleDeleteCurrentNode}
                flowProgramTriggerType={flowProgramTriggerType}
                flowEntityType={flowEntityType}
                triggerType={triggerType}
                onTriggerTypeChange={(newTriggerType) => {
                    setTriggerType(newTriggerType);
                    setCronExpr('');
                }}
                cronExpr={cronExpr}
                onCronExprChange={setCronExpr}
            />
        </div>
        </FlowEditorProgramProvider>
    );
}

const FlowEditor = forwardRef<FlowEditorHandle, FlowEditorProps>(InnerFlowEditor);

export default FlowEditor;
