import countyData from './chinaCounties.json';

export type CoordinatePrecision = 'county' | 'county_name_match' | 'county_city_layer' | 'city' | 'province';

export interface ChinaCountyRecord {
  code: string;
  provinceCode: string;
  province: string;
  cityCode: string;
  city: string;
  county: string;
  longitude: number;
  latitude: number;
  coordinatePrecision: CoordinatePrecision;
}

export interface ChinaAdministrativeOption {
  code: string;
  name: string;
}

export const CHINA_COUNTIES = countyData as ChinaCountyRecord[];

const byCode = new Map(CHINA_COUNTIES.map((item) => [item.code, item]));

export const CHINA_PROVINCES: ChinaAdministrativeOption[] = Array.from(
  new Map(CHINA_COUNTIES.map((item) => [item.provinceCode, { code: item.provinceCode, name: item.province }])).values(),
);

export function getChinaCities(provinceCode: string): ChinaAdministrativeOption[] {
  return Array.from(
    new Map(
      CHINA_COUNTIES
        .filter((item) => item.provinceCode === provinceCode)
        .map((item) => [item.cityCode, { code: item.cityCode, name: item.city }]),
    ).values(),
  );
}

export function getChinaCounties(cityCode: string): ChinaCountyRecord[] {
  return CHINA_COUNTIES.filter((item) => item.cityCode === cityCode);
}

export function findChinaCounty(code?: string): ChinaCountyRecord | undefined {
  return code ? byCode.get(code) : undefined;
}

export function findChinaCountyByNames(province?: string, prefecture?: string, district?: string): ChinaCountyRecord | undefined {
  if (!district) return undefined;
  return CHINA_COUNTIES.find((item) => (
    item.county === district
    && (!province || item.province === province)
    && (!prefecture || item.city === prefecture)
  ));
}

export function coordinatePrecisionLabel(precision: CoordinatePrecision): string {
  switch (precision) {
    case 'county': return '区县中心坐标';
    case 'county_name_match': return '区县名称匹配坐标';
    case 'county_city_layer': return '县级市中心坐标';
    case 'city': return '地级市近似坐标';
    case 'province': return '省级近似坐标';
  }
}

export function formatChinaLocation(record: Pick<ChinaCountyRecord, 'province' | 'city' | 'county'>): string {
  if (record.province === record.city) return `${record.province} · ${record.county}`;
  return `${record.province} · ${record.city} · ${record.county}`;
}
