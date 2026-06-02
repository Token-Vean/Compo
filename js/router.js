/* ===========================================================================
   Compo · Router
   Navegación mínima entre pantallas, sin historial externo y sin dependencias.
   =========================================================================== */

(function() {
  'use strict';

  const VALID_SCREENS = ['welcome', 'builder', 'audit', 'models', 'usage', 'license'];
  const DEFAULT_SCREEN = 'welcome';

  const Router = {
    current: DEFAULT_SCREEN,

    init() {
      this.go(DEFAULT_SCREEN, { silent: true });
      document.addEventListener('click', (e) => {
        const el = e.target.closest('[data-go-to]');
        if (!el) return;
        const target = el.getAttribute('data-go-to');
        if (VALID_SCREENS.includes(target)) {
          e.preventDefault();
          this.go(target);
        }
      });
    },

    go(screen, opts) {
      opts = opts || {};
      if (!VALID_SCREENS.includes(screen)) return;
      this.current = screen;
      document.querySelectorAll('.screen').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-screen') === screen);
      });
      const active = document.querySelector(`.screen[data-screen="${screen}"]`);
      if (active && !opts.silent) {
        const focusable = active.querySelector('h1, h2, [data-focus-on-enter]');
        if (focusable) {
          focusable.setAttribute('tabindex', '-1');
          focusable.focus({ preventScroll: false });
        }
      }
      document.dispatchEvent(new CustomEvent('compo:screen-changed', {
        detail: { current: screen }
      }));
    }
  };

  window.CompoRouter = Router;
})();
