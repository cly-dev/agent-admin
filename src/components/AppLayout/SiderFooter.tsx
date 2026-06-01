import { CheckCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';

const SiderFooter: React.FC = () => {
  const intl = useIntl();

  return (
    <div className="flex flex-col gap-1 border-t border-outline-variant/20 pb-4 pt-2">
      <button
        type="button"
        className="flex items-center gap-3 px-4 py-2 text-[13px] font-medium text-on-surface/60 transition-colors hover:bg-white/50 hover:text-on-surface"
      >
        <QuestionCircleOutlined />
        {intl.formatMessage({ id: 'layout.help' })}
      </button>
      <button
        type="button"
        className="flex items-center gap-3 px-4 py-2 text-[13px] font-medium text-on-surface/60 transition-colors hover:bg-white/50 hover:text-on-surface"
      >
        <CheckCircleOutlined />
        {intl.formatMessage({ id: 'layout.status' })}
      </button>
    </div>
  );
};

export default SiderFooter;
