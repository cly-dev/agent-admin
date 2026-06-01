import { PlusOutlined } from '@ant-design/icons';
import { useProjectRoute } from '@/hooks/useProjectRoute';
import { history, useIntl } from '@umijs/max';

const NewProjectButton: React.FC = () => {
  const { toPagePath } = useProjectRoute();
  const intl = useIntl();

  return (
    <button
      type="button"
      className="app-button-primary flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold shadow-sm transition-transform active:scale-95"
      onClick={() => history.push(toPagePath('project'))}
    >
      <PlusOutlined className="text-xs" />
      <span className="hidden sm:inline">{intl.formatMessage({ id: 'layout.newProject' })}</span>
    </button>
  );
};

export default NewProjectButton;
