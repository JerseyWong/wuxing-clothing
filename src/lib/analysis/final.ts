import { blankElementScores } from '../../data/wuxing';
import { strengthLevelLabel } from '../uiLabels';
import { ELEMENTS } from '../../types/domain';
import { isExpertConfigurationActive } from '../expertConfig';
import type {
  BaziAnalysis,
  BaziChart,
  ExpertOverride,
  FinalPersonalAnalysis,
  StrengthAnalysis,
  StructureAnalysis,
  UsefulElementAnalysis,
} from '../../types/domain';

export const ALGORITHM_VERSION = '2.1.6';

function buildAutomaticBaseScores(useful: UsefulElementAnalysis) {
  const scores = blankElementScores();
  useful.details.forEach((detail) => {
    scores[detail.element] = detail.level === 'core' ? 100 : detail.level === 'favorable' ? 75 : detail.level === 'neutral' ? 45 : 10;
  });
  return scores;
}

export function finalizeAnalysis(
  strength: StrengthAnalysis,
  structure: StructureAnalysis,
  useful: UsefulElementAnalysis,
  expert: ExpertOverride,
): FinalPersonalAnalysis {
  const automaticElements = {
    core: useful.core,
    favorable: useful.favorable,
    neutral: useful.neutral,
    cautious: useful.cautious,
  };
  const expertActive = isExpertConfigurationActive(expert);
  const useExpert = expertActive && Boolean(expert.finalElements);
  const elements = useExpert ? expert.finalElements! : automaticElements;
  const baseScores = buildAutomaticBaseScores(useful);

  if (useExpert) {
    ELEMENTS.forEach((element) => {
      if (elements.core.includes(element)) baseScores[element] = 100;
      else if (elements.favorable.includes(element)) baseScores[element] = 75;
      else if (elements.cautious.includes(element)) baseScores[element] = 10;
      else baseScores[element] = 45;
    });
  }

  if (expertActive) {
    ELEMENTS.forEach((element) => {
      if (elements.cautious.includes(element)) return;
      let bonus = 0;
      if (expert.supportingElements.includes(element)) bonus += 6;
      if (expert.climateElements.includes(element)) bonus += 8;
      if (expert.bridgingElements.includes(element)) bonus += 6;
      if (expert.illnessMedicineElements.includes(element)) bonus += 4;
      baseScores[element] = Math.min(100, baseScores[element] + bonus);
    });
  }

  return {
    source: expertActive ? 'expert' : 'automatic',
    strength: expertActive && expert.correctedStrength ? expert.correctedStrength : strength.level,
    strengthLabel: expertActive && expert.correctedStrength ? strengthLevelLabel(expert.correctedStrength) : strength.label,
    structure: expertActive && expert.structureName ? expert.structureName : structure.selectedStructure,
    elements,
    elementBaseScores: baseScores,
    notes: [
      expertActive ? '当前已采用专业校正结果。' : '当前采用基础命盘判断。',
      structure.specialPending ? '命局中有需要进一步确认的特殊结构，暂不据此调整五行力量。' : '',
      expert.notes || '',
    ].filter(Boolean),
  };
}

export function buildAnalysis(
  chart: BaziChart,
  expert: ExpertOverride,
  analyzers: {
    basic: (chart: BaziChart) => any;
    strength: (chart: BaziChart, basic: any) => StrengthAnalysis;
    structure: (chart: BaziChart, strength: StrengthAnalysis, expert: ExpertOverride) => StructureAnalysis;
    useful: (chart: BaziChart, strength: StrengthAnalysis, structure: StructureAnalysis) => UsefulElementAnalysis;
  },
): BaziAnalysis {
  const basic = analyzers.basic(chart);
  const strength = analyzers.strength(chart, basic);
  const structure = analyzers.structure(chart, strength, expert);
  const usefulElements = analyzers.useful(chart, strength, structure);
  const final = finalizeAnalysis(strength, structure, usefulElements, expert);
  return { basic, strength, structure, usefulElements, final, algorithmVersion: ALGORITHM_VERSION };
}
