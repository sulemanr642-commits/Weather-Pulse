import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';
import { useUIStore } from '@store';

/**
 * Combines system prefers-reduced-motion with user UI store setting.
 */
export function useReducedMotion(): boolean {
  const systemReduced = useFramerReducedMotion();
  const storeReduced = useUIStore((s) => s.reducedMotion);

  return Boolean(systemReduced || storeReduced);
}

export default useReducedMotion;
