import { SurfaceCard } from '@svaraa/ui';

export function PrayerPage() {
  return (
    <div className="stack">
      <h2 data-tour="prayer-title" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Prayer</h2>
      <SurfaceCard>
        <p>Location + tradition drive spoken prayer times and optional recite pairing.</p>
        <ul>
          <li>06:30 · Morning prayer</li>
          <li>18:30 · Evening prayer</li>
        </ul>
      </SurfaceCard>
    </div>
  );
}
