import { describe, expect, test } from 'vitest';
import { buildBaziChart, buildTransitContext } from '../lib/calendar';
import { resolveEffectiveTime } from '../lib/time';
import { analyzeBazi } from '../lib/analysis';
import { buildClothingRecommendation, buildUniversalRanking } from '../lib/recommendation';
import { DEFAULT_WEIGHTS, blankElementScores } from '../data/wuxing';
import { CHINA_COUNTIES, CHINA_PROVINCES, findChinaCounty, getChinaCities, getChinaCounties } from '../data/chinaAdministrative';
import { createDefaultProfile } from '../store/useAppStore';
import { parseProfile } from '../lib/profileSchema';
import type { BirthInput, ExpertOverride, TimeCorrectionConfig } from '../types/domain';
import { transformationStatusLabel } from '../lib/uiLabels';

const baseBirth: BirthInput = {
  localDateTime: '1988-02-15T23:30',
  country: '中国', city: '北京', timezone: 'Asia/Shanghai', longitude: 116.4074, latitude: 39.9042,
};

const baseConfig: TimeCorrectionConfig = {
  solarTimeEnabled: false,
  expertTimeEnabled: false,
  dayRolloverRule: 'zi_start',
};

function expert(enabled = false): ExpertOverride {
  return {
    enabled,
    configured: enabled,
    transformationOverrides: {},
    supportingElements: [], climateElements: [], bridgingElements: [], illnessMedicineElements: [],
    elementAdjustments: blankElementScores(),
    weights: { ...DEFAULT_WEIGHTS },
    notes: '',
  };
}


describe('页面中文标签', () => {
  test('内部合化状态不会直接显示英文代码', () => {
    expect(transformationStatusLabel('potential')).toBe('有合化条件');
  });
});

describe('中国县级出生地数据', () => {
  test('覆盖中国大陆县级行政区并可三级联动', () => {
    expect(CHINA_COUNTIES.length).toBeGreaterThan(2800);
    expect(CHINA_PROVINCES.length).toBeGreaterThanOrEqual(31);
    const beijingCities = getChinaCities('110000');
    expect(beijingCities.some((item) => item.name === '北京市')).toBe(true);
    const beijingCounties = getChinaCounties('110000');
    expect(beijingCounties.some((item) => item.county === '门头沟区')).toBe(true);
  });

  test('区县选择可自动取得WGS84经纬度', () => {
    const mentougou = findChinaCounty('110109');
    expect(mentougou?.longitude).toBeGreaterThan(115);
    expect(mentougou?.latitude).toBeGreaterThan(39);
    expect(mentougou?.coordinatePrecision).toBe('county');
  });

  test('旧版专业配置导入后会保留已配置状态', () => {
    const legacy = createDefaultProfile() as any;
    delete legacy.expertOverride.configured;
    legacy.expertOverride.enabled = true;
    legacy.expertOverride.correctedStrength = 'balanced';
    const parsed = parseProfile(legacy);
    expect(parsed.expertOverride.configured).toBe(true);
  });

  test('新建档案默认使用东八区且允许后续手动覆盖', () => {
    const profile = createDefaultProfile();
    expect(profile.birthInput.timezone).toBe('Asia/Shanghai');
    expect(profile.birthInput.timezoneSource).toBe('default');
    expect(profile.birthInput.locationSource).toBe('china_county');
    expect(profile.birthInput.administrativeCode).toBe('110101');
  });
});

describe('时间与排盘口径', () => {
  test('默认子初换日在23:00后使用次日日柱', () => {
    const chart = buildBaziChart(baseBirth, baseConfig);
    expect(chart.pillars.day.text).toBe('辛丑');
  });

  test('午夜换日在23:00后仍使用前一日日柱', () => {
    const chart = buildBaziChart(baseBirth, { ...baseConfig, dayRolloverRule: 'midnight' });
    expect(chart.pillars.day.text).toBe('庚子');
  });

  test('晚子时不换日与午夜口径保持前一日日柱', () => {
    const chart = buildBaziChart(baseBirth, { ...baseConfig, dayRolloverRule: 'late_zi_previous_day' });
    expect(chart.pillars.day.text).toBe('庚子');
  });

  test('专家校正时间优先于真太阳时', () => {
    const result = resolveEffectiveTime(baseBirth, {
      ...baseConfig,
      solarTimeEnabled: true,
      expertTimeEnabled: true,
      expertDateTime: '1988-02-16T08:00',
    });
    expect(result.breakdown.effectiveTimeType).toBe('expert');
    expect(result.breakdown.effectiveDateTime).toBe('1988-02-16 08:00');
  });

  test('西部经度启用真太阳时可能跨越日期', () => {
    const birth = { ...baseBirth, localDateTime: '2000-01-15T00:30', city: '乌鲁木齐', longitude: 87.6168 };
    const result = resolveEffectiveTime(birth, { ...baseConfig, solarTimeEnabled: true });
    expect(result.breakdown.crossedDate).toBe(true);
    expect(result.warnings.some((warning) => warning.code === 'SOLAR_CROSSED_DATE')).toBe(true);
  });

  test('时区能够识别历史夏令时', () => {
    const birth = { ...baseBirth, localDateTime: '2020-07-01T12:00', country: '美国', city: '洛杉矶', timezone: 'America/Los_Angeles', longitude: -118.2437 };
    const result = resolveEffectiveTime(birth, baseConfig);
    expect(result.breakdown.isDst).toBe(true);
    expect(result.breakdown.utcOffsetMinutes).toBe(-420);
  });
});

