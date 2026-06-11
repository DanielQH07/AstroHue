import "@testing-library/jest-dom/vitest";

process.env.ASTROHUE_ROUND_SECRET =
  "test-secret-that-is-at-least-thirty-two-characters";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  value: ResizeObserverMock,
  configurable: true,
});
