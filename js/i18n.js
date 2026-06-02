/* ===========================================================================
   Compo · i18n module
   Carga JSON, recupera strings por clave punteada (a.b.c), aplica a todos los
   elementos con data-i18n en el DOM y notifica cambios. Sin dependencias.
   =========================================================================== */

(function() {
  'use strict';

  const STORAGE_KEY = 'compo_lang';
  const SUPPORTED = ['es', 'en'];
  const DEFAULT_LANG = 'es';

  const I18n = {
    current: DEFAULT_LANG,
    data: {},

    async init() {
      const stored = this.read();
      const browser = (navigator.language || '').toLowerCase().split('-')[0];
      this.current = stored
        || (SUPPORTED.includes(browser) ? browser : DEFAULT_LANG);
      await this.load(this.current);
      this.apply();
    },

    read() {
      try {
        const v = localStorage.getItem(STORAGE_KEY);
        return SUPPORTED.includes(v) ? v : null;
      } catch (e) {
        return null;
      }
    },

    write(lang) {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) { /* silencioso */ }
    },

    async load(lang) {
      if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
      try {
        const res = await fetch(`./i18n/${lang}.json`);
        if (!res.ok) throw new Error(`Failed to load i18n/${lang}.json`);
        this.data = await res.json();
        this.current = lang;
        document.documentElement.setAttribute('lang', lang);
      } catch (e) {
        console.error('Compo i18n:', e);
        this.data = {};
      }
    },

    async setLang(lang) {
      if (!SUPPORTED.includes(lang) || lang === this.current) return;
      await this.load(lang);
      this.write(lang);
      this.apply();
      this.notify();
    },

    cycle() {
      const idx = SUPPORTED.indexOf(this.current);
      const next = SUPPORTED[(idx + 1) % SUPPORTED.length];
      this.setLang(next);
    },

    /**
     * Resuelve una clave punteada en el JSON.
     * t('welcome.title') → "¿Qué quieres crear hoy?"
     * Sustituye placeholders {var} si se pasa un objeto params.
     */
    t(key, params) {
      const parts = String(key).split('.');
      let cur = this.data;
      for (const p of parts) {
        if (cur && typeof cur === 'object' && p in cur) {
          cur = cur[p];
        } else {
          return key; // fallback: la propia clave
        }
      }
      if (typeof cur !== 'string') return key;
      if (!params) return cur;
      return cur.replace(/\{(\w+)\}/g, (m, name) =>
        params[name] !== undefined ? String(params[name]) : m
      );
    },

    /**
     * Aplica las traducciones a todo elemento con data-i18n="clave".
     * Los atributos se pueden traducir con data-i18n-attr="atributo:clave".
     * Soporta varios atributos separados por coma.
     */
    apply(root) {
      const r = root || document;
      r.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const params = this.parseParams(el);
        const value = this.t(key, params);
        // textContent es la opción segura: nunca interpreta HTML.
        el.textContent = value;
      });
      r.querySelectorAll('[data-i18n-attr]').forEach(el => {
        const spec = el.getAttribute('data-i18n-attr');
        const params = this.parseParams(el);
        spec.split(',').forEach(pair => {
          const [attr, key] = pair.split(':').map(s => s.trim());
          if (attr && key) el.setAttribute(attr, this.t(key, params));
        });
      });
    },

    parseParams(el) {
      const raw = el.getAttribute('data-i18n-params');
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    },

    notify() {
      document.dispatchEvent(new CustomEvent('compo:lang-changed', {
        detail: { current: this.current }
      }));
    }
  };

  window.CompoI18n = I18n;
})();