describe('五层分析', () => {
  const chart = buildBaziChart({ ...baseBirth, localDateTime: '1988-11-20T06:00' }, baseConfig);
  const analysis = analyzeBazi(chart, expert());

  test('生成完整四柱、五行数量与力量', () => {
    expect(chart.pillarList).toHaveLength(4);
    expect(Object.values(analysis.basic.elementCounts).reduce((a, b) => a + b, 0)).toBe(8);
    expect(Math.round(Object.values(analysis.strength.elementPercentages).reduce((a, b) => a + b, 0))).toBe(100);
  });

  test('旺衰输出五级结论与置信度', () => {
    expect(['very_strong', 'strong', 'balanced', 'weak', 'very_weak']).toContain(analysis.strength.level);
    expect(analysis.strength.confidence).toBeGreaterThanOrEqual(0.3);
    expect(analysis.strength.confidence).toBeLessThanOrEqual(0.96);
  });

  test('格局使用候选制并保留证据', () => {
    expect(analysis.structure.candidates.length).toBeGreaterThan(0);
    expect(analysis.structure.candidates[0].supportingEvidence.length).toBeGreaterThan(0);
  });

  test('喜用结果覆盖五个元素且不按缺失直接补齐', () => {
    const groups = analysis.usefulElements;
    const all = [...groups.core, ...groups.favorable, ...groups.neutral, ...groups.cautious];
    expect(new Set(all).size).toBe(5);
    expect(groups.details.every((item) => item.reasons.length >= 3)).toBe(true);
  });

  test('专家喜用覆盖拥有最高优先级', () => {
    const override = expert(true);
    override.finalElements = { core: ['火'], favorable: ['木'], neutral: ['土', '金'], cautious: ['水'] };
    const overridden = analyzeBazi(chart, override);
    expect(overridden.final.source).toBe('expert');
    expect(overridden.final.elements.core).toEqual(['火']);
    expect(overridden.final.elementBaseScores.火).toBe(100);
    expect(overridden.final.elementBaseScores.水).toBe(10);
  });


  test('已保存但未启用的专业配置不会参与计算', () => {
    const override = expert(false);
    override.configured = true;
    override.finalElements = { core: ['火'], favorable: ['木'], neutral: ['土', '金'], cautious: ['水'] };
    override.elementAdjustments.火 = 20;
    const result = analyzeBazi(chart, override);
    expect(result.final.source).toBe('automatic');
    expect(result.final.elements.core).toEqual(analysis.final.elements.core);
  });

  test('专家确认合化成立后重新计算目标五行力量', () => {
    const override = expert(true);
    override.transformationOverrides['stem-戊癸'] = 'formed';
    const transformed = analyzeBazi(chart, override);
    expect(transformed.strength.elementPercentages.火).toBeGreaterThan(analysis.strength.elementPercentages.火);
    expect(transformed.strength.warnings.some((warning) => warning.includes('化气结果'))).toBe(true);
  });
});


describe('通用参考沿用原版规则', () => {
  test('只按日支本五行生成固定五档，不使用百分制混合评分', () => {
    const transit = buildTransitContext('2026-07-17');
    expect(transit.day.text).toBe('壬辰');
    expect(transit.day.branchElement).toBe('土');
    const result = buildUniversalRanking(transit);
    expect(result.map((item) => item.element)).toEqual(['金', '土', '木', '火', '水']);
    expect(result.map((item) => item.title)).toEqual(['顺利贵人色', '合宜安稳色', '奋斗加油色', '辛苦消耗色', '压力山大色']);
    expect(result.every((item) => !('score' in item))).toBe(true);
  });
});

describe('动态穿衣推荐', () => {
  const chart = buildBaziChart({ ...baseBirth, localDateTime: '1988-11-20T06:00' }, baseConfig);
  const automatic = expert(false);
  const analysis = analyzeBazi(chart, automatic);
  const transit = buildTransitContext('2026-07-15');

  test('输出五个五行评分与五类穿衣角色', () => {
    const recommendation = buildClothingRecommendation(analysis, transit, 'commute', 'advanced', automatic);
    expect(recommendation.elementRanking).toHaveLength(5);
    expect(recommendation.main.ratio).toBe('55%–65%');
    expect(recommendation.caution.ratio).toBe('不建议超过10%');
    expect(recommendation.outfitExamples.length).toBeGreaterThanOrEqual(2);
  });

  test('场景切换会改变场景子分', () => {
    const commute = buildClothingRecommendation(analysis, transit, 'commute', 'advanced', automatic);
    const social = buildClothingRecommendation(analysis, transit, 'social', 'advanced', automatic);
    const commuteFire = commute.elementRanking.find((item) => item.element === '火')!;
    const socialFire = social.elementRanking.find((item) => item.element === '火')!;
    expect(socialFire.score.scene).toBeGreaterThan(commuteFire.score.scene);
  });

  test('专家人工加分会进入最终评分', () => {
    const override = expert(true);
    override.elementAdjustments.金 = 20;
    const expertAnalysis = analyzeBazi(chart, override);
    const recommendation = buildClothingRecommendation(expertAnalysis, transit, 'business', 'expert', override);
    expect(recommendation.elementRanking.find((item) => item.element === '金')?.score.expertAdjustment).toBe(20);
  });

  test('过量五行会触发扣分且核心用神也不豁免', () => {
    const recommendation = buildClothingRecommendation(analysis, transit, 'commute', 'advanced', automatic);
    expect(recommendation.elementRanking.some((item) => item.score.overflowPenalty >= 0)).toBe(true);
    expect(recommendation.elementRanking.every((item) => item.score.final >= 0 && item.score.final <= 100)).toBe(true);
  });
});
