import { DateTime } from 'luxon';
import { Solar } from 'lunar-javascript';
import {
  BRANCH_ELEMENT,
  HIDDEN_STEMS,
  STEM_ELEMENT,
  getTenGod,
} from '../data/wuxing';
import type {
  BaziChart,
  BirthInput,
  EarthlyBranch,
  HeavenlyStem,
  HiddenStemDetail,
  Pillar,
  SolarTermContext,
  TimeCorrectionConfig,
  TransitContext,
  TransitPillar,
} from '../types/domain';
import { resolveEffectiveTime, dayRolloverSect } from './time';
import { blankElementScores, normalizeElementScores } from '../data/wuxing';

function asStem(value: string): HeavenlyStem {
  return value as HeavenlyStem;
}

function asBranch(value: string): EarthlyBranch {
  return value as EarthlyBranch;
}

function hiddenDetails(branch: EarthlyBranch, dayMaster: HeavenlyStem): HiddenStemDetail[] {
  return HIDDEN_STEMS[branch].map((item) => ({
    ...item,
    element: STEM_ELEMENT[item.stem],
    tenGod: getTenGod(dayMaster, item.stem),
  }));
}

function parsePillarText(text: string): { stem: HeavenlyStem; branch: EarthlyBranch } {
  return { stem: asStem(text[0]), branch: asBranch(text[1]) };
}

function buildPillar(
  label: Pillar['label'],
  text: string,
  dayMaster: HeavenlyStem,
  naYin: string,
  diShi: string,
): Pillar {
  const { stem, branch } = parsePillarText(text);
  return {
    label,
    text,
    stem,
    branch,
    stemElement: STEM_ELEMENT[stem],
    branchElement: BRANCH_ELEMENT[branch],
    stemTenGod: label === '日柱' ? '日主' : getTenGod(dayMaster, stem),
    hiddenStems: hiddenDetails(branch, dayMaster),
    naYin,
    diShi,
  };
}

function toDateTimeFromSolar(value: any, zone: string): DateTime {
  return DateTime.fromFormat(value.toYmdHms(), 'yyyy-MM-dd HH:mm:ss', { zone, setZone: true });
}

function buildSolarTermContext(lunar: any, effective: DateTime, zone: string): SolarTermContext {
  const previousRaw = lunar.getPrevJie();
  const nextRaw = lunar.getNextJie();
  const previousDateTime = toDateTimeFromSolar(previousRaw.getSolar(), zone);
  const nextDateTime = toDateTimeFromSolar(nextRaw.getSolar(), zone);
  const previousDistance = Math.abs(effective.diff(previousDateTime, 'hours').hours);
  const nextDistance = Math.abs(nextDateTime.diff(effective, 'hours').hours);
  const previous = {
    name: previousRaw.getName(),
    dateTime: previousDateTime.toFormat('yyyy-MM-dd HH:mm:ss'),
    distanceHours: Number(previousDistance.toFixed(2)),
  };
  const next = {
    name: nextRaw.getName(),
    dateTime: nextDateTime.toFormat('yyyy-MM-dd HH:mm:ss'),
    distanceHours: Number(nextDistance.toFixed(2)),
  };
  const nearest = previous.distanceHours <= next.distanceHours ? previous : next;
  return {
    current: lunar.getJie() || undefined,
    previous,
    next,
    nearest,
    isCritical: nearest.distanceHours < 24,
  };
}

