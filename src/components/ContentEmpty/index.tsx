import type { ReactNode } from 'react';

export type ContentEmptyProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  minHeight?: number;
};

const ContentEmpty: React.FC<ContentEmptyProps> = ({
  title,
  description,
  action,
  className = '',
  minHeight = 300,
}) => {
  return (
    <div className={`content-empty ${className}`} style={{ minHeight }}>
      <div className="content-empty-glow" aria-hidden />
      <h3 className="content-empty-title">{title}</h3>
      {description ? <p className="content-empty-description">{description}</p> : null}
      {action ? <div className="content-empty-action">{action}</div> : null}
    </div>
  );
};

export default ContentEmpty;
