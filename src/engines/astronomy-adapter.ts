import { Body, Ecliptic, EclipticGeoMoon, GeoVector, MakeTime, SiderealTime, e_tilt } from 'astronomy-engine';
import type { PlanetPosition } from '../types/fate';

const bodies = [
  { body: Body.Sun, name: '太陽' }, { body: Body.Moon, name: '月亮' },
  { body: Body.Mercury, name: '水星' }, { body: Body.Venus, name: '金星' },
  { body: Body.Mars, name: '火星' }, { body: Body.Jupiter, name: '木星' },
  { body: Body.Saturn, name: '土星' }, { body: Body.Uranus, name: '天王星' },
  { body: Body.Neptune, name: '海王星' }, { body: Body.Pluto, name: '冥王星' },
] as const;

const signNames = ['牡羊座', '金牛座', '雙子座', '巨蟹座', '獅子座', '處女座', '天秤座', '天蠍座', '射手座', '摩羯座', '水瓶座', '雙魚座'] as const;

function normalizeLongitude(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function zodiacPosition(longitude: number): { sign: string; degreeInSign: number } {
  const normalized = normalizeLongitude(longitude);
  return { sign: signNames[Math.floor(normalized / 30)], degreeInSign: normalized % 30 };
}

function eclipticPosition(body: Body, date: Date): { longitude: number; latitude: number } {
  if (body === Body.Moon) {
    const moon = EclipticGeoMoon(date);
    return { longitude: normalizeLongitude(moon.lon), latitude: moon.lat };
  }
  const position = Ecliptic(GeoVector(body, date, true));
  return { longitude: normalizeLongitude(position.elon), latitude: position.elat };
}

function isRetrograde(body: Body, date: Date, longitude: number): boolean {
  if (body === Body.Sun || body === Body.Moon) return false;
  const later = new Date(date.getTime() + 12 * 60 * 60 * 1000);
  const nextLongitude = eclipticPosition(body, later).longitude;
  const signedMovement = ((nextLongitude - longitude + 540) % 360) - 180;
  return signedMovement < 0;
}

export function calculatePlanetPositions(date: Date): PlanetPosition[] {
  return bodies.map(({ body, name }) => {
    const { longitude, latitude } = eclipticPosition(body, date);
    const zodiac = zodiacPosition(longitude);
    return {
      name,
      longitude: Number(longitude.toFixed(4)),
      latitude: Number(latitude.toFixed(4)),
      sign: zodiac.sign,
      degreeInSign: Number(zodiac.degreeInSign.toFixed(2)),
      retrograde: isRetrograde(body, date, longitude),
    };
  });
}

export function calculateAscendant(date: Date, latitude: number, longitude: number): number {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error('緯度必須介於 -90 與 90 度。');
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error('經度必須介於 -180 與 180 度。');
  const siderealRadians = normalizeLongitude(SiderealTime(date) * 15 + longitude) * Math.PI / 180;
  const obliquityRadians = e_tilt(MakeTime(date)).tobl * Math.PI / 180;
  const latitudeRadians = latitude * Math.PI / 180;
  const longitudeRadians = Math.atan2(
    -Math.cos(siderealRadians),
    Math.sin(obliquityRadians) * Math.tan(latitudeRadians) + Math.cos(obliquityRadians) * Math.sin(siderealRadians),
  );
  return normalizeLongitude(longitudeRadians * 180 / Math.PI);
}

export const astronomyAdapterStatus = {
  enabled: true,
  engine: 'astronomy-engine',
  version: '2.1.19',
  referenceFrame: 'geocentric true ecliptic of date',
} as const;
