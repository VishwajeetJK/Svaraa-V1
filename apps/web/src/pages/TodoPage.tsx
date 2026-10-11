import { useEffect, useState } from 'react';
import { SurfaceCard } from '@svaraa/ui';
import { api } from '../lib/api';
import { useApp } from '../lib/store';

export function TodoPage() {
  const { session } = useApp();
  const [items, setItems] = useState<Array<{ id: string; title: string; status: string }>>([]);
  useEffect(() => {
    if (!session) return;
    api.getTodo(session).then((x) => setItems(x as typeof items));
  }, [session]);
  return (
    <div className="stack">
      <h2 data-tour="todo-title" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>To-do</h2>
      {items.map((i) => (
        <SurfaceCard key={i.id}>
          <strong>{i.title}</strong>
          <div style={{ color: 'var(--text-secondary)' }}>{i.status}</div>
        </SurfaceCard>
      ))}
    </div>
  );
}
