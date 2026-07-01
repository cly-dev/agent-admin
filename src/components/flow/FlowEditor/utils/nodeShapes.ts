import { Shape } from "@antv/x6";

/**
 * 注册自定义节点端口与几何
 */
export const portAttrs = {
  circle: {
    r: 4.5,
    magnet: true,
    stroke: "#d1d5db",
    fill: "#ffffff",
    strokeWidth: 1.5,
    cursor: "crosshair",
  },
};

/** 仅输入(in/左)、输出(out/右) 两组端口（横向布局） */
export const twoPortsHorizontal = {
  groups: {
    in: {
      position: { name: "left" },
      attrs: portAttrs,
    },
    out: {
      position: { name: "right" },
      attrs: portAttrs,
    },
  },
  items: [
    { id: "in", group: "in" },
    { id: "out", group: "out" },
  ],
};

/** 仅输入(in/上)、输出(out/下) 两组端口（纵向布局） */
export const twoPortsVertical = {
  groups: {
    in: {
      position: { name: "top" },
      attrs: portAttrs,
    },
    out: {
      position: { name: "bottom" },
      attrs: portAttrs,
    },
  },
  items: [
    { id: "in", group: "in" },
    { id: "out", group: "out" },
  ],
};

/** 仅输入端口（结束节点使用，无输出点），横向布局默认在左侧 */
export const onePortInHorizontal = {
  groups: {
    in: {
      position: { name: "left" },
      attrs: portAttrs,
    },
  },
  items: [{ id: "in", group: "in" }],
};

/** 仅输入端口（结束节点使用，无输出点），纵向布局在上侧 */
export const onePortInVertical = {
  groups: {
    in: {
      position: { name: "top" },
      attrs: portAttrs,
    },
  },
  items: [{ id: "in", group: "in" }],
};

// 向后兼容旧引用：默认使用横向端口
export const twoPorts = twoPortsHorizontal;
export const onePortIn = onePortInHorizontal;

/** 仅输出端口（开始节点使用，无入口点），横向布局默认在右侧 */
export const onePortOutHorizontal = {
  groups: {
    out: {
      position: { name: "right" },
      attrs: portAttrs,
    },
  },
  items: [{ id: "out", group: "out" }],
};

/** 仅输出端口（开始节点使用，无入口点），纵向布局在下侧 */
export const onePortOutVertical = {
  groups: {
    out: {
      position: { name: "bottom" },
      attrs: portAttrs,
    },
  },
  items: [{ id: "out", group: "out" }],
};

/** 椭圆节点（常用于开始/结束）：仅输入、输出两端口 */
export const ellipsePorts = twoPorts;

// 注册所有节点形状
Shape.Rect.define({
  shape: "flow-node",
  width: 240,
  height: 80,
  ports: twoPorts,
  markup: [
    {
      tagName: "rect",
      selector: "body",
    },
    {
      tagName: "text",
      selector: "icon",
    },
    {
      tagName: "text",
      selector: "label",
    },
    {
      tagName: "text",
      selector: "description",
    },
  ],
  attrs: {
    body: {
      stroke: "#e5e7eb",
      strokeWidth: 1,
      fill: "#ffffff",
      rx: 8,
      ry: 8,
    },
    // 左侧 icon
    icon: {
      fontSize: 16,
      fill: "#4b5563",
      refX: 0.15, // 靠左
      refY: 0.35,
      textAnchor: "middle",
      textVerticalAnchor: "middle",
      display: "none",
    },
    // 中间主标题
    label: {
      fontSize: 14,
      fill: "#262626",
      refX: 0.55, // 略偏右，给 icon 留空间
      refY: 0.35,
      textAnchor: "middle",
      textVerticalAnchor: "middle",
    },
    // 下方描述
    description: {
      fontSize: 11,
      fill: "#8c8c8c",
      refX: 0.5,
      refY: 0.7,
      textAnchor: "middle",
      textVerticalAnchor: "middle",
      display: "none",
    },
  },
});

