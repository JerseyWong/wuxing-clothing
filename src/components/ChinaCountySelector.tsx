import { useMemo } from 'react';
import {
  CHINA_PROVINCES,
  coordinatePrecisionLabel,
  findChinaCounty,
  getChinaCities,
  getChinaCounties,
  type ChinaCountyRecord,
} from '../data/chinaAdministrative';
import type { BirthInput } from '../types/domain';

interface ChinaCountySelectorProps {
  value: BirthInput;
  onChange: (birthInput: BirthInput) => void;
}

function applyCounty(value: BirthInput, county: ChinaCountyRecord): BirthInput {
  return {
    ...value,
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
    timezone: value.timezoneSource === 'manual' ? value.timezone : 'Asia/Shanghai',
    timezoneSource: value.timezoneSource === 'manual' ? 'manual' : 'default',
  };
}

export default function ChinaCountySelector({ value, onChange }: ChinaCountySelectorProps) {
  const selected = findChinaCounty(value.administrativeCode);
  const provinceCode = selected?.provinceCode ?? '';
  const cityCode = selected?.cityCode ?? '';
  const cities = useMemo(() => getChinaCities(provinceCode), [provinceCode]);
  const counties = useMemo(() => getChinaCounties(cityCode), [cityCode]);

  const selectProvince = (nextProvinceCode: string) => {
    const firstCity = getChinaCities(nextProvinceCode)[0];
    const firstCounty = firstCity ? getChinaCounties(firstCity.code)[0] : undefined;
    if (firstCounty) onChange(applyCounty(value, firstCounty));
  };

  const selectCity = (nextCityCode: string) => {
    const firstCounty = getChinaCounties(nextCityCode)[0];
    if (firstCounty) onChange(applyCounty(value, firstCounty));
  };

  const selectCounty = (code: string) => {
    const county = findChinaCounty(code);
    if (county) onChange(applyCounty(value, county));
  };

  return <>
    <label><span>省 / 自治区 / 直辖市</span><select aria-label="省 / 自治区 / 直辖市" value={provinceCode} onChange={(event) => selectProvince(event.target.value)}><option value="">请选择省级地区</option>{CHINA_PROVINCES.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
    <label><span>地级市 / 州 / 盟</span><select aria-label="地级市 / 州 / 盟" value={cityCode} disabled={!provinceCode} onChange={(event) => selectCity(event.target.value)}><option value="">请选择地级地区</option>{cities.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
    <label><span>区 / 县 / 县级市</span><select aria-label="区 / 县 / 县级市" value={selected?.code ?? ''} disabled={!cityCode} onChange={(event) => selectCounty(event.target.value)}><option value="">请选择县级地区</option>{counties.map((item) => <option key={item.code} value={item.code}>{item.county}</option>)}</select></label>
    <div className="location-auto-summary">
      <strong>{selected ? `${selected.province}${selected.city === selected.province ? '' : ` · ${selected.city}`} · ${selected.county}` : '请选择出生地区'}</strong>
      {selected && <span>行政区划代码 {selected.code} · {coordinatePrecisionLabel(selected.coordinatePrecision)} · 通用经纬度</span>}
    </div>
  </>;
}
