import { create } from 'zustand';
import { DateTime } from 'luxon';
import { DEFAULT_WEIGHTS, blankElementScores } from '../data/wuxing';
import type {
  DisplayMode,
  RecommendationMode,
  SceneType,
  UserProfile,
} from '../types/domain';
import { parseProfile } from '../lib/profileSchema';

const STORAGE_KEY = 'wuxing-clothing-profiles-v2.1';
export const SCHEMA_VERSION = '2.1.6';

function uuid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createDefaultProfile(name = '我的命盘'): UserProfile {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    schemaVersion: SCHEMA_VERSION,
    name,
    gender: 'unspecified',
    birthInput: {
      localDateTime: '',
      country: '中国',
      city: '东城区',
      province: '北京市',
      prefecture: '北京市',
      district: '东城区',
      administrativeCode: '110101',
      locationSource: 'china_county',
      coordinatePrecision: 'county',
      timezone: 'Asia/Shanghai',
      timezoneSource: 'default',
      longitude: 116.407408,
      latitude: 39.915707,
    },
    timeConfig: {
      solarTimeEnabled: false,
      expertTimeEnabled: false,
      expertDateTime: undefined,
      dayRolloverRule: 'zi_start',
    },
    expertOverride: {
      enabled: false,
      configured: false,
      transformationOverrides: {},
      supportingElements: [],
      climateElements: [],
      bridgingElements: [],
      illnessMedicineElements: [],
      finalElements: undefined,
      elementAdjustments: blankElementScores(),
      weights: { ...DEFAULT_WEIGHTS },
      notes: '',
    },
    preferences: { dislikedColors: [], wardrobeElements: [], dressCode: '' },
    createdAt: now,
    updatedAt: now,
  };
}

interface AppState {
  profiles: UserProfile[];
  activeProfileId?: string;
  draftProfile: UserProfile;
  selectedDate: string;
  scene: SceneType;
  displayMode: DisplayMode;
  recommendationMode: RecommendationMode;
  initialized: boolean;
  initialize: () => void;
  setDraftProfile: (profile: UserProfile) => void;
  updateDraft: (updater: (profile: UserProfile) => UserProfile) => void;
  newProfile: () => void;
  selectProfile: (id: string) => void;
  saveDraft: () => void;
  deleteProfile: (id: string) => void;
  clearProfiles: () => void;
  importProfiles: (profiles: UserProfile[]) => void;
  setSelectedDate: (date: string) => void;
  setScene: (scene: SceneType) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setRecommendationMode: (mode: RecommendationMode) => void;
}

function writeProfiles(profiles: UserProfile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export const useAppStore = create<AppState>((set, get) => ({
  profiles: [],
  activeProfileId: undefined,
  draftProfile: createDefaultProfile(),
  selectedDate: DateTime.local().toISODate() ?? '',
  scene: 'commute',
  displayMode: 'popular',
  recommendationMode: 'universal',
  initialized: false,

  initialize: () => {
    if (get().initialized) return;
    let profiles: UserProfile[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) profiles = (JSON.parse(raw) as unknown[]).map(parseProfile);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    const active = profiles[0];
    set({
      profiles,
      activeProfileId: active?.id,
      draftProfile: active ? structuredClone(active) : createDefaultProfile(),
      initialized: true,
    });
  },

  setDraftProfile: (profile) => set({ draftProfile: structuredClone(profile) }),
  updateDraft: (updater) => set((state) => ({ draftProfile: updater(structuredClone(state.draftProfile)) })),
  newProfile: () => set({ activeProfileId: undefined, draftProfile: createDefaultProfile(`档案 ${get().profiles.length + 1}`) }),
  selectProfile: (id) => {
    const profile = get().profiles.find((item) => item.id === id);
    if (profile) set({ activeProfileId: id, draftProfile: structuredClone(profile) });
  },
  saveDraft: () => {
    const draft = { ...get().draftProfile, updatedAt: new Date().toISOString() };
    const existing = get().profiles.some((item) => item.id === draft.id);
    const profiles = existing
      ? get().profiles.map((item) => item.id === draft.id ? structuredClone(draft) : item)
      : [...get().profiles, structuredClone(draft)];
    writeProfiles(profiles);
    set({ profiles, activeProfileId: draft.id, draftProfile: draft });
  },
  deleteProfile: (id) => {
    const profiles = get().profiles.filter((item) => item.id !== id);
    writeProfiles(profiles);
    const next = profiles[0];
    set({ profiles, activeProfileId: next?.id, draftProfile: next ? structuredClone(next) : createDefaultProfile() });
  },
  clearProfiles: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ profiles: [], activeProfileId: undefined, draftProfile: createDefaultProfile() });
  },
  importProfiles: (incoming) => {
    const byId = new Map(get().profiles.map((profile) => [profile.id, profile]));
    incoming.forEach((profile) => byId.set(profile.id, profile));
    const profiles = [...byId.values()];
    writeProfiles(profiles);
    const next = incoming[0] ?? profiles[0];
    set({ profiles, activeProfileId: next?.id, draftProfile: next ? structuredClone(next) : createDefaultProfile() });
  },
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setScene: (scene) => set({ scene }),
  setDisplayMode: (displayMode) => set({ displayMode }),
  setRecommendationMode: (recommendationMode) => set({ recommendationMode }),
}));
