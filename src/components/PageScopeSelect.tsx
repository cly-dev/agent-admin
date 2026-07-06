import { usePageScopeOptions } from '@/hooks/usePageScopeOptions';
import type { SelectProps } from 'antd';
import { Select } from 'antd';

type PageScopeSelectProps = Omit<SelectProps, 'options' | 'loading'> & {
  appClientId?: number;
  activeOnly?: boolean;
  extraScope?: string | null;
};

const PageScopeSelect: React.FC<PageScopeSelectProps> = ({
  appClientId,
  activeOnly = true,
  extraScope,
  disabled,
  placeholder,
  className,
  ...rest
}) => {
  const { selectOptions, loading } = usePageScopeOptions({
    appClientId,
    activeOnly,
    extraScopes: [extraScope],
  });

  return (
    <Select
      allowClear
      showSearch
      optionFilterProp="label"
      className={`app-input ${className ?? ''}`.trim()}
      disabled={disabled || !appClientId}
      loading={loading}
      placeholder={placeholder}
      options={selectOptions}
      {...rest}
    />
  );
};

export default PageScopeSelect;
