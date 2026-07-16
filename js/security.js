/* ===========================================================================
   Compo · Security module (v0.1.14)
   Validadores, sanitizadores y detector de PII para reducir el riesgo de:
   - Inyección de HTML/JS al renderizar contenido del usuario o respuestas
     del modelo (defensa en profundidad sobre la CSP estricta).
   - Filtrado accidental de datos personales en SKILL.md exportados.
   - Procesamiento de archivos subidos con nombres o contenidos peligrosos.

   Cambios v0.1.14:
   - DNI/NIE: validación del dígito de control (módulo 23). Un patrón de
     8 dígitos + letra solo se marca como DNI si la letra es la correcta,
     lo que elimina la gran mayoría de falsos positivos en textos con
     referencias numéricas (frecuentes en contexto archivístico).
   - Teléfono: guardas de límite de dígitos para no casar subcadenas
     dentro de números más largos (expedientes, signaturas, códigos).
   =========================================================================== */

(function() {
  'use strict';

  // Tabla oficial de letras de control del DNI/NIE (módulo 23).
  const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

  /**
   * Valida el dígito de control de un DNI (8 dígitos + letra) o NIE
   * (X/Y/Z + 7 dígitos + letra). Devuelve false para formatos no válidos.
   */
  function isValidDNI(value) {
    const v = String(value || '').toUpperCase().replace(/[\s-]/g, '');
    let m = v.match(/^(\d{8})([A-Z])$/);
    if (m) return DNI_LETTERS[Number(m[1]) % 23] === m[2];
    m = v.match(/^([XYZ])(\d{7})([A-Z])$/);
    if (m) {
      const prefix = { X: '0', Y: '1', Z: '2' }[m[1]];
      return DNI_LETTERS[Number(prefix + m[2]) % 23] === m[3];
    }
    return false;
  }

  // Patrones de PII para uso archivístico/administrativo español.
  // Detección heurística, NO infalible. Pensada para avisar antes de exportar.
  // `verify` (opcional) filtra las coincidencias del patrón con una
  // comprobación adicional (p. ej., checksum) para reducir falsos positivos.
  const PII_PATTERNS = [
    {
      id: 'dni', label: 'DNI/NIE',
      re: /\b[XYZ]?\d{7,8}[A-HJ-NP-TV-Z]\b/gi,
      verify: isValidDNI
    },
    {
      id: 'iban_es', label: 'IBAN español',
      re: /\bES\d{2}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{2}[\s-]?\d{10}\b/gi
    },
    {
      id: 'email', label: 'Correo electrónico',
      re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
    },
    {
      id: 'phone_es', label: 'Teléfono español',
      // Guardas (?<!\d) y (?!\d): el número no forma parte de una cifra mayor.
      re: /(?<![\d.])(?:\+?34[\s-]?)?[6789]\d{2}[\s-]?\d{3}[\s-]?\d{3}(?![\d.])/g
    },
    {
      id: 'expediente', label: 'Posible expediente',
      re: /\b(?:EXPTE|EXP|EXPEDIENTE)[\s.:#-]+[A-Z0-9/-]{3,30}\b/gi
    }
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
      let matches = text.match(p.re);
      if (matches && matches.length && typeof p.verify === 'function') {
        matches = matches.filter(p.verify);
      }
      if (matches && matches.length) {
        const unique = Array.from(new Set(matches)).slice(0, 5);
        findings.push({ id: p.id, label: p.label, matches: unique });
      }
    }
    return findings;
  }

  /**
   * Enmascara un hallazgo de PII para poder mostrarlo en un aviso sin
   * repetir el dato completo: conserva los dos primeros y el último carácter.
   */
  function maskFinding(value) {
    const v = String(value || '');
    if (v.length <= 4) return v.charAt(0) + '…';
    return v.slice(0, 2) + '…' + v.slice(-2);
  }

  /**
   * Validación de slug (kebab-case). Heredado del Prompt Composer v8.5.
   */
  function isValidSlug(slug) {
    if (typeof slug !== 'string') return false;
    return /^[a-z][a-z0-9-]{1,63}$/.test(slug) && !/--/.test(slug);
  }

  function sanitizeSlug(input) {
    if (typeof input !== 'string') return '';
    return input.toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-')
      .slice(0, 64);
  }

  function isValidSemver(v) {
    if (typeof v !== 'string') return false;
    return /^\d+\.\d+\.\d+$/.test(v);
  }

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
    return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  /**
   * Encapsula contenido del usuario para mandarlo a un LLM con delimitadores
   * difíciles de confundir, mitigando inyecciones simples del estilo
   * "ignora todo lo anterior y haz X".
   */
  function wrapForLLM(content, label) {
    const safe = stripControlChars(String(content || ''));
    const lbl = String(label || 'user_content').replace(/[^a-zA-Z0-9_-]/g, '');
    return `<<<${lbl}_BEGIN>>>\n${safe}\n<<<${lbl}_END>>>`;
  }

  /**
   * Lee un archivo subido y devuelve su texto, con límites duros.
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

  const api = {
    detectPII,
    maskFinding,
    isValidDNI,
    isValidSlug,
    sanitizeSlug,
    isValidSemver,
    isSafeFilename,
    stripControlChars,
    wrapForLLM,
    readUploadedText,
    PII_PATTERNS: PII_PATTERNS.map(p => ({ id: p.id, label: p.label }))
  };

  if (typeof window !== 'undefined') window.CompoSecurity = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
