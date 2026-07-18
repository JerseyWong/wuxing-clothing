export interface CityRecord {
  country: string;
  city: string;
  timezone: string;
  longitude: number;
  latitude: number;
}

export const CITY_DATABASE: CityRecord[] = [
  { country: '中国', city: '北京', timezone: 'Asia/Shanghai', longitude: 116.4074, latitude: 39.9042 },
  { country: '中国', city: '上海', timezone: 'Asia/Shanghai', longitude: 121.4737, latitude: 31.2304 },
  { country: '中国', city: '广州', timezone: 'Asia/Shanghai', longitude: 113.2644, latitude: 23.1291 },
  { country: '中国', city: '深圳', timezone: 'Asia/Shanghai', longitude: 114.0579, latitude: 22.5431 },
  { country: '中国', city: '杭州', timezone: 'Asia/Shanghai', longitude: 120.1551, latitude: 30.2741 },
  { country: '中国', city: '南京', timezone: 'Asia/Shanghai', longitude: 118.7969, latitude: 32.0603 },
  { country: '中国', city: '成都', timezone: 'Asia/Shanghai', longitude: 104.0665, latitude: 30.5723 },
  { country: '中国', city: '重庆', timezone: 'Asia/Shanghai', longitude: 106.5516, latitude: 29.5630 },
  { country: '中国', city: '武汉', timezone: 'Asia/Shanghai', longitude: 114.3054, latitude: 30.5931 },
  { country: '中国', city: '西安', timezone: 'Asia/Shanghai', longitude: 108.9398, latitude: 34.3416 },
  { country: '中国', city: '天津', timezone: 'Asia/Shanghai', longitude: 117.2000, latitude: 39.0842 },
  { country: '中国', city: '苏州', timezone: 'Asia/Shanghai', longitude: 120.5853, latitude: 31.2989 },
  { country: '中国', city: '青岛', timezone: 'Asia/Shanghai', longitude: 120.3826, latitude: 36.0671 },
  { country: '中国', city: '郑州', timezone: 'Asia/Shanghai', longitude: 113.6254, latitude: 34.7466 },
  { country: '中国', city: '长沙', timezone: 'Asia/Shanghai', longitude: 112.9388, latitude: 28.2282 },
  { country: '中国', city: '沈阳', timezone: 'Asia/Shanghai', longitude: 123.4315, latitude: 41.8057 },
  { country: '中国', city: '哈尔滨', timezone: 'Asia/Shanghai', longitude: 126.5349, latitude: 45.8038 },
  { country: '中国', city: '昆明', timezone: 'Asia/Shanghai', longitude: 102.8329, latitude: 24.8801 },
  { country: '中国', city: '厦门', timezone: 'Asia/Shanghai', longitude: 118.0894, latitude: 24.4798 },
  { country: '中国', city: '香港', timezone: 'Asia/Hong_Kong', longitude: 114.1694, latitude: 22.3193 },
  { country: '中国', city: '澳门', timezone: 'Asia/Macau', longitude: 113.5439, latitude: 22.1987 },
  { country: '中国', city: '台北', timezone: 'Asia/Taipei', longitude: 121.5654, latitude: 25.0330 },
  { country: '美国', city: '洛杉矶', timezone: 'America/Los_Angeles', longitude: -118.2437, latitude: 34.0522 },
  { country: '美国', city: '纽约', timezone: 'America/New_York', longitude: -74.0060, latitude: 40.7128 },
  { country: '美国', city: '旧金山', timezone: 'America/Los_Angeles', longitude: -122.4194, latitude: 37.7749 },
  { country: '英国', city: '伦敦', timezone: 'Europe/London', longitude: -0.1276, latitude: 51.5072 },
  { country: '法国', city: '巴黎', timezone: 'Europe/Paris', longitude: 2.3522, latitude: 48.8566 },
  { country: '日本', city: '东京', timezone: 'Asia/Tokyo', longitude: 139.6917, latitude: 35.6895 },
  { country: '新加坡', city: '新加坡', timezone: 'Asia/Singapore', longitude: 103.8198, latitude: 1.3521 },
  { country: '澳大利亚', city: '悉尼', timezone: 'Australia/Sydney', longitude: 151.2093, latitude: -33.8688 },
];
