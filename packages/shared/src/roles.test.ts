import { describe, expect, it } from 'vitest';
import { MemberRoles, PrivacyModes, Regions } from './roles.js';

describe('roles constants', () => {
  it('includes owner caregiver wearer viewer', () => {
    expect(MemberRoles).toEqual(['owner', 'caregiver', 'wearer', 'viewer']);
  });

  it('includes privacy modes', () => {
    expect(PrivacyModes).toContain('wearer-managed');
    expect(PrivacyModes).toContain('family-managed');
  });

  it('includes IN EU US regions', () => {
    expect(Regions).toEqual(['IN', 'EU', 'US']);
  });
});
