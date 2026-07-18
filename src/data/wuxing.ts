import type {
  EarthlyBranch,
  Element,
  ElementScoreMap,
  HeavenlyStem,
  SceneType,
  TenGod,
  TenGodGroup,
} from '../types/domain';
import { ELEMENTS } from '../types/domain';

export { ELEMENTS };

export const GENERATES: Record<Element, Element> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
export const GENERATED_BY: Record<Element, Element> = { 木: '水', 火: '木', 土: '火', 金: '土', 水: '金' };
export const CONTROLS: Record<Element, Element> = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };
export const CONTROLLED_BY: Record<Element, Element> = { 木: '金', 火: '水', 土: '木', 金: '火', 水: '土' };

export const STEM_ELEMENT: Record<HeavenlyStem, Element> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

export const STEM_YIN_YANG: Record<HeavenlyStem, 'yang' | 'yin'> = {
  甲: 'yang', 乙: 'yin', 丙: 'yang', 丁: 'yin', 戊: 'yang',
  己: 'yin', 庚: 'yang', 辛: 'yin', 壬: 'yang', 癸: 'yin',
};

export const BRANCH_ELEMENT: Record<EarthlyBranch, Element> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};

export const BRANCH_YIN_YANG: Record<EarthlyBranch, 'yang' | 'yin'> = {
  子: 'yang', 丑: 'yin', 寅: 'yang', 卯: 'yin', 辰: 'yang', 巳: 'yin',
  午: 'yang', 未: 'yin', 申: 'yang', 酉: 'yin', 戌: 'yang', 亥: 'yin',
};

export const HIDDEN_STEMS: Record<EarthlyBranch, Array<{ stem: HeavenlyStem; role: 'main' | 'middle' | 'residual'; ratio: number }>> = {
  子: [{ stem: '癸', role: 'main', ratio: 1 }],
  丑: [{ stem: '己', role: 'main', ratio: 0.7 }, { stem: '癸', role: 'middle', ratio: 0.2 }, { stem: '辛', role: 'residual', ratio: 0.1 }],
  寅: [{ stem: '甲', role: 'main', ratio: 0.7 }, { stem: '丙', role: 'middle', ratio: 0.2 }, { stem: '戊', role: 'residual', ratio: 0.1 }],
  卯: [{ stem: '乙', role: 'main', ratio: 1 }],
  辰: [{ stem: '戊', role: 'main', ratio: 0.7 }, { stem: '乙', role: 'middle', ratio: 0.2 }, { stem: '癸', role: 'residual', ratio: 0.1 }],
  巳: [{ stem: '丙', role: 'main', ratio: 0.7 }, { stem: '戊', role: 'middle', ratio: 0.2 }, { stem: '庚', role: 'residual', ratio: 0.1 }],
  午: [{ stem: '丁', role: 'main', ratio: 0.8 }, { stem: '己', role: 'middle', ratio: 0.2 }],
  未: [{ stem: '己', role: 'main', ratio: 0.7 }, { stem: '丁', role: 'middle', ratio: 0.2 }, { stem: '乙', role: 'residual', ratio: 0.1 }],
  申: [{ stem: '庚', role: 'main', ratio: 0.7 }, { stem: '壬', role: 'middle', ratio: 0.2 }, { stem: '戊', role: 'residual', ratio: 0.1 }],
  酉: [{ stem: '辛', role: 'main', ratio: 1 }],
  戌: [{ stem: '戊', role: 'main', ratio: 0.7 }, { stem: '辛', role: 'middle', ratio: 0.2 }, { stem: '丁', role: 'residual', ratio: 0.1 }],
  亥: [{ stem: '壬', role: 'main', ratio: 0.8 }, { stem: '甲', role: 'middle', ratio: 0.2 }],
};

export const ELEMENT_META: Record<Element, {
  main: string;
  soft: string;
  ink: string;
  colors: Array<{ name: string; hex: string }>;
  materials: string[];
}> = {
  木: {
    main: '#2f7d4a', soft: '#edf7f0', ink: '#194b2c',
    colors: [
      { name: '松柏绿', hex: '#1f5f3a' }, { name: '墨绿', hex: '#173f2b' },
      { name: '青黛', hex: '#2f6f69' }, { name: '橄榄绿', hex: '#7b7d35' },
      { name: '灰绿色', hex: '#80947d' }, { name: '竹青', hex: '#6f9b62' },
      { name: '青绿色', hex: '#3b8b78' }, { name: '薄荷绿', hex: '#9bcfbd' },
    ],
    materials: ['棉麻', '灯芯绒', '磨毛棉', '哑光针织'],
  },
  火: {
    main: '#b8463f', soft: '#fff0ee', ink: '#76251f',
    colors: [
      { name: '朱砂红', hex: '#b23a35' }, { name: '绛红', hex: '#7e2631' },
      { name: '酒红', hex: '#722f37' }, { name: '珊瑚色', hex: '#e4765a' },
      { name: '暖紫', hex: '#8f4f77' }, { name: '砖红', hex: '#a8513d' },
      { name: '暖粉', hex: '#c98f9c' }, { name: '柿子橙', hex: '#d96c32' },
    ],
    materials: ['羊毛', '丝绒', '真丝', '有光泽皮革'],
  },
  土: {
    main: '#a16a2f', soft: '#fff7e9', ink: '#684117',
    colors: [
      { name: '驼色', hex: '#b28a5a' }, { name: '卡其', hex: '#a59678' },
      { name: '奶茶色', hex: '#c5aa91' }, { name: '沙色', hex: '#c8b28e' },
      { name: '米黄色', hex: '#dfd2ba' }, { name: '咖啡色', hex: '#6f4e37' },
      { name: '焦糖', hex: '#9a633d' }, { name: '赭石', hex: '#9d5438' },
    ],
    materials: ['麂皮', '粗花呢', '羊绒', '厚实棉布'],
  },
  金: {
    main: '#687785', soft: '#f3f5f7', ink: '#38434d',
    colors: [
      { name: '白色', hex: '#f7f7f2' }, { name: '月白', hex: '#f2f0e8' },
      { name: '银灰', hex: '#a9b0b6' }, { name: '珍珠白', hex: '#ebe7df' },
      { name: '浅金', hex: '#d8c39b' }, { name: '冷灰', hex: '#8d969e' },
      { name: '铂金', hex: '#c9ced1' }, { name: '象牙白', hex: '#fffaf0' },
    ],
    materials: ['挺括西装料', '府绸', '缎面', '金属配饰'],
  },
  水: {
    main: '#315f8a', soft: '#edf4fb', ink: '#193b5a',
    colors: [
      { name: '藏青', hex: '#192d4d' }, { name: '深蓝', hex: '#183f70' },
      { name: '靛蓝', hex: '#344b7a' }, { name: '黑色', hex: '#24282d' },
      { name: '蓝灰', hex: '#617283' }, { name: '墨蓝', hex: '#203b57' },
      { name: '玄青', hex: '#25394b' }, { name: '炭灰', hex: '#4b5157' },
    ],
    materials: ['垂坠西装料', '丝绸', '细针织', '哑光皮革'],
  },
};

