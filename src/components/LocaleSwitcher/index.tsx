import { getLocale, setLocale, useIntl } from '@umijs/max';
import { GlobalOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { useMemo } from 'react';

const LOCALE_KEYS = ['zh-CN', 'en-US'] as const;

const LocaleSwitcher: React.FC = () => {
  const intl = useIntl();
  const currentLocale = getLocale();

  const menuItems = useMemo<MenuProps['items']>(
    () =>
      LOCALE_KEYS.map((locale) => ({
        key: locale,
        label: intl.formatMessage({ id: `locale.${locale}` }),
      })),
    [intl],
  );

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === currentLocale) {
      return;
    }

    setLocale(key, false);
  };

  return (
    <Dropdown
      menu={{
        items: menuItems,
        selectable: true,
        selectedKeys: [currentLocale],
        onClick: handleMenuClick,
      }}
      placement="bottomRight"
      trigger={['click']}
    >
      <button
        type="button"
        className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-on-surface/50 transition-all hover:bg-surface-container-low active:scale-95"
        aria-label={intl.formatMessage({ id: 'locale.switch' })}
      >
        <GlobalOutlined className="text-sm" />
        <span className="hidden text-xs font-medium sm:inline">
          {intl.formatMessage({ id: `locale.${currentLocale}` })}
        </span>
      </button>
    </Dropdown>
  );
};

export default LocaleSwitcher;
