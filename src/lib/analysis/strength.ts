import {
  BRANCH_ELEMENT,
  GENERATED_BY,
  GENERATES,
  CONTROLS,
  CONTROLLED_BY,
  STEM_ELEMENT,
  blankElementScores,
  normalizeElementScores,
} from '../../data/wuxing';
import type {
  BaziChart,
  BasicChartAnalysis,
  ConfidenceLevel,
  Element,
  ElementScoreMap,
  StrengthAnalysis,
  StrengthLevel,
} from '../../types/domain';

const SEASON_STATES: Record<Element, Record<Element, '旺' | '相' | '休' | '囚' | '死'>> = {
  木: { 木: '旺', 火: '相', 水: '休', 金: '囚', 土: '死' },
  火: { 火: '旺', 土: '相', 木: '休', 水: '囚', 金: '死' },
  金: { 金: '旺', 水: '相', 土: '休', 火: '囚', 木: '死' },
  水: { 水: '旺', 木: '相', 金: '休', 土: '囚', 火: '死' },
  土: { 土: '旺', 金: '相', 火: '休', 木: '囚', 水: '死' },
};

const STATE_MULTIPLIER = { 旺: 1.6, 相: 1.3, 休: 1, 囚: 0.75, 死: 0.55 };
const BRANCH_POSITION_MULTIPLIER = [1, 1.8, 1.2, 1];
const ROOT_POSITION_MULTIPLIER = [1, 1.5, 1.2, 1];
const HIDDEN_POWER = { main: 7, middle: 2, residual: 1 };
const ROOT_POWER = { main: 12, middle: 7, residual: 4 };

function strengthLevel(ratio: number): { level: StrengthLevel; label: string } {
  if (ratio >= 0.68) return { level: 'very_strong', label: '明显偏强' };
  if (ratio >= 0.58) return { level: 'strong', label: '相对偏强' };
  if (ratio >= 0.42) return { level: 'balanced', label: '较为平衡' };
  if (ratio >= 0.32) return { level: 'weak', label: '相对偏弱' };
  return { level: 'very_weak', label: '明显偏弱' };
}

function confidenceLevel(value: number): ConfidenceLevel {
  if (value >= 0.8) return 'high';
  if (value >= 0.6) return 'medium';
  return 'low';
}

export function analyzeStrength(chart: BaziChart, basic: BasicChartAnalysis): StrengthAnalysis {
  const rawPower = blankElementScores();
  const seasonElement = chart.pillars.month.branchElement;
  const seasonStates = SEASON_STATES[seasonElement];

  chart.pillarList.forEach((pillar, index) => {
    rawPower[STEM_ELEMENT[pillar.stem]] += 10;
    pillar.hiddenStems.forEach((hidden) => {
      rawPower[hidden.element] += HIDDEN_POWER[hidden.role] * BRANCH_POSITION_MULTIPLIER[index];
    });
  });

  const elementPower = Object.fromEntries(
    Object.entries(rawPower).map(([element, power]) => {
      const typedElement = element as Element;
      return [typedElement, Number((power * STATE_MULTIPLIER[seasonStates[typedElement]]).toFixed(2))];
    }),
  ) as ElementScoreMap;

  basic.rawElementPower = rawPower;
  const percentages = normalizeElementScores(elementPower);
  const dm = chart.dayMasterElement;
  const resource = GENERATED_BY[dm];
  const supportScore = elementPower[dm] + elementPower[resource];
  const drainScore = elementPower[GENERATES[dm]] + elementPower[CONTROLS[dm]] + elementPower[CONTROLLED_BY[dm]];
  const supportRatio = supportScore / Math.max(1, supportScore + drainScore);
  const result = strengthLevel(supportRatio);

  let rootScore = 0;
  const rootEvidence: string[] = [];
  chart.pillarList.forEach((pillar, index) => {
    pillar.hiddenStems.forEach((hidden) => {
      if (hidden.stem === chart.dayMaster) {
        const score = ROOT_POWER[hidden.role] * ROOT_POSITION_MULTIPLIER[index];
        rootScore += score;
        rootEvidence.push(`${pillar.label}${pillar.branch}藏${hidden.stem}${hidden.role === 'main' ? '主气' : hidden.role === 'middle' ? '中气' : '余气'}根`);
      }
    });
  });

  const distance = Math.abs(supportRatio - 0.5) * 2;
  let confidence = 0.56 + distance * 0.4;
  const warnings: string[] = [];
  if (chart.solarTerms.nearest.distanceHours < 24) {
    confidence -= chart.solarTerms.nearest.distanceHours < 2 ? 0.22 : chart.solarTerms.nearest.distanceHours < 12 ? 0.13 : 0.06;
    warnings.push('出生时间接近节气，月令交界会影响旺衰判断。');
  }
  if (chart.timeWarnings.some((warning) => warning.code.includes('CROSSED') || warning.code.includes('BOUNDARY'))) {
    confidence -= 0.08;
    warnings.push('出生时间存在日期或时辰临界，需要复核时间口径。');
  }
  if (supportRatio >= 0.82 || supportRatio <= 0.18) {
    confidence -= 0.08;
    warnings.push('命局力量较为集中，建议结合格局进一步判断。');
  }
  confidence = Math.max(0.3, Math.min(0.96, confidence));

  const supportingEvidence = [
    { title: '生扶比例', detail: `印比力量占生扶与耗泄克总量的${(supportRatio * 100).toFixed(1)}%` },
    { title: '月令状态', detail: `${dm}在${chart.pillars.month.branch}月处于“${seasonStates[dm]}”` },
    { title: '通根', detail: rootEvidence.length ? `${rootEvidence.join('、')}，根气分${rootScore.toFixed(1)}` : '未发现日主同干的直接根气' },
  ];
  const opposingEvidence = [
    { title: '耗泄克力量', detail: `食伤、财星、官杀合计${drainScore.toFixed(1)}分` },
    { title: '制衡关系', detail: `${CONTROLLED_BY[dm]}克${dm}、${dm}生${GENERATES[dm]}、${dm}克${CONTROLS[dm]}` },
  ];

  return {
    level: result.level,
    label: result.label,
    supportRatio: Number(supportRatio.toFixed(4)),
    supportScore: Number(supportScore.toFixed(2)),
    drainScore: Number(drainScore.toFixed(2)),
    rootScore: Number(rootScore.toFixed(2)),
    elementPower,
    elementPercentages: percentages,
    confidence: Number(confidence.toFixed(2)),
    confidenceLevel: confidenceLevel(confidence),
    supportingEvidence,
    opposingEvidence,
    warnings,
  };
}
