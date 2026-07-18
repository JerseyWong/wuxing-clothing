import {
  CONTROLS,
  CONTROLLED_BY,
  GENERATED_BY,
  GENERATES,
  DEFAULT_WEIGHTS,
  ELEMENT_META,
  SCENE_META,
  blankElementScores,
  clampScore,
  relationScore,
} from '../data/wuxing';
import { ELEMENTS } from '../types/domain';
import type {
  BaziAnalysis,
  ClothingRecommendation,
  ColorRecommendation,
  Element,
  ElementRecommendation,
  ElementScoreMap,
  ExpertOverride,
  RecommendationWeights,
  SceneType,
  TransitContext,
} from '../types/domain';
import { ALGORITHM_VERSION } from './analysis';
import { isExpertConfigurationActive } from './expertConfig';

function weightedRelation(environmentScores: ElementScoreMap, candidate: Element): number {
  return ELEMENTS.reduce((sum, environment) => (
    sum + relationScore(environment, candidate) * (environmentScores[environment] / 100)
  ), 0);
}

function normalizeWeights(weights: RecommendationWeights): RecommendationWeights {
  const total = weights.personal + weights.month + weights.day + weights.year + weights.scene;
  if (total <= 0) return { ...DEFAULT_WEIGHTS };
  const factor = 100 / total;
  return {
    personal: weights.personal * factor,
    month: weights.month * factor,
    day: weights.day * factor,
    year: weights.year * factor,
    scene: weights.scene * factor,
  };
}

function environmentShare(analysis: BaziAnalysis, transit: TransitContext): ElementScoreMap {
  const combined = blankElementScores();
  ELEMENTS.forEach((element) => {
    combined[element] = analysis.strength.elementPercentages[element] * 0.55
      + transit.environmentScores[element] * 0.45;
  });
  return combined;
}

function overflowPenalty(
  element: Element,
  share: number,
  isCautious: boolean,
): number {
  let penalty = 0;
  if (share >= 45) penalty = 28 + Math.min(7, (share - 45) * 0.7);
  else if (share >= 35) penalty = 10 + (share - 35);
  else if (share >= 30) penalty = 5;
  if (isCautious && share >= 35) penalty += 10;
  return Number(Math.min(35, penalty).toFixed(2));
}

function isConflict(a: Element, b: Element): boolean {
  return CONTROLS[a] === b || CONTROLS[b] === a;
}

const BRIDGE_MAP: Record<string, Element> = {
  '金木': '水', '木金': '水', '水火': '木', '火水': '木',
  '木土': '火', '土木': '火', '土水': '金', '水土': '金',
  '火金': '土', '金火': '土',
};

function levelForElement(analysis: BaziAnalysis, element: Element) {
  const groups = analysis.final.elements;
  if (groups.core.includes(element)) return 'core' as const;
  if (groups.favorable.includes(element)) return 'favorable' as const;
  if (groups.cautious.includes(element)) return 'cautious' as const;
  return 'neutral' as const;
}

function selectColors(element: Element, scene: SceneType, count = 4) {
  const colors = [...ELEMENT_META[element].colors];
  if (scene === 'business' || scene === 'decision') {
    colors.sort((a, b) => perceivedLightness(a.hex) - perceivedLightness(b.hex));
  } else if (scene === 'social') {
    colors.sort((a, b) => perceivedLightness(b.hex) - perceivedLightness(a.hex));
  }
  return colors.slice(0, count);
}

