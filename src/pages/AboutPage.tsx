import { Panel } from '../components/UI';

export default function AboutPage() {
  return <>
    <section className="page-hero compact"><div><p className="eyebrow">了解配色建议如何形成</p><h1>计算说明</h1><p>应用先整理个人命盘的长期取色方向，再结合当天气势和使用场合调整颜色比例。</p></div></section>

    <Panel title="从出生资料到穿衣建议" eyebrow="主要计算步骤">
      <div className="pipeline"><span>出生信息</span><i>→</i><span>时间校正</span><i>→</i><span>四柱排盘</span><i>→</i><span>命局分析</span><i>→</i><span>年、月、日气势</span><i>→</i><span>场合调整</span><i>→</i><span>穿衣配色</span></div>
    </Panel>

    <Panel title="判断原则" eyebrow="复杂结构保留人工校正空间">
      <div className="about-grid"><article><h3>先看命盘整体</h3><p>四柱、藏干、十神、月令、根气和五行力量共同参与判断，不以单纯数量决定喜用。</p></article><article><h3>特殊结构谨慎处理</h3><p>从格、专旺、化气和合化成立等情况，需要结合整体命局进一步确认。</p></article><article><h3>颜色不是越多越好</h3><p>适合的五行在当天已经很旺时，也会降低面积，避免继续叠加。</p></article><article><h3>结果以日常穿搭为落点</h3><p>最终给出主色、辅助色、点缀色和慎用色，并结合场合调整明暗和材质。</p></article></div>
    </Panel>

    <Panel title="默认比重" eyebrow="个人命局为主">
      <div className="metric-row"><div><small>个人命局</small><strong>55%</strong></div><div><small>流月</small><strong>15%</strong></div><div><small>流日</small><strong>20%</strong></div><div><small>流年</small><strong>5%</strong></div><div><small>场合</small><strong>5%</strong></div></div>
      <p className="method-copy">个人命局决定长期方向，流月和流日负责当天微调，场合只改变颜色的表达方式。</p>
    </Panel>

    <Panel title="隐私与数据" eyebrow="所有资料均在本机处理">
      <p className="panel-lead">出生资料填写后只在当前页面使用。点击“保存到本机”后，才会保存在当前浏览器中。应用不依赖第三方地图服务，排盘和推荐可以离线完成。</p>
    </Panel>
  </>;
}
