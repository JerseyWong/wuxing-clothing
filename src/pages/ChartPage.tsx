import { Link } from 'react-router-dom';
import { ElementBars, EmptyState, Panel, PillarGrid, WarningList } from '../components/UI';
import { useCalculations } from '../lib/useCalculations';
import { effectiveTimeLabel } from '../lib/uiLabels';

export default function ChartPage() {
  const { chart, analysis, profile } = useCalculations();
  if (!profile.birthInput.localDateTime || !chart || !analysis) return <EmptyState title="尚未生成命盘" description="请先录入出生时间与出生地。" action={<Link className="primary-button" to="/profiles">前往个人档案</Link>} />;

  const time = chart.timeBreakdown;
  return <>
    <section className="page-hero compact"><div><p className="eyebrow">查看四柱与五行构成</p><h1>我的命盘</h1><p>先看四柱、藏干和五行力量，再进入后续的强弱与喜用分析。</p></div><div className="day-master-seal"><small>日主</small><strong>{chart.dayMaster}</strong><span>{chart.dayMasterElement}</span></div></section>

    <Panel title={`${profile.name} · ${chart.dayMaster}${chart.dayMasterElement}日主`} eyebrow={chart.lunarText}>
      <PillarGrid pillars={chart.pillarList} />
    </Panel>

    <div className="two-column">
      <Panel title="五行数量" eyebrow="查看命盘中出现的五行"><ElementBars scores={analysis.basic.elementCounts} suffix="" max={4} /><p className="method-copy">数量只表示命盘构成，不能直接理解为“少什么就补什么”。</p></Panel>
      <Panel title="五行力量" eyebrow="结合月令、藏干和根气"><ElementBars scores={analysis.strength.elementPercentages} /><p className="method-copy">综合生扶比例为 {(analysis.strength.supportRatio * 100).toFixed(1)}%，当前判断为“{analysis.strength.label}”。</p></Panel>
    </div>

    <Panel title="出生时间与排盘口径" eyebrow={`当前采用：${effectiveTimeLabel(chart.effectiveTimeType)}`}>
      <div className="time-comparison">
        <div><small>当地标准时间</small><strong>{time.standardDateTime}</strong></div>
        <div><small>世界协调时间</small><strong>{time.utcDateTime}</strong></div>
        <div><small>真太阳时</small><strong>{time.trueSolarDateTime}</strong><span>共调整 {time.totalSolarCorrectionMinutes > 0 ? '+' : ''}{time.totalSolarCorrectionMinutes} 分钟</span></div>
        <div className="active"><small>最终排盘时间</small><strong>{time.effectiveDateTime}</strong><span>{effectiveTimeLabel(chart.effectiveTimeType)}</span></div>
      </div>
      <div className="solar-term-box"><span>前一节：{chart.solarTerms.previous.name} {chart.solarTerms.previous.dateTime}</span><strong>距离最近节气 {chart.solarTerms.nearest.distanceHours} 小时</strong><span>后一节：{chart.solarTerms.next.name} {chart.solarTerms.next.dateTime}</span></div>
      <WarningList warnings={chart.timeWarnings} />
    </Panel>
  </>;
}
