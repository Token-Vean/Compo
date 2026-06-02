/* ===========================================================================
   Compo · Theme module
   Gestión del tema (claro / oscuro / automático) con persistencia.
   El tema se persiste siempre, separado de los datos del formulario.
   =========================================================================== */

(function() {
  'use strict';

  const STORAGE_KEY = 'compo_theme';
  const VALID_THEMES = ['light', 'dark', 'auto'];

  const Theme = {
    current: 'auto',
    mediaQuery: null,

    init() {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const stored = this.read();
      this.current = stored || 'auto';
      this.apply();
      // Si el usuario tiene "auto", reaccionar a cambios del sistema.
      this.mediaQuery.addEventListener('change', () => {
        if (this.current === 'auto') this.apply();
      });
    },

    read() {
      try {
        const v = localStorage.getItem(STORAGE_KEY);
        return VALID_THEMES.includes(v) ? v : null;
      } catch (e) {
        // localStorage podría estar deshabilitado.
        return null;
      }
    },

    write(theme) {
      try {
        if (theme === 'auto') {
          localStorage.removeItem(STORAGE_KEY);
        } else {
          localStorage.setItem(STORAGE_KEY, theme);
        }
      } catch (e) {
        /* silencioso */
      }
    },

    set(theme) {
      if (!VALID_THEMES.includes(theme)) return;
      this.current = theme;
      this.write(theme);
      this.apply();
      this.notify();
    },

    cycle() {
      // light → dark → auto → light
      const next = {
        'light': 'dark',
        'dark': 'auto',
        'auto': 'light'
      }[this.current] || 'light';
      this.set(next);
    },

    apply() {
      const effective = this.effectiveTheme();
      document.documentElement.setAttribute('data-theme', effective);
    },

    effectiveTheme() {
      if (this.current === 'auto') {
        return this.mediaQuery.matches ? 'dark' : 'light';
      }
      return this.current;
    },

    notify() {
      document.dispatchEvent(new CustomEvent('compo:theme-changed', {
        detail: { current: this.current, effective: this.effectiveTheme() }
      }));
    }
  };

  window.CompoTheme = Theme;
})();
