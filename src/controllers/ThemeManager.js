import { getTheme, setTheme as storageSetTheme } from '../utils/storage.js';

const VALID_THEMES = ['light', 'dark', 'eye'];

export class ThemeManager {
  constructor(rootElement) {
    this.root = rootElement || document.documentElement;
    this.currentTheme = 'light';
    this.onChange = () => {};
  }

  init() {
    this.currentTheme = this.normalize(getTheme());
    this.apply(this.currentTheme);
    return this;
  }

  normalize(theme) {
    return VALID_THEMES.includes(theme) ? theme : 'light';
  }

  getTheme() {
    return this.currentTheme;
  }

  setTheme(theme) {
    theme = this.normalize(theme);
    if (theme === this.currentTheme) return;
    this.currentTheme = theme;
    storageSetTheme(theme);
    this.apply(theme);
    this.onChange(theme);
  }

  apply(theme) {
    const target = document.querySelector('#app') || this.root;
    target.classList.remove('theme-light', 'theme-dark', 'theme-eye');
    target.classList.add(`theme-${theme}`);
  }

  getThemes() {
    return VALID_THEMES;
  }
}
