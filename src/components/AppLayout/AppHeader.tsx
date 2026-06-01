import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';

const NAV_ITEMS = [
  { key: 'orchestration', label: 'Orchestration' },
  { key: 'models', label: 'Models' },
  { key: 'logs', label: 'Logs' },
  { key: 'deployments', label: 'Deployments' },
] as const;

const AppHeader: React.FC = () => {
  const [activeNav, setActiveNav] = useState<string>('deployments');

  return (
    <div className="flex flex-1 items-center gap-8 overflow-hidden">
      <div className="relative w-72 shrink-0">
        <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-on-surface/40" />
        <input
          type="text"
          className="app-input w-full py-2 pl-9 pr-3 text-[13px] placeholder:text-on-surface/40"
          placeholder="Search resources..."
        />
      </div>
    
    </div>
  );
};

export default AppHeader;
