import { BuildOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';

type AppLogoProps = {
  collapsed?: boolean;
};

const AppLogo: React.FC<AppLogoProps> = ({ collapsed }) => {
  const intl = useIntl();

  if (collapsed) {
    return (
      <div className="flex items-center justify-center px-2 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-[--radius-ui] bg-linear-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20">
          <BuildOutlined className="text-base" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[--radius-ui] bg-linear-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20">
        <BuildOutlined className="text-base" />
      </div>
      <div className="min-w-0">
        <h1 className="truncate text-base font-extrabold leading-tight text-on-surface">
          {intl.formatMessage({ id: 'layout.brand.title' })}
        </h1>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface/50">
          {intl.formatMessage({ id: 'layout.brand.subtitle' })}
        </p>
      </div>
    </div>
  );
};

export default AppLogo;
