import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Automatically unmount and cleanup DOM after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Polyfill window.matchMedia for useBreakpoint and useReducedMotion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Polyfill ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.ResizeObserver = MockResizeObserver as any;

// Polyfill IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.IntersectionObserver = MockIntersectionObserver as any;

// Polyfill scrollTo and scrollIntoView
window.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

// Polyfill HTMLCanvasElement.getContext for Three.js / WebGL checks
HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextId: string) => {
  if (contextId === 'webgl' || contextId === 'webgl2' || contextId === 'experimental-webgl') {
    return {
      getExtension: vi.fn(),
      getParameter: vi.fn().mockReturnValue(16),
      createShader: vi.fn(),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      getShaderParameter: vi.fn().mockReturnValue(true),
      createProgram: vi.fn(),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      getProgramParameter: vi.fn().mockReturnValue(true),
      useProgram: vi.fn(),
      createBuffer: vi.fn(),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      clear: vi.fn(),
      viewport: vi.fn(),
    };
  }
  return null;
}) as any;
