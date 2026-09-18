import { useMemo } from 'react';
import { mapConditionToScene, type SceneType } from '@design-system';

export type { SceneType } from '@design-system';
export type NormalizedWeatherSceneType = SceneType;

/**
 * Normalizes backend condition string and icon code into canonical 3D scene keys.
 * Synchronized through the single boundary in design-system/scenes.ts.
 */
export function useWeatherCondition(
  rawCondition: string = 'Clear',
  iconCode: string = '01d'
): SceneType {
  return useMemo(() => {
    return mapConditionToScene(rawCondition, iconCode);
  }, [rawCondition, iconCode]);
}

export default useWeatherCondition;
