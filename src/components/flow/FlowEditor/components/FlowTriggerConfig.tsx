import { Card, Space, Select } from "antd";
import type { FlowWorkTriggerType } from "@/types";

export interface FlowTriggerConfigProps {
  triggerType?: FlowWorkTriggerType;
  onChange: (triggerType: FlowWorkTriggerType | undefined) => void;
}

/**
 * 触发配置组件
 */
export function FlowTriggerConfig({
  triggerType,
  onChange,
}: FlowTriggerConfigProps): JSX.Element {
  return (
    <Card
      className="mt-3"
      bodyStyle={{ padding: 16 }}
      title="触发配置"
      size="small"
    >
      <Space direction="horizontal" align="center" size="middle">
        <span>执行周期：</span>
        <Select
          value={triggerType}
          onChange={onChange}
          placeholder="请选择触发类型"
          style={{ width: 200 }}
        >
          <Select.Option value={1}>仅一次</Select.Option>
          <Select.Option value={2}>每日重复</Select.Option>
          <Select.Option value={3}>定时重复</Select.Option>
        </Select>
        <span className="text-gray-500 text-xs">
          （保存后生效，在列表页启用后才会进入调度）
        </span>
      </Space>
    </Card>
  );
}