export function buildBaziChart(birth: BirthInput, config: TimeCorrectionConfig): BaziChart {
  const { effective, breakdown, warnings } = resolveEffectiveTime(birth, config);
  const solar = Solar.fromYmdHms(
    effective.year,
    effective.month,
    effective.day,
    effective.hour,
    effective.minute,
    0,
  );
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  eightChar.setSect(dayRolloverSect(config.dayRolloverRule));
  const dayMaster = asStem(eightChar.getDayGan());

  const year = buildPillar('年柱', eightChar.getYear(), dayMaster, eightChar.getYearNaYin(), eightChar.getYearDiShi());
  const month = buildPillar('月柱', eightChar.getMonth(), dayMaster, eightChar.getMonthNaYin(), eightChar.getMonthDiShi());
  const day = buildPillar('日柱', eightChar.getDay(), dayMaster, eightChar.getDayNaYin(), eightChar.getDayDiShi());
  const hour = buildPillar('时柱', eightChar.getTime(), dayMaster, eightChar.getTimeNaYin(), eightChar.getTimeDiShi());
  const solarTerms = buildSolarTermContext(lunar, effective, birth.timezone);

  if (solarTerms.nearest.distanceHours < 2) {
    warnings.push({ code: 'SOLAR_TERM_CRITICAL', level: 'danger', message: `出生时间距离${solarTerms.nearest.name}不足2小时，年柱或月柱处于高风险临界。` });
  } else if (solarTerms.nearest.distanceHours < 12) {
    warnings.push({ code: 'SOLAR_TERM_WARNING', level: 'warning', message: `出生时间距离${solarTerms.nearest.name}不足12小时，建议复核节气交接时刻。` });
  } else if (solarTerms.nearest.distanceHours < 24) {
    warnings.push({ code: 'SOLAR_TERM_NOTICE', level: 'info', message: `出生时间距离${solarTerms.nearest.name}不足24小时。` });
  }

  const pillarList = [year, month, day, hour];
  return {
    sourceDateTime: birth.localDateTime,
    effectiveDateTime: breakdown.effectiveDateTime,
    effectiveTimeType: breakdown.effectiveTimeType,
    timeBreakdown: breakdown,
    pillars: { year, month, day, hour },
    pillarList,
    dayMaster,
    dayMasterElement: STEM_ELEMENT[dayMaster],
    lunarText: `${lunar.getYearInGanZhi()}年 农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    solarTerms,
    timeWarnings: warnings,
  };
}

function buildTransitPillar(text: string, dayMaster: HeavenlyStem): TransitPillar {
  const { stem, branch } = parsePillarText(text);
  return {
    text,
    stem,
    branch,
    stemElement: STEM_ELEMENT[stem],
    branchElement: BRANCH_ELEMENT[branch],
    hiddenStems: hiddenDetails(branch, dayMaster),
  };
}

function transitElementScores(pillar: TransitPillar) {
  const scores = blankElementScores();
  scores[pillar.stemElement] += 40;
  pillar.hiddenStems.forEach((hidden) => {
    scores[hidden.element] += hidden.ratio * 60;
  });
  return normalizeElementScores(scores);
}

export function buildTransitContext(dateIso: string): TransitContext {
  const date = DateTime.fromISO(dateIso, { zone: 'Asia/Shanghai' });
  if (!date.isValid) throw new Error('目标日期无效');
  const solar = Solar.fromYmdHms(date.year, date.month, date.day, 12, 0, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  eightChar.setSect(2);
  const dayMaster = asStem(eightChar.getDayGan());
  const year = buildTransitPillar(eightChar.getYear(), dayMaster);
  const month = buildTransitPillar(eightChar.getMonth(), dayMaster);
  const day = buildTransitPillar(eightChar.getDay(), dayMaster);
  const yearScores = transitElementScores(year);
  const monthScores = transitElementScores(month);
  const dayScores = transitElementScores(day);
  const environment = blankElementScores();
  (Object.keys(environment) as Array<keyof typeof environment>).forEach((element) => {
    environment[element] = yearScores[element] * 0.125 + monthScores[element] * 0.375 + dayScores[element] * 0.5;
  });
  return {
    date: dateIso,
    year,
    month,
    day,
    yearScores,
    monthScores,
    dayScores,
    environmentScores: normalizeElementScores(environment),
    lunarText: `${lunar.getYearInGanZhi()}年 农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    weekday: solar.getWeekInChinese(),
  };
}

export function todayIso(): string {
  return DateTime.local().toISODate() ?? '';
}
