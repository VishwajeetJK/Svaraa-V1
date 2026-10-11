export const MemberRoles = ['owner', 'caregiver', 'wearer', 'viewer'] as const;
export type MemberRole = (typeof MemberRoles)[number];

export const PrivacyModes = ['wearer-managed', 'family-managed'] as const;
export type PrivacyMode = (typeof PrivacyModes)[number];

export const Regions = ['IN', 'EU', 'US'] as const;
export type Region = (typeof Regions)[number];
