/** @vitest-environment happy-dom */
import { describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { EmptyState, ErrorState, LoadingState, PendantOfflineState } from './States.js';
import { AttentionCard } from './Card.js';

async function render(ui: React.ReactNode) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(ui);
  });
  return host;
}

describe('standard states', () => {
  it('LoadingState marks busy', async () => {
    const host = await render(<LoadingState label="Loading today" />);
    expect(host.querySelector('[aria-busy="true"]')).toBeTruthy();
    expect(host.textContent).toContain('Loading today');
  });

  it('EmptyState shows title', async () => {
    const host = await render(<EmptyState title="Nothing here" detail="Yet" />);
    expect(host.textContent).toContain('Nothing here');
    expect(host.textContent).toContain('Yet');
  });

  it('ErrorState retries', async () => {
    const onRetry = vi.fn();
    const host = await render(<ErrorState title="Failed" onRetry={onRetry} />);
    await act(async () => {
      host.querySelector('button')?.click();
    });
    expect(onRetry).toHaveBeenCalled();
  });

  it('PendantOfflineState lists what still works', async () => {
    const host = await render(<PendantOfflineState />);
    expect(host.textContent).toMatch(/Reminders continue/i);
    expect(host.textContent).toMatch(/Fall and SOS/i);
  });

  it('AttentionCard fires CTA', async () => {
    const onCta = vi.fn();
    const host = await render(
      <AttentionCard title="Help" cta="Open" severity="safety" onCta={onCta} />,
    );
    await act(async () => {
      host.querySelector('button')?.click();
    });
    expect(onCta).toHaveBeenCalled();
  });
});
