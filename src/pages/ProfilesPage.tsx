import { useRef, useState } from 'react';
import { DateTime } from 'luxon';
import ChinaCountySelector from '../components/ChinaCountySelector';
import { findChinaCounty, formatChinaLocation } from '../data/chinaAdministrative';
import { CITY_DATABASE } from '../data/cities';
import { parseProfileExport } from '../lib/profileSchema';
import { timezoneLabel } from '../lib/uiLabels';
import { useAppStore, SCHEMA_VERSION } from '../store/useAppStore';
import { Panel } from '../components/UI';
import type { BirthInput } from '../types/domain';

const TIMEZONE_OPTIONS = [
  ['Asia/Shanghai', '中国标准时间（东八区）'],
  ['Asia/Hong_Kong', '香港时间（东八区）'],
  ['Asia/Macau', '澳门时间（东八区）'],
  ['Asia/Taipei', '台北时间（东八区）'],
  ['Asia/Tokyo', '日本时间（东九区）'],
  ['Asia/Singapore', '新加坡时间（东八区）'],
  ['Europe/London', '伦敦时间'],
  ['Europe/Paris', '巴黎时间'],
  ['America/Los_Angeles', '北美太平洋时间'],
  ['America/New_York', '北美东部时间'],
  ['Australia/Sydney', '悉尼时间'],
  ['UTC', '零时区'],
] as const;

function profileLocationLabel(birthInput: BirthInput): string {
  const county = findChinaCounty(birthInput.administrativeCode);
  if (county) return formatChinaLocation(county);
  return [birthInput.country, birthInput.city].filter(Boolean).join(' · ');
}

