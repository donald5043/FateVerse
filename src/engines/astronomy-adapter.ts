export interface AstronomyInput {
  isoDateTimeUtc: string;
  latitude?: number;
  longitude?: number;
}

export interface EclipticPosition {
  body: 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';
  longitude: number;
  referenceFrame: 'geocentric-ecliptic-of-date';
}

export interface AstronomyResult {
  calculatedAtUtc: string;
  positions: EclipticPosition[];
  source: {
    engine: 'astronomy-engine';
    version: string;
  };
}

export interface AstronomyAdapter {
  calculate(input: AstronomyInput): Promise<AstronomyResult>;
}

export const astronomyAdapterStatus = {
  enabled: false,
  reason: 'Phase 1 僅使用日期計算太陽星座；尚未安裝 astronomy-engine 或啟用行星位置、宮位與相位。',
} as const;
