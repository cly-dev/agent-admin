import ListScopeBar from '@/components/ListScopeBar';
import {
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Collapse, Form } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { ReactNode } from 'react';
import { AppListSearchInput } from './fields';
import styles from './index.module.scss';
import { countActiveFilters } from './utils';

export type AppQueryPanelLayout = 'default' | 'list';

export type AppQueryPanelProps<T extends Record<string, unknown>> = {
  form: FormInstance<T>;
  appliedFilters: Record<string, unknown>;
  loading?: boolean;
  onSearch: (values: T) => void;
  onReset: () => void;
  /**
   * list：列表页标准布局（透明主行、与 AppListQueryToolbar 对齐）
   * default：带边框的主搜索区
   */
  layout?: AppQueryPanelLayout;
  /** 左侧展示项目切换器（layout=list 时常用） */
  showProjectScope?: boolean;
  leadingContent?: ReactNode;
  plainMainBlock?: boolean;
  /** 主搜索字段名，默认 keyword */
  keywordName?: keyof T & string;
  keywordLabel?: ReactNode;
  keywordPlaceholder?: string;
  keywordClassName?: string;
  /** 高级筛选表单项，建议包在 AppQueryPanel.Grid 内 */
  advancedContent?: ReactNode;
  /** 自定义已生效筛选项计数，默认 countActiveFilters */
  countActive?: (filters: Record<string, unknown>) => number;
  className?: string;
};

function AppQueryPanelRoot<T extends Record<string, unknown>>({
  form,
  appliedFilters,
  loading = false,
  onSearch,
  onReset,
  layout = 'default',
  showProjectScope = false,
  leadingContent,
  plainMainBlock,
  keywordName = 'keyword' as keyof T & string,
  keywordLabel,
  keywordPlaceholder,
  keywordClassName,
  advancedContent,
  countActive = countActiveFilters,
  className,
}: AppQueryPanelProps<T>) {
  const intl = useIntl();
  const activeCount = countActive(appliedFilters);
  const isListLayout = layout === 'list';
  const resolvedPlainMain = plainMainBlock ?? isListLayout;
  const resolvedLeading =
    leadingContent ?? (showProjectScope ? <ListScopeBar compact /> : undefined);

  return (
    <div className={`${styles.panel} ${className ?? ''}`.trim()}>
      <Form<T>
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={onSearch}
      >
        <div
          className={`${styles.mainBlock} ${resolvedPlainMain ? styles.mainBlockPlain : ''}`.trim()}
        >
          <div className={styles.main}>
            {resolvedLeading ? (
              <div className={styles.leading}>{resolvedLeading}</div>
            ) : null}
            <div className={styles.querySide}>
              <Form.Item
                name={keywordName as never}
                className={`${styles.keyword} ${keywordClassName ?? ''}`.trim()}
                label={keywordLabel}
              >
                <AppListSearchInput
                  placeholder={
                    keywordPlaceholder ??
                    intl.formatMessage({
                      id: 'appQueryPanel.keywordPlaceholder',
                    })
                  }
                />
              </Form.Item>
            </div>
          </div>
        </div>

        {advancedContent ? (
          <div className={styles.advancedBlock}>
            <Collapse
              ghost
              className={styles.collapse}
              expandIcon={() => null}
              items={[
                {
                  key: 'advanced',
                  showArrow: false,
                  label: (
                    <span className={styles.collapseLabel}>
                      <FilterOutlined />
                      {intl.formatMessage({ id: 'appQueryPanel.advanced' })}
                      {activeCount > 0 ? (
                        <span className={styles.activeBadge}>
                          {activeCount}
                        </span>
                      ) : null}
                    </span>
                  ),
                  children: (
                    <>
                      {advancedContent}
                      <div className={styles.bottomActions}>
                        <button
                          type="submit"
                          className="app-button-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={loading}
                        >
                          <SearchOutlined />
                          {intl.formatMessage({ id: 'appQueryPanel.search' })}
                        </button>
                        <button
                          type="button"
                          className="app-button-tertiary inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={loading}
                          onClick={onReset}
                        >
                          <ReloadOutlined />
                          {intl.formatMessage({ id: 'appQueryPanel.reset' })}
                        </button>
                      </div>
                    </>
                  ),
                },
              ]}
            />
          </div>
        ) : (
          <div className={styles.bottomActions}>
            <button
              type="submit"
              className="app-button-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            >
              <SearchOutlined />
              {intl.formatMessage({ id: 'appQueryPanel.search' })}
            </button>
            <button
              type="button"
              className="app-button-tertiary inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
              onClick={onReset}
            >
              <ReloadOutlined />
              {intl.formatMessage({ id: 'appQueryPanel.reset' })}
            </button>
          </div>
        )}
      </Form>
    </div>
  );
}

const AppQueryPanelGrid: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className={styles.grid}>{children}</div>
);

type AppQueryPanelComponent = typeof AppQueryPanelRoot & {
  Grid: typeof AppQueryPanelGrid;
};

const AppQueryPanel = AppQueryPanelRoot as AppQueryPanelComponent;
AppQueryPanel.Grid = AppQueryPanelGrid;

export default AppQueryPanel;
