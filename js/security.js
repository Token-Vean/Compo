/* ===========================================================================
   Compo · Security module
   Validadores, sanitizadores y detector de PII para reducir el riesgo de:
   - Inyección de HTML/JS al renderizar contenido del usuario o respuestas
     del modelo (defensa en profundidad sobre la CSP estricta).
   - Filtrado accidental de datos personales en SKILL.md exportados.
   - Procesamiento de archivos subidos con nombres o contenidos peligrosos.
   =========================================================================== */

(function() {
  'use strict';

  // Patrones de PII para uso archivístico/administrativo español.
  // Detección heurística, NO infalible. Pensada para avisar antes de exportar.
  const PII_PATTERNS = [
    { id: 'dni',       label: 'DNI/NIE',           re: /\b[XYZ]?\d{7,8}[A-HJ-NP-TV-Z]\b/gi },
    { id: 'iban_es',   label: 'IBAN español',      re: /\bES\d{2}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{2}[\s-]?\d{10}\b/gi },
    { id: 'email',     label: 'Correo electrónico', re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
    { id: 'phone_es',  label: 'Teléfono español',  re: /(?:\+?34[\s-]?)?(?:[6789]\d{2}[\s-]?\d{3}[\s-]?\d{3})\b/g },
    { id: 'expediente', label: 'Posible expediente', re: /\b(?:EXPTE|EXP|EXPEDIENTE)[\s.:#-]+[A-Z0-9/-]{3,30}\b/gi }
  ];

  /**
   * Devuelve los hallazgos de PII en un texto.
   * @param {string} text
   * @returns {Array<{ id, label, matches: string[] }>}
   */
  function detectPII(text) {
    if (!text || typeof text !== 'string') return [];
    const findings = [];
    for (const p of PII_PATTERNS) {
      const matches = text.match(p.re);
      if (matches && matches.length) {
        // Deduplicar y limitar para no saturar la UI.
        const unique = Array.from(new Set(matches)).slice(0, 5);
        findings.push({ id: p.id, label: p.label, matches: unique });
      }
    }
    return findings;
  }

  /**
   * Validación de slug (kebab-case). Heredado del Prompt Composer v8.5.
   */
  function isValidSlug(slug) {
    if (typeof slug !== 'string') return false;
    return /^[a-z][a-z0-9-]{1,63}$/.test(slug) && !/--/.test(slug);
  }

  /**
   * Saneamiento de slug.
   */
  function sanitizeSlug(input) {
    if (typeof input !== 'string') return '';
    return input.toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-')
      .slice(0, 64);
  }

  /**
   * Validación semver MAJOR.MINOR.PATCH (sin pre-release).
   */
  function isValidSemver(v) {
    if (typeof v !== 'string') return false;
    return /^\d+\.\d+\.\d+$/.test(v);
  }

  /**
   * Validación de nombre de archivo seguro (sin path traversal).
   * Solo alfanuméricos, guiones, puntos y guiones bajos.
   */
  function isSafeFilename(name) {
    if (typeof name !== 'string') return false;
    if (name.length < 1 || name.length > 255) return false;
    if (/[\\/]/.test(name)) return false;
    if (name.startsWith('.')) return false;
    return /^[a-zA-Z0-9._-]+$/.test(name);
  }

  /**
   * Limpia un texto de caracteres de control que no aportan nada y pueden
   * romper YAML, JSON o vista previa. Mantiene saltos de línea y tabs.
   */
  function stripControlChars(text) {
    if (typeof text !== 'string') return '';
    // Conserva \n (0x0A), \r (0x0D), \t (0x09); elimina el resto < 0x20 y 0x7F.
    return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  /**
   * Encapsula contenido del usuario para mandarlo a un LLM con delimitadores
   * difíciles de confundir, mitigando inyecciones simples del estilo
   * "ignora todo lo anterior y haz X".
   * El system prompt asociado debe declarar explícitamente que el contenido
   * entre estos delimitadores es DATOS, no instrucciones.
   */
  function wrapForLLM(content, label) {
    const safe = stripControlChars(String(content || ''));
    const lbl = String(label || 'user_content').replace(/[^a-zA-Z0-9_-]/g, '');
    return `<<<${lbl}_BEGIN>>>\n${safe}\n<<<${lbl}_END>>>`;
  }

  /**
   * Lee un archivo subido y devuelve su texto, con límites duros.
   * @param {File} file
   * @param {object} opts { maxBytes, allowedExt }
   * @returns {Promise<string>}
   */
  async function readUploadedText(file, opts) {
    opts = opts || {};
    const maxBytes = opts.maxBytes || (256 * 1024); // 256 KB
    const allowedExt = opts.allowedExt || ['md', 'txt', 'json', 'yaml', 'yml'];

    if (!file) throw new Error('No file');
    if (file.size > maxBytes) {
      throw new Error(`File too large (max ${Math.round(maxBytes / 1024)} KB)`);
    }
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!allowedExt.includes(ext)) {
      throw new Error(`Disallowed file extension: ${ext}`);
    }
    const text = await file.text();
    return stripControlChars(text);
  }

  window.CompoSecurity = {
    detectPII,
    isValidSlug,
    sanitizeSlug,
    isValidSemver,
    isSafeFilename,
    stripControlChars,
    wrapForLLM,
    readUploadedText,
    PII_PATTERNS: PII_PATTERNS.map(p => ({ id: p.id, label: p.label }))
  };
})();