Shape.Ellipse.define({
  shape: "flow-node-ellipse",
  width: 120,
  height: 80,
  ports: ellipsePorts,
  markup: [
    {
      tagName: "ellipse",
      selector: "body",
    },
    {
      tagName: "text",
      selector: "label",
    },
    {
      tagName: "text",
      selector: "description",
    },
  ],
  attrs: {
    body: {
      stroke: "#5F95FF",
      strokeWidth: 1,
      fill: "#EFF4FF",
      refCx: "50%",
      refCy: "50%",
      refRx: "50%",
      refRy: "50%",
    },
    label: {
      fontSize: 14,
      fill: "#262626",
      refX: 0.5,
      refY: 0.35,
      textAnchor: "middle",
      textVerticalAnchor: "middle",
    },
    description: {
      fontSize: 11,
      fill: "#8c8c8c",
      refX: 0.5,
      refY: 0.7,
      textAnchor: "middle",
      textVerticalAnchor: "middle",
      display: "none",
    },
  },
});

Shape.Polygon.define({
  shape: "flow-node-diamond",
  width: 100,
  height: 120,
  points: [
    [0.5, 0],
    [1, 0.5],
    [0.5, 1],
    [0, 0.5],
  ],
  ports: ellipsePorts,
  markup: [
    {
      tagName: "polygon",
      selector: "body",
    },
    {
      tagName: "text",
      selector: "label",
    },
    {
      tagName: "text",
      selector: "description",
    },
  ],
  attrs: {
    body: {
      stroke: "#5F95FF",
      strokeWidth: 1,
      fill: "#EFF4FF",
    },
    label: {
      fontSize: 14,
      fill: "#262626",
      refX: 0.5,
      refY: 0.35,
      textAnchor: "middle",
      textVerticalAnchor: "middle",
    },
    description: {
      fontSize: 11,
      fill: "#8c8c8c",
      refX: 0.5,
      refY: 0.75,
      textAnchor: "middle",
      textVerticalAnchor: "middle",
      display: "none",
    },
  },
});

Shape.Circle.define({
  shape: "flow-node-circle",
  width: 80,
  height: 100,
  ports: ellipsePorts,
  markup: [
    {
      tagName: "circle",
      selector: "body",
    },
    {
      tagName: "text",
      selector: "label",
    },
    {
      tagName: "text",
      selector: "description",
    },
  ],
  attrs: {
    body: {
      stroke: "#5F95FF",
      strokeWidth: 1,
      fill: "#EFF4FF",
      refCx: "50%",
      refCy: "50%",
      refR: "50%",
    },
    label: {
      fontSize: 14,
      fill: "#262626",
      refX: 0.5,
      refY: 0.35,
      textAnchor: "middle",
      textVerticalAnchor: "middle",
    },
    description: {
      fontSize: 11,
      fill: "#8c8c8c",
      refX: 0.5,
      refY: 0.7,
      textAnchor: "middle",
      textVerticalAnchor: "middle",
      display: "none",
    },
  },
});

Shape.Circle.define({
  shape: "flow-node-branch",
  width: 44,
  height: 44,
  ports: twoPorts,
  markup: [
    {
      tagName: "circle",
      selector: "body",
    },
    {
      tagName: "text",
      selector: "label",
    },
    {
      tagName: "text",
      selector: "description",
    },
  ],
  attrs: {
    body: {
      stroke: "#52c41a",
      strokeWidth: 1,
      fill: "#f6ffed",
      refCx: "50%",
      refCy: "50%",
      refR: "50%",
    },
    label: {
      fontSize: 11,
      fill: "#262626",
      refX: 0.5,
      refY: 0.5,
      textAnchor: "middle",
      textVerticalAnchor: "middle",
    },
    description: {
      fontSize: 9,
      fill: "#8c8c8c",
      refX: 0.5,
      refY: 0.75,
      textAnchor: "middle",
      textVerticalAnchor: "middle",
      display: "none",
    },
  },
});
