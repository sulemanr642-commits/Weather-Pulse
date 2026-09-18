import { describe, it, expect } from 'vitest';
import { mapConditionToScene, SCENE_METADATA } from '@design-system';

describe('Condition Mapping Utility (mapConditionToScene)', () => {
  describe('Storm Classification', () => {
    it('maps thunderstorm variations to "storm"', () => {
      expect(mapConditionToScene('Thunderstorm', '11d')).toBe('storm');
      expect(mapConditionToScene('thunderstorm with heavy rain', '11n')).toBe('storm');
      expect(mapConditionToScene('Severe Storm', '11d')).toBe('storm');
      expect(mapConditionToScene('lightning storm', '11d')).toBe('storm');
      expect(mapConditionToScene('squall', '11d')).toBe('storm');
    });
  });

  describe('Snow Classification', () => {
    it('maps snow, blizzard, sleet, and ice variations to "snow"', () => {
      expect(mapConditionToScene('Snow', '13d')).toBe('snow');
      expect(mapConditionToScene('Light snow flurries', '13n')).toBe('snow');
      expect(mapConditionToScene('Blizzard', '13d')).toBe('snow');
      expect(mapConditionToScene('Sleet', '13d')).toBe('snow');
      expect(mapConditionToScene('Freezing rain with ice pellets', '13d')).toBe('snow');
    });
  });

  describe('Rain Classification', () => {
    it('maps rain, drizzle, and shower variations to "rain"', () => {
      expect(mapConditionToScene('Rain', '10d')).toBe('rain');
      expect(mapConditionToScene('Light Drizzle', '09d')).toBe('rain');
      expect(mapConditionToScene('Heavy intensity shower rain', '09n')).toBe('rain');
      expect(mapConditionToScene('Moderate rain', '10d')).toBe('rain');
    });
  });

  describe('Fog & Mist Classification', () => {
    it('maps fog, mist, haze, smoke, and dust to "fog"', () => {
      expect(mapConditionToScene('Fog', '50d')).toBe('fog');
      expect(mapConditionToScene('Mist', '50d')).toBe('fog');
      expect(mapConditionToScene('Haze', '50n')).toBe('fog');
      expect(mapConditionToScene('Smoke', '50d')).toBe('fog');
      expect(mapConditionToScene('Dust', '50d')).toBe('fog');
    });
  });

  describe('Cloudy Classification', () => {
    it('maps clouds and overcast conditions to "cloudy"', () => {
      expect(mapConditionToScene('Clouds', '04d')).toBe('cloudy');
      expect(mapConditionToScene('few clouds', '02d')).toBe('cloudy');
      expect(mapConditionToScene('scattered clouds', '03d')).toBe('cloudy');
      expect(mapConditionToScene('broken clouds', '04d')).toBe('cloudy');
      expect(mapConditionToScene('overcast clouds', '04n')).toBe('cloudy');
    });
  });

  describe('Clear Day vs Clear Night Classification', () => {
    it('maps daytime clear conditions to "clear-day"', () => {
      expect(mapConditionToScene('Clear', '01d')).toBe('clear-day');
      expect(mapConditionToScene('Sunny', '01d')).toBe('clear-day');
      expect(mapConditionToScene('clear sky', '01d')).toBe('clear-day');
    });

    it('maps nocturnal clear conditions to "clear-night"', () => {
      expect(mapConditionToScene('Clear', '01n')).toBe('clear-night');
      expect(mapConditionToScene('clear sky', '01n')).toBe('clear-night');
    });
  });

  describe('Fallback Handling for Unknown Conditions', () => {
    it('falls back sensibly to "clear-day" for unrecognized or empty conditions', () => {
      expect(mapConditionToScene('SolarFlare', '01d')).toBe('clear-day');
      expect(mapConditionToScene('ExtraterrestrialPhenomenon', '01d')).toBe('clear-day');
      expect(mapConditionToScene('', '01d')).toBe('clear-day');
      expect(mapConditionToScene(undefined as any, '01d')).toBe('clear-day');
    });

    it('falls back sensibly to "clear-night" for unrecognized condition with night icon', () => {
      expect(mapConditionToScene('MysteriousAurora', '01n')).toBe('clear-night');
    });
  });

  describe('Scene Metadata Integrity', () => {
    it('provides valid metadata for all 7 canonical scenes', () => {
      const canonicalKeys = ['clear-day', 'clear-night', 'cloudy', 'rain', 'snow', 'storm', 'fog'] as const;
      canonicalKeys.forEach((key) => {
        const meta = SCENE_METADATA[key];
        expect(meta).toBeDefined();
        expect(meta.key).toBe(key);
        expect(meta.displayName).toBeTruthy();
        expect(typeof meta.isNight).toBe('boolean');
        expect(meta.baseAtmosphere).toBeTruthy();
      });
    });
  });
});
