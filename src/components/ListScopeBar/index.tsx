import ProjectSwitcher from '@/components/ProjectSwitcher';

type ListScopeBarProps = {
  compact?: boolean;
};

const ListScopeBar: React.FC<ListScopeBarProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex min-h-10 items-center">
        <ProjectSwitcher showPageLabel={false} />
      </div>
    );
  }

  return (
    <div className="mb-3 flex min-h-10 items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <ProjectSwitcher showPageLabel={false} />
      </div>
    </div>
  );
};

export default ListScopeBar;
