export const ELEMENTS = ['木', '火', '土', '金', '水'] as const;
export type Element = (typeof ELEMENTS)[number];
export type ElementScoreMap = Record<Element, number>;

export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export type HeavenlyStem = (typeof STEMS)[number];
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
export type EarthlyBranch = (typeof BRANCHES)[number];

export type TenGod = '比肩' | '劫财' | '食神' | '伤官' | '偏财' | '正财' | '七杀' | '正官' | '偏印' | '正印' | '日主';
export type TenGodGroup = '比劫' | '食伤' | '财星' | '官杀' | '印星';
export type DisplayMode = 'popular' | 'advanced' | 'expert';
export type RecommendationMode = 'personal' | 'universal';
export type SceneType = 'commute' | 'business' | 'social' | 'decision';
export type DayRolloverRule = 'zi_start' | 'midnight' | 'late_zi_previous_day';
export type EffectiveTimeType = 'standard' | 'true_solar' | 'expert';
export type StrengthLevel = 'very_strong' | 'strong' | 'balanced' | 'weak' | 'very_weak' | 'special_pending';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type ElementPreferenceLevel = 'core' | 'favorable' | 'neutral' | 'cautious';
export type TransformationStatus = 'potential' | 'not_formed' | 'combined_not_transformed' | 'formed';

export interface BirthInput {
  localDateTime: string;
  country: string;
  city: string;
  province?: string;
  prefecture?: string;
  district?: string;
  administrativeCode?: string;
  locationSource?: 'china_county' | 'preset' | 'manual';
  coordinatePrecision?: 'county' | 'county_name_match' | 'county_city_layer' | 'city' | 'province' | 'manual';
  timezone: string;
  timezoneSource?: 'default' | 'manual';
  longitude: number;
  latitude?: number;
}

export interface TimeCorrectionConfig {
  solarTimeEnabled: boolean;
  expertTimeEnabled: boolean;
  expertDateTime?: string;
  dayRolloverRule: DayRolloverRule;
}

export interface UserPreferences {
  dislikedColors: string[];
  wardrobeElements: Element[];
  dressCode?: string;
}

export interface ExpertElementSetting {
  core: Element[];
  favorable: Element[];
  neutral: Element[];
  cautious: Element[];
}

export interface RecommendationWeights {
  personal: number;
  month: number;
  day: number;
  year: number;
  scene: number;
}

export interface ExpertOverride {
  enabled: boolean;
  configured: boolean;
  correctedStrength?: StrengthLevel;
  structureName?: string;
  specialStructureConfirmed?: boolean;
  transformationOverrides: Record<string, TransformationStatus>;
  supportingElements: Element[];
  climateElements: Element[];
  bridgingElements: Element[];
  illnessMedicineElements: Element[];
  finalElements?: ExpertElementSetting;
  elementAdjustments: ElementScoreMap;
  weights: RecommendationWeights;
  notes: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  schemaVersion: string;
  name: string;
  gender: 'male' | 'female' | 'unspecified';
  birthInput: BirthInput;
  timeConfig: TimeCorrectionConfig;
  expertOverride: ExpertOverride;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface TimeCorrectionBreakdown {
  standardDateTime: string;
  utcDateTime: string;
  trueSolarDateTime?: string;
  expertDateTime?: string;
  effectiveDateTime: string;
  effectiveTimeType: EffectiveTimeType;
  utcOffsetMinutes: number;
  isDst: boolean;
  longitudeCorrectionMinutes: number;
  equationOfTimeMinutes: number;
  totalSolarCorrectionMinutes: number;
  crossedDate: boolean;
  crossedHourBranch: boolean;
}

export interface TimeWarning {
  code: string;
  level: 'info' | 'warning' | 'danger';
  message: string;
}

export interface HiddenStemDetail {
  stem: HeavenlyStem;
  element: Element;
  tenGod: TenGod;
  role: 'main' | 'middle' | 'residual';
  ratio: number;
}

export interface Pillar {
  label: '年柱' | '月柱' | '日柱' | '时柱';
  text: string;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  stemElement: Element;
  branchElement: Element;
  stemTenGod: TenGod;
  hiddenStems: HiddenStemDetail[];
  naYin: string;
  diShi: string;
}

export interface SolarTermPoint {
  name: string;
  dateTime: string;
  distanceHours: number;
}

export interface SolarTermContext {
  current?: string;
  previous: SolarTermPoint;
  next: SolarTermPoint;
  nearest: SolarTermPoint;
  isCritical: boolean;
}

export interface BaziChart {
  sourceDateTime: string;
  effectiveDateTime: string;
  effectiveTimeType: EffectiveTimeType;
  timeBreakdown: TimeCorrectionBreakdown;
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar;
  };
  pillarList: Pillar[];
  dayMaster: HeavenlyStem;
  dayMasterElement: Element;
  lunarText: string;
  solarTerms: SolarTermContext;
  timeWarnings: TimeWarning[];
}

