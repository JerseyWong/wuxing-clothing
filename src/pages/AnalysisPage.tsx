import { Link } from 'react-router-dom';
import { ElementBadge, ElementBars, EmptyState, Panel } from '../components/UI';
import { useCalculations } from '../lib/useCalculations';
import { transformationStatusLabel } from '../lib/uiLabels';

function Evidence({ title, items }: { title: string; items: Array<{ title: string; detail: string }> }) {
  return <div className="evidence-block"><h3>{title}</h3>{items.length ? items.map((item) => <article key={`${item.title}-${item.detail}`}><strong>{item.title}</strong><p>{item.detail}</p></article>) : <p className="muted">暂无需要补充的内容</p>}</div>;
}

export default function AnalysisPage() {
  const { chart, analysis, profile } = useCalculations();
  if (!profile.birthInput.localDateTime || !chart || !analysis) return <EmptyState title="尚未生成命理分析" description="请先完成出生信息和排盘设置。" action={<Link className="primary-button" to="/profiles">创建命盘</Link>} />;

  const confidenceText = analysis.strength.confidenceLevel === 'high' ? '依据较充分' : analysis.strength.confidenceLevel === 'medium' ? '可作参考' : '建议复核';
  const confidenceLabel = (value: number) => value >= 0.8 ? '依据较足' : value >= 0.6 ? '可作参考' : '仍需复核';
  const selectedStructure = analysis.final.structure || analysis.structure.candidates[0]?.name || '常规格局参考';

  return <>
    <section className="page-hero compact"><div><p className="eyebrow">从命盘看整体气势</p><h1>命理分析</h1><p>先看日主强弱和五行流通，再整理适合长期使用的颜色方向。遇到特殊结构时，页面只保留必要说明。</p></div><div className="confidence-seal"><small>整体判断</small><strong>{confidenceText}</strong><span>结合月令、根气与五行流通</span></div></section>

    <Panel title="命盘概览" eyebrow="四柱、月令与五行构成">
      <div className="fact-grid">{analysis.basic.facts.map((fact) => <div key={fact.title}><small>{fact.title}</small><strong>{fact.detail}</strong></div>)}</div>
    </Panel>

    <Panel title={`日主强弱：${analysis.strength.label}`} eyebrow={`生扶力量约占 ${(analysis.strength.supportRatio * 100).toFixed(1)}%`}>
      <div className="two-column analysis-columns">
        <Evidence title="为什么这样判断" items={analysis.strength.supportingEvidence} />
        <Evidence title="需要同时考虑" items={analysis.strength.opposingEvidence} />
      </div>
      <div className="metric-row"><div><small>生扶力量</small><strong>{analysis.strength.supportScore}</strong></div><div><small>耗泄克力量</small><strong>{analysis.strength.drainScore}</strong></div><div><small>根气力量</small><strong>{analysis.strength.rootScore}</strong></div><div><small>综合判断</small><strong>{analysis.strength.label}</strong></div></div>
      {analysis.strength.warnings.length > 0 && <p className="soft-note">{analysis.strength.warnings[0]}</p>}
    </Panel>

    <Panel title="格局与组合关系" eyebrow="用于辅助理解，不强行下唯一结论">
      <div className="candidate-list">{analysis.structure.candidates.map((candidate) => <article key={candidate.id} className={candidate.active ? 'active' : ''}><header><div><small>{candidate.type === 'special' ? '特殊结构参考' : '常规格局参考'}</small><h3>{candidate.name}</h3></div><strong className="candidate-confidence">{confidenceLabel(candidate.confidence)}</strong></header><div className="candidate-evidence-grid"><Evidence title="主要依据" items={candidate.supportingEvidence} /><Evidence title="仍需留意" items={candidate.opposingEvidence} /></div></article>)}</div>
      {analysis.structure.relationships.length > 0 && <div className="relationship-table-wrap"><h3>命局中的合冲刑害</h3><table className="relationship-table"><colgroup><col className="relationship-name" /><col className="relationship-status" /><col /></colgroup><thead><tr><th>组合关系</th><th>当前判断</th><th>说明</th></tr></thead><tbody>{analysis.structure.relationships.map((finding) => <tr key={finding.id}><td><strong>{finding.label}</strong></td><td><span className="status-pill">{transformationStatusLabel(finding.status)}</span></td><td>{finding.explanation}</td></tr>)}</tbody></table></div>}
      {analysis.structure.warnings.length > 0 && <p className="soft-note">{analysis.structure.warnings[0]}</p>}
    </Panel>

    <Panel title="喜用与配色方向" eyebrow="综合扶抑、调候与五行流通">
      <div className="preference-groups">
        <div><small>重点采用</small><p>{analysis.usefulElements.core.map((element) => <ElementBadge key={element} element={element} />)}</p></div>
        <div><small>适合采用</small><p>{analysis.usefulElements.favorable.map((element) => <ElementBadge key={element} element={element} />)}</p></div>
        <div><small>平衡使用</small><p>{analysis.usefulElements.neutral.map((element) => <ElementBadge key={element} element={element} />)}</p></div>
        <div><small>少量使用</small><p>{analysis.usefulElements.cautious.map((element) => <ElementBadge key={element} element={element} />)}</p></div>
      </div>
      <p className="panel-lead">{analysis.usefulElements.explanation}</p>
      <div className="two-column">
        <div><h3>寒暖燥湿</h3><div className="climate-grid"><div><small>寒</small><strong>{analysis.usefulElements.climateIndex.cold}</strong></div><div><small>热</small><strong>{analysis.usefulElements.climateIndex.heat}</strong></div><div><small>燥</small><strong>{analysis.usefulElements.climateIndex.dry}</strong></div><div><small>湿</small><strong>{analysis.usefulElements.climateIndex.wet}</strong></div></div></div>
        <div><h3>五行适配程度</h3><ElementBars scores={Object.fromEntries(analysis.usefulElements.details.map((item) => [item.element, item.combinedScore])) as any} suffix="" /></div>
      </div>
    </Panel>

    <Panel title="最终采用的判断" eyebrow={analysis.final.source === 'expert' ? '已使用专业校正' : '当前使用基础判断'}>
      <div className="expert-summary"><div><small>日主强弱</small><strong>{analysis.final.strengthLabel}</strong></div><div><small>格局参考</small><strong>{selectedStructure}</strong></div><div><small>采用方式</small><strong>{analysis.final.source === 'expert' ? '专业校正' : '基础判断'}</strong></div></div>
      {profile.expertOverride.notes && <p className="expert-note">{profile.expertOverride.notes}</p>}
      <Link className="secondary-button" to="/expert">前往专业校正</Link>
    </Panel>
  </>;
}