export const SCENE_META: Record<SceneType, {
  name: string;
  description: string;
  adjustments: ElementScoreMap;
  tone: string;
}> = {
  commute: {
    name: '日常通勤', description: '稳定、耐看、易搭配，优先低饱和和中等明度。',
    adjustments: { 木: 0, 火: -1, 土: 3, 金: 2, 水: 1 }, tone: '低饱和、舒适、耐穿',
  },
  business: {
    name: '商务会议', description: '强调专业、秩序与可信度，避免过度鲜艳。',
    adjustments: { 木: 0, 火: -2, 土: 4, 金: 5, 水: 2 }, tone: '深色、挺括、低光泽',
  },
  social: {
    name: '社交约会', description: '提高亲和力和表达感，允许适度暖色点缀。',
    adjustments: { 木: 4, 火: 5, 土: 0, 金: -2, 水: 1 }, tone: '柔和、轻盈、适度明亮',
  },
  decision: {
    name: '重要决策', description: '强调稳定、清晰和专注，降低刺激性颜色。',
    adjustments: { 木: 0, 火: -3, 土: 2, 金: 3, 水: 4 }, tone: '克制、清晰、沉稳',
  },
};

export const DEFAULT_WEIGHTS = { personal: 55, month: 15, day: 20, year: 5, scene: 5 } as const;

export function blankElementScores(value = 0): ElementScoreMap {
  return { 木: value, 火: value, 土: value, 金: value, 水: value };
}

export function normalizeElementScores(scores: ElementScoreMap, target = 100): ElementScoreMap {
  const total = ELEMENTS.reduce((sum, element) => sum + Math.max(0, scores[element]), 0);
  if (total <= 0) return blankElementScores(target / 5);
  return Object.fromEntries(ELEMENTS.map((element) => [
    element,
    Number(((Math.max(0, scores[element]) / total) * target).toFixed(2)),
  ])) as ElementScoreMap;
}

export function clampScore(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function getTenGod(dayMaster: HeavenlyStem, target: HeavenlyStem): TenGod {
  if (dayMaster === target) return '比肩';
  const dmElement = STEM_ELEMENT[dayMaster];
  const targetElement = STEM_ELEMENT[target];
  const samePolarity = STEM_YIN_YANG[dayMaster] === STEM_YIN_YANG[target];
  if (targetElement === dmElement) return samePolarity ? '比肩' : '劫财';
  if (targetElement === GENERATES[dmElement]) return samePolarity ? '食神' : '伤官';
  if (targetElement === CONTROLS[dmElement]) return samePolarity ? '偏财' : '正财';
  if (targetElement === CONTROLLED_BY[dmElement]) return samePolarity ? '七杀' : '正官';
  if (targetElement === GENERATED_BY[dmElement]) return samePolarity ? '偏印' : '正印';
  return '日主';
}

export function getTenGodGroupFromElement(dayMasterElement: Element, targetElement: Element): TenGodGroup {
  if (targetElement === dayMasterElement) return '比劫';
  if (targetElement === GENERATES[dayMasterElement]) return '食伤';
  if (targetElement === CONTROLS[dayMasterElement]) return '财星';
  if (targetElement === CONTROLLED_BY[dayMasterElement]) return '官杀';
  return '印星';
}

export function relationScore(environment: Element, candidate: Element): number {
  if (GENERATES[environment] === candidate) return 85;
  if (environment === candidate) return 75;
  if (CONTROLS[candidate] === environment) return 55;
  if (GENERATES[candidate] === environment) return 45;
  if (CONTROLS[environment] === candidate) return 20;
  return 50;
}

export function relationText(from: Element, to: Element): string {
  if (from === to) return `${from}${to}同气`;
  if (GENERATES[from] === to) return `${from}生${to}`;
  if (CONTROLS[from] === to) return `${from}克${to}`;
  if (GENERATES[to] === from) return `${to}生${from}`;
  if (CONTROLS[to] === from) return `${to}克${from}`;
  return `${from}与${to}关系中性`;
}
