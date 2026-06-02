/* ===========================================================================
   Compo · Ollama client
   Comunicación con la API local de Ollama. No realiza ninguna llamada de red
   más allá de http://localhost:11434. La CSP debe restringir connect-src a
   ese origen para que esta promesa sea verificable por el usuario.
   =========================================================================== */

(function() {
  'use strict';

  const ENDPOINT = 'http://localhost:11434';
  const DETECT_TIMEOUT_MS = 2500;
  const GENERATE_TIMEOUT_MS = 180000;

  // Allowlist de modelos recomendados que la UI ofrece como atajo.
  // Esta lista es la única fuente de descarga desde Compo: por curaduría
  // (modelos verificados que rinden bien con los prompts de Compo) y por
  // simplicidad de UX. Los modelos que el usuario ya tenga descargados
  // manualmente (vía CLI de Ollama) seguirán apareciendo en la lista de
  // descargados y serán seleccionables como activos.
  //
  // Para añadir un modelo nuevo a la allowlist, edita esta tabla. En una versión posterior
  // está previsto mover esto a un archivo models.json externo editable
  // por el administrador del despliegue sin tocar el código.
  const RECOMMENDED_MODELS = [
    {
      key: 'light',
      id: 'phi3.5:3.8b',
      sizeGB: 2.2,
      ramMinGB: 8,
      i18nKey: 'models.recommended.options.light'
    },
    {
      key: 'balanced',
      id: 'gemma3n:e2b',
      sizeGB: 5.6,
      ramMinGB: 12,
      i18nKey: 'models.recommended.options.balanced'
    },
    {
      key: 'powerful',
      id: 'gemma3n:e4b',
      sizeGB: 7.5,
      ramMinGB: 16,
      i18nKey: 'models.recommended.options.powerful'
    },
    {
      key: 'alternative',
      id: 'qwen3:8b',
      sizeGB: 5.2,
      ramMinGB: 16,
      i18nKey: 'models.recommended.options.alternative'
    }
  ];

  // Validación defensiva del nombre de modelo. Solo aceptamos lo que el
  // registro de Ollama acepta: alfanumérico, guiones, puntos, dos puntos,
  // barras (para namespaces tipo library/qwen2.5). Sin espacios, sin shell.
  const MODEL_NAME_RE = /^[a-z0-9][a-z0-9._:/-]{0,127}$/i;

  function isValidModelName(name) {
    if (typeof name !== 'string') return false;
    if (name.length < 2 || name.length > 128) return false;
    if (!MODEL_NAME_RE.test(name)) return false;
    // Bloquear caracteres que no deberían aparecer aunque pasaran la regex.
    if (/[\s'"<>;&|`$()]/.test(name)) return false;
    return true;
  }

  function formatBytes(bytes) {
    if (!bytes || bytes < 0) return '—';
    const gb = bytes / (1024 ** 3);
    if (gb >= 1) return gb.toFixed(1) + ' GB';
    const mb = bytes / (1024 ** 2);
    return mb.toFixed(0) + ' MB';
  }


  function friendlyFetchError(err, action) {
    if (err && err.name === 'AbortError') {
      return action === 'generate'
        ? 'La generación local ha superado el tiempo máximo. Prueba con un modelo más ligero, reduce la instrucción o regenera de nuevo.'
        : 'La operación con Ollama ha superado el tiempo máximo.';
    }
    if (err && err.name === 'TypeError') {
      return 'No se pudo conectar con Ollama en http://localhost:11434. Comprueba que Ollama está instalado, iniciado y accesible desde este navegador.';
    }
    return err && err.message ? err.message : 'Error desconocido al comunicarse con Ollama.';
  }

  function friendlyHttpError(status, details, action) {
    const suffix = details ? ` Detalle: ${details}` : '';
    if (status === 404) {
      return action === 'generate'
        ? `El modelo seleccionado no se encontró en Ollama. Actualiza la lista de modelos o descarga/selecciona otro modelo.${suffix}`
        : `Ollama no encontró el recurso o modelo solicitado.${suffix}`;
    }
    if (status === 400) return `Ollama rechazó la solicitud. Revisa el modelo seleccionado y vuelve a intentarlo.${suffix}`;
    if (status === 500) return `Ollama devolvió un error interno. Puede faltar memoria, el modelo puede estar corrupto o la solicitud puede ser demasiado larga.${suffix}`;
    if (status === 503) return `Ollama no está disponible temporalmente o está ocupado. Espera unos segundos y vuelve a intentarlo.${suffix}`;
    return `Ollama devolvió HTTP ${status}.${suffix}`;
  }

  /**
   * Cliente Ollama.
   * Estado actual cacheado: lista de modelos descargados y modelo activo.
   * El "modelo activo" es una preferencia del usuario, persistida.
   */
  const Ollama = {
    available: null, // null = no chequeado, true/false tras detect()
    models: [],
    activeModel: null,
    abortDownload: null,

    async init() {
      this.activeModel = this.readActiveModel();
      await this.detect();
    },

    async detect() {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), DETECT_TIMEOUT_MS);
        const res = await fetch(`${ENDPOINT}/api/tags`, {
          method: 'GET',
          signal: ctrl.signal
        });
        clearTimeout(timer);
        if (!res.ok) {
          this.available = false;
          this.models = [];
          this.notify();
          return false;
        }
        const data = await res.json();
        this.available = true;
        this.models = Array.isArray(data.models) ? data.models : [];
        // Si no hay modelo activo persistido o el persistido ya no existe,
        // intentar elegir uno razonable.
        if (!this.activeModel || !this.hasModel(this.activeModel)) {
          this.activeModel = this.pickDefaultModel();
          this.writeActiveModel(this.activeModel);
        }
        this.notify();
        return true;
      } catch (e) {
        this.available = false;
        this.models = [];
        this.notify();
        return false;
      }
    },

    pickDefaultModel() {
      if (!this.models.length) return null;
      // Preferencia: gemma3n:e2b → gemma3n:e4b → qwen3:8b → phi3.5 → cualquier otro.
      for (const pref of RECOMMENDED_MODELS) {
        const found = this.models.find(m => m.name === pref.id);
        if (found) return found.name;
      }
      return this.models[0].name;
    },

    hasModel(name) {
      return this.models.some(m => m.name === name);
    },

    setActiveModel(name) {
      if (!this.hasModel(name)) return false;
      this.activeModel = name;
      this.writeActiveModel(name);
      this.notify();
      return true;
    },

    readActiveModel() {
      try { return localStorage.getItem('compo_model') || null; } catch { return null; }
    },

    writeActiveModel(name) {
      try {
        if (name) localStorage.setItem('compo_model', name);
        else localStorage.removeItem('compo_model');
      } catch { /* silencioso */ }
    },

    /**
     * Descarga un modelo con progreso en streaming.
     * @param {string} name
     * @param {(event: object) => void} onProgress
     * @returns {Promise<void>}
     */
    async pullModel(name, onProgress) {
      if (!isValidModelName(name)) {
        throw new Error('Nombre de modelo no válido.');
      }
      this.abortDownload = new AbortController();
      let res;
      try {
        res = await fetch(`${ENDPOINT}/api/pull`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, stream: true }),
          signal: this.abortDownload.signal
        });
      } catch (err) {
        throw new Error(friendlyFetchError(err, 'pull'));
      }
      if (!res.ok) {
        let details = '';
        try {
          const err = await res.json();
          details = err && err.error ? err.error : '';
        } catch { /* respuesta no JSON */ }
        throw new Error(friendlyHttpError(res.status, details, 'pull'));
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          let data;
          try { data = JSON.parse(trimmed); } catch { continue; }
          if (data.error) {
            throw new Error(data.error);
          }
          if (typeof onProgress === 'function') {
            onProgress(data);
          }
        }
      }
      // Refrescar lista al terminar.
      await this.detect();
    },

    cancelDownload() {
      if (this.abortDownload) {
        this.abortDownload.abort();
        this.abortDownload = null;
      }
    },


    /**
     * Generación de texto. Usado por el builder unificado para generar prompts, agentes y skills con el modelo local activo.
     */
    async generate(opts) {
      const { prompt, system, model, format, signal, options } = opts || {};
      if (!prompt) throw new Error('Missing prompt');
      const useModel = model || this.activeModel;
      if (!useModel) throw new Error('No active model');

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), GENERATE_TIMEOUT_MS);
      if (signal) {
        if (signal.aborted) ctrl.abort();
        else signal.addEventListener('abort', () => ctrl.abort(), { once: true });
      }

      try {
        const body = {
          model: useModel,
          prompt: String(prompt),
          stream: false,
          options: Object.assign({
            temperature: 0.25,
            top_p: 0.9,
            num_predict: 4096
          }, options || {})
        };
        if (system) body.system = String(system);
        if (format === 'json') body.format = 'json';

        let res;
        try {
          res = await fetch(`${ENDPOINT}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: ctrl.signal
          });
        } catch (err) {
          if (err && (err.name === 'AbortError' || ctrl.signal.aborted)) {
            throw new Error(friendlyFetchError({ name: 'AbortError' }, 'generate'));
          }
          throw new Error(friendlyFetchError(err, 'generate'));
        }
        if (!res.ok) {
          let details = '';
          try {
            const err = await res.json();
            details = err && err.error ? `: ${err.error}` : '';
          } catch { /* respuesta no JSON */ }
          throw new Error(friendlyHttpError(res.status, details.replace(/^: /, ''), 'generate'));
        }
        let data;
        try {
          data = await res.json();
        } catch {
          throw new Error('Ollama devolvió una respuesta no interpretable. Reinicia la generación o cambia de modelo.');
        }
        if (!data || typeof data.response !== 'string') {
          throw new Error('Ollama no devolvió texto de respuesta. Prueba con otro modelo o reduce la instrucción.');
        }
        return {
          text: data.response || '',
          model: data.model || useModel,
          totalDurationMs: data.total_duration ? Math.round(data.total_duration / 1e6) : null
        };
      } finally {
        clearTimeout(timer);
      }
    },

    notify() {
      document.dispatchEvent(new CustomEvent('compo:ollama-changed', {
        detail: {
          available: this.available,
          models: this.models,
          activeModel: this.activeModel
        }
      }));
    },

    // Utilidades expuestas
    isValidModelName,
    formatBytes,
    RECOMMENDED_MODELS
  };

  window.CompoOllama = Ollama;
})();
