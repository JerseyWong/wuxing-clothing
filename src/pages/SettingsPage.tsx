import { Link } from 'react-router-dom';
import { Panel, WarningList } from '../components/UI';
import { useCalculations } from '../lib/useCalculations';
import { dayRolloverLabel, formatOffset } from '../lib/time';
import { effectiveTimeLabel } from '../lib/uiLabels';
import { useAppStore } from '../store/useAppStore';

export default function SettingsPage() {
  const profile = useAppStore((state) => state.draftProfile);
  const updateDraft = useAppStore((state) => state.updateDraft);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const { chart, error } = useCalculations();

  const updateTime = (partial: Partial<typeof profile.timeConfig>) => updateDraft((draft) => ({ ...draft, timeConfig: { ...draft.timeConfig, ...partial } }));

  return <>
    <section className="page-hero compact"><div><p className="eyebrow">调整出生时间的采用方式</p><h1>排盘设置</h1><p>默认使用出生地当地时间和子初换日。真太阳时需要手动开启，人工校正时间开启后优先采用。</p></div><Link className="hero-button" to="/chart">查看命盘结果</Link></section>

    <Panel title="出生时间采用顺序" eyebrow="人工校正时间 ＞ 真太阳时 ＞ 当地标准时间">
      <div className="setting-stack">
        <label className="switch-setting"><div><strong>使用真太阳时</strong><span>开启后，根据出生地经度和当天均时差调整出生时间。</span></div><input type="checkbox" checked={profile.timeConfig.solarTimeEnabled} onChange={(event) => updateTime({ solarTimeEnabled: event.target.checked })} /></label>
        <label className="switch-setting"><div><strong>使用人工校正时间</strong><span>适合已经由专业人士校正过出生时间的情况，开启后优先采用。</span></div><input type="checkbox" checked={profile.timeConfig.expertTimeEnabled} onChange={(event) => updateTime({ expertTimeEnabled: event.target.checked })} /></label>
        {profile.timeConfig.expertTimeEnabled && <label className="wide-field"><span>人工校正后的出生时间</span><input type="datetime-local" value={profile.timeConfig.expertDateTime ?? ''} onChange={(event) => updateTime({ expertDateTime: event.target.value })} /></label>}
      </div>
    </Panel>

    <Panel title="子时换日规则" eyebrow={`当前采用：${dayRolloverLabel(profile.timeConfig.dayRolloverRule)}`}>
      <div className="radio-cards">{([
        ['zi_start', '子初换日', '晚上十一点起按次日的日柱计算，当前默认。'],
        ['midnight', '午夜换日', '凌晨零点起按次日的日柱计算。'],
        ['late_zi_previous_day', '晚子时不换日', '晚上十一点至十二点仍按前一日处理。'],
      ] as const).map(([value, title, description]) => <label key={value} className={profile.timeConfig.dayRolloverRule === value ? 'active' : ''}><input type="radio" name="rollover" value={value} checked={profile.timeConfig.dayRolloverRule === value} onChange={() => updateTime({ dayRolloverRule: value })} /><strong>{title}</strong><span>{description}</span></label>)}</div>
      <p className="method-copy">不同流派对晚子时有不同处理方式。普通使用保持默认即可，出生时间接近晚上十一点时再重点核对。</p>
    </Panel>

    {error && <div className="error-banner">{error}</div>}
    {chart && <Panel title="当前时间对照" eyebrow={`最终采用：${effectiveTimeLabel(chart.effectiveTimeType)}`}>
      <div className="time-comparison">
        <div><small>当地标准时间</small><strong>{chart.timeBreakdown.standardDateTime}</strong><span>{formatOffset(chart.timeBreakdown.utcOffsetMinutes)}{chart.timeBreakdown.isDst ? ' · 当时实行夏令时' : ''}</span></div>
        <div><small>世界协调时间</small><strong>{chart.timeBreakdown.utcDateTime}</strong></div>
        <div><small>真太阳时</small><strong>{chart.timeBreakdown.trueSolarDateTime}</strong><span>经度调整 {chart.timeBreakdown.longitudeCorrectionMinutes} 分钟 · 均时差 {chart.timeBreakdown.equationOfTimeMinutes} 分钟</span></div>
        <div className="active"><small>最终排盘时间</small><strong>{chart.timeBreakdown.effectiveDateTime}</strong><span>{effectiveTimeLabel(chart.effectiveTimeType)}</span></div>
      </div>
      <WarningList warnings={chart.timeWarnings} />
    </Panel>}

    <div className="sticky-save"><p>修改后请保存当前档案，下次打开时才会继续沿用。</p><button type="button" className="primary-button" onClick={saveDraft}>保存当前档案</button></div>
  </>;
}
