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
    <div className="mb-3 flex min-h-10 items-center justify-between gap-3 rounded-[--radius-ui] border border-surface-container-high/80 bg-surface-container-low/40 px-2.5 py-1.5">
      <div className="flex items-center gap-2">
        <span className="rounded-md border border-surface-container-high bg-surface px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-on-surface/55">
          Scope
        </span>
        <ProjectSwitcher showPageLabel={false} />
      </div>
    </div>
  );
};

export default ListScopeBar;
