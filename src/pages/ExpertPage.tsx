import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_WEIGHTS, ELEMENT_META, blankElementScores } from '../data/wuxing';
import { ElementPicker, EmptyState, Panel } from '../components/UI';
import { useCalculations } from '../lib/useCalculations';
import { hasExpertConfiguration, isExpertConfigurationActive } from '../lib/expertConfig';
import { expertOverrideSchema } from '../lib/profileSchema';
import { strengthLevelLabel } from '../lib/uiLabels';
import { useAppStore } from '../store/useAppStore';
import { ELEMENTS } from '../types/domain';
import type { Element, ExpertElementSetting, ExpertOverride, RecommendationWeights, StrengthLevel, TransformationStatus } from '../types/domain';

const STRENGTH_OPTIONS: Array<[StrengthLevel, string]> = [
  ['very_strong', '明显偏强'], ['strong', '相对偏强'], ['balanced', '较为平衡'],
  ['weak', '相对偏弱'], ['very_weak', '明显偏弱'], ['special_pending', '特殊结构待判断'],
];

export default function ExpertPage() {
  const profile = useAppStore((state) => state.draftProfile);
  const updateDraft = useAppStore((state) => state.updateDraft);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const { analysis } = useCalculations();
  const expertFile = useRef<HTMLInputElement>(null);
  const [fileMessage, setFileMessage] = useState('');

  if (!profile.birthInput.localDateTime || !analysis) return <EmptyState title="需要先生成命盘" description="专业校正需要先有基础命盘。" action={<Link className="primary-button" to="/profiles">录入出生信息</Link>} />;

  const expert = profile.expertOverride;
  const configured = hasExpertConfiguration(expert);
  const expertActive = isExpertConfigurationActive(expert);
  const updateExpert = (partial: Partial<ExpertOverride>, markConfigured = true) => updateDraft((draft) => ({
    ...draft,
    expertOverride: {
      ...draft.expertOverride,
      ...partial,
      configured: partial.configured ?? (markConfigured ? true : draft.expertOverride.configured),
      updatedAt: new Date().toISOString(),
    },
  }));

  const automaticGroups: ExpertElementSetting = {
    core: analysis.usefulElements.core,
    favorable: analysis.usefulElements.favorable,
    neutral: analysis.usefulElements.neutral,
    cautious: analysis.usefulElements.cautious,
  };
  const groups = expert.finalElements ?? automaticGroups;

  const enableExpert = (enabled: boolean) => {
    if (enabled && !configured) {
      setFileMessage('请先完成至少一项专业校正，再启用专业配置。');
      return;
    }
    updateExpert({ enabled }, false);
    setFileMessage(enabled ? '专业配置已启用，保存档案后会继续沿用。' : '专业配置已停用，当前恢复使用基础判断。');
  };

  const setGroup = (group: keyof ExpertElementSetting, values: Element[]) => {
    const next: ExpertElementSetting = {
      core: groups.core.filter((item) => group === 'core' || !values.includes(item)),
      favorable: groups.favorable.filter((item) => group === 'favorable' || !values.includes(item)),
      neutral: groups.neutral.filter((item) => group === 'neutral' || !values.includes(item)),
      cautious: groups.cautious.filter((item) => group === 'cautious' || !values.includes(item)),
      [group]: values,
    } as ExpertElementSetting;
    ELEMENTS.forEach((element) => {
      const assigned = (Object.keys(next) as Array<keyof ExpertElementSetting>).some((key) => next[key].includes(element));
      if (!assigned) next.neutral.push(element);
    });
    updateExpert({ finalElements: next });
  };

  const setWeight = (key: keyof RecommendationWeights, value: number) => updateExpert({ weights: { ...expert.weights, [key]: value } });
  const weightTotal = Object.values(expert.weights).reduce((sum, value) => sum + value, 0);

  const exportExpert = () => {
    if (!configured) return;
    const payload = { schemaVersion: '2.1.6', exportedAt: new Date().toISOString(), expertOverride: expert };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `五行穿衣专业配置-${profile.name}-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importExpert = async (file?: File) => {
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      const parsed = expertOverrideSchema.parse(raw.expertOverride ?? raw) as ExpertOverride;
      updateDraft((draft) => ({ ...draft, expertOverride: { ...parsed, configured: true } }));
      setFileMessage('专业配置已导入，请检查后保存当前档案。');
    } catch {
      setFileMessage('导入失败，请确认文件来自本应用且内容完整。');
    } finally {
      if (expertFile.current) expertFile.current.value = '';
    }
  };

  const resetAutomatic = () => updateExpert({
    enabled: false,
    configured: false,
    correctedStrength: undefined,
    structureName: undefined,
    specialStructureConfirmed: false,
    transformationOverrides: {},
    supportingElements: [], climateElements: [], bridgingElements: [], illnessMedicineElements: [],
    finalElements: undefined,
    elementAdjustments: blankElementScores(),
    weights: { ...DEFAULT_WEIGHTS },
    notes: '',
  }, false);

  const expertStrength = expert.correctedStrength ? strengthLevelLabel(expert.correctedStrength) : '沿用基础判断';
  const statusText = expertActive ? '专业校正已启用' : configured ? '专业配置已保存，当前未启用' : '尚未设置专业配置';

  return <>
    <section className="page-hero compact"><div><p className="eyebrow">由专业人士调整关键判断</p><h1>专业校正</h1><p>可以先编辑和保存专业配置，确认无误后再启用。只有“已配置并已启用”时，专业结论才会参与命盘分析和穿衣推荐。</p></div><label className="hero-switch"><span>{statusText}</span><input aria-label="启用专业校正" type="checkbox" checked={expert.enabled} disabled={!configured} onChange={(event) => enableExpert(event.target.checked)} /></label></section>

    <div className={`expert-config-banner ${expertActive ? 'active' : configured ? 'ready' : ''}`}>
      <strong>{expertActive ? '当前正在使用专业校正结果' : configured ? '配置已准备好，但尚未参与推荐' : '当前仍使用基础命盘判断'}</strong>
      <span>{expertActive ? '修改后请保存当前档案。' : configured ? '确认配置后，可在页面顶部启用。' : '调整任一项目后会形成专业配置；保存并启用后才会生效。'}</span>
    </div>

    <Panel title="基础判断与专业校正" eyebrow="左右对照，便于确认修改内容">
      <div className="comparison-grid">
        <article><small>基础判断</small><h3>{analysis.strength.label} · {analysis.structure.selectedStructure ?? '常规格局参考'}</h3><p>重点采用：{analysis.usefulElements.core.join('、') || '无'}；适合采用：{analysis.usefulElements.favorable.join('、') || '无'}；少量使用：{analysis.usefulElements.cautious.join('、') || '无'}</p></article>
        <article className={expertActive ? 'active' : configured ? 'ready' : ''}><small>专业校正</small><h3>{expertStrength} · {expert.structureName ?? '沿用基础格局'}</h3><p>重点采用：{groups.core.join('、') || '无'}；适合采用：{groups.favorable.join('、') || '无'}；少量使用：{groups.cautious.join('、') || '无'}</p></article>
      </div>
    </Panel>

    <Panel title="旺衰与格局" eyebrow={`当前基础：${analysis.strength.label} · ${analysis.structure.selectedStructure ?? '格局待定'}`}>
      <div className="form-grid two">
        <label><span>专业旺衰结论</span><select value={expert.correctedStrength ?? ''} onChange={(event) => updateExpert({ correctedStrength: event.target.value ? event.target.value as StrengthLevel : undefined })}><option value="">沿用基础判断</option>{STRENGTH_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>专业格局名称</span><input value={expert.structureName ?? ''} placeholder="留空则沿用基础格局" onChange={(event) => updateExpert({ structureName: event.target.value || undefined })} /></label>
      </div>
      <label className="switch-setting compact-switch"><div><strong>确认采用特殊格局规则</strong><span>从格、专旺等只有专业确认后，才会改变喜用和穿衣排序。</span></div><input type="checkbox" checked={Boolean(expert.specialStructureConfirmed)} onChange={(event) => updateExpert({ specialStructureConfirmed: event.target.checked })} /></label>
    </Panel>

    {analysis.structure.relationships.filter((item) => item.status).length > 0 && <Panel title="合化判断" eyebrow="未确认时只作为命局关系展示，不改变五行力量">
      <div className="transformation-list">{analysis.structure.relationships.filter((item) => item.status).map((finding) => <label key={finding.id}><div><strong>{finding.label}</strong><span>{finding.explanation}</span></div><select value={expert.transformationOverrides[finding.id] ?? 'potential'} onChange={(event) => updateExpert({ transformationOverrides: { ...expert.transformationOverrides, [finding.id]: event.target.value as TransformationStatus } })}><option value="potential">有合化条件</option><option value="not_formed">不成立</option><option value="combined_not_transformed">相合但不化</option><option value="formed">合化成立</option></select></label>)}</div>
    </Panel>}

    <Panel title="喜用五行" eyebrow="同一五行只归入一个层级">
      <ElementPicker label="重点采用" value={groups.core} onChange={(value) => setGroup('core', value)} />
      <ElementPicker label="适合采用" value={groups.favorable} onChange={(value) => setGroup('favorable', value)} />
      <ElementPicker label="平衡使用" value={groups.neutral} onChange={(value) => setGroup('neutral', value)} />
      <ElementPicker label="少量使用" value={groups.cautious} onChange={(value) => setGroup('cautious', value)} />
    </Panel>

    <Panel title="取用细分" eyebrow="记录扶抑、调候、通关与病药判断">
      <ElementPicker label="扶抑用神" value={expert.supportingElements} onChange={(supportingElements) => updateExpert({ supportingElements })} />
      <ElementPicker label="调候用神" value={expert.climateElements} onChange={(climateElements) => updateExpert({ climateElements })} />
      <ElementPicker label="通关用神" value={expert.bridgingElements} onChange={(bridgingElements) => updateExpert({ bridgingElements })} />
      <ElementPicker label="病药用神" value={expert.illnessMedicineElements} onChange={(illnessMedicineElements) => updateExpert({ illnessMedicineElements })} />
    </Panel>

    <Panel title="五行加减分" eyebrow="每个五行可调整负二十分至正二十分">
      <div className="adjustment-grid">{ELEMENTS.map((element) => {
        const meta = ELEMENT_META[element];
        const value = expert.elementAdjustments[element];
        return <label key={element} style={{ '--element-main': meta.main } as React.CSSProperties}><span><b>{element}</b><strong>{value > 0 ? '+' : ''}{value}</strong></span><input type="range" min="-20" max="20" step="1" value={value} onChange={(event) => updateExpert({ elementAdjustments: { ...expert.elementAdjustments, [element]: Number(event.target.value) } })} /></label>;
      })}</div>
    </Panel>

    <Panel title="推荐比重" eyebrow={`当前合计 ${weightTotal}% · 计算时按比例换算`}>
      <div className="weight-input-grid">{([
        ['personal', '个人命局'], ['month', '流月'], ['day', '流日'], ['year', '流年'], ['scene', '场景'],
      ] as const).map(([key, label]) => <label key={key}><span>{label}</span><input type="number" min="0" max="100" value={expert.weights[key]} onChange={(event) => setWeight(key, Math.max(0, Number(event.target.value)))} /><em>%</em></label>)}</div>
      {Math.abs(weightTotal - 100) > 0.01 && <p className="form-message warning">当前合计不是百分之百，计算时会按现有比例换算。调整到百分之百会更容易理解。</p>}
      <button type="button" className="secondary-button" onClick={() => updateExpert({ weights: { ...DEFAULT_WEIGHTS } })}>恢复默认比重</button>
    </Panel>

    <Panel title="校正备注" eyebrow="记录判断依据和使用口径">
      <textarea rows={5} value={expert.notes} placeholder="记录旺衰、格局、调候或合化判断依据……" onChange={(event) => updateExpert({ notes: event.target.value })} />
    </Panel>

    {fileMessage && <p className="form-message">{fileMessage}</p>}
    <div className="sticky-save"><button type="button" className="secondary-button" onClick={resetAutomatic}>清除专业配置</button><button type="button" className="secondary-button" disabled={!configured} onClick={exportExpert}>导出专业配置</button><button type="button" className="secondary-button" onClick={() => expertFile.current?.click()}>导入专业配置</button><input ref={expertFile} hidden type="file" accept="application/json" onChange={(event) => importExpert(event.target.files?.[0])} /><button type="button" className="primary-button" onClick={() => { saveDraft(); setFileMessage(configured ? '专业配置已保存到当前档案。' : '当前档案已保存，尚未设置专业配置。'); }}>保存当前档案</button></div>
  </>;
}
