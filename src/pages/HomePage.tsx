import { Link } from 'react-router-dom';
import { ELEMENT_META, SCENE_META } from '../data/wuxing';
import { useCalculations } from '../lib/useCalculations';
import { useAppStore } from '../store/useAppStore';
import { ColorDots, EmptyState, Panel, WarningList } from '../components/UI';
import DisplayModeSelector from '../components/DisplayModeSelector';
import type { ColorRecommendation } from '../types/domain';

function ColorRoleCard({ item, title }: { item: ColorRecommendation; title: string }) {
  const meta = ELEMENT_META[item.element];
  return <article className={`color-role-card role-${item.role}`} style={{ '--element-main': meta.main, '--element-soft': meta.soft } as React.CSSProperties}>
    <header><span>{title}</span><strong>{item.element}系</strong><em>{item.ratio}</em></header>
    <ColorDots element={item.element} limit={item.role === 'main' ? 5 : 4} />
    <p>{item.explanation}</p>
  </article>;
}

export default function HomePage() {
  const selectedDate = useAppStore((state) => state.selectedDate);
  const setSelectedDate = useAppStore((state) => state.setSelectedDate);
  const scene = useAppStore((state) => state.scene);
  const setScene = useAppStore((state) => state.setScene);
  const recommendationMode = useAppStore((state) => state.recommendationMode);
  const setRecommendationMode = useAppStore((state) => state.setRecommendationMode);
  const displayMode = useAppStore((state) => state.displayMode);
  const { profile, transit, recommendation, universal, error } = useCalculations();
  const isUniversal = recommendationMode === 'universal';

  return <>
    <section className="page-hero compact">
      <div>
        <p className="eyebrow">{isUniversal ? '按当日日支五行查看配色' : '结合个人命盘安排配色'}</p>
        <h1>{isUniversal ? '今日通用穿衣参考' : '今日个人穿衣建议'}</h1>
        <p>{isUniversal
          ? '通用参考只看当天的日支五行，沿用原版五行生克顺序，不读取任何个人出生资料。'
          : '个人定制会结合生辰八字、流年流月流日和实际场合，给出更贴合个人的配色建议。'}</p>
      </div>
      <div className="date-seal"><small>{transit.date}</small><strong>{transit.day.text}</strong><span>星期{transit.weekday}</span></div>
    </section>

    <div className={`home-toolbar ${isUniversal ? 'universal-toolbar' : ''}`}>
      <div className="segmented mode-segmented" aria-label="推荐方式">{([['universal', '通用参考'], ['personal', '个人定制']] as const).map(([value, label]) => <button type="button" key={value} className={recommendationMode === value ? 'active' : ''} onClick={() => setRecommendationMode(value)}>{label}</button>)}</div>
      <div className="toolbar-fields">
        <label className="toolbar-field date-field"><span>日期</span><input aria-label="穿衣日期" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label>
        {!isUniversal && <label className="toolbar-field scene-field"><span>场景</span><select aria-label="使用场景" value={scene} onChange={(event) => setScene(event.target.value as keyof typeof SCENE_META)}>{Object.entries(SCENE_META).map(([value, meta]) => <option key={value} value={value}>{meta.name}</option>)}</select></label>}
        {!isUniversal && <DisplayModeSelector placement="toolbar" showLabel />}
      </div>
    </div>

    {isUniversal ? <>
      <Panel title="通用五行穿衣" eyebrow={`今天是${transit.day.text}日 · 日支属${transit.day.branchElement}`}>
        <div className="universal-intro">
          <p>以下五档建议只依据<strong>当日日支五行</strong>与五行生克关系排列，和最早单文件版保持一致。</p>
          <span>需要更精准的结果，请切换到“个人定制”。</span>
        </div>
        <div className="universal-grid">{universal.map((item) => {
          const meta = ELEMENT_META[item.element];
          return <article key={item.key} className={`universal-card tone-${item.tone}`} style={{ '--element-main': meta.main, '--element-soft': meta.soft } as React.CSSProperties}>
            <header>
              <div><b>{item.icon}</b><h3>{item.title}</h3></div>
              <span>{item.badge}</span>
            </header>
            <div className="universal-card-body">
              <div className="universal-element"><strong>{item.element}</strong><small>{item.element}系</small></div>
              <div className="universal-copy">
                <ColorDots element={item.element} limit={3} />
                <h4>{item.summary}</h4>
                <p>{item.detail}</p>
              </div>
            </div>
          </article>;
        })}</div>
      </Panel>
    </> : !profile.birthInput.localDateTime ? <EmptyState title="先创建个人命盘" description="录入出生时间和出生地后，就能获得更适合你的每日配色。资料只有主动保存后才会留在本机。" action={<Link className="primary-button" to="/profiles">录入出生信息</Link>} /> : error ? <EmptyState title="暂时无法计算" description={error} action={<Link className="primary-button" to="/settings">检查排盘设置</Link>} /> : recommendation && <>
      <section className="recommend-summary" style={{ '--element-main': ELEMENT_META[recommendation.main.element].main } as React.CSSProperties}>
        <div><p className="eyebrow">{SCENE_META[scene].name}</p><h2>{recommendation.explanation.summary}</h2><p>{recommendation.explanation.personalReason}</p></div>
        <div className="main-color-orb" style={{ background: ELEMENT_META[recommendation.main.element].main }}><small>今日主色</small><strong>{recommendation.main.element}</strong></div>
      </section>

      {displayMode !== 'popular' && <div className="weight-hint"><strong>今天的取色依据</strong><span>个人命局 55%</span><span>流月 15%</span><span>流日 20%</span><span>流年 5%</span><span>场景 5%</span><Link to="/recommendation">查看详细分数</Link></div>}

      <div className="color-role-grid">
        <ColorRoleCard item={recommendation.main} title="主色" />
        <ColorRoleCard item={recommendation.secondary} title="辅助色" />
        <ColorRoleCard item={recommendation.accent} title="点缀色" />
        <ColorRoleCard item={recommendation.neutral} title="中性色" />
        <ColorRoleCard item={recommendation.caution} title="慎用色" />
      </div>

      <Panel title="完整搭配示例" eyebrow={SCENE_META[scene].tone}>
        <div className="outfit-grid">{recommendation.outfitExamples.map((example) => <article key={example.title}><span>搭</span><div><h3>{example.title}</h3><p>{example.description}</p></div></article>)}</div>
      </Panel>

      {displayMode !== 'popular' && <Panel title="为什么这样搭" eyebrow="查看今天的主要依据">
        <div className="explanation-grid"><div><small>个人基础</small><p>{recommendation.explanation.personalReason}</p></div><div><small>今天的气势</small><p>{recommendation.explanation.transitReason}</p></div><div><small>场合需要</small><p>{recommendation.explanation.sceneReason}</p></div></div>
        {displayMode === 'expert' && <WarningList warnings={recommendation.explanation.warnings} />}
      </Panel>}
    </>}
  </>;
}
