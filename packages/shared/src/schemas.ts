import { z } from 'zod';
import { HardwareModels, WearModes, FoldStates } from './hardware.js';
import { MemberRoles, PrivacyModes, Regions } from './roles.js';

export const AccountSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  name: z.string().min(1),
  country: z.string().min(2),
  timezone: z.string().min(1),
});

export const WearerProfileSchema = z.object({
  name: z.string().min(1),
  callAs: z.string().min(1),
  dob: z.string().optional(),
  languages: z.array(z.string()).default(['en']),
  address: z.string().optional(),
  responderNotes: z.string().optional(),
  doctor: z.string().optional(),
  allergies: z.string().optional(),
  faith: z.string().optional(),
  hearingNotes: z.string().optional(),
  cardiacImplant: z.boolean().default(false),
});

export const PendantSchema = z.object({
  id: z.string(),
  serial: z.string(),
  name: z.string(),
  hardwareModel: z.enum(HardwareModels),
  firmwareVersion: z.string(),
  batteryPercent: z.number().min(0).max(100),
  connected: z.boolean(),
  charging: z.boolean(),
  recording: z.boolean(),
  micsOff: z.boolean(),
  wearMode: z.enum(WearModes).optional(),
  foldState: z.enum(FoldStates).optional(),
  lastSpokeAt: z.string().nullable(),
  storageUsedMb: z.number().default(0),
  storageTotalMb: z.number().default(128),
});

export const ReminderSchema = z.object({
  id: z.string(),
  title: z.string(),
  spokenPreview: z.string(),
  language: z.string().default('en'),
  important: z.boolean().default(false),
  scheduleCron: z.string().optional(),
  at: z.string().optional(),
  quietHoursExempt: z.boolean().default(false),
});

export const IncidentSchema = z.object({
  id: z.string(),
  kind: z.enum(['sos', 'fall', 'wellness', 'drill']),
  status: z.enum(['active', 'acknowledged', 'resolved', 'cancelled']),
  isDrill: z.boolean().default(false),
  startedAt: z.string(),
  acknowledgedAt: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  locationLabel: z.string().optional(),
  batteryPercent: z.number().optional(),
  notes: z.string().optional(),
});

export const SessionSchema = z.object({
  id: z.string(),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  title: z.string(),
  summary: z.string().optional(),
  kind: z.enum(['conversation', 'recitation', 'doctor', 'other']).default('conversation'),
  actionItemIds: z.array(z.string()).default([]),
});

export const ActionItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['proposed', 'open', 'done', 'dismissed']).default('proposed'),
  sessionId: z.string().optional(),
  ownerMemberId: z.string().optional(),
});

export const TimelineEventSchema = z.object({
  id: z.string(),
  at: z.string(),
  kind: z.string(),
  title: z.string(),
  detail: z.string().optional(),
});

export const MemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(MemberRoles),
  sosTier: z.number().min(0).max(3).default(1),
  channels: z.array(z.enum(['push', 'sms', 'call'])).default(['push']),
  verified: z.boolean().default(false),
});

export const HouseholdSchema = z.object({
  id: z.string(),
  name: z.string(),
  region: z.enum(Regions),
  privacyMode: z.enum(PrivacyModes),
  onboardingStep: z.number().min(1).max(13).default(1),
  onboardingComplete: z.boolean().default(false),
});

export const ProviderConfigSchema = z.object({
  llm: z.enum(['claude', 'openai', 'sarvam']),
  stt: z.string(),
  tts: z.string(),
  managedKeys: z.boolean().default(true),
});

export type Account = z.infer<typeof AccountSchema>;
export type WearerProfile = z.infer<typeof WearerProfileSchema>;
export type Pendant = z.infer<typeof PendantSchema>;
export type Reminder = z.infer<typeof ReminderSchema>;
export type Incident = z.infer<typeof IncidentSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type ActionItem = z.infer<typeof ActionItemSchema>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type Member = z.infer<typeof MemberSchema>;
export type Household = z.infer<typeof HouseholdSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

export type TodaySnapshot = {
  pendant: Pendant | null;
  lastSpokeAt: string | null;
  nextReminder: Reminder | null;
  attention: Array<{ id: string; title: string; cta: string; severity: 'info' | 'attention' | 'safety' }>;
  actionItems: ActionItem[];
  timeline: TimelineEvent[];
  familyLine: string;
  recording: boolean;
  brainJobs: number;
};
