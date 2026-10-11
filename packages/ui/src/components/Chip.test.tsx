/** @vitest-environment happy-dom */
import { describe, expect, it } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { PendantChip, SyncChip } from './Chip.js';

async function render(ui: React.ReactNode) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(ui);
  });
  return host;
}

describe('PendantChip', () => {
  it.each([
    ['connected', 'Pendant'],
    ['charging', 'Charging'],
    ['low', 'Low battery'],
    ['not_connected', 'Not connected'],
    ['recording', 'Recording'],
    ['mics_off', 'Mics off'],
  ] as const)('renders %s state', async (state, label) => {
    const host = await render(<PendantChip state={state} battery={72} />);
    expect(host.textContent).toContain(label);
    expect(host.textContent).toContain('72%');
  });
});

describe('SyncChip', () => {
  it.each([
    ['waiting', 'Waiting for pendant'],
    ['sent', 'Sent to pendant'],
    ['synced', 'In sync'],
  ] as const)('renders %s', async (state, label) => {
    const host = await render(<SyncChip state={state} />);
    expect(host.textContent).toContain(label);
  });
});
