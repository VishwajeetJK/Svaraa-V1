import { useNavigate } from 'react-router-dom';
import { APP_TILES } from '@svaraa/shared';
import { TileIcon } from '../components/TileIcon';
import { useApp } from '../lib/store';

export function HomePage() {
  const navigate = useNavigate();
  const { today } = useApp();
  const todoBadge = today?.actionItems.filter((a) => a.status !== 'done').length ?? 0;
  const safetyBadge = today?.attention.filter((a) => a.severity === 'safety').length ?? 0;

  return (
    <div data-tour="apps-title">
      <div className="app-grid">
        {APP_TILES.map((tile) => {
          let badge: number | undefined;
          if (tile.id === 'todo' && todoBadge > 0) badge = todoBadge;
          if (tile.id === 'safety' && safetyBadge > 0) badge = safetyBadge;
          return (
            <button
              key={tile.id}
              className="app-tile"
              type="button"
              onClick={() => navigate(tile.route)}
              aria-label={tile.label}
            >
              <span className={`app-tile__icon ${tile.family}`}>
                <TileIcon id={tile.id} family={tile.family} />
                {badge ? <span className="app-tile__badge">{badge}</span> : null}
              </span>
              <span className="app-tile__label">{tile.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
