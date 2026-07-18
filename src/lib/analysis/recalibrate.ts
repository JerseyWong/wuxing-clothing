import { BRANCH_ELEMENT, GENERATED_BY, STEM_ELEMENT, normalizeElementScores } from '../../data/wuxing';
import type { BaziChart, Element, ElementScoreMap, StrengthAnalysis, StrengthLevel, StructureAnalysis } from '../../types/domain';

function classify(ratio: number): { level: StrengthLevel; label: string } {
  if (ratio >= 0.68) return { level: 'very_strong', label: '明显偏强' };
  if (ratio >= 0.58) return { level: 'strong', label: '相对偏强' };
  if (ratio >= 0.42) return { level: 'balanced', label: '较为平衡' };
  if (ratio >= 0.32) return { level: 'weak', label: '相对偏弱' };
  return { level: 'very_weak', label: '明显偏弱' };
}

export function applyConfirmedStructures(
  chart: BaziChart,
  strength: StrengthAnalysis,
  structure: StructureAnalysis,
): StrengthAnalysis {
  const formed = structure.relationships.filter((finding) => finding.status === 'formed' && finding.targetElement);
  const clashes = structure.relationships.filter((finding) => finding.kind === 'clash');
  if (!formed.length && !clashes.length) return strength;

  const power: ElementScoreMap = { ...strength.elementPower };
  formed.forEach((finding) => {
    const bonus = finding.kind === 'stem_combine' ? 12
      : finding.kind === 'branch_combine' ? 18
        : finding.kind === 'three_harmony' || finding.kind === 'three_meeting' ? 28 : 8;
    finding.members.forEach((member) => {
      const element = (STEM_ELEMENT as Record<string, Element>)[member] ?? (BRANCH_ELEMENT as Record<string, Element>)[member];
      if (element) power[element] = Math.max(0, power[element] * 0.9);
    });
    power[finding.targetElement!] += bonus;
  });

  const percentages = normalizeElementScores(power);
  const dm = chart.dayMasterElement;
  const resource = GENERATED_BY[dm];
  const supportScore = power[dm] + power[resource];
  const total = Object.values(power).reduce((sum, value) => sum + value, 0);
  const drainScore = total - supportScore;
  const supportRatio = supportScore / Math.max(1, total);
  const result = classify(supportRatio);
  const rootScore = clashes.length ? strength.rootScore * 0.9 : strength.rootScore;
  const warnings = [...strength.warnings];
  if (formed.length) warnings.push(`已按专业确认的${formed.length}组合化气结果重新计算五行力量。`);
  if (clashes.length) warnings.push('命局存在地支相冲，直接根气按最多10%的上限作减弱修正。');

  return {
    ...strength,
    level: result.level,
    label: result.label,
    supportRatio: Number(supportRatio.toFixed(4)),
    supportScore: Number(supportScore.toFixed(2)),
    drainScore: Number(drainScore.toFixed(2)),
    rootScore: Number(rootScore.toFixed(2)),
    elementPower: power,
    elementPercentages: percentages,
    warnings,
  };
}
