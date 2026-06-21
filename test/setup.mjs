// Test globals: localStorage shim + minimal document/window shim.
// Loaded before any test runs so DOM-dependent pure logic can execute in Node.

import { document as documentShim, window as windowShim } from './dom-shim.mjs';

class LocalStorage {
  constructor() { this._m = new Map(); }
  getItem(key) { return this._m.has(key) ? this._m.get(key) : null; }
  setItem(key, value) { this._m.set(String(key), String(value)); }
  removeItem(key) { this._m.delete(String(key)); }
  clear() { this._m.clear(); }
  key(i) { return [...this._m.keys()][i] ?? null; }
  get length() { return this._m.size; }
}

globalThis.localStorage = new LocalStorage();
globalThis.document = documentShim;
globalThis.window = windowShim;

export function resetLocalStorage() {
  globalThis.localStorage.clear();
}
