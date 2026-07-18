import { z } from 'zod';
import type { UserProfile } from '../types/domain';

const element = z.enum(['木', '火', '土', '金', '水']);
const scoreMap = z.object({ 木: z.number(), 火: z.number(), 土: z.number(), 金: z.number(), 水: z.number() });
const weights = z.object({ personal: z.number(), month: z.number(), day: z.number(), year: z.number(), scene: z.number() });

export const expertOverrideSchema = z.object({
  enabled: z.boolean(),
  configured: z.boolean().optional().default(false),
  correctedStrength: z.enum(['very_strong', 'strong', 'balanced', 'weak', 'very_weak', 'special_pending']).optional(),
  structureName: z.string().optional(),
  specialStructureConfirmed: z.boolean().optional(),
  transformationOverrides: z.record(z.string(), z.enum(['potential', 'not_formed', 'combined_not_transformed', 'formed'])),
  supportingElements: z.array(element),
  climateElements: z.array(element),
  bridgingElements: z.array(element),
  illnessMedicineElements: z.array(element),
  finalElements: z.object({
    core: z.array(element), favorable: z.array(element), neutral: z.array(element), cautious: z.array(element),
  }).optional(),
  elementAdjustments: scoreMap,
  weights,
  notes: z.string(),
  updatedAt: z.string().optional(),
});

export const userProfileSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.string(),
  name: z.string().min(1),
  gender: z.enum(['male', 'female', 'unspecified']),
  birthInput: z.object({
    localDateTime: z.string(),
    country: z.string(),
    city: z.string(),
    province: z.string().optional(),
    prefecture: z.string().optional(),
    district: z.string().optional(),
    administrativeCode: z.string().optional(),
    locationSource: z.enum(['china_county', 'preset', 'manual']).optional(),
    coordinatePrecision: z.enum(['county', 'county_name_match', 'county_city_layer', 'city', 'province', 'manual']).optional(),
    timezone: z.string(),
    timezoneSource: z.enum(['default', 'manual']).optional(),
    longitude: z.number().min(-180).max(180),
    latitude: z.number().min(-90).max(90).optional(),
  }),
  timeConfig: z.object({
    solarTimeEnabled: z.boolean(),
    expertTimeEnabled: z.boolean(),
    expertDateTime: z.string().optional(),
    dayRolloverRule: z.enum(['zi_start', 'midnight', 'late_zi_previous_day']),
  }),
  expertOverride: expertOverrideSchema,
  preferences: z.object({
    dislikedColors: z.array(z.string()),
    wardrobeElements: z.array(element),
    dressCode: z.string().optional(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const profileExportSchema = z.object({
  schemaVersion: z.string(),
  exportedAt: z.string(),
  profiles: z.array(userProfileSchema),
});

function inferLegacyExpertConfiguration(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const expert = (value as { expertOverride?: Record<string, unknown> }).expertOverride;
  if (!expert || expert.configured !== undefined) return Boolean(expert?.configured);
  const arrays = ['supportingElements', 'climateElements', 'bridgingElements', 'illnessMedicineElements'];
  const hasArrays = arrays.some((key) => Array.isArray(expert[key]) && (expert[key] as unknown[]).length > 0);
  const hasAdjustments = expert.elementAdjustments && typeof expert.elementAdjustments === 'object'
    && Object.values(expert.elementAdjustments as Record<string, unknown>).some((item) => Number(item) !== 0);
  const hasTransform = expert.transformationOverrides && typeof expert.transformationOverrides === 'object'
    && Object.values(expert.transformationOverrides as Record<string, unknown>).some((item) => item !== 'potential');
  return Boolean(
    expert.enabled
    || expert.correctedStrength
    || expert.structureName
    || expert.specialStructureConfirmed
    || expert.finalElements
    || hasArrays
    || hasAdjustments
    || hasTransform
    || String(expert.notes ?? '').trim(),
  );
}

export function parseProfile(value: unknown): UserProfile {
  const profile = userProfileSchema.parse(value) as UserProfile;
  if (value && typeof value === 'object') {
    const rawExpert = (value as { expertOverride?: { configured?: unknown } }).expertOverride;
    if (rawExpert && rawExpert.configured === undefined) profile.expertOverride.configured = inferLegacyExpertConfiguration(value);
  }
  return profile;
}

export function parseProfileExport(value: unknown): UserProfile[] {
  return profileExportSchema.parse(value).profiles as UserProfile[];
}
