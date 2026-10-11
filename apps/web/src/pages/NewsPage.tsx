import { useEffect, useState } from 'react';
import { SurfaceCard } from '@svaraa/ui';
import { api } from '../lib/api';
import { useApp } from '../lib/store';

export function NewsPage() {
  const { session } = useApp();
  const [briefing, setBriefing] = useState<{ title: string; summary: string; at: string } | null>(null);
  useEffect(() => {
    if (!session) return;
    api.getNews(session).then((b) => setBriefing(b as typeof briefing));
  }, [session]);
  return (
    <div className="stack">
      <h2 data-tour="news-title" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>News</h2>
      <SurfaceCard>
        <h3 style={{ marginTop: 0 }}>{briefing?.title ?? 'Morning briefing'}</h3>
        <p>{briefing?.summary ?? 'Seed demo content after onboarding to hear a briefing.'}</p>
        <p style={{ color: 'var(--text-secondary)' }}>About 90 seconds · Calm mode available</p>
      </SurfaceCard>
    </div>
  );
}