export default function ProfilesPage() {
  const profiles = useAppStore((state) => state.profiles);
  const activeProfileId = useAppStore((state) => state.activeProfileId);
  const profile = useAppStore((state) => state.draftProfile);
  const updateDraft = useAppStore((state) => state.updateDraft);
  const saveDraft = useAppStore((state) => state.saveDraft);
  const newProfile = useAppStore((state) => state.newProfile);
  const selectProfile = useAppStore((state) => state.selectProfile);
  const deleteProfile = useAppStore((state) => state.deleteProfile);
  const clearProfiles = useAppStore((state) => state.clearProfiles);
  const importProfiles = useAppStore((state) => state.importProfiles);
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const updateBirthInput = (birthInput: BirthInput) => updateDraft((draft) => ({ ...draft, birthInput }));
  const locationMode = profile.birthInput.locationSource === 'china_county' ? 'china' : 'manual';
  const timezoneIsValid = DateTime.now().setZone(profile.birthInput.timezone).isValid;
  const timezoneKnown = TIMEZONE_OPTIONS.some(([zone]) => zone === profile.birthInput.timezone);

  const switchLocationMode = (mode: 'china' | 'manual') => {
    if (mode === 'china') {
      const county = findChinaCounty(profile.birthInput.administrativeCode) ?? findChinaCounty('110101');
      if (!county) return;
      updateBirthInput({
        ...profile.birthInput,
        country: '中国',
        city: county.county,
        province: county.province,
        prefecture: county.city,
        district: county.county,
        administrativeCode: county.code,
        locationSource: 'china_county',
        coordinatePrecision: county.coordinatePrecision,
        longitude: county.longitude,
        latitude: county.latitude,
        timezone: profile.birthInput.timezoneSource === 'manual' ? profile.birthInput.timezone : 'Asia/Shanghai',
        timezoneSource: profile.birthInput.timezoneSource === 'manual' ? 'manual' : 'default',
      });
      return;
    }
    updateBirthInput({ ...profile.birthInput, locationSource: 'manual', coordinatePrecision: 'manual' });
  };

  const selectPresetCity = (cityName: string) => {
    const city = CITY_DATABASE.find((item) => item.city === cityName);
    if (!city) return;
    updateBirthInput({
      ...profile.birthInput,
      ...city,
      province: undefined,
      prefecture: undefined,
      district: undefined,
      administrativeCode: undefined,
      locationSource: 'preset',
      coordinatePrecision: 'manual',
      timezoneSource: 'manual',
    });
  };

  const exportProfiles = () => {
    const payload = { schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), profiles };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `五行穿衣档案-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = parseProfileExport(JSON.parse(await file.text()));
      importProfiles(parsed);
      setMessage(`已导入 ${parsed.length} 个档案。`);
    } catch {
      setMessage('导入失败，请确认文件来自本应用且内容完整。');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return <>
    <section className="page-hero compact"><div><p className="eyebrow">出生资料只在你主动保存后留在本机</p><h1>个人档案</h1><p>选择省、市、区县后，经纬度会自动带出；时区默认东八区，也可以按实际出生地调整。</p></div><button type="button" className="hero-button" onClick={newProfile}>新建档案</button></section>

    <div className="profile-layout">
      <Panel title="已保存档案" eyebrow={`${profiles.length} 个本地档案`} className="profile-list-panel">
        <div className="profile-list">{profiles.length ? profiles.map((item) => <button type="button" key={item.id} className={activeProfileId === item.id ? 'active' : ''} onClick={() => selectProfile(item.id)}><strong>{item.name}</strong><span>{item.birthInput.localDateTime ? item.birthInput.localDateTime.replace('T', ' ') : '未填写时间'}</span><small>{profileLocationLabel(item.birthInput)} · {timezoneLabel(item.birthInput.timezone)}</small></button>) : <p className="muted">尚无已保存档案。</p>}</div>
        <div className="button-stack"><button type="button" className="secondary-button" onClick={exportProfiles} disabled={!profiles.length}>导出全部档案</button><button type="button" className="secondary-button" onClick={() => fileInput.current?.click()}>导入档案</button><input ref={fileInput} hidden type="file" accept="application/json" onChange={(event) => importFile(event.target.files?.[0])} />{profiles.length > 0 && <button type="button" className="danger-button" onClick={() => confirm('确定清除全部本地档案吗？删除后不可恢复。') && clearProfiles()}>清除全部本地数据</button>}</div>
      </Panel>

      <Panel title="编辑当前档案" eyebrow={activeProfileId ? '修改后请再次保存' : '当前内容尚未保存'}>
        <div className="form-grid two">
          <label><span>档案名称</span><input value={profile.name} onChange={(event) => updateDraft((draft) => ({ ...draft, name: event.target.value }))} /></label>
          <label><span>性别（暂不参与穿衣评分）</span><select value={profile.gender} onChange={(event) => updateDraft((draft) => ({ ...draft, gender: event.target.value as typeof draft.gender }))}><option value="unspecified">不指定</option><option value="male">男</option><option value="female">女</option></select></label>
          <label><span>出生日期与时间</span><input type="datetime-local" value={profile.birthInput.localDateTime} onChange={(event) => updateBirthInput({ ...profile.birthInput, localDateTime: event.target.value })} /></label>
          <label><span>出生地录入方式</span><select aria-label="出生地录入方式" value={locationMode} onChange={(event) => switchLocationMode(event.target.value as 'china' | 'manual')}><option value="china">中国省市区县选择</option><option value="manual">海外或手动设置</option></select></label>
        </div>

        {locationMode === 'china' ? <div className="location-section"><div className="form-grid three"><ChinaCountySelector value={profile.birthInput} onChange={updateBirthInput} /></div></div> : <div className="location-section">
          <div className="form-grid two">
            <label><span>常用境外城市</span><select value={CITY_DATABASE.some((item) => item.city === profile.birthInput.city) ? profile.birthInput.city : ''} onChange={(event) => selectPresetCity(event.target.value)}><option value="">手动设置</option>{CITY_DATABASE.filter((item) => item.country !== '中国' || ['香港', '澳门', '台北'].includes(item.city)).map((city) => <option key={`${city.country}-${city.city}`} value={city.city}>{city.country} · {city.city}</option>)}</select></label>
            <label><span>国家或地区</span><input value={profile.birthInput.country} onChange={(event) => updateBirthInput({ ...profile.birthInput, country: event.target.value, locationSource: 'manual' })} /></label>
            <label><span>出生城市</span><input value={profile.birthInput.city} onChange={(event) => updateBirthInput({ ...profile.birthInput, city: event.target.value, locationSource: 'manual' })} /></label>
          </div>
        </div>}

        <div className="form-grid two coordinate-grid">
          <label><span>经度（选择区县后自动带出）</span><input type="number" step="0.000001" min="-180" max="180" value={profile.birthInput.longitude} onChange={(event) => updateBirthInput({ ...profile.birthInput, longitude: Number(event.target.value), coordinatePrecision: 'manual' })} /></label>
          <label><span>纬度（选择区县后自动带出）</span><input type="number" step="0.000001" min="-90" max="90" value={profile.birthInput.latitude ?? ''} onChange={(event) => updateBirthInput({ ...profile.birthInput, latitude: event.target.value ? Number(event.target.value) : undefined, coordinatePrecision: 'manual' })} /></label>
          <label><span>时区</span><select aria-label="时区" className={timezoneIsValid ? '' : 'invalid-input'} value={profile.birthInput.timezone} onChange={(event) => updateBirthInput({ ...profile.birthInput, timezone: event.target.value, timezoneSource: event.target.value === 'Asia/Shanghai' ? 'default' : 'manual' })}>{!timezoneKnown && <option value={profile.birthInput.timezone}>其他时区（已导入）</option>}{TIMEZONE_OPTIONS.map(([zone, label]) => <option key={zone} value={zone}>{label}</option>)}</select>{!timezoneIsValid && <small className="field-error">当前时区无法识别，请重新选择。</small>}</label>
          <div className="timezone-summary"><small>当前采用</small><strong>{timezoneLabel(profile.birthInput.timezone)}</strong><button type="button" className="mini-button" onClick={() => updateBirthInput({ ...profile.birthInput, timezone: 'Asia/Shanghai', timezoneSource: 'default' })}>恢复东八区</button></div>
        </div>

        <div className="privacy-callout"><strong>位置说明</strong><p>区县和经纬度数据已经内置，选择时不会连接地图服务。个别新调整区县可能使用上级城市的近似中心点，页面会单独标注。</p></div>
        <div className="privacy-callout"><strong>保存说明</strong><p>填写内容只在当前页面中使用。点击“保存到本机”后，才会写入浏览器的本地存储。</p></div>
        {message && <p className="form-message">{message}</p>}
        <div className="form-actions"><button type="button" className="primary-button" disabled={!profile.name || !profile.birthInput.localDateTime || !timezoneIsValid} onClick={() => { saveDraft(); setMessage('档案已保存到当前浏览器。'); }}>保存到本机</button>{activeProfileId && <button type="button" className="danger-button" onClick={() => confirm(`确定删除“${profile.name}”吗？`) && deleteProfile(profile.id)}>删除当前档案</button>}</div>
      </Panel>
    </div>
  </>;
}
