import { BRANCH_ELEMENT, STEM_ELEMENT, blankElementScores } from '../../data/wuxing';
import type { BaziChart, BasicChartAnalysis } from '../../types/domain';

export function analyzeBasicChart(chart: BaziChart): BasicChartAnalysis {
  const elementCounts = blankElementScores();
  let yinCount = 0;
  let yangCount = 0;

  chart.pillarList.forEach((pillar) => {
    elementCounts[STEM_ELEMENT[pillar.stem]] += 1;
    elementCounts[BRANCH_ELEMENT[pillar.branch]] += 1;
    const stemIndex = '甲乙丙丁戊己庚辛壬癸'.indexOf(pillar.stem);
    const branchIndex = '子丑寅卯辰巳午未申酉戌亥'.indexOf(pillar.branch);
    if (stemIndex % 2 === 0) yangCount += 1; else yinCount += 1;
    if (branchIndex % 2 === 0) yangCount += 1; else yinCount += 1;
  });

  return {
    elementCounts,
    rawElementPower: blankElementScores(),
    yinCount,
    yangCount,
    monthCommandElement: chart.pillars.month.branchElement,
    facts: [
      { title: '日主', detail: `${chart.dayMaster}${chart.dayMasterElement}` },
      { title: '月令', detail: `${chart.pillars.month.branch}月，月令五行为${chart.pillars.month.branchElement}` },
      { title: '阴阳分布', detail: `阳${yangCount}、阴${yinCount}` },
      { title: '时间口径', detail: `采用${chart.effectiveTimeType === 'expert' ? '专家校正时间' : chart.effectiveTimeType === 'true_solar' ? '真太阳时' : '当地标准时间'} ${chart.effectiveDateTime}` },
    ],
  };
}
