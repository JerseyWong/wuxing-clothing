import {
  CONTROLLED_BY,
  CONTROLS,
  GENERATED_BY,
  GENERATES,
  blankElementScores,
  clampScore,
} from '../../data/wuxing';
import { ELEMENTS } from '../../types/domain';
import type {
  BaziChart,
  Element,
  ElementScoreMap,
  StrengthAnalysis,
  StructureAnalysis,
  UsefulElementAnalysis,
  UsefulElementDetail,
  ElementPreferenceLevel,
} from '../../types/domain';

function supportingModel(chart: BaziChart, strength: StrengthAnalysis, structure: StructureAnalysis): ElementScoreMap {
  const dm = chart.dayMasterElement;
  const scores = blankElementScores(45);
  const activeSpecial = structure.candidates.find((candidate) => candidate.type === 'special' && candidate.active);
  if (activeSpecial?.id === 'special-follow-weak') {
    scores[GENERATES[dm]] = 92;
    scores[CONTROLS[dm]] = 88;
    scores[CONTROLLED_BY[dm]] = 82;
    scores[dm] = 10;
    scores[GENERATED_BY[dm]] = 8;
    return scores;
  }
  if (activeSpecial?.id === 'special-follow-strong') {
    scores[dm] = 98;
    scores[GENERATED_BY[dm]] = 92;
    scores[GENERATES[dm]] = 28;
    scores[CONTROLS[dm]] = 12;
    scores[CONTROLLED_BY[dm]] = 8;
    return scores;
  }
  if (strength.level === 'very_strong' || strength.level === 'strong') {
    scores[GENERATES[dm]] = 95;
    scores[CONTROLS[dm]] = 85;
    scores[CONTROLLED_BY[dm]] = 72;
    scores[dm] = 18;
    scores[GENERATED_BY[dm]] = 10;
  } else if (strength.level === 'very_weak' || strength.level === 'weak') {
    scores[GENERATED_BY[dm]] = 98;
    scores[dm] = 88;
    scores[GENERATES[dm]] = 35;
    scores[CONTROLS[dm]] = 18;
    scores[CONTROLLED_BY[dm]] = 12;
  } else {
    scores[GENERATES[dm]] = 65;
    scores[CONTROLS[dm]] = 60;
    scores[CONTROLLED_BY[dm]] = 55;
    scores[dm] = 52;
    scores[GENERATED_BY[dm]] = 52;
  }
  return scores;
}

function climateIndex(chart: BaziChart, strength: StrengthAnalysis) {
  const branch = chart.pillars.month.branch;
  const winter = ['亥', '子', '丑'].includes(branch);
  const summer = ['巳', '午', '未'].includes(branch);
  const autumn = ['申', '酉', '戌'].includes(branch);
  const spring = ['寅', '卯', '辰'].includes(branch);
  const p = strength.elementPercentages;
  const cold = clampScore((winter ? 58 : 12) + p.水 * 0.65 - p.火 * 0.35);
  const heat = clampScore((summer ? 58 : 12) + p.火 * 0.65 - p.水 * 0.35);
  const dry = clampScore((autumn ? 45 : 15) + p.金 * 0.35 + p.火 * 0.2 - p.水 * 0.4);
  const wet = clampScore((winter || spring ? 38 : 15) + p.水 * 0.35 + p.土 * 0.12 - p.火 * 0.35);
  return { cold: Number(cold.toFixed(1)), heat: Number(heat.toFixed(1)), dry: Number(dry.toFixed(1)), wet: Number(wet.toFixed(1)) };
}

function climateModel(index: ReturnType<typeof climateIndex>): ElementScoreMap {
  const scores = blankElementScores(45);
  if (index.cold >= 65) { scores.火 += 45; scores.木 += 20; }
  if (index.heat >= 65) { scores.水 += 45; scores.金 += 20; }
  if (index.dry >= 65) { scores.水 += 40; scores.木 += 18; }
  if (index.wet >= 65) { scores.火 += 38; scores.土 += 16; }
  return Object.fromEntries(ELEMENTS.map((element) => [element, clampScore(scores[element])])) as ElementScoreMap;
}

