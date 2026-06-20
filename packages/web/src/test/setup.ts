import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement window.matchMedia — stub it so hooks that read
// prefers-reduced-motion (e.g. useCountUp) don't throw in tests.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
