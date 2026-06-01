import { PlusOutlined } from '@ant-design/icons';

type MarketplaceCardProps = {
  onBrowse?: () => void;
};

const MarketplaceCard: React.FC<MarketplaceCardProps> = ({ onBrowse }) => {
  return (
    <button
      type="button"
      className="flex min-h-[220px] flex-col items-center justify-center rounded-[--radius-ui] border-2 border-dashed border-outline-variant/25 bg-surface-container-low/60 p-6 text-center transition-colors hover:border-primary/35 hover:bg-surface-container-low"
      onClick={onBrowse}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-[--radius-ui] border border-outline-variant/25 bg-surface-container-lowest text-on-surface/40">
        <PlusOutlined className="text-lg" />
      </span>
      <span className="text-sm font-semibold text-on-surface">Browse Marketplace</span>
      <span className="mt-1 text-xs text-on-surface/50">Discover 200+ native integrations</span>
    </button>
  );
};

export default MarketplaceCard;
