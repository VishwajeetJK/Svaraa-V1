import { useEffect, useState } from 'react';
import { Button, SurfaceCard } from '@svaraa/ui';
import { api } from '../lib/api';
import { useApp } from '../lib/store';

type Member = { id: string; name: string; role: string; sosTier: number; verified: boolean; email?: string };

export function FamilyPage() {
  const { session } = useApp();
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    if (!session) return;
    setMembers((await api.getFamily(session)) as Member[]);
  }

  useEffect(() => {
    void load();
  }, [session]);

  return (
    <div className="stack">
      <h2 data-tour="family-title" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>
        Family
      </h2>
      <SurfaceCard className="stack">
        <strong>Invite</strong>
        <input
          aria-label="Invite name"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: '1px solid var(--bg-sunken)' }}
        />
        <input
          aria-label="Invite email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: '1px solid var(--bg-sunken)' }}
        />
        <Button
          data-tour="family-invite"
          onClick={async () => {
            if (!session || !name.trim()) return;
            await api.inviteFamily(session, { name: name.trim(), email: email.trim() || undefined });
            setName('');
            setEmail('');
            setMsg('Invite sent (pending verify).');
            await load();
          }}
        >
          Send invite
        </Button>
        {msg ? <div style={{ color: 'var(--status-info)', fontSize: 14 }}>{msg}</div> : null}
      </SurfaceCard>
      <SurfaceCard className="stack">
        <strong>SOS ladder</strong>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
          Lower tier = earlier alert. Drag order via Move up / Move down.
        </p>
        {members.map((m, idx) => (
          <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ minWidth: 160 }}>
              <strong>{m.name}</strong> · tier {m.sosTier} · {m.verified ? 'verified' : 'pending'}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={idx === 0}
              onClick={async () => {
                if (!session || idx === 0) return;
                const next = members.map((x) => ({ ...x }));
                const tmp = next[idx - 1].sosTier;
                next[idx - 1].sosTier = next[idx].sosTier;
                next[idx].sosTier = tmp;
                const updated = (await api.updateFamilyLadder(
                  session,
                  next.map((x) => ({ id: x.id, sosTier: x.sosTier })),
                )) as Member[];
                setMembers(updated);
              }}
            >
              Move up
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={idx === members.length - 1}
              onClick={async () => {
                if (!session || idx >= members.length - 1) return;
                const next = members.map((x) => ({ ...x }));
                const tmp = next[idx + 1].sosTier;
                next[idx + 1].sosTier = next[idx].sosTier;
                next[idx].sosTier = tmp;
                const updated = (await api.updateFamilyLadder(
                  session,
                  next.map((x) => ({ id: x.id, sosTier: x.sosTier })),
                )) as Member[];
                setMembers(updated);
              }}
            >
              Move down
            </Button>
          </div>
        ))}
      </SurfaceCard>
    </div>
  );
}
