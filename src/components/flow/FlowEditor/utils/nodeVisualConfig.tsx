import type { FlowNodeType } from "@/types";
import {
  PlayCircleOutlined,
  ThunderboltOutlined,
  BranchesOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";

/**
 * Flow 节点统一视觉配置：
 * - 画布节点背景/边框色
 * - 图标映射与颜色
 * - 左侧菜单预览样式
 */

export const NODE_VISUAL_TOKENS: Record<
  FlowNodeType,
  { fill: string; stroke: string; dashed?: boolean }
> = {
  start: {
    fill: "#f0fdf4",
    stroke: "#86efac",
  },
  conditionCheck: {
    fill: "#fffbeb",
    stroke: "#fcd34d",
  },
  execute: {
    fill: "#eff6ff",
    stroke: "#93c5fd",
  },
  wait: {
    fill: "#f5f3ff",
    stroke: "#c4b5fd",
  },
  branch: {
    fill: "#ffffff",
    stroke: "#e5e7eb",
  },
  conditionGroupBranch: {
    fill: "#ffffff",
    stroke: "#e5e7eb",
  },
};

export const NODE_ICON_MAP: Record<FlowNodeType, ReactNode> = {
  start: <PlayCircleOutlined />,
  execute: <ThunderboltOutlined />,
  conditionCheck: <BranchesOutlined />,
  wait: <FieldTimeOutlined />,
  branch: null,
  conditionGroupBranch: null,
};

export const NODE_STRIP_COLOR: Partial<Record<FlowNodeType, string>> = {
  start: "#1677ff",
  conditionCheck: "#f59e0b",
  execute: "#10b981",
  wait: "#8b5cf6",
  conditionGroupBranch: "#94a3b8",
};

export const NODE_ICON_COLOR: Record<
  FlowNodeType,
  { bg: string; fg: string }
> = {
  start: { bg: "rgba(22,119,255,0.12)", fg: "#1677ff" },
  conditionCheck: { bg: "rgba(245,158,11,0.12)", fg: "#b45309" },
  execute: { bg: "rgba(16,185,129,0.12)", fg: "#047857" },
  wait: { bg: "rgba(139,92,246,0.12)", fg: "#5b21b6" },
  branch: { bg: "rgba(148,163,184,0.12)", fg: "#4b5563" },
  conditionGroupBranch: { bg: "rgba(148,163,184,0.12)", fg: "#4b5563" },
};

export const NODE_MENU_STYLE: Record<
  FlowNodeType,
  { strip: string; iconBg: string; iconFg: string }
> = {
  start: {
    strip: "#1677ff",
    iconBg: "rgba(22,119,255,0.12)",
    iconFg: "#1677ff",
  },
  conditionCheck: {
    strip: "#f59e0b",
    iconBg: "rgba(245,158,11,0.12)",
    iconFg: "#b45309",
  },
  execute: {
    strip: "#10b981",
    iconBg: "rgba(16,185,129,0.12)",
    iconFg: "#047857",
  },
  wait: {
    strip: "#8b5cf6",
    iconBg: "rgba(139,92,246,0.12)",
    iconFg: "#5b21b6",
  },
  branch: {
    strip: "#94a3b8",
    iconBg: "rgba(148,163,184,0.12)",
    iconFg: "#4b5563",
  },
  conditionGroupBranch: {
    strip: "#94a3b8",
    iconBg: "rgba(148,163,184,0.12)",
    iconFg: "#4b5563",
  },
};

