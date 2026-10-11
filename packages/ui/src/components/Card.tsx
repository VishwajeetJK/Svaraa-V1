import type { ReactNode } from 'react';
import { Button } from './Button.js';

export function AttentionCard({
  title,
  detail,
  cta,
  onCta,
  severity = 'attention',
}: {
  title: string;
  detail?: string;
  cta: string;
  onCta?: () => void;
  severity?: 'info' | 'attention' | 'safety';
}) {
  return (
    <div className={`attention-card attention-card--${severity}`}>
      <div>
        <div className="attention-card__title">{title}</div>
        {detail ? <div className="attention-card__detail">{detail}</div> : null}
      </div>
      <div>
        <Button variant={severity === 'safety' ? 'safety' : 'primary'} size="md" onClick={onCta}>
          {cta}
        </Button>
      </div>
    </div>
  );
}

export function SurfaceCard({
  children,
  style,
  className,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className={['surface-card', className].filter(Boolean).join(' ')} style={style}>
      {children}
    </div>
  );
}
