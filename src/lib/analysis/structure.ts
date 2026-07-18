import { HIDDEN_STEMS, getTenGod } from '../../data/wuxing';
import { isExpertConfigurationActive } from '../expertConfig';
import type {
  BaziChart,
  ExpertOverride,
  RelationshipFinding,
  StructureAnalysis,
  StructureCandidate,
  StrengthAnalysis,
} from '../../types/domain';

const TEN_GOD_STRUCTURE: Record<string, string> = {
  正官: '正官格', 七杀: '七杀格', 正财: '正财格', 偏财: '偏财格',
  正印: '正印格', 偏印: '偏印格', 食神: '食神格', 伤官: '伤官格',
  比肩: '建禄格', 劫财: '月劫格',
};

const STEM_COMBINES: Array<[string, string, string]> = [
  ['甲', '己', '土'], ['乙', '庚', '金'], ['丙', '辛', '水'], ['丁', '壬', '木'], ['戊', '癸', '火'],
];
const BRANCH_COMBINES: Array<[string, string, string]> = [
  ['子', '丑', '土'], ['寅', '亥', '木'], ['卯', '戌', '火'], ['辰', '酉', '金'], ['巳', '申', '水'], ['午', '未', '土'],
];
const CLASHES = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']];
const HARMS = [['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']];
const BREAKS = [['子', '酉'], ['丑', '辰'], ['寅', '亥'], ['卯', '午'], ['巳', '申'], ['未', '戌']];
const THREE_HARMONY: Array<[string[], string]> = [
  [['申', '子', '辰'], '水'], [['亥', '卯', '未'], '木'], [['寅', '午', '戌'], '火'], [['巳', '酉', '丑'], '金'],
];
const THREE_MEETING: Array<[string[], string]> = [
  [['寅', '卯', '辰'], '木'], [['巳', '午', '未'], '火'], [['申', '酉', '戌'], '金'], [['亥', '子', '丑'], '水'],
];
const PUNISHMENTS: string[][] = [['寅', '巳', '申'], ['丑', '未', '戌'], ['子', '卯'], ['辰', '辰'], ['午', '午'], ['酉', '酉'], ['亥', '亥']];

function pairPresent(branches: string[], pair: string[]): boolean {
  return pair.every((value) => branches.includes(value));
}

function detectRelationships(chart: BaziChart, expert: ExpertOverride, applyOverrides: boolean): RelationshipFinding[] {
  const stems = chart.pillarList.map((pillar) => pillar.stem);
  const branches = chart.pillarList.map((pillar) => pillar.branch);
  const findings: RelationshipFinding[] = [];

  STEM_COMBINES.forEach(([a, b, target]) => {
    if (stems.includes(a as any) && stems.includes(b as any)) {
      const id = `stem-${a}${b}`;
      findings.push({
        id, kind: 'stem_combine', label: `${a}${b}合${target}`,
        members: [a, b], targetElement: target as any,
        status: applyOverrides ? (expert.transformationOverrides[id] ?? 'potential') : 'potential',
        explanation: '天干有相合关系；是否成化，还要结合月令、透干和全局气势判断。',
      });
    }
  });
  BRANCH_COMBINES.forEach(([a, b, target]) => {
    if (pairPresent(branches, [a, b])) {
      const id = `branch-${a}${b}`;
      findings.push({ id, kind: 'branch_combine', label: `${a}${b}六合${target}`, members: [a, b], targetElement: target as any, status: applyOverrides ? (expert.transformationOverrides[id] ?? 'potential') : 'potential', explanation: '地支形成六合；是否成化，还要结合月令、透干和整体结构判断。' });
    }
  });
  THREE_HARMONY.forEach(([members, target]) => {
    const count = members.filter((item) => branches.includes(item as any)).length;
    if (count === 3) {
      const id = `harmony-${members.join('')}`;
      findings.push({ id, kind: 'three_harmony', label: `${members.join('')}三合${target}局`, members, targetElement: target as any, status: applyOverrides ? (expert.transformationOverrides[id] ?? 'potential') : 'potential', explanation: '三合齐全；在未确认成局前，先作为命局结构参考。' });
    } else if (count === 2) {
      findings.push({ id: `half-${members.join('')}`, kind: 'half_harmony', label: `${members.filter((item) => branches.includes(item as any)).join('')}半合${target}`, members: members.filter((item) => branches.includes(item as any)), targetElement: target as any, explanation: '两支形成半合，可作为命局流通关系的辅助参考。' });
    }
  });
  THREE_MEETING.forEach(([members, target]) => {
    if (members.every((item) => branches.includes(item as any))) {
      const id = `meeting-${members.join('')}`;
      findings.push({ id, kind: 'three_meeting', label: `${members.join('')}三会${target}方`, members, targetElement: target as any, status: applyOverrides ? (expert.transformationOverrides[id] ?? 'potential') : 'potential', explanation: '三会齐全；是否成局，还要结合月令和全局气势判断。' });
    }
  });
  CLASHES.forEach((pair) => {
    if (pairPresent(branches, pair)) findings.push({ id: `clash-${pair.join('')}`, kind: 'clash', label: `${pair.join('')}相冲`, members: pair, explanation: '地支相冲会影响根气和结构稳定，当前按适度减弱处理。' });
  });
  HARMS.forEach((pair) => {
    if (pairPresent(branches, pair)) findings.push({ id: `harm-${pair.join('')}`, kind: 'harm', label: `${pair.join('')}相害`, members: pair, explanation: '地支相害作为命局关系的辅助参考。' });
  });
  BREAKS.forEach((pair) => {
    if (pairPresent(branches, pair)) findings.push({ id: `break-${pair.join('')}`, kind: 'break', label: `${pair.join('')}相破`, members: pair, explanation: '地支相破作为命局关系的辅助参考。' });
  });
  PUNISHMENTS.forEach((members) => {
    if (members.every((item) => branches.filter((branch) => branch === item).length >= members.filter((m) => m === item).length)) {
      findings.push({ id: `punishment-${members.join('')}`, kind: 'punishment', label: `${members.join('')}相刑`, members, explanation: '地支相刑作为命局关系的辅助参考。' });
    }
  });
  return findings;
}

