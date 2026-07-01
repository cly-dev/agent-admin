export interface WaitEventOption {
  value: string;
  label: string;
}

export interface WaitEventMetaGroup {
  category: "tag" | "feedAdjust";
  label: string;
  options: WaitEventOption[];
}

/**
 * 等待事件可选项（前端 mock）
 * 后端未就绪前用于支撑「等待事件」节点的事件选择能力。
 */
export const WAIT_EVENT_META: WaitEventMetaGroup[] = [
  {
    category: "tag",
    label: "打标事件",
    options: [
      { value: "tag:o", label: "打为 O 标" },
      { value: "tag:o-minus", label: "打为 O- 标" },
      { value: "tag:o-plus", label: "打为 O+ 标" },
      { value: "tag:a", label: "打为 A 标" },
      { value: "tag:a-plus", label: "打为 A+ 标" },
      { value: "tag:s", label: "打为 S 标" },
      { value: "tag:bfcm", label: "打为 BFCM 标" },
      { value: "tag:l", label: "打为 L 标" },
      { value: "tag:l-minus", label: "打为 L- 标" },
      { value: "tag:p", label: "打为 P 标" },
    ],
  },
  {
    category: "feedAdjust",
    label: "feed 字段调整事件",
    options: [
      { value: "feed:description-update", label: "更改 feed-Description 字段拼接规范" },
      { value: "feed:custom-attribute-update", label: "更改 CustomAttribute 值" },
      { value: "feed:year-range-update", label: "配置适配年份范围" },
      { value: "feed:year-list-update", label: "配置适配年份列表" },
      { value: "feed:fixed-attributes", label: "设置固定属性（如 Warranty、Material 等）" },
      { value: "feed:custom-attributes", label: "设置自定义属性（如 Drive Shaft Length 等）" },
    ],
  },
];

