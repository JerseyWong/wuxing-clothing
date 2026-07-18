import { DateTime } from 'luxon';
import type {
  BirthInput,
  DayRolloverRule,
  TimeCorrectionBreakdown,
  TimeCorrectionConfig,
  TimeWarning,
} from '../types/domain';

export const DATE_TIME_INPUT_FORMAT = "yyyy-MM-dd'T'HH:mm";

export function equationOfTimeMinutes(dateTime: DateTime): number {
  const dayOfYear = dateTime.ordinal;
  const hour = dateTime.hour + dateTime.minute / 60;
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (hour - 12) / 24);
  return 229.18 * (
    0.000075
    + 0.001868 * Math.cos(gamma)
    - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma)
    - 0.040849 * Math.sin(2 * gamma)
  );
}

export function hourBranchIndex(dateTime: DateTime): number {
  return Math.floor(((dateTime.hour + 1) % 24) / 2);
}

export function resolveEffectiveTime(
  birth: BirthInput,
  config: TimeCorrectionConfig,
): { breakdown: TimeCorrectionBreakdown; warnings: TimeWarning[]; effective: DateTime } {
  const warnings: TimeWarning[] = [];
  const standard = DateTime.fromFormat(birth.localDateTime, DATE_TIME_INPUT_FORMAT, {
    zone: birth.timezone,
    setZone: true,
  });

  if (!standard.isValid) {
    throw new Error(`出生时间无效：${standard.invalidExplanation ?? '无法解析'}`);
  }

  const utc = standard.toUTC();
  const longitudeCorrectionMinutes = birth.longitude * 4 - standard.offset;
  const equation = equationOfTimeMinutes(standard);
  const totalSolarCorrectionMinutes = longitudeCorrectionMinutes + equation;
  const trueSolar = standard.plus({ minutes: totalSolarCorrectionMinutes });

  let effective: DateTime = standard;
  let effectiveTimeType: TimeCorrectionBreakdown['effectiveTimeType'] = 'standard';
  let expert: DateTime | undefined;

  if (config.solarTimeEnabled) {
    effective = trueSolar;
    effectiveTimeType = 'true_solar';
  }

  if (config.expertTimeEnabled && config.expertDateTime) {
    expert = DateTime.fromFormat(config.expertDateTime, DATE_TIME_INPUT_FORMAT, {
      zone: birth.timezone,
      setZone: true,
    });
    if (!expert.isValid) {
      warnings.push({ code: 'INVALID_EXPERT_TIME', level: 'danger', message: '专家校正时间无效，已回退到其他时间口径。' });
    } else {
      effective = expert;
      effectiveTimeType = 'expert';
    }
  }

  const crossedDate = standard.toISODate() !== trueSolar.toISODate();
  const crossedHourBranch = hourBranchIndex(standard) !== hourBranchIndex(trueSolar);

  if (config.solarTimeEnabled && crossedDate) {
    warnings.push({ code: 'SOLAR_CROSSED_DATE', level: 'danger', message: '真太阳时校正后跨越日期，日柱和时柱可能变化。' });
  } else if (config.solarTimeEnabled && crossedHourBranch) {
    warnings.push({ code: 'SOLAR_CROSSED_BRANCH', level: 'warning', message: '真太阳时校正后跨越时辰，时柱已经重新计算。' });
  }

  if (config.expertTimeEnabled && expert) {
    warnings.push({ code: 'EXPERT_TIME_ACTIVE', level: 'info', message: '当前命盘采用专家校正时间，标准时间和真太阳时仅用于对照。' });
  }

  if (standard.isInDST) {
    warnings.push({ code: 'DST_ACTIVE', level: 'info', message: `出生时刻实行夏令时，当时采用${formatOffset(standard.offset)}。` });
  }

  const minuteInBranch = ((effective.hour + 1) % 2) * 60 + effective.minute;
  if (minuteInBranch <= 15 || minuteInBranch >= 105) {
    warnings.push({ code: 'HOUR_BRANCH_BOUNDARY', level: 'warning', message: '有效出生时间接近时辰交界，建议复核出生时间。' });
  }

  if (effective.hour === 23) {
    warnings.push({ code: 'ZI_HOUR_RULE', level: 'warning', message: `出生时间位于晚子时，当前采用“${dayRolloverLabel(config.dayRolloverRule)}”。` });
  }

  return {
    effective,
    warnings,
    breakdown: {
      standardDateTime: standard.toFormat('yyyy-MM-dd HH:mm'),
      utcDateTime: utc.toFormat('yyyy-MM-dd HH:mm'),
      trueSolarDateTime: trueSolar.toFormat('yyyy-MM-dd HH:mm'),
      expertDateTime: expert?.isValid ? expert.toFormat('yyyy-MM-dd HH:mm') : undefined,
      effectiveDateTime: effective.toFormat('yyyy-MM-dd HH:mm'),
      effectiveTimeType,
      utcOffsetMinutes: standard.offset,
      isDst: standard.isInDST,
      longitudeCorrectionMinutes: Number(longitudeCorrectionMinutes.toFixed(2)),
      equationOfTimeMinutes: Number(equation.toFixed(2)),
      totalSolarCorrectionMinutes: Number(totalSolarCorrectionMinutes.toFixed(2)),
      crossedDate,
      crossedHourBranch,
    },
  };
}

export function dayRolloverSect(rule: DayRolloverRule): 1 | 2 {
  return rule === 'zi_start' ? 1 : 2;
}

export function dayRolloverLabel(rule: DayRolloverRule): string {
  if (rule === 'zi_start') return '子初换日（23:00）';
  if (rule === 'midnight') return '午夜换日（00:00）';
  return '晚子时不换日';
}

export function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? '东' : '西';
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  const zone = mins === 0 ? `${sign}${hours}区` : `${sign}${hours}区${mins}分`;
  const numeric = `${minutes >= 0 ? '+' : '-'}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  return `${zone}（${numeric}）`;
}
