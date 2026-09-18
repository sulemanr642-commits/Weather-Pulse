/**
 * Canonical Weather Scene Classification & Normalization Boundary
 *
 * Normalizes disparate external API strings (OpenWeatherMap, Open-Meteo, wttr.in)
 * into a single canonical set of 7 discrete 3D scene keys:
 * - 'clear-day'
 * - 'clear-night'
 * - 'cloudy'
 * - 'rain'
 * - 'snow'
 * - 'storm'
 * - 'fog'
 *
 * Architectural Rationale:
 * Normalizing at this single boundary point decouples visual 3D components from
 * upstream vendor vocabularies. The 3D scene components never need to know about
 * raw WMO codes, vendor descriptions ("light intensity shower rain"), or icon suffixes.
 */

export type SceneType =
  | 'clear-day'
  | 'clear-night'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'storm'
  | 'fog';

export interface SceneMeta {
  key: SceneType;
  displayName: string;
  isNight: boolean;
  baseAtmosphere: string;
}

/**
 * Normalizes raw condition strings and optional icon codes into a canonical SceneType.
 *
 * @param condition Raw weather condition string (e.g., "Clear", "Clouds", "Rain", "Thunderstorm")
 * @param iconCode Optional weather icon code (e.g., "01d", "01n", "10d") to detect nocturnal state
 * @returns Canonical SceneType
 */
export function mapConditionToScene(condition: string = 'Clear', iconCode: string = '01d'): SceneType {
  const cond = (condition || '').toLowerCase().trim();
  const isNight = iconCode ? iconCode.toLowerCase().endsWith('n') : false;

  // 1. Thunderstorm / Electric Storms
  if (cond.includes('thunder') || cond.includes('storm') || cond.includes('lightning') || cond.includes('squall')) {
    return 'storm';
  }

  // 2. Snow / Ice / Freezing
  if (cond.includes('snow') || cond.includes('blizzard') || cond.includes('sleet') || cond.includes('flurr') || cond.includes('ice')) {
    return 'snow';
  }

  // 3. Rain / Drizzle / Precipitation
  if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower')) {
    return 'rain';
  }

  // 4. Fog / Mist / Atmospheric Obscuration
  if (cond.includes('fog') || cond.includes('mist') || cond.includes('haze') || cond.includes('smoke') || cond.includes('dust')) {
    return 'fog';
  }

  // 5. Clouds / Overcast
  if (cond.includes('cloud') || cond.includes('overcast')) {
    return 'cloudy';
  }

  // 6. Nocturnal Clear
  if (isNight) {
    return 'clear-night';
  }

  // 7. Diurnal Clear
  return 'clear-day';
}

export const SCENE_METADATA: Record<SceneType, SceneMeta> = {
  'clear-day': {
    key: 'clear-day',
    displayName: 'Sunny Atmosphere',
    isNight: false,
    baseAtmosphere: 'warm-solar',
  },
  'clear-night': {
    key: 'clear-night',
    displayName: 'Nocturnal Starfield',
    isNight: true,
    baseAtmosphere: 'deep-sapphire',
  },
  'cloudy': {
    key: 'cloudy',
    displayName: 'Overcast Cloudscapes',
    isNight: false,
    baseAtmosphere: 'cool-silver',
  },
  'rain': {
    key: 'rain',
    displayName: 'Precipitation Atmosphere',
    isNight: false,
    baseAtmosphere: 'oceanic-slate',
  },
  'snow': {
    key: 'snow',
    displayName: 'Crystalline Snowdrift',
    isNight: false,
    baseAtmosphere: 'arctic-frost',
  },
  'storm': {
    key: 'storm',
    displayName: 'Electric Stormbloom',
    isNight: true,
    baseAtmosphere: 'violent-indigo',
  },
  'fog': {
    key: 'fog',
    displayName: 'Volumetric Vapor Veil',
    isNight: false,
    baseAtmosphere: 'dense-vapor',
  },
};
