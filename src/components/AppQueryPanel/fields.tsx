import { SearchOutlined } from '@ant-design/icons';
import { Input, InputNumber, Select } from 'antd';
import type { InputNumberProps, InputProps, SelectProps } from 'antd';
import styles from './index.module.scss';

export function AppQueryInput({ className, ...props }: InputProps) {
  return (
    <Input
      className={`app-input ${styles.control} ${className ?? ''}`.trim()}
      allowClear
      {...props}
    />
  );
}

export function AppQueryInputNumber({ className, ...props }: InputNumberProps) {
  return (
    <InputNumber
      className={`app-input ${styles.control} ${className ?? ''}`.trim()}
      controls={false}
      {...props}
    />
  );
}

export function AppQuerySelect({ className, ...props }: SelectProps) {
  return (
    <Select className={`app-input ${styles.control} ${className ?? ''}`.trim()} {...props} />
  );
}

export function AppListSearchInput({ className, ...props }: InputProps) {
  return (
    <Input
      allowClear
      prefix={<SearchOutlined className="text-on-surface/40" />}
      className={`app-input ${styles.control} w-full py-2.5 pr-3 pl-9 text-sm ${className ?? ''}`.trim()}
      {...props}
    />
  );
}