function perceivedLightness(hex: string): number {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function colorRole(
  role: ColorRecommendation['role'],
  element: Element,
  scene: SceneType,
  explanation: string,
): ColorRecommendation {
  const ratio = {
    main: '55%–65%', secondary: '20%–30%', accent: '5%–10%', neutral: '补足剩余比例', caution: '不建议超过10%',
  }[role];
  return { role, element, colors: selectColors(element, scene, role === 'main' ? 5 : 4), ratio, explanation };
}

function scoreElements(
  analysis: BaziAnalysis,
  transit: TransitContext,
  scene: SceneType,
  expert: ExpertOverride,
): ElementRecommendation[] {
  const expertActive = isExpertConfigurationActive(expert);
  const weights = normalizeWeights(expertActive ? expert.weights : { ...DEFAULT_WEIGHTS });
  const shares = environmentShare(analysis, transit);
  const cautious = analysis.final.elements.cautious;

  return ELEMENTS.map((element) => {
    const personal = analysis.final.elementBaseScores[element];
    const year = weightedRelation(transit.yearScores, element);
    const month = weightedRelation(transit.monthScores, element);
    const day = weightedRelation(transit.dayScores, element);
    const sceneScore = clampScore(50 + SCENE_META[scene].adjustments[element] * 8);
    const penalty = overflowPenalty(element, shares[element], cautious.includes(element));
    const validBridge = analysis.usefulElements.bridgingCandidates.includes(element) && !cautious.includes(element);
    const bridgeBonus = validBridge ? Math.min(15, 5 + analysis.usefulElements.bridgingModel[element] / 10) : 0;
    const expertAdjustment = expertActive ? expert.elementAdjustments[element] : 0;
    const raw = personal * (weights.personal / 100)
      + month * (weights.month / 100)
      + day * (weights.day / 100)
      + year * (weights.year / 100)
      + sceneScore * (weights.scene / 100)
      + bridgeBonus
      - penalty
      + expertAdjustment;
    const final = clampScore(raw);
    const reasons = [
      `个人命局${personal.toFixed(0)}分，占${weights.personal.toFixed(0)}%`,
      `流月${month.toFixed(0)}分、流日${day.toFixed(0)}分、流年${year.toFixed(0)}分`,
      `场景“${SCENE_META[scene].name}”对子模型评分为${sceneScore.toFixed(0)}分`,
    ];
    if (penalty > 0) reasons.push(`当前环境中${element}占比较高，过量修正-${penalty.toFixed(0)}分`);
    if (bridgeBonus > 0) reasons.push(`${element}可作为有效通关，+${bridgeBonus.toFixed(0)}分`);
    if (expertAdjustment !== 0) reasons.push(`专业校正${expertAdjustment > 0 ? '+' : ''}${expertAdjustment}分`);
    return {
      element,
      rank: 0,
      level: levelForElement(analysis, element),
      score: {
        personal, year, month, day, scene: sceneScore,
        overflowPenalty: penalty, bridgeBonus, expertAdjustment,
        final: Number(final.toFixed(2)),
      },
      reasons,
    };
  }).sort((a, b) => b.score.final - a.score.final).map((item, index) => ({ ...item, rank: index + 1 }));
}

function buildOutfitExamples(main: Element, secondary: Element, accent: Element, scene: SceneType) {
  const mainColor = selectColors(main, scene, 1)[0].name;
  const secondaryColor = selectColors(secondary, scene, 1)[0].name;
  const accentColor = selectColors(accent, scene, 1)[0].name;
  const examples = {
    commute: [
      { title: '通勤基础款', description: `${mainColor}外套或长裤作为主色，搭配${secondaryColor}针织或衬衫，以${accentColor}包袋、袜子或小配饰收束。` },
      { title: '轻量搭配', description: `${mainColor}上装搭配中性色下装，${secondaryColor}放在鞋履或包袋，保持低饱和和舒适材质。` },
    ],
    business: [
      { title: '商务正式', description: `${mainColor}西装或套装占主体，${secondaryColor}用于衬衫或内搭，${accentColor}只放在领带、丝巾、袖扣等小面积。` },
      { title: '可信表达', description: `优先挺括、低光泽材质；主色保持深稳，避免把点缀色扩大成全身高饱和色块。` },
    ],
    social: [
      { title: '柔和社交', description: `${mainColor}作为主要单品，${secondaryColor}增加层次，${accentColor}可用于首饰、围巾或鞋履，适当提高明度。` },
      { title: '亲和搭配', description: `选择柔软或有轻微光泽的材质，让主辅色自然过渡，点缀色不超过整体10%。` },
    ],
    decision: [
      { title: '专注组合', description: `${mainColor}作为稳定基调，${secondaryColor}用于内搭或下装，${accentColor}仅做小面积识别点。` },
      { title: '克制表达', description: `整体保持清晰、低刺激和线条利落，减少复杂图案与大面积强对比。` },
    ],
  }[scene];
  return examples;
}

export function buildClothingRecommendation(
  analysis: BaziAnalysis,
  transit: TransitContext,
  scene: SceneType,
  mode: ClothingRecommendation['mode'],
  expert: ExpertOverride,
): ClothingRecommendation {
  const ranking = scoreElements(analysis, transit, scene, expert);
  let mainElement = ranking[0].element;
  let secondaryElement = ranking[1].element;
  let accentElement = ranking[2].element;

  if (isConflict(mainElement, secondaryElement)) {
    const bridge = BRIDGE_MAP[`${mainElement}${secondaryElement}`];
    if (bridge && !analysis.final.elements.cautious.includes(bridge)) {
      accentElement = secondaryElement;
      secondaryElement = bridge;
    } else {
      const neutralCandidate = ranking.find((item) => item.level === 'neutral' && !isConflict(mainElement, item.element));
      if (neutralCandidate) secondaryElement = neutralCandidate.element;
    }
  }

  const neutralCandidate = ranking.find((item) => (
    item.element !== mainElement
    && item.element !== secondaryElement
    && item.element !== accentElement
    && item.level !== 'cautious'
  ));
  const neutralElement = neutralCandidate?.element ?? (mainElement === '金' ? '土' : '金');
  const cautionElement = [...ranking].reverse().find((item) => analysis.final.elements.cautious.includes(item.element))?.element
    ?? ranking[ranking.length - 1].element;

  const summary = `今日以${mainElement}系为主，${secondaryElement}系辅助，${accentElement}系点缀；${cautionElement}系避免大面积使用。`;
  const personalReason = `你的长期配色以${analysis.final.elements.core.join('、') || '平衡取色'}为重点，今天在此基础上做小幅调整。`;
  const transitReason = `今年${transit.year.text}、本月${transit.month.text}和今日${transit.day.text}共同影响当天的颜色顺序，其中月运和日运变化最明显。`;
  const sceneReason = `${SCENE_META[scene].name}主要影响颜色的明暗、材质和使用面积，不改变你的长期配色方向。`;
  const warnings = [
    ...analysis.strength.warnings,
    ...analysis.structure.warnings,
    ranking[0].score.overflowPenalty > 0 ? `${mainElement}今天已有一定强度，按建议比例使用更协调。` : '',
  ].filter(Boolean);

  return {
    date: transit.date,
    scene,
    mode,
    elementRanking: ranking,
    main: colorRole('main', mainElement, scene, `${mainElement}系最适合作为今天的整体基调。`),
    secondary: colorRole('secondary', secondaryElement, scene, `${secondaryElement}系用来增加层次，并让主色过渡得更自然。`),
    accent: colorRole('accent', accentElement, scene, `${accentElement}系适合小面积点缀，让整体更有精神。`),
    neutral: colorRole('neutral', neutralElement, scene, `${neutralElement}系作为过渡色，帮助整体更耐看。`),
    caution: colorRole('caution', cautionElement, scene, `${cautionElement}系今天更适合少量出现，不建议成为全身主色。`),
    outfitExamples: buildOutfitExamples(mainElement, secondaryElement, accentElement, scene),
    explanation: { summary, personalReason, transitReason, sceneReason, warnings },
    algorithmVersion: ALGORITHM_VERSION,
  };
}

export type UniversalCategoryKey = 'lucky' | 'stable' | 'effort' | 'drain' | 'pressure';

export interface UniversalRecommendation {
  key: UniversalCategoryKey;
  title: string;
  icon: string;
  element: Element;
  badge: string;
  summary: string;
  detail: string;
  tone: 'gold' | 'green' | 'blue' | 'orange' | 'slate';
}

/**
 * 通用参考严格沿用最早单文件版：
 * 只读取当日日支的本五行，再按固定生克顺序生成五档建议。
 * 不读取日干、藏干、个人命盘、流年、流月、使用场景，也不做百分制评分。
 */
export function buildUniversalRanking(transit: TransitContext): UniversalRecommendation[] {
  const dayElement = transit.day.branchElement;
  const lucky = GENERATES[dayElement];
  const stable = dayElement;
  const effort = CONTROLLED_BY[dayElement];
  const drain = GENERATED_BY[dayElement];
  const pressure = CONTROLS[dayElement];
  const colorText = (element: Element) => ELEMENT_META[element].colors.slice(0, 3).map((item) => item.name).join('、');

  return [
    {
      key: 'lucky', title: '顺利贵人色', icon: '★', element: lucky, tone: 'gold',
      badge: `${dayElement}行生${lucky}行`,
      summary: `推荐穿${colorText(lucky)}`,
      detail: '日支五行生此行，整体较顺，适合重要安排和需要推进的事情。',
    },
    {
      key: 'stable', title: '合宜安稳色', icon: '◎', element: stable, tone: 'green',
      badge: `与当日同为${stable}行`,
      summary: `穿${colorText(stable)}也合适`,
      detail: '与日支五行相同，气势平稳，适合日常通勤、合作沟通和一般事务。',
    },
    {
      key: 'effort', title: '奋斗加油色', icon: '◆', element: effort, tone: 'blue',
      badge: `${effort}行克${dayElement}行`,
      summary: `穿${colorText(effort)}需要多付出`,
      detail: '此行克日支五行，做事更费力，但主动争取时仍有机会获得成果。',
    },
    {
      key: 'drain', title: '辛苦消耗色', icon: '△', element: drain, tone: 'orange',
      badge: `${drain}行生${dayElement}行`,
      summary: `少穿${colorText(drain)}`,
      detail: '此行生日支五行，容易形成消耗，重要场合不建议大面积使用。',
    },
    {
      key: 'pressure', title: '压力山大色', icon: '×', element: pressure, tone: 'slate',
      badge: `${dayElement}行克${pressure}行`,
      summary: `不宜穿${colorText(pressure)}`,
      detail: '日支五行克此行，整体阻力偏大，重要日子尽量避免作为主色。',
    },
  ];
}
