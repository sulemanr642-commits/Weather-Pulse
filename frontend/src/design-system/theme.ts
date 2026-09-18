import type { SceneType } from './scenes';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface SceneColorPalette {
  skyTop: string;
  skyBottom: string;
  fogColor: string;
  primaryLight: string;
  secondaryLight: string;
  particleColor: string;
  cloudTint: string;
  cssGradient: string;
}

export const SCENE_THEMES: Record<SceneType, Record<'dark' | 'light', SceneColorPalette>> = {
  'clear-day': {
    dark: {
      skyTop: '#0284c7',
      skyBottom: '#0f172a',
      fogColor: '#0c4a6e',
      primaryLight: '#fbbf24',
      secondaryLight: '#38bdf8',
      particleColor: '#fef08a',
      cloudTint: '#e0f2fe',
      cssGradient: 'radial-gradient(circle at 50% -10%, #0284c7 0%, #1d4ed8 35%, #312e81 75%, #0f172a 100%)',
    },
    light: {
      skyTop: '#38bdf8',
      skyBottom: '#93c5fd',
      fogColor: '#bae6fd',
      primaryLight: '#f59e0b',
      secondaryLight: '#60a5fa',
      particleColor: '#fde047',
      cloudTint: '#ffffff',
      cssGradient: 'radial-gradient(circle at 50% -10%, #7dd3fc 0%, #38bdf8 40%, #60a5fa 75%, #93c5fd 100%)',
    },
  },
  'clear-night': {
    dark: {
      skyTop: '#0f172a',
      skyBottom: '#020617',
      fogColor: '#030712',
      primaryLight: '#e2e8f0',
      secondaryLight: '#38bdf8',
      particleColor: '#f8fafc',
      cloudTint: '#1e293b',
      cssGradient: 'radial-gradient(circle at 50% -10%, #1e1b4b 0%, #0f172a 45%, #020617 100%)',
    },
    light: {
      skyTop: '#1e293b',
      skyBottom: '#0f172a',
      fogColor: '#0f172a',
      primaryLight: '#ffffff',
      secondaryLight: '#60a5fa',
      particleColor: '#ffffff',
      cloudTint: '#334155',
      cssGradient: 'radial-gradient(circle at 50% -10%, #312e81 0%, #1e293b 45%, #0f172a 100%)',
    },
  },
  'cloudy': {
    dark: {
      skyTop: '#334155',
      skyBottom: '#0f172a',
      fogColor: '#1e293b',
      primaryLight: '#94a3b8',
      secondaryLight: '#475569',
      particleColor: '#cbd5e1',
      cloudTint: '#64748b',
      cssGradient: 'radial-gradient(circle at 50% -10%, #60a5fa 0%, #4f46e5 35%, #334155 75%, #0f172a 100%)',
    },
    light: {
      skyTop: '#94a3b8',
      skyBottom: '#cbd5e1',
      fogColor: '#e2e8f0',
      primaryLight: '#f1f5f9',
      secondaryLight: '#cbd5e1',
      particleColor: '#ffffff',
      cloudTint: '#f8fafc',
      cssGradient: 'radial-gradient(circle at 50% -10%, #93c5fd 0%, #cbd5e1 45%, #e2e8f0 100%)',
    },
  },
  'rain': {
    dark: {
      skyTop: '#0369a1',
      skyBottom: '#082f49',
      fogColor: '#0c4a6e',
      primaryLight: '#38bdf8',
      secondaryLight: '#0284c7',
      particleColor: '#7dd3fc',
      cloudTint: '#1e293b',
      cssGradient: 'radial-gradient(circle at 50% -10%, #0ea5e9 0%, #0284c7 35%, #0f375a 70%, #090d16 100%)',
    },
    light: {
      skyTop: '#38bdf8',
      skyBottom: '#0284c7',
      fogColor: '#0ea5e9',
      primaryLight: '#bae6fd',
      secondaryLight: '#7dd3fc',
      particleColor: '#e0f2fe',
      cloudTint: '#475569',
      cssGradient: 'radial-gradient(circle at 50% -10%, #38bdf8 0%, #0284c7 40%, #0369a1 75%, #0c4a6e 100%)',
    },
  },
  'snow': {
    dark: {
      skyTop: '#1e3a8a',
      skyBottom: '#0b1120',
      fogColor: '#172554',
      primaryLight: '#e0f2fe',
      secondaryLight: '#7dd3fc',
      particleColor: '#ffffff',
      cloudTint: '#1e293b',
      cssGradient: 'radial-gradient(circle at 50% -10%, #7dd3fc 0%, #2563eb 35%, #1e293b 75%, #0b1120 100%)',
    },
    light: {
      skyTop: '#7dd3fc',
      skyBottom: '#bfdbfe',
      fogColor: '#e0f2fe',
      primaryLight: '#ffffff',
      secondaryLight: '#bae6fd',
      particleColor: '#ffffff',
      cloudTint: '#f1f5f9',
      cssGradient: 'radial-gradient(circle at 50% -10%, #bae6fd 0%, #93c5fd 40%, #60a5fa 75%, #bfdbfe 100%)',
    },
  },
  'storm': {
    dark: {
      skyTop: '#581c87',
      skyBottom: '#090817',
      fogColor: '#3b0764',
      primaryLight: '#c084fc',
      secondaryLight: '#9333ea',
      particleColor: '#e9d5ff',
      cloudTint: '#1e1b4b',
      cssGradient: 'radial-gradient(circle at 50% -10%, #9333ea 0%, #581c87 40%, #1e1b4b 80%, #090817 100%)',
    },
    light: {
      skyTop: '#7e22ce',
      skyBottom: '#3b0764',
      fogColor: '#581c87',
      primaryLight: '#f3e8ff',
      secondaryLight: '#c084fc',
      particleColor: '#ffffff',
      cloudTint: '#312e81',
      cssGradient: 'radial-gradient(circle at 50% -10%, #a855f7 0%, #7e22ce 40%, #581c87 80%, #3b0764 100%)',
    },
  },
  'fog': {
    dark: {
      skyTop: '#1e293b',
      skyBottom: '#020617',
      fogColor: '#0f172a',
      primaryLight: '#94a3b8',
      secondaryLight: '#475569',
      particleColor: '#cbd5e1',
      cloudTint: '#334155',
      cssGradient: 'radial-gradient(circle at 50% -10%, #475569 0%, #334155 40%, #1e293b 75%, #0f172a 100%)',
    },
    light: {
      skyTop: '#94a3b8',
      skyBottom: '#e2e8f0',
      fogColor: '#cbd5e1',
      primaryLight: '#f8fafc',
      secondaryLight: '#e2e8f0',
      particleColor: '#ffffff',
      cloudTint: '#e2e8f0',
      cssGradient: 'radial-gradient(circle at 50% -10%, #cbd5e1 0%, #94a3b8 40%, #64748b 75%, #475569 100%)',
    },
  },
};

export function getSceneTheme(scene: SceneType, mode: ThemeMode = 'dark'): SceneColorPalette {
  const resolvedMode: 'dark' | 'light' = mode === 'light' ? 'light' : 'dark';
  return SCENE_THEMES[scene]?.[resolvedMode] || SCENE_THEMES['clear-day'][resolvedMode];
}
