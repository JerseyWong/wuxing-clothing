import { Link } from 'react-router-dom';
import { ELEMENT_META, SCENE_META } from '../data/wuxing';
import { EmptyState, Panel } from '../components/UI';
import { useCalculations } from '../lib/useCalculations';
import { preferenceLevelLabel } from '../lib/uiLabels';
import { useAppStore } from '../store/useAppStore';

export default function RecommendationPage() {
  const { recommendation, profile } = useCalculations();
  const scene = useAppStore((state) => state.scene);
  if (!profile.birthInput.localDateTime || !recommendation) return <EmptyState title="尚无个人推荐明细" description="请先完成命盘信息。" action={<Link className="primary-button" to="/profiles">创建命盘</Link>} />;

  return <>
    <section className="page-hero compact"><div><p className="eyebrow">查看每种五行的得分</p><h1>推荐详情</h1><p>这里把个人基础、年运、月运、日运和场合影响分开列出，方便查看今天为什么推荐这些颜色。</p></div><div className="date-seal"><small>{recommendation.date}</small><strong>{SCENE_META[scene].name}</strong><span>当日配色</span></div></section>

    <Panel title="五行综合评分" eyebrow="分数越高，越适合作为今天的主要配色">
      <div className="score-table-wrap"><table className="score-table"><colgroup><col className="col-rank" /><col className="col-element" /><col /><col /><col /><col /><col /><col /><col /><col /><col className="col-final" /></colgroup><thead><tr><th>排名</th><th>五行</th><th>个人基础</th><th>年运</th><th>月运</th><th>日运</th><th>场合</th><th>过旺调整</th><th>流通调整</th><th>专业调整</th><th>综合分</th></tr></thead><tbody>{recommendation.elementRanking.map((item) => {
        const meta = ELEMENT_META[item.element];
        return <tr key={item.element}><td>{item.rank}</td><td><span className="score-element" style={{ color: meta.main }}>{item.element}</span><small>{preferenceLevelLabel(item.level)}</small></td><td>{item.score.personal.toFixed(1)}</td><td>{item.score.year.toFixed(1)}</td><td>{item.score.month.toFixed(1)}</td><td>{item.score.day.toFixed(1)}</td><td>{item.score.scene.toFixed(1)}</td><td className="negative">-{item.score.overflowPenalty.toFixed(1)}</td><td className="positive">+{item.score.bridgeBonus.toFixed(1)}</td><td>{item.score.expertAdjustment > 0 ? '+' : ''}{item.score.expertAdjustment.toFixed(1)}</td><td><strong>{item.score.final.toFixed(1)}</strong></td></tr>;
      })}</tbody></table></div>
    </Panel>

    <div className="score-card-grid">{recommendation.elementRanking.map((item) => {
      const meta = ELEMENT_META[item.element];
      return <article className="score-detail-card" key={item.element} style={{ '--element-main': meta.main, '--element-soft': meta.soft } as React.CSSProperties}><header><span>{item.rank}</span><div><small>{preferenceLevelLabel(item.level)}</small><h2>{item.element}系</h2></div><strong>{item.score.final.toFixed(1)}</strong></header><ul>{item.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></article>;
    })}</div>

    <Panel title="各项比重" eyebrow="个人基础为主，月运和日运负责当天微调">
      <div className="weight-visual"><div style={{ width: '55%' }}>个人 55%</div><div style={{ width: '15%' }}>流月 15%</div><div style={{ width: '20%' }}>流日 20%</div><div style={{ width: '5%' }}>流年 5%</div><div style={{ width: '5%' }}>场合 5%</div></div>
      <p className="method-copy">场合只改变颜色的明暗、面积和材质，不会盖过个人长期适合的五行。某种五行即使适合你，当天已经很旺时也会适当降低比例。</p>
    </Panel>
  </>;
}
