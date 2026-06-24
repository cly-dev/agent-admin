import { PageContainer } from '@ant-design/pro-components';
import { Spin } from 'antd';
import type { ReactNode } from 'react';
import {
  AppDetailHeader,
  AppDetailHeading,
  type AppDetailHeaderProps,
} from './AppDetailHeader';
import shellStyles from './AppDetailPage.module.scss';

export type AppDetailPageProps = Omit<AppDetailHeaderProps, 'className'> & {
  loading?: boolean;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** 顶栏底部分割线，默认开启 */
  headerBordered?: boolean;
  pageClassName?: string;
  cardClassName?: string;
  bodyClassName?: string;
  children: ReactNode;
};

export const AppDetailPage: React.FC<AppDetailPageProps> = ({
  loading = false,
  title,
  subtitle,
  headerBordered = true,
  pageClassName,
  cardClassName,
  bodyClassName,
  children,
  ...headerProps
}) => {
  return (
    <PageContainer ghost className={pageClassName}>
      <div className={shellStyles.shell}>
        <div className={`${shellStyles.card} ${cardClassName ?? ''}`.trim()}>
          <Spin spinning={loading}>
            <div className={shellStyles.inner}>
              <AppDetailHeader {...headerProps} bordered={headerBordered} />
              <div
                className={`${shellStyles.body} ${bodyClassName ?? ''}`.trim()}
              >
                <AppDetailHeading title={title} subtitle={subtitle} />
                {children}
              </div>
            </div>
          </Spin>
        </div>
      </div>
    </PageContainer>
  );
};
