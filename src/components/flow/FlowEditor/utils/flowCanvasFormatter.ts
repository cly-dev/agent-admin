import type { Graph, Node } from "@antv/x6";
import { message } from "antd";
import ELK from "elkjs/lib/elk.bundled.js";
import type { FlowNodeData } from "@/types";
import {
  twoPortsVertical,
  onePortOutVertical,
  twoPortsHorizontal,
  onePortOutHorizontal,
} from "./nodeShapes";

export type FlowCanvasOrientation = "horizontal" | "vertical";

const elk = new ELK();

const LAYOUT_TOKEN_KEY = "__flowLayoutToken";

function bumpLayoutToken(graph: Graph): number {
  const next =
    (Number((graph as Graph & { [LAYOUT_TOKEN_KEY]?: number })[LAYOUT_TOKEN_KEY]) ||
      0) + 1;
  (graph as Graph & { [LAYOUT_TOKEN_KEY]: number })[LAYOUT_TOKEN_KEY] = next;
  return next;
}

function readLayoutToken(graph: Graph): number {
  return (
    Number((graph as Graph & { [LAYOUT_TOKEN_KEY]?: number })[LAYOUT_TOKEN_KEY]) ||
    0
  );
}

export function invalidateCanvasLayout(graph: Graph): void {
  bumpLayoutToken(graph);
}

export function formatCanvasInternal(
  graph: Graph,
  withMessage: boolean,
  orientation: FlowCanvasOrientation = "vertical",
  onSettled?: () => void,
): void {
  const allNodes = graph.getNodes();
  const allEdges = graph.getEdges();

  if (allNodes.length === 0) {
    if (withMessage) {
      message.info("画布无节点，无需格式化");
    }
    onSettled?.();
    return;
  }

  // 作废进行中的旧布局，避免 clear/add 后旧回调写回已销毁节点导致重影
  const layoutToken = bumpLayoutToken(graph);

  const children = allNodes.map((node) => {
    const box = node.getBBox();
    return {
      id: node.id,
      width: box.width || 240,
      height: box.height || 80,
    };
  });

  const elkEdges = allEdges.map((edge) => ({
    id: edge.id,
    sources: [edge.getSourceCellId()],
    targets: [edge.getTargetCellId()],
  }));

  const elkGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "mrtree",
      // 增大节点之间的间距，让层级更疏朗
      "elk.spacing.nodeNode": "120",
      "elk.layered.spacing.nodeNodeBetweenLayers": "120",
      // 根据画布方向切换主布局方向
      "elk.direction": orientation === "horizontal" ? "RIGHT" : "DOWN",
      "nodePlacement.strategy": "SIMPLE",
    },
    children,
    edges: elkEdges,
  };

  void elk
    .layout(elkGraph as unknown as ELK.ElkNode)
    .then((result) => {
      if (readLayoutToken(graph) !== layoutToken) {
        onSettled?.();
        return;
      }

      const liveNodes = graph.getNodes();
      const liveIds = new Set(liveNodes.map((node) => node.id));

      (result.children ?? []).forEach((c) => {
        const id = c.id as string;
        if (!liveIds.has(id)) {
          return;
        }
        const node = graph.getCellById(id) as Node | null;
        if (!node?.isNode()) {
          return;
        }
        const x = typeof c.x === "number" ? c.x : 0;
        const y = typeof c.y === "number" ? c.y : 0;
        node.position(x, y);
      });

      // 根据画布方向设置节点端口位置（上下 or 左右），并写入 layoutOrientation
      // 只用当前仍在图上的节点，勿用布局开始时的快照（可能已 dispose）
      liveNodes.forEach((node) => {
        const data = (node.getData() ?? {}) as FlowNodeData;
        const nextData: FlowNodeData = {
          ...data,
          layoutOrientation: orientation,
        };
        node.setData(nextData);

        if (orientation === "vertical") {
          node.setProp(
            "ports",
            nextData.nodeType === "start" ? onePortOutVertical : twoPortsVertical,
          );
        } else {
          node.setProp(
            "ports",
            nextData.nodeType === "start"
              ? onePortOutHorizontal
              : twoPortsHorizontal,
          );
        }
      });

      const currentEdges = graph.getEdges();
      currentEdges.forEach((edge) => {
        const source = edge.getSourceNode();
        const target = edge.getTargetNode();
        if (!source || !target) {
          return;
        }

        const sBox = source.getBBox();
        const tBox = target.getBBox();

        if (orientation === "vertical") {
          // 纵向布局：节点上下排列，连线在中间做一段水平线
          if (sBox.x !== tBox.x) {
            const gap = tBox.y - sBox.y - sBox.height;
            const midY = sBox.y + sBox.height + gap / 2;
            edge.setVertices([
              { x: sBox.center.x, y: midY },
              { x: tBox.center.x, y: midY },
            ]);
          } else {
            edge.setVertices([]);
          }
        } else {
          // 横向布局：节点左右排列，连线在中间做一段垂直线
          if (sBox.y !== tBox.y) {
            const gap = tBox.x - sBox.x - sBox.width;
            const midX = sBox.x + sBox.width + gap / 2;
            edge.setVertices([
              { x: midX, y: sBox.center.y },
              { x: midX, y: tBox.center.y },
            ]);
          } else {
            edge.setVertices([]);
          }
        }
      });

      try {
        graph.centerContent();
        const bbox = graph.getContentBBox();
        if (bbox.width > 0 && bbox.height > 0) {
          const el = graph.container as HTMLElement;
          const cw = el?.clientWidth || (graph.options.width as number) || 800;
          const ch = el?.clientHeight || (graph.options.height as number) || 600;
          if (bbox.width > cw * 0.85 || bbox.height > ch * 0.85) {
            graph.zoomToFit({ padding: 20, maxScale: 1 });
          } else {
            graph.centerContent();
          }
        }
      } catch {
        // ignore
      }

      if (withMessage) {
        message.success(
          `已格式化：${liveNodes.length} 个节点，${currentEdges.length} 条连线重算`,
        );
      }
      onSettled?.();
    })
    .catch(() => {
      if (withMessage) {
        message.error("自动布局失败，请稍后重试");
      }
      onSettled?.();
    });
}

// ─────────────────────────────────────────────
// 对外快捷入口（orientation 参数保留兼容，内部不再使用）
// ─────────────────────────────────────────────
export function formatCanvas(
  graph: Graph,
  orientation: FlowCanvasOrientation = "horizontal",
): void {
  formatCanvasInternal(graph, true, orientation);
}

export function formatCanvasSilent(
  graph: Graph,
  orientation: FlowCanvasOrientation = "horizontal",
): void {
  formatCanvasInternal(graph, false, orientation);
}

export function formatCanvasSilentAsync(
  graph: Graph,
  orientation: FlowCanvasOrientation = "vertical",
): Promise<void> {
  return new Promise((resolve) => {
    formatCanvasInternal(graph, false, orientation, resolve);
  });
}
