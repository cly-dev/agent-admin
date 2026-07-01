import { Button, Space, message } from "antd";
import {
  SaveOutlined,
  ClearOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  DeleteOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import type { Graph } from "@antv/x6";
import { buildBackendPayload } from "../utils/flowDataTransformer";
import { validateFlowStructure, type FlowNodeForValidation } from "@/utils/flowValidation";
import { saveFlowConfigApi } from "@/services/flow";
import type { FlowWorkTriggerType } from "@/types";

export interface FlowToolbarProps {
  graphRef: React.MutableRefObject<Graph | null>;
  hasSelection: boolean;
  onDeleteSelected: () => void;
  programName?: string;
  programId?: string;
  triggerType?: FlowWorkTriggerType;
}

/**
 * 流程编辑器工具栏组件
 */
export function FlowToolbar({
  graphRef,
  hasSelection,
  onDeleteSelected,
  programName,
  programId,
  triggerType,
}: FlowToolbarProps): JSX.Element {
  /**
   * 保存流程（先校验：至少一个开始、一个结束；再保存）
   */
  const handleSave = async (): Promise<void> => {
    const graph = graphRef.current;
    if (!graph) return;

    const nodes = graph.getNodes();
    if (nodes.length > 0) {
      const payload = buildBackendPayload(graph);
      const nodesForValidation: FlowNodeForValidation[] = payload.nodes.map(
        (node) => ({
          id: node.id,
          nodeType: String(node.nodeType),
          inlets: node.inlets,
          outlets: node.outlets,
          form: {
            ...node.form,
            name: node.form.name,
            nodeType: node.form.nodeType,
            conditionGroup: node.form.conditionGroup,
          } as FlowNodeForValidation["form"],
        }),
      );
      const result = validateFlowStructure(nodesForValidation);
      if (!result.isValid) {
        message.error(result.errors.join("；"));
        return;
      }
    }

    const data = graph.toJSON();

    if (!programId) {
      message.error("缺少程序 ID，无法保存");
      return;
    }

    try {
      const res = await saveFlowConfigApi({
        id: Number(programId),
        name: programName,
        triggerType,
        flowData: data,
      });

      if (res.code !== 0) {
        message.error(res.message || "保存失败");
        return;
      }

      message.success("流程已保存");
    } catch (error: unknown) {
      const err = error as { message?: string };
      message.error(err?.message || "保存失败");
    }
  };

  /**
   * 输出当前画布 JSON 到剪贴板
   */
  const handleExportJson = async (): Promise<void> => {
    if (!graphRef.current) return;

    const data = graphRef.current.toJSON();
    const jsonStr = JSON.stringify(data, null, 2);
    try {
      await navigator.clipboard.writeText(jsonStr);
      message.success("已复制到剪贴板");
    } catch {
      message.error("复制失败");
    }
  };

  /**
   * 清空画布
   */
  const handleClear = (): void => {
    if (!graphRef.current) return;

    graphRef.current.clearCells();
    message.info("画布已清空");
  };

  /**
   * 放大
   */
  const handleZoomIn = (): void => {
    if (!graphRef.current) return;

    const zoom = graphRef.current.zoom();
    graphRef.current.zoomTo(Math.min(zoom + 0.1, 3));
  };

  /**
   * 缩小
   */
  const handleZoomOut = (): void => {
    if (!graphRef.current) return;

    const zoom = graphRef.current.zoom();
    graphRef.current.zoomTo(Math.max(zoom - 0.1, 0.5));
  };

  /**
   * 适应画布
   */
  const handleFit = (): void => {
    if (!graphRef.current) return;

    graphRef.current.zoomToFit({ padding: 20 });
  };

  return (
    <Space wrap size="small" className="min-w-0">
      <Button
        danger
        icon={<DeleteOutlined />}
        onClick={onDeleteSelected}
        disabled={!hasSelection}
      >
        删除选中
      </Button>
      <Button icon={<SaveOutlined />} onClick={handleSave}>
        保存
      </Button>
      <Button icon={<CopyOutlined />} onClick={handleExportJson}>
        复制 JSON
      </Button>
      <Button danger icon={<ClearOutlined />} onClick={handleClear}>
        清空
      </Button>
      <Button icon={<ZoomInOutlined />} onClick={handleZoomIn}>
        放大
      </Button>
      <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut}>
        缩小
      </Button>
      <Button onClick={handleFit}>适应画布</Button>
    </Space>
  );
}
