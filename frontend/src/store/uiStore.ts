/**
 * Client-Only UI State Store (Zustand)
 *
 * Scoped strictly to genuine client-only state:
 * - Selected city
 * - Ephemeral in-memory admin JWT token & username
 * - Administrative modal visibility
 * - Active color theme
 * - Current weather condition (drives the dynamic atmospheric 3D background in Phase 11)
 * - User animation and reduced-motion preferences
 *
 * Tradeoff vs React Context:
 * - Selector subscriptions: components subscribing to `useUIStore(s => s.selectedCity)`
 *   will NOT re-render when `currentWeatherCondition` or `adminToken` changes.
 * - Zero provider nesting in component tree.
 * - Store can be accessed or inspected outside of React components if needed.
 */
import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light' | 'system';
export type AnimationIntensity = 'full' | 'subtle' | 'off';

export interface UIState {
  selectedCity: string;
  adminToken: string;
  adminUsername: string;
  isAdminModalOpen: boolean;
  activeTheme: ThemeMode;
  currentWeatherCondition: string;
  reducedMotion: boolean;
  animationIntensity: AnimationIntensity;

  // Actions
  setSelectedCity: (city: string) => void;
  setAdminAuth: (token: string, username: string) => void;
  clearAdminAuth: () => void;
  setIsAdminModalOpen: (isOpen: boolean) => void;
  setActiveTheme: (theme: ThemeMode) => void;
  setCurrentWeatherCondition: (condition: string) => void;
  setReducedMotion: (reduced: boolean) => void;
  setAnimationIntensity: (intensity: AnimationIntensity) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedCity: 'Tokyo',
  adminToken: '',
  adminUsername: '',
  isAdminModalOpen: false,
  activeTheme: 'dark',
  currentWeatherCondition: 'Clear',
  reducedMotion: false,
  animationIntensity: 'full',

  setSelectedCity: (city: string) => set({ selectedCity: city }),
  setAdminAuth: (token: string, username: string) =>
    set({ adminToken: token, adminUsername: username }),
  clearAdminAuth: () => set({ adminToken: '', adminUsername: '' }),
  setIsAdminModalOpen: (isOpen: boolean) => set({ isAdminModalOpen: isOpen }),
  setActiveTheme: (theme: ThemeMode) => set({ activeTheme: theme }),
  setCurrentWeatherCondition: (condition: string) =>
    set({ currentWeatherCondition: condition }),
  setReducedMotion: (reduced: boolean) => set({ reducedMotion: reduced }),
  setAnimationIntensity: (intensity: AnimationIntensity) =>
    set({ animationIntensity: intensity }),
}));

export default useUIStore;
