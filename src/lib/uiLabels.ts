import type {
  EffectiveTimeType,
  ElementPreferenceLevel,
  StrengthLevel,
  TransformationStatus,
} from '../types/domain';

const EFFECTIVE_TIME_LABELS: Record<EffectiveTimeType, string> = {
  standard: '当地标准时间',
  true_solar: '真太阳时',
  expert: '人工校正时间',
};

const TRANSFORMATION_STATUS_LABELS: Record<TransformationStatus, string> = {
  potential: '有合化条件',
  not_formed: '不成立',
  combined_not_transformed: '相合但不化',
  formed: '合化成立',
};

const PREFERENCE_LEVEL_LABELS: Record<ElementPreferenceLevel, string> = {
  core: '重点采用',
  favorable: '适合采用',
  neutral: '平衡使用',
  cautious: '少量使用',
};

const STRENGTH_LABELS: Record<StrengthLevel, string> = {
  very_strong: '明显偏强',
  strong: '相对偏强',
  balanced: '较为平衡',
  weak: '相对偏弱',
  very_weak: '明显偏弱',
  special_pending: '特殊结构待判断',
};

const TIMEZONE_LABELS: Record<string, string> = {
  'Asia/Shanghai': '中国标准时间（东八区）',
  'Asia/Hong_Kong': '香港时间（东八区）',
  'Asia/Macau': '澳门时间（东八区）',
  'Asia/Taipei': '台北时间（东八区）',
  'Asia/Tokyo': '日本时间（东九区）',
  'Asia/Singapore': '新加坡时间（东八区）',
  'Europe/London': '伦敦时间',
  'Europe/Paris': '巴黎时间',
  'America/Los_Angeles': '北美太平洋时间',
  'America/New_York': '北美东部时间',
  'Australia/Sydney': '悉尼时间',
  UTC: '零时区',
};

export function effectiveTimeLabel(value: EffectiveTimeType): string {
  return EFFECTIVE_TIME_LABELS[value];
}

export function transformationStatusLabel(value?: TransformationStatus): string {
  return value ? TRANSFORMATION_STATUS_LABELS[value] : '命局关系';
}

export function preferenceLevelLabel(value: ElementPreferenceLevel): string {
  return PREFERENCE_LEVEL_LABELS[value];
}

export function strengthLevelLabel(value: StrengthLevel): string {
  return STRENGTH_LABELS[value];
}

export function timezoneLabel(value: string): string {
  return TIMEZONE_LABELS[value] ?? '其他时区';
}
