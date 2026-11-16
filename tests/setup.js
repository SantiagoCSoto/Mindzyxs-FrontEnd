import { vi } from 'vitest';

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(String(key)) ? this.store.get(String(key)) : null;
  }
  setItem(key, value) {
    this.store.set(String(key), String(value));
  }
  removeItem(key) {
    this.store.delete(String(key));
  }
  clear() {
    this.store.clear();
  }
  get length() {
    return this.store.size;
  }
  key(index) {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

// Ensure robust standard storage across Node 22+ and jsdom
const ls = new MemoryStorage();
const ss = new MemoryStorage();

Object.defineProperty(globalThis, 'localStorage', { value: ls, writable: true, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: ss, writable: true, configurable: true });
Object.defineProperty(window, 'localStorage', { value: ls, writable: true, configurable: true });
Object.defineProperty(window, 'sessionStorage', { value: ss, writable: true, configurable: true });

// Mock window.location with dynamic URL parsing
let _href = 'http://localhost/';
let _pathname = '/';
let _search = '';
let _hash = '';

function updateLocation(newUrl) {
  try {
    const parsed = new URL(newUrl, 'http://localhost');
    _href = newUrl;
    _pathname = parsed.pathname;
    _search = parsed.search;
    _hash = parsed.hash;
  } catch {
    _href = newUrl;
  }
}

const locationMock = {
  get href() { return _href; },
  set href(val) { updateLocation(val); },
  get pathname() { return _pathname; },
  set pathname(val) { _pathname = val; },
  get search() { return _search; },
  set search(val) { _search = val; },
  get hash() { return _hash; },
  set hash(val) { _hash = val; },
  assign: vi.fn((url) => updateLocation(url)),
  replace: vi.fn((url) => updateLocation(url)),
  reload: vi.fn(),
};

delete window.location;
window.location = locationMock;

window.alert = vi.fn();
window.confirm = vi.fn(() => true);
window.prompt = vi.fn();

// In jsdom document.readyState is 'loading' by default, set to 'complete' so controllers initialize immediately
Object.defineProperty(document, 'readyState', { value: 'complete', writable: true, configurable: true });