export interface EvidenceItem {
  title: string;
  detail: string;
  impact?: number;
}

export interface BasicChartAnalysis {
  elementCounts: ElementScoreMap;
  rawElementPower: ElementScoreMap;
  yinCount: number;
  yangCount: number;
  monthCommandElement: Element;
  facts: EvidenceItem[];
}

export interface StrengthAnalysis {
  level: StrengthLevel;
  label: string;
  supportRatio: number;
  supportScore: number;
  drainScore: number;
  rootScore: number;
  elementPower: ElementScoreMap;
  elementPercentages: ElementScoreMap;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  supportingEvidence: EvidenceItem[];
  opposingEvidence: EvidenceItem[];
  warnings: string[];
}

export interface StructureCandidate {
  id: string;
  name: string;
  type: 'normal' | 'special';
  confidence: number;
  active: boolean;
  supportingEvidence: EvidenceItem[];
  opposingEvidence: EvidenceItem[];
}

export interface RelationshipFinding {
  id: string;
  kind: 'stem_combine' | 'branch_combine' | 'three_harmony' | 'three_meeting' | 'half_harmony' | 'clash' | 'punishment' | 'harm' | 'break';
  label: string;
  members: string[];
  targetElement?: Element;
  status?: TransformationStatus;
  explanation: string;
}

export interface StructureAnalysis {
  candidates: StructureCandidate[];
  relationships: RelationshipFinding[];
  selectedStructure?: string;
  specialPending: boolean;
  confidence: number;
  warnings: string[];
}

export interface ClimateIndex {
  cold: number;
  heat: number;
  dry: number;
  wet: number;
}

export interface UsefulElementDetail {
  element: Element;
  supportingScore: number;
  climateScore: number;
  bridgingScore: number;
  structureScore: number;
  combinedScore: number;
  level: ElementPreferenceLevel;
  reasons: string[];
}

export interface UsefulElementAnalysis {
  supportingModel: ElementScoreMap;
  climateModel: ElementScoreMap;
  bridgingModel: ElementScoreMap;
  structureModel: ElementScoreMap;
  climateIndex: ClimateIndex;
  details: UsefulElementDetail[];
  core: Element[];
  favorable: Element[];
  neutral: Element[];
  cautious: Element[];
  bridgingCandidates: Element[];
  explanation: string;
}

export interface FinalPersonalAnalysis {
  source: 'automatic' | 'expert';
  strength: StrengthLevel;
  strengthLabel: string;
  structure?: string;
  elements: ExpertElementSetting;
  elementBaseScores: ElementScoreMap;
  notes: string[];
}

export interface BaziAnalysis {
  basic: BasicChartAnalysis;
  strength: StrengthAnalysis;
  structure: StructureAnalysis;
  usefulElements: UsefulElementAnalysis;
  final: FinalPersonalAnalysis;
  algorithmVersion: string;
}

export interface TransitPillar {
  text: string;
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  stemElement: Element;
  branchElement: Element;
  hiddenStems: HiddenStemDetail[];
}

export interface TransitContext {
  date: string;
  year: TransitPillar;
  month: TransitPillar;
  day: TransitPillar;
  yearScores: ElementScoreMap;
  monthScores: ElementScoreMap;
  dayScores: ElementScoreMap;
  environmentScores: ElementScoreMap;
  lunarText: string;
  weekday: string;
}

export interface ScoreBreakdown {
  personal: number;
  year: number;
  month: number;
  day: number;
  scene: number;
  overflowPenalty: number;
  bridgeBonus: number;
  expertAdjustment: number;
  final: number;
}

export interface ElementRecommendation {
  element: Element;
  rank: number;
  level: ElementPreferenceLevel;
  score: ScoreBreakdown;
  reasons: string[];
}

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface ColorRecommendation {
  role: 'main' | 'secondary' | 'accent' | 'neutral' | 'caution';
  element: Element;
  colors: ColorSwatch[];
  ratio: string;
  explanation: string;
}

export interface OutfitExample {
  title: string;
  description: string;
}

export interface RecommendationExplanation {
  summary: string;
  personalReason: string;
  transitReason: string;
  sceneReason: string;
  warnings: string[];
}

export interface ClothingRecommendation {
  date: string;
  scene: SceneType;
  mode: DisplayMode;
  elementRanking: ElementRecommendation[];
  main: ColorRecommendation;
  secondary: ColorRecommendation;
  accent: ColorRecommendation;
  neutral: ColorRecommendation;
  caution: ColorRecommendation;
  outfitExamples: OutfitExample[];
  explanation: RecommendationExplanation;
  algorithmVersion: string;
}