export function analyzeStructure(chart: BaziChart, strength: StrengthAnalysis, expert: ExpertOverride): StructureAnalysis {
  const expertActive = isExpertConfigurationActive(expert);
  const mainHidden = HIDDEN_STEMS[chart.pillars.month.branch][0].stem;
  const monthTenGod = getTenGod(chart.dayMaster, mainHidden);
  const visible = chart.pillarList.some((pillar) => pillar.stem === mainHidden);
  const normal: StructureCandidate = {
    id: `normal-${monthTenGod}`,
    name: TEN_GOD_STRUCTURE[monthTenGod] ? `${TEN_GOD_STRUCTURE[monthTenGod]}参考` : '常规格局参考',
    type: 'normal',
    confidence: visible ? 0.76 : 0.6,
    active: true,
    supportingEvidence: [
      { title: '月令主气', detail: `${chart.pillars.month.branch}月主气${mainHidden}，对日主为${monthTenGod}` },
      { title: '透干情况', detail: visible ? `${mainHidden}透于天干，格局特征更清楚` : `${mainHidden}未透干，格局特征相对含蓄` },
    ],
    opposingEvidence: visible ? [] : [{ title: '仍需留意', detail: '月令主气未透出，格局判断需要结合其他干支一起看。' }],
  };

  const candidates: StructureCandidate[] = [normal];
  if (strength.supportRatio < 0.18 && strength.rootScore <= 4) {
    candidates.push({
      id: 'special-follow-weak', name: '从弱类结构参考', type: 'special', confidence: 0.62,
      active: expertActive && Boolean(expert.specialStructureConfirmed),
      supportingEvidence: [{ title: '生扶极弱', detail: `生扶比例仅${(strength.supportRatio * 100).toFixed(1)}%，且有效根气弱。` }],
      opposingEvidence: [{ title: '需要确认', detail: '从格判断要求较严，未确认前仍按常规命局理解。' }],
    });
  }
  if (strength.supportRatio > 0.82 && strength.rootScore >= 12) {
    candidates.push({
      id: 'special-follow-strong', name: '从强或专旺结构参考', type: 'special', confidence: 0.62,
      active: expertActive && Boolean(expert.specialStructureConfirmed),
      supportingEvidence: [{ title: '生扶极强', detail: `生扶比例达${(strength.supportRatio * 100).toFixed(1)}%，且根气明显。` }],
      opposingEvidence: [{ title: '需要确认', detail: '从强、专旺需要结合全局气势进一步确认。' }],
    });
  }

  const relationships = detectRelationships(chart, expert, expertActive);
  const specialPending = candidates.some((candidate) => candidate.type === 'special' && !candidate.active)
    || relationships.some((finding) => finding.status === 'potential');
  const selectedStructure = expertActive && expert.structureName
    ? expert.structureName
    : candidates.find((candidate) => candidate.active)?.name;
  const warnings: string[] = [];
  if (specialPending) warnings.push('命局中有需要进一步确认的特殊结构，当前暂不据此调整五行力量。');
  if (expertActive && expert.structureName) warnings.push('当前格局已采用专业校正结果。');

  return {
    candidates,
    relationships,
    selectedStructure,
    specialPending,
    confidence: Number(Math.min(0.9, normal.confidence - (specialPending ? 0.1 : 0)).toFixed(2)),
    warnings,
  };
}
