export interface CityCoordinate {
  city: string;
  longitude: number;
  latitude: number;
  timezone: string;
}

const CITIES: CityCoordinate[] = [
  { city: '臺北市', longitude: 121.5654, latitude: 25.033, timezone: 'Asia/Taipei' },
  { city: '新北市', longitude: 121.4628, latitude: 25.017, timezone: 'Asia/Taipei' },
  { city: '基隆市', longitude: 121.7392, latitude: 25.1276, timezone: 'Asia/Taipei' },
  { city: '桃園市', longitude: 121.301, latitude: 24.9937, timezone: 'Asia/Taipei' },
  { city: '新竹市', longitude: 120.9647, latitude: 24.8138, timezone: 'Asia/Taipei' },
  { city: '新竹縣', longitude: 121.0177, latitude: 24.8387, timezone: 'Asia/Taipei' },
  { city: '苗栗縣', longitude: 120.8214, latitude: 24.5602, timezone: 'Asia/Taipei' },
  { city: '臺中市', longitude: 120.6736, latitude: 24.1477, timezone: 'Asia/Taipei' },
  { city: '彰化縣', longitude: 120.5161, latitude: 24.0518, timezone: 'Asia/Taipei' },
  { city: '南投縣', longitude: 120.9719, latitude: 23.9609, timezone: 'Asia/Taipei' },
  { city: '雲林縣', longitude: 120.4313, latitude: 23.7092, timezone: 'Asia/Taipei' },
  { city: '嘉義市', longitude: 120.4491, latitude: 23.4801, timezone: 'Asia/Taipei' },
  { city: '嘉義縣', longitude: 120.574, latitude: 23.4589, timezone: 'Asia/Taipei' },
  { city: '臺南市', longitude: 120.227, latitude: 22.9999, timezone: 'Asia/Taipei' },
  { city: '高雄市', longitude: 120.3014, latitude: 22.6273, timezone: 'Asia/Taipei' },
  { city: '屏東縣', longitude: 120.488, latitude: 22.6829, timezone: 'Asia/Taipei' },
  { city: '宜蘭縣', longitude: 121.7195, latitude: 24.7021, timezone: 'Asia/Taipei' },
  { city: '花蓮縣', longitude: 121.6015, latitude: 23.9872, timezone: 'Asia/Taipei' },
  { city: '臺東縣', longitude: 121.1132, latitude: 22.7583, timezone: 'Asia/Taipei' },
  { city: '澎湖縣', longitude: 119.5793, latitude: 23.5712, timezone: 'Asia/Taipei' },
  { city: '金門縣', longitude: 118.3186, latitude: 24.4321, timezone: 'Asia/Taipei' },
  { city: '連江縣', longitude: 119.9397, latitude: 26.1608, timezone: 'Asia/Taipei' },
  { city: '香港', longitude: 114.1694, latitude: 22.3193, timezone: 'Asia/Hong_Kong' },
  { city: '澳門', longitude: 113.5439, latitude: 22.1987, timezone: 'Asia/Macau' },
  { city: '北京', longitude: 116.4074, latitude: 39.9042, timezone: 'Asia/Shanghai' },
  { city: '上海', longitude: 121.4737, latitude: 31.2304, timezone: 'Asia/Shanghai' },
  { city: '廣州', longitude: 113.2644, latitude: 23.1291, timezone: 'Asia/Shanghai' },
  { city: '深圳', longitude: 114.0579, latitude: 22.5431, timezone: 'Asia/Shanghai' },
  { city: '成都', longitude: 104.0665, latitude: 30.5723, timezone: 'Asia/Shanghai' },
  { city: '廈門', longitude: 118.0894, latitude: 24.4798, timezone: 'Asia/Shanghai' },
  { city: '東京', longitude: 139.6917, latitude: 35.6895, timezone: 'Asia/Tokyo' },
  { city: '大阪', longitude: 135.5023, latitude: 34.6937, timezone: 'Asia/Tokyo' },
  { city: '京都', longitude: 135.7681, latitude: 35.0116, timezone: 'Asia/Tokyo' },
  { city: '首爾', longitude: 126.978, latitude: 37.5665, timezone: 'Asia/Seoul' },
  { city: '新加坡', longitude: 103.8198, latitude: 1.3521, timezone: 'Asia/Singapore' },
  { city: '曼谷', longitude: 100.5018, latitude: 13.7563, timezone: 'Asia/Bangkok' },
  { city: '吉隆坡', longitude: 101.6869, latitude: 3.139, timezone: 'Asia/Kuala_Lumpur' },
  { city: '河內', longitude: 105.8342, latitude: 21.0278, timezone: 'Asia/Ho_Chi_Minh' },
  { city: '馬尼拉', longitude: 120.9842, latitude: 14.5995, timezone: 'Asia/Manila' },
  { city: '雅加達', longitude: 106.8456, latitude: -6.2088, timezone: 'Asia/Jakarta' },
  { city: '雪梨', longitude: 151.2093, latitude: -33.8688, timezone: 'Australia/Sydney' },
  { city: '墨爾本', longitude: 144.9631, latitude: -37.8136, timezone: 'Australia/Melbourne' },
  { city: '奧克蘭', longitude: 174.7645, latitude: -36.8509, timezone: 'Pacific/Auckland' },
  { city: '紐約', longitude: -74.006, latitude: 40.7128, timezone: 'America/New_York' },
  { city: '洛杉磯', longitude: -118.2437, latitude: 34.0522, timezone: 'America/Los_Angeles' },
  { city: '舊金山', longitude: -122.4194, latitude: 37.7749, timezone: 'America/Los_Angeles' },
  { city: '西雅圖', longitude: -122.3321, latitude: 47.6062, timezone: 'America/Los_Angeles' },
  { city: '溫哥華', longitude: -123.1207, latitude: 49.2827, timezone: 'America/Vancouver' },
  { city: '多倫多', longitude: -79.3832, latitude: 43.6532, timezone: 'America/Toronto' },
  { city: '倫敦', longitude: -0.1276, latitude: 51.5072, timezone: 'Europe/London' },
  { city: '巴黎', longitude: 2.3522, latitude: 48.8566, timezone: 'Europe/Paris' },
  { city: '柏林', longitude: 13.405, latitude: 52.52, timezone: 'Europe/Berlin' },
];

const ALIASES: Record<string, string> = {
  台北: '臺北市',
  台中: '臺中市',
  台南: '臺南市',
  台東: '臺東縣',
  首尔: '首爾',
  悉尼: '雪梨',
  Taipei: '臺北市',
  Tokyo: '東京',
  Seoul: '首爾',
  Singapore: '新加坡',
  'Hong Kong': '香港',
  'New York': '紐約',
  London: '倫敦',
};

function normalize(name: string): string {
  return name.trim().replace(/\s+/g, ' ').replaceAll('台', '臺');
}

export function lookupCityCoordinates(name: string): CityCoordinate | undefined {
  const trimmed = name.trim();
  const aliasKey = Object.keys(ALIASES).find((key) => key.toLowerCase() === trimmed.toLowerCase());
  const cleaned = normalize(aliasKey ? ALIASES[aliasKey] : trimmed);
  if (!cleaned) return undefined;
  return CITIES.find((item) => {
    const canonical = item.city;
    const short = canonical.replace(/[市縣]$/, '');
    return cleaned === canonical || cleaned === short || cleaned === `${short}市` || cleaned === `${short}縣`;
  });
}

export const CITY_SUGGESTIONS = CITIES.map((item) => item.city);
