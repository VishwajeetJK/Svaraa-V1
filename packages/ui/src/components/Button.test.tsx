/** @vitest-environment happy-dom */
import { describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { Button } from './Button.js';

async function render(ui: React.ReactNode) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(ui);
  });
  return { host, root };
}

describe('Button', () => {
  it('renders children and primary variant', async () => {
    const { host } = await render(<Button>Continue</Button>);
    const btn = host.querySelector('button');
    expect(btn?.textContent).toBe('Continue');
    expect(btn?.style.background).toContain('action-primary');
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    const { host } = await render(
      <Button onClick={onClick} variant="safety">
        Call
      </Button>,
    );
    await act(async () => {
      host.querySelector('button')?.click();
    });
    expect(onClick).toHaveBeenCalled();
  });

  it('respects disabled', async () => {
    const onClick = vi.fn();
    const { host } = await render(
      <Button disabled onClick={onClick}>
        No
      </Button>,
    );
    const btn = host.querySelector('button')!;
    expect(btn.disabled).toBe(true);
  });

  it('supports xl size for Simple Mode', async () => {
    const { host } = await render(
      <Button size="xl" variant="secondary">
        Talk
      </Button>,
    );
    expect(host.querySelector('button')?.style.minHeight).toBe('64px');
  });
});
