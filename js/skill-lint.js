/* ===========================================================================
   Compo · Skill lint (v0.1.14)
   Linter determinista de SKILL.md: evalúa un artefacto contra los criterios
   de calidad de Compo y devuelve una puntuación y hallazgos concretos.

   Este módulo sustituye a los antiguos reemplazos globales de texto de
   postProcessGenerated, que podían corromper contenido legítimo (por
   ejemplo, una skill sobre bases de datos veía reescrito "base de datos"
   en todo el cuerpo). El linter NO modifica el texto: detecta, localiza y
   explica, y la persona usuaria (o una regeneración dirigida) decide.

   Sin dependencias. Se puede ejecutar en navegador (window.CompoSkillLint)
   y en Node (module.exports) para tests automatizados.
   =========================================================================== */

(function() {
  'use strict';

  // ------------------------------------------------------------------ //
  // Parsing mínimo de frontmatter (autocontenido para testabilidad)
  // ------------------------------------------------------------------ //
  function extractFrontmatter(markdown) {
    const text = String(markdown || '').trim();
    const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    if (!match) return null;
    return { raw: match[1] || '', body: (match[2] || '').trim() };
  }

  function parseFrontmatter(raw) {
    const meta = {};
    const lines = String(raw || '').split(/\r?\n/);
    let currentListKey = null;
    lines.forEach(line => {
      const listItem = line.match(/^\s*-\s*(.+?)\s*$/);
      if (currentListKey && listItem) {
        meta[currentListKey].push(listItem[1].replace(/^['"]|['"]$/g, '').trim());
        return;
      }
      currentListKey = null;
      const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!m) return;
      const key = m[1];
      const value = m[2].trim();
      if (!value) {
        meta[key] = [];
        currentListKey = key;
      } else {
        meta[key] = value.replace(/^['"]|['"]$/g, '').trim();
      }
    });
    return meta;
  }

  function hasSection(body, headings) {
    return headings.some(h => {
      const esc = h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(?:^|\\n)##\\s+${esc}\\s*(?:\\n|$)`, 'i').test(String(body || ''));
    });
  }

  // ------------------------------------------------------------------ //
  // Reglas
  // ------------------------------------------------------------------ //
  // severity: 'error' (bloquea calidad), 'warning' (revisar), 'info'.
  // Los pesos restan sobre 100.
  const WEIGHTS = { error: 18, warning: 8, info: 3 };

  const CERT_LANGUAGE_RE = /(garantiz|certific|valida(?:r|ción)?\s+(?:el\s+)?cumplimiento|valida(?:r|ción)?\s+(?:la\s+)?conformidad|asegura(?:ndo|r)?\s+(?:que\s+cumpl|conformidad)|validates?\s+compliance|certif(?:y|ies)|guarantees?)/i;
  const GENERIC_DESC_RE = /^(esta\s+habilidad\s+est[áa]\s+diseñada\s+para|esta\s+skill\s+sirve\s+para|ayuda\s+con\s+una\s+tarea|skill\s+generada|generada\s+con\s+compo|this\s+skill\s+is\s+designed\s+to|generated\s+with\s+compo)/i;
  const CRYPTO_PROMISE_RE = /(hash(?:es)?\s+aleatori|sha-?\d{2,3}|semilla\s+segura|firma\s+digital|sello\s+de\s+tiempo|identificador(?:es)?\s+criptográfic)/i;
  const TECH_PROMISE_RE = /(ejecuta(?:r)?\s+(?:ocr|scripts?)|realiza(?:r)?\s+ocr|llamadas?\s+(?:a\s+)?api(?:s)?\s+(?:automática|en\s+tiempo\s+real)|consulta(?:s)?\s+automática(?:s)?\s+(?:a|al|del)\s+(?:boe|registros?|bases?\s+de\s+datos)|conteo\s+exacto\s+de\s+tokens)/i;
  const COMPLIANCE_STATES_RE = /\bcumple\s*\/\s*(?:parcialmente\s+cumple\s*\/\s*)?no\s+cumple\b/i;
  const SENSITIVE_META_RE = /^\s*(api[_-]?key|token|secret|password|passwd|credential|private[_-]?key)\s*:/im;

  const REQUIRED_SECTIONS = [
    { id: 'purpose', headings: ['Propósito', 'Purpose'] },
    { id: 'when', headings: ['Cuándo usar esta skill', 'Cuándo usar', 'When to use this skill', 'When to use'] },
    { id: 'guardrails', headings: ['Guardrails', 'Límites y guardrails', 'Límites'] },
    { id: 'tech_limits', headings: ['Limitaciones técnicas', 'Technical limitations'] },
    { id: 'review', headings: ['Revisión humana', 'Human review'] }
  ];

  /**
   * Analiza un SKILL.md y devuelve { score, findings, meta }.
   * findings: [{ id, severity, field, message }]
   * Los mensajes usan claves i18n-agnósticas: quien renderiza decide idioma
   * mediante el catálogo MESSAGES (es/en) incluido abajo.
   */
  function lintSkill(markdown) {
    const findings = [];
    const add = (id, severity, field) => findings.push({ id, severity, field: field || null });

    const fm = extractFrontmatter(markdown);
    if (!fm) {
      add('missing_frontmatter', 'error', 'frontmatter');
      return finish(findings, {});
    }
    const meta = parseFrontmatter(fm.raw);
    const body = fm.body;

    // --- Frontmatter ---
    if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(String(meta.name || ''))) add('invalid_name', 'error', 'name');
    const desc = String(meta.description || '').trim();
    if (!desc) add('missing_description', 'error', 'description');
    else {
      if (GENERIC_DESC_RE.test(desc)) add('generic_description', 'error', 'description');
      if (CERT_LANGUAGE_RE.test(desc)) add('cert_language_description', 'error', 'description');
      if (desc.length < 60) add('short_description', 'warning', 'description');
      if (desc.length > 600) add('long_description', 'warning', 'description');
    }
    const wtu = meta.when_to_use;
    if (!wtu || (Array.isArray(wtu) && wtu.length === 0)) add('missing_when_to_use', 'warning', 'when_to_use');
    else if (!Array.isArray(wtu)) add('when_to_use_not_list', 'info', 'when_to_use');
    else if (wtu.length > 6) add('when_to_use_too_long', 'info', 'when_to_use');
    if (!/^\d+\.\d+\.\d+$/.test(String(meta.version || ''))) add('invalid_version', 'warning', 'version');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(meta.created || ''))) add('invalid_created', 'warning', 'created');
    if (SENSITIVE_META_RE.test(fm.raw)) add('sensitive_metadata', 'error', 'frontmatter');

    // --- Cuerpo: secciones obligatorias ---
    REQUIRED_SECTIONS.forEach(section => {
      if (!hasSection(body, section.headings)) add('missing_section_' + section.id, 'warning', 'body');
    });

    // --- Cuerpo: lenguaje de riesgo (avisos, nunca reescritura) ---
    if (CERT_LANGUAGE_RE.test(body)) add('cert_language_body', 'warning', 'body');
    if (COMPLIANCE_STATES_RE.test(body)) add('compliance_states', 'warning', 'body');
    if (CRYPTO_PROMISE_RE.test(body)) add('crypto_promise', 'warning', 'body');
    if (TECH_PROMISE_RE.test(body)) add('tech_promise', 'warning', 'body');
    if (/skill\s+generada\s+con\s+compo|generated\s+with\s+compo/i.test(body)) add('provenance_in_body', 'info', 'body');

    return finish(findings, meta);
  }

  function finish(findings, meta) {
    let score = 100;
    findings.forEach(f => { score -= WEIGHTS[f.severity] || 0; });
    score = Math.max(0, Math.min(100, score));
    return { score, findings, meta, valid: !findings.some(f => f.severity === 'error') };
  }

  // Mensajes legibles por hallazgo (es/en).
  const MESSAGES = {
    es: {
      missing_frontmatter: 'Falta el frontmatter YAML inicial (---).',
      invalid_name: 'El campo name no cumple el patrón (minúsculas, números y guiones, 3-64).',
      missing_description: 'Falta la description del frontmatter.',
      generic_description: 'La description es genérica o de procedencia; no orienta la activación.',
      cert_language_description: 'La description usa lenguaje de certificación (garantiza/certifica/valida cumplimiento).',
      short_description: 'La description es muy breve para orientar la activación automática.',
      long_description: 'La description es demasiado larga; los límites van en el cuerpo.',
      missing_when_to_use: 'Falta when_to_use.',
      when_to_use_not_list: 'when_to_use debería ser una lista YAML de casos breves.',
      when_to_use_too_long: 'when_to_use tiene demasiados elementos; conviene 2-5.',
      invalid_version: 'version no sigue semver (X.Y.Z).',
      invalid_created: 'created no tiene formato YYYY-MM-DD.',
      sensitive_metadata: 'El frontmatter contiene campos sensibles (api_key, token, secret...).',
      missing_section_purpose: 'Falta la sección "Propósito".',
      missing_section_when: 'Falta la sección "Cuándo usar esta skill".',
      missing_section_guardrails: 'Falta la sección "Guardrails" o "Límites".',
      missing_section_tech_limits: 'Falta la sección "Limitaciones técnicas".',
      missing_section_review: 'Falta la sección "Revisión humana".',
      cert_language_body: 'El cuerpo usa lenguaje de certificación; prefiere "revisa", "señala", "propone".',
      compliance_states: 'Usa estados "cumple/no cumple"; prefiere Adecuado/Parcial/Insuficiente/Ausente/No evaluable.',
      crypto_promise: 'Menciona capacidades criptográficas (hash, firma, sello) que una skill instructiva no puede ejecutar.',
      tech_promise: 'Promete capacidades técnicas no implementadas (OCR, scripts, consultas automáticas, conteo exacto de tokens).',
      provenance_in_body: 'El cuerpo menciona la procedencia de Compo; no aporta a la skill.'
    },
    en: {
      missing_frontmatter: 'Missing initial YAML frontmatter (---).',
      invalid_name: 'The name field does not match the pattern (lowercase, digits, hyphens, 3-64).',
      missing_description: 'Missing frontmatter description.',
      generic_description: 'The description is generic or provenance-focused; it does not guide activation.',
      cert_language_description: 'The description uses certification language (guarantees/certifies/validates compliance).',
      short_description: 'The description is too short to guide automatic activation.',
      long_description: 'The description is too long; limits belong in the body.',
      missing_when_to_use: 'Missing when_to_use.',
      when_to_use_not_list: 'when_to_use should be a YAML list of brief cases.',
      when_to_use_too_long: 'when_to_use has too many items; 2-5 is recommended.',
      invalid_version: 'version does not follow semver (X.Y.Z).',
      invalid_created: 'created is not in YYYY-MM-DD format.',
      sensitive_metadata: 'Frontmatter contains sensitive fields (api_key, token, secret...).',
      missing_section_purpose: 'Missing "Purpose" section.',
      missing_section_when: 'Missing "When to use this skill" section.',
      missing_section_guardrails: 'Missing "Guardrails" or "Limits" section.',
      missing_section_tech_limits: 'Missing "Technical limitations" section.',
      missing_section_review: 'Missing "Human review" section.',
      cert_language_body: 'The body uses certification language; prefer "reviews", "flags", "proposes".',
      compliance_states: 'Uses "complies/does not comply" states; prefer Adequate/Partial/Insufficient/Absent/Not assessable.',
      crypto_promise: 'Mentions cryptographic capabilities (hash, signature, timestamp) an instructional skill cannot execute.',
      tech_promise: 'Promises unimplemented technical capabilities (OCR, scripts, automatic lookups, exact token counting).',
      provenance_in_body: 'The body mentions Compo provenance; it adds nothing to the skill.'
    }
  };

  function describeFindings(findings, lang) {
    const table = MESSAGES[lang] || MESSAGES.es;
    return (findings || []).map(f => ({
      id: f.id,
      severity: f.severity,
      field: f.field,
      message: table[f.id] || f.id
    }));
  }

  const api = { lintSkill, describeFindings, MESSAGES, WEIGHTS };

  if (typeof window !== 'undefined') window.CompoSkillLint = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
