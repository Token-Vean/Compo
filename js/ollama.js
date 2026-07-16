/* ===========================================================================
   Compo · Ollama client (v0.1.14)
   Comunicación con la API local de Ollama. No realiza ninguna llamada de red
   más allá de Ollama en localhost. La CSP restringe connect-src a
   http://127.0.0.1:11434 y http://localhost:11434 para que esta promesa sea
   verificable por el usuario.

   Cambios v0.1.14:
   - Detección de endpoint dual: prueba 127.0.0.1 y localhost y usa el que
     responda (en algunos sistemas "localhost" resuelve a ::1/IPv6 mientras
     Ollama solo escucha en 127.0.0.1).
   - num_ctx explícito: sin él, Ollama usa un contexto por defecto pequeño y
     TRUNCA el prompt en silencio; los prompts internos de Compo lo superan.
   - Generación en streaming vía /api/chat con callback onToken y soporte de
     cancelación (AbortSignal).
   - Comprobación de done_reason: si la salida se cortó por límite de tokens
     (done_reason === "length"), se marca truncated=true para avisar en la UI.
   =========================================================================== */

(function() {
  'use strict';

  // Se prueba primero 127.0.0.1 (más fiable que "localhost", que puede
  // resolver a ::1 donde Ollama no escucha por defecto).
  const CANDIDATE_ENDPOINTS = [
    'http://127.0.0.1:11434',
    'http://localhost:11434'
  ];
  const DETECT_TIMEOUT_MS = 2500;
  const GENERATE_TIMEOUT_MS = 300000; // 5 min: streaming permite cancelar antes.

  // Contexto explícito. El valor por defecto de Ollama (a menudo 4096) es
  // insuficiente para los prompts internos de Compo y provoca truncamiento
  // silencioso de las instrucciones. Ajustable por llamada vía options.num_ctx.
  const DEFAULT_NUM_CTX = 16384;

  // Estimación aproximada de tokens (heurística conservadora para ES/EN).
  function approxTokens(text) {
    return Math.ceil(String(text || '').length / 3.2);
  }

  // Allowlist de modelos recomendados que la UI ofrece como atajo.
  const RECOMMENDED_MODELS = [
    {
      key: 'light',
      id: 'gemma4:e2b',
      sizeGB: 7.2,
      ramMinGB: 8,
      i18nKey: 'models.recommended.options.light'
    },
    {
      key: 'balanced',
      id: 'gemma4:e4b',
      sizeGB: 9.6,
      ramMinGB: 16,
      i18nKey: 'models.recommended.options.balanced'
    },
    {
      key: 'powerful',
      id: 'gpt-oss:20b',
      sizeGB: 14,
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

  const MODEL_NAME_RE = /^[a-z0-9][a-z0-9._:/-]{0,127}$/i;

  function isValidModelName(name) {
    if (typeof name !== 'string') return false;
    if (name.length < 2 || name.length > 128) return false;
    if (!MODEL_NAME_RE.test(name)) return false;
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
        ? CompoI18n.t('ollama.errors.generate_timeout')
        : CompoI18n.t('ollama.errors.timeout');
    }
    if (err && err.name === 'TypeError') {
      return CompoI18n.t('ollama.errors.unreachable');
    }
    return err && err.message ? err.message : CompoI18n.t('ollama.errors.unknown');
  }

  function friendlyHttpError(status, details, action) {
    const suffix = details ? ' ' + CompoI18n.t('ollama.errors.detail', { details }) : '';
    if (status === 404) {
      return (action === 'generate'
        ? CompoI18n.t('ollama.errors.model_not_found')
        : CompoI18n.t('ollama.errors.resource_not_found')) + suffix;
    }
    if (status === 400) return CompoI18n.t('ollama.errors.bad_request') + suffix;
    if (status === 500) return CompoI18n.t('ollama.errors.internal') + suffix;
    if (status === 503) return CompoI18n.t('ollama.errors.busy') + suffix;
    return CompoI18n.t('ollama.errors.http', { status }) + suffix;
  }

  /**
   * Lee un cuerpo NDJSON en streaming, invocando onLine(objeto) por línea.
   */
  async function readNDJSON(res, onLine) {
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
        if (data.error) throw new Error(data.error);
        onLine(data);
      }
    }
    const tail = buffer.trim();
    if (tail) {
      try {
        const data = JSON.parse(tail);
        if (data.error) throw new Error(data.error);
        onLine(data);
      } catch (e) {
        if (e && e.message && !(e instanceof SyntaxError)) throw e;
      }
    }
  }

  const Ollama = {
    available: null, // null = no chequeado, true/false tras detect()
    endpoint: CANDIDATE_ENDPOINTS[0],
    models: [],
    activeModel: null,
    abortDownload: null,

    async init() {
      this.activeModel = this.readActiveModel();
      await this.detect();
    },

    async _probe(endpoint) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), DETECT_TIMEOUT_MS);
      try {
        const res = await fetch(`${endpoint}/api/tags`, { method: 'GET', signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) return null;
        const data = await res.json();
        return Array.isArray(data.models) ? data.models : [];
      } catch (e) {
        clearTimeout(timer);
        return null;
      }
    },

    async detect() {
      for (const endpoint of CANDIDATE_ENDPOINTS) {
        const models = await this._probe(endpoint);
        if (models !== null) {
          this.endpoint = endpoint;
          this.available = true;
          this.models = models;
          if (!this.activeModel || !this.hasModel(this.activeModel)) {
            this.activeModel = this.pickDefaultModel();
            this.writeActiveModel(this.activeModel);
          }
          this.notify();
          return true;
        }
      }
      this.available = false;
      this.models = [];
      this.notify();
      return false;
    },

    pickDefaultModel() {
      if (!this.models.length) return null;
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
     */
    async pullModel(name, onProgress) {
      if (!isValidModelName(name)) {
        throw new Error(CompoI18n.t('ollama.errors.invalid_model_name'));
      }
      this.abortDownload = new AbortController();
      let res;
      try {
        res = await fetch(`${this.endpoint}/api/pull`, {
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
      await readNDJSON(res, (data) => {
        if (typeof onProgress === 'function') onProgress(data);
      });
      await this.detect();
    },

    cancelDownload() {
      if (this.abortDownload) {
        this.abortDownload.abort();
        this.abortDownload = null;
      }
    },

    /**
     * Generación de texto en streaming vía /api/chat.
     *
     * @param {object} opts
     *   prompt   (string, obligatorio)  mensaje de usuario
     *   system   (string, opcional)     mensaje de sistema
     *   model    (string, opcional)     por defecto, el modelo activo
     *   signal   (AbortSignal, opcional) cancelación externa (botón Cancelar)
     *   options  (object, opcional)     opciones de Ollama (temperature, etc.)
     *   onToken  (function, opcional)   onToken(chunk, textoAcumulado)
     * @returns {Promise<{text, model, totalDurationMs, truncated, doneReason}>}
     */
    async generate(opts) {
      const { prompt, system, model, signal, options, onToken } = opts || {};
      if (!prompt) throw new Error('Missing prompt');
      const useModel = model || this.activeModel;
      if (!useModel) throw new Error('No active model');

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), GENERATE_TIMEOUT_MS);
      let externallyAborted = false;
      if (signal) {
        if (signal.aborted) { externallyAborted = true; ctrl.abort(); }
        else signal.addEventListener('abort', () => { externallyAborted = true; ctrl.abort(); }, { once: true });
      }

      const mergedOptions = Object.assign({
        temperature: 0.25,
        top_p: 0.9,
        num_predict: 4096,
        num_ctx: DEFAULT_NUM_CTX
      }, options || {});

      const messages = [];
      if (system) messages.push({ role: 'system', content: String(system) });
      messages.push({ role: 'user', content: String(prompt) });

      // Aviso preventivo de contexto: si el prompt estimado se acerca al
      // límite, el modelo podría perder el principio de las instrucciones.
      const promptTokens = approxTokens((system || '') + prompt);
      const contextTight = promptTokens > Math.floor(mergedOptions.num_ctx * 0.75);

      try {
        let res;
        try {
          res = await fetch(`${this.endpoint}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: useModel,
              messages,
              stream: true,
              options: mergedOptions
            }),
            signal: ctrl.signal
          });
        } catch (err) {
          if (externallyAborted) throw Object.assign(new Error(CompoI18n.t('ollama.errors.cancelled')), { cancelled: true });
          if (err && (err.name === 'AbortError' || ctrl.signal.aborted)) {
            throw new Error(friendlyFetchError({ name: 'AbortError' }, 'generate'));
          }
          throw new Error(friendlyFetchError(err, 'generate'));
        }
        if (!res.ok) {
          let details = '';
          try {
            const err = await res.json();
            details = err && err.error ? err.error : '';
          } catch { /* respuesta no JSON */ }
          throw new Error(friendlyHttpError(res.status, details, 'generate'));
        }

        let text = '';
        let doneReason = null;
        let totalDuration = null;
        let responseModel = useModel;
        try {
          await readNDJSON(res, (data) => {
            if (data.message && typeof data.message.content === 'string' && data.message.content) {
              text += data.message.content;
              if (typeof onToken === 'function') onToken(data.message.content, text);
            }
            if (data.done) {
              doneReason = data.done_reason || null;
              if (data.total_duration) totalDuration = Math.round(data.total_duration / 1e6);
              if (data.model) responseModel = data.model;
            }
          });
        } catch (err) {
          if (externallyAborted) {
            // Cancelación del usuario: devolvemos lo acumulado marcándolo.
            throw Object.assign(new Error(CompoI18n.t('ollama.errors.cancelled')), { cancelled: true, partialText: text });
          }
          if (ctrl.signal.aborted) {
            throw new Error(friendlyFetchError({ name: 'AbortError' }, 'generate'));
          }
          throw err;
        }

        if (!text) {
          throw new Error(CompoI18n.t('ollama.errors.empty_response'));
        }
        return {
          text,
          model: responseModel,
          totalDurationMs: totalDuration,
          truncated: doneReason === 'length',
          doneReason,
          contextTight
        };
      } finally {
        clearTimeout(timer);
      }
    },

    notify() {
      document.dispatchEvent(new CustomEvent('compo:ollama-changed', {
        detail: {
          available: this.available,
          endpoint: this.endpoint,
          models: this.models,
          activeModel: this.activeModel
        }
      }));
    },

    // Utilidades expuestas
    isValidModelName,
    formatBytes,
    approxTokens,
    RECOMMENDED_MODELS,
    DEFAULT_NUM_CTX
  };

  window.CompoOllama = Ollama;
})();
