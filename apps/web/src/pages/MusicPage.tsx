import { Button, SurfaceCard } from '@svaraa/ui';

export function MusicPage() {
  return (
    <div className="stack">
      <h2 data-tour="music-title" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Music</h2>
      <SurfaceCard className="stack">
        <p>Third-party music plays on phone, speaker, or hearing aids. The pendant is a voice remote only.</p>
        <Button variant="secondary">Connect Spotify (stub)</Button>
        <Button variant="secondary">Connect YouTube Music (stub)</Button>
        <Button variant="secondary">Connect Apple Music (stub)</Button>
      </SurfaceCard>
    </div>
  );
}
