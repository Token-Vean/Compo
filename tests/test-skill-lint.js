/* Tests del linter de SKILL.md (node --test tests/) */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const lint = require(path.join(__dirname, '..', 'js', 'skill-lint.js'));

const GOOD_SKILL = `---
name: revisor-descripciones-isadg
description: "Revisa borradores de descripción archivística conforme a ISAD(G), separando evidencia literal, inferencias, lagunas, nivel de confianza y recomendaciones de mejora."
when_to_use:
  - "Cuando el usuario aporte una transcripción documental y pida una descripción archivística."
  - "Cuando solicite revisar campos ISAD(G) o mejorar una descripción existente."
version: 0.1.0
created: 2026-07-16
---

# Revisor de descripciones archivísticas

## Propósito
Ayudar a revisar descripciones archivísticas.

## Cuándo usar esta skill
- Revisar una descripción ISAD(G).

## Guardrails
- No inventar datos.

## Limitaciones técnicas
Opera como instrucción textual.

## Revisión humana
Requiere revisión profesional.
`;

test('lintSkill: skill correcta obtiene puntuacion alta y valid=true', () => {
  const r = lint.lintSkill(GOOD_SKILL);
  assert.equal(r.valid, true);
  assert.ok(r.score >= 90, `score=${r.score}`);
});

test('lintSkill: sin frontmatter es error', () => {
  const r = lint.lintSkill('# Solo un titulo\n\nCuerpo sin YAML.');
  assert.equal(r.valid, false);
  assert.ok(r.findings.some(f => f.id === 'missing_frontmatter'));
});

test('lintSkill: detecta lenguaje de certificacion en description', () => {
  const bad = GOOD_SKILL.replace('Revisa borradores', 'Garantiza el cumplimiento de borradores');
  const r = lint.lintSkill(bad);
  assert.ok(r.findings.some(f => f.id === 'cert_language_description'));
  assert.equal(r.valid, false);
});

test('lintSkill: detecta description generica de procedencia', () => {
  const bad = GOOD_SKILL.replace(/description: ".*"/, 'description: "Skill generada con Compo para revisar y completar."');
  const r = lint.lintSkill(bad);
  assert.ok(r.findings.some(f => f.id === 'generic_description'));
});

test('lintSkill: detecta metadata sensible', () => {
  const bad = GOOD_SKILL.replace('version: 0.1.0', 'api_key: sk-123\nversion: 0.1.0');
  const r = lint.lintSkill(bad);
  assert.ok(r.findings.some(f => f.id === 'sensitive_metadata'));
});

test('lintSkill: detecta secciones ausentes', () => {
  const bad = GOOD_SKILL.replace('## Limitaciones técnicas\nOpera como instrucción textual.\n\n', '');
  const r = lint.lintSkill(bad);
  assert.ok(r.findings.some(f => f.id === 'missing_section_tech_limits'));
});

test('lintSkill: avisa de promesas criptograficas sin reescribir el texto', () => {
  const bad = GOOD_SKILL.replace('- No inventar datos.', '- Añadir hash aleatorio con semilla segura a cada registro.');
  const r = lint.lintSkill(bad);
  assert.ok(r.findings.some(f => f.id === 'crypto_promise'));
});

test('lintSkill: NO penaliza "base de datos" en uso legitimo (regresion v0.1.13)', () => {
  // En v0.1.13 esto se reescribia globalmente a "registro controlado".
  const legit = GOOD_SKILL.replace('Ayudar a revisar descripciones archivísticas.',
    'Ayudar a documentar el esquema descriptivo de una base de datos de catálogo.');
  const r = lint.lintSkill(legit);
  assert.equal(r.findings.some(f => f.id === 'tech_promise'), false);
  assert.ok(r.score >= 90);
});

test('lintSkill: avisa de estados cumple/no cumple', () => {
  const bad = GOOD_SKILL.replace('- Revisar una descripción ISAD(G).', 'Estados: Cumple / No cumple.');
  const r = lint.lintSkill(bad);
  assert.ok(r.findings.some(f => f.id === 'compliance_states'));
});

test('describeFindings: devuelve mensajes en es y en', () => {
  const r = lint.lintSkill('# sin yaml');
  const es = lint.describeFindings(r.findings, 'es');
  const en = lint.describeFindings(r.findings, 'en');
  assert.ok(es[0].message.includes('frontmatter'));
  assert.ok(en[0].message.includes('frontmatter'));
});

test('lintSkill: version y created invalidos son avisos', () => {
  const bad = GOOD_SKILL.replace('version: 0.1.0', 'version: v1').replace('created: 2026-07-16', 'created: ayer');
  const r = lint.lintSkill(bad);
  assert.ok(r.findings.some(f => f.id === 'invalid_version'));
  assert.ok(r.findings.some(f => f.id === 'invalid_created'));
});