const BRIDGE_MAP: Record<string, Element> = {
  '金木': '水', '木金': '水', '水火': '木', '火水': '木',
  '木土': '火', '土木': '火', '土水': '金', '水土': '金',
  '火金': '土', '金火': '土',
};

function bridgingModel(strength: StrengthAnalysis): { scores: ElementScoreMap; candidates: Element[] } {
  const sorted = ELEMENTS.map((element) => ({ element, value: strength.elementPercentages[element] })).sort((a, b) => b.value - a.value);
  const scores = blankElementScores(40);
  const candidates: Element[] = [];
  const first = sorted[0];
  const second = sorted[1];
  if (first.value >= 20 && second.value >= 20) {
    const bridge = BRIDGE_MAP[`${first.element}${second.element}`];
    if (bridge) {
      scores[bridge] = 95;
      candidates.push(bridge);
    }
  }
  return { scores, candidates };
}

export function analyzeUsefulElements(
  chart: BaziChart,
  strength: StrengthAnalysis,
  structure: StructureAnalysis,
): UsefulElementAnalysis {
  const support = supportingModel(chart, strength, structure);
  const climate = climateIndex(chart, strength);
  const climateScores = climateModel(climate);
  const bridge = bridgingModel(strength);
  const structureScores = blankElementScores(50);

  const details: UsefulElementDetail[] = ELEMENTS.map((element) => {
    const combinedScore = support[element] * 0.6
      + climateScores[element] * 0.2
      + bridge.scores[element] * 0.15
      + structureScores[element] * 0.05;
    return {
      element,
      supportingScore: support[element],
      climateScore: climateScores[element],
      bridgingScore: bridge.scores[element],
      structureScore: structureScores[element],
      combinedScore: Number(combinedScore.toFixed(2)),
      level: 'neutral' as ElementPreferenceLevel,
      reasons: [
        `扶抑参考${support[element].toFixed(0)}分`,
        climateScores[element] > 50 ? `调候上更需要${element}` : '调候影响不大',
        bridge.candidates.includes(element) ? `${element}有助于疏通主要五行关系` : '暂不需要额外通关',
      ],
    };
  }).sort((a, b) => b.combinedScore - a.combinedScore);

  details.forEach((detail, index) => {
    if (index < 1 || (index === 1 && detail.combinedScore >= details[0].combinedScore - 8)) detail.level = 'core';
    else if (index <= 2) detail.level = 'favorable';
    else if (index === 3) detail.level = 'neutral';
    else detail.level = 'cautious';
  });

  const core = details.filter((item) => item.level === 'core').map((item) => item.element);
  const favorable = details.filter((item) => item.level === 'favorable').map((item) => item.element);
  const neutral = details.filter((item) => item.level === 'neutral').map((item) => item.element);
  const cautious = details.filter((item) => item.level === 'cautious').map((item) => item.element);

  const climateAlerts = Object.entries(climate).filter(([, value]) => value >= 65).map(([key]) => ({ cold: '寒', heat: '热', dry: '燥', wet: '湿' }[key]));
  const explanation = `综合日主强弱、寒暖燥湿和五行流通后，给出今天穿衣可长期参考的五行顺序。${climateAlerts.length ? `当前更需要留意${climateAlerts.join('、')}的调节。` : '当前寒暖燥湿没有特别突出的偏向。'}${structure.specialPending ? '命局中另有特殊结构需要进一步确认。' : ''}`;

  return {
    supportingModel: support,
    climateModel: climateScores,
    bridgingModel: bridge.scores,
    structureModel: structureScores,
    climateIndex: climate,
    details,
    core,
    favorable,
    neutral,
    cautious,
    bridgingCandidates: bridge.candidates,
    explanation,
  };
}
