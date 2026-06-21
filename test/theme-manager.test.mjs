import { ThemeManager } from '../src/controllers/ThemeManager.js';
import { getTheme } from '../src/utils/storage.js';

function makeRoot() {
  // Use the DOM shim's element so classList works realistically.
  return document.createElement('div');
}

describe('ThemeManager — normalize', () => {
  const tm = new ThemeManager(makeRoot());

  it('accepts valid themes unchanged', () => {
    expect(tm.normalize('light')).toBe('light');
    expect(tm.normalize('dark')).toBe('dark');
    expect(tm.normalize('eye')).toBe('eye');
  });

  it('falls back to light for invalid theme', () => {
    expect(tm.normalize('solarized')).toBe('light');
    expect(tm.normalize('DARK')).toBe('light'); // case-sensitive
    expect(tm.normalize(' dark ')).toBe('light'); // no trimming
  });

  it('falls back to light for empty / null / undefined', () => {
    expect(tm.normalize('')).toBe('light');
    expect(tm.normalize(null)).toBe('light');
    expect(tm.normalize(undefined)).toBe('light');
  });
});

describe('ThemeManager — getThemes', () => {
  it('returns the supported theme list', () => {
    const tm = new ThemeManager(makeRoot());
    expect(tm.getThemes()).toEqual(['light', 'dark', 'eye']);
  });
});

describe('ThemeManager — getTheme / setTheme state flow', () => {
  beforeEach(() => localStorage.clear());

  it('init defaults to light when no stored theme', () => {
    const tm = new ThemeManager(makeRoot());
    tm.init();
    expect(tm.getTheme()).toBe('light');
  });

  it('init reads stored theme', () => {
    localStorage.setItem('markdown_editor_theme', 'dark');
    const tm = new ThemeManager(makeRoot());
    tm.init();
    expect(tm.getTheme()).toBe('dark');
  });

  it('init normalizes a corrupt stored theme', () => {
    localStorage.setItem('markdown_editor_theme', 'garbage');
    const tm = new ThemeManager(makeRoot());
    tm.init();
    expect(tm.getTheme()).toBe('light');
  });

  it('setTheme updates current theme and persists', () => {
    const tm = new ThemeManager(makeRoot());
    tm.init();
    tm.setTheme('dark');
    expect(tm.getTheme()).toBe('dark');
    expect(getTheme()).toBe('dark');
  });

  it('setTheme is a no-op when setting the same theme', () => {
    const tm = new ThemeManager(makeRoot());
    tm.init();
    let calls = 0;
    tm.onChange = () => { calls += 1; };
    tm.setTheme('light'); // already light
    expect(calls).toBe(0);
    expect(tm.getTheme()).toBe('light');
  });

  it('setTheme fires onChange with the new theme', () => {
    const tm = new ThemeManager(makeRoot());
    tm.init();
    const changes = [];
    tm.onChange = (theme) => changes.push(theme);
    tm.setTheme('dark');
    tm.setTheme('eye');
    expect(changes).toEqual(['dark', 'eye']);
  });

  it('setTheme normalizes invalid input before applying', () => {
    const tm = new ThemeManager(makeRoot());
    tm.init();
    tm.setTheme('dark');
    tm.setTheme('not-a-theme'); // normalizes to light
    expect(tm.getTheme()).toBe('light');
    expect(getTheme()).toBe('light');
  });

  it('apply toggles theme-* classes on the root element', () => {
    const root = makeRoot();
    const tm = new ThemeManager(root);
    tm.init();
    tm.setTheme('dark');
    expect(root.classList.contains('theme-dark')).toBe(true);
    expect(root.classList.contains('theme-light')).toBe(false);
    tm.setTheme('eye');
    expect(root.classList.contains('theme-eye')).toBe(true);
    expect(root.classList.contains('theme-dark')).toBe(false);
  });
});
