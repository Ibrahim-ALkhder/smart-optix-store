// Mock localStorage for vitest/jsdom environment
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// Mock AudioContext
class MockAudioContext {
  constructor() {
    this.destination = {};
    this.currentTime = 0;
  }
  createOscillator() {
    return {
      connect: () => {},
      frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      start: () => {},
      stop: () => {},
    };
  }
  createGain() {
    return {
      connect: () => {},
      gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
    };
  }
}

Object.defineProperty(window, 'AudioContext', { value: MockAudioContext, writable: true });
Object.defineProperty(window, 'webkitAudioContext', { value: MockAudioContext, writable: true });
