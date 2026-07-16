/* Tests del módulo de seguridad de Compo (node --test tests/) */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const sec = require(path.join(__dirname, '..', 'js', 'security.js'));

test('isValidDNI: acepta DNI con letra de control correcta', () => {
  // 12345678 % 23 = 14 -> letra Z
  assert.equal(sec.isValidDNI('12345678Z'), true);
  // 00000000 % 23 = 0 -> letra T
  assert.equal(sec.isValidDNI('00000000T'), true);
});

test('isValidDNI: rechaza DNI con letra incorrecta', () => {
  assert.equal(sec.isValidDNI('12345678A'), false);
  assert.equal(sec.isValidDNI('12345678T'), false);
});

test('isValidDNI: valida NIE con prefijo X/Y/Z', () => {
  // X1234567 -> 01234567 % 23 = 20 -> letra L
  assert.equal(sec.isValidDNI('X1234567L'), true);
  assert.equal(sec.isValidDNI('X1234567T'), false);
});

test('detectPII: no marca como DNI un numero de 8 digitos + letra con checksum invalido', () => {
  const findings = sec.detectPII('La signatura del legajo es 12345678B segun el inventario.');
  assert.equal(findings.some(f => f.id === 'dni'), false);
});

test('detectPII: detecta un DNI real (checksum valido)', () => {
  const findings = sec.detectPII('El solicitante con DNI 12345678Z pide acceso.');
  const dni = findings.find(f => f.id === 'dni');
  assert.ok(dni);
  assert.deepEqual(dni.matches, ['12345678Z']);
});

test('detectPII: telefono no casa subcadenas de numeros mas largos', () => {
  // 16 dígitos seguidos: ningún fragmento debe marcarse como teléfono.
  const findings = sec.detectPII('Referencia interna 6123456789012345 del registro.');
  assert.equal(findings.some(f => f.id === 'phone_es'), false);
});

test('detectPII: detecta telefono espanol valido con y sin prefijo', () => {
  const f1 = sec.detectPII('Contacto: 612 345 678');
  assert.ok(f1.some(x => x.id === 'phone_es'));
  const f2 = sec.detectPII('Contacto: +34 912345678');
  assert.ok(f2.some(x => x.id === 'phone_es'));
});

test('detectPII: detecta correo e IBAN', () => {
  const f = sec.detectPII('Escribir a persona@example.org, IBAN ES91 2100 0418 45 0200051332.');
  assert.ok(f.some(x => x.id === 'email'));
  assert.ok(f.some(x => x.id === 'iban_es'));
});

test('maskFinding: enmascara conservando extremos', () => {
  assert.equal(sec.maskFinding('12345678Z'), '12…8Z');
  assert.equal(sec.maskFinding('abc'), 'a…');
});

test('sanitizeSlug e isValidSlug', () => {
  assert.equal(sec.sanitizeSlug('Descripción ISAD(G) — v2'), 'descripcin-isadg-v2');
  assert.equal(sec.isValidSlug('revisor-isadg'), true);
  assert.equal(sec.isValidSlug('Revisor'), false);
  assert.equal(sec.isValidSlug('a--b'), false);
});

test('isSafeFilename: bloquea path traversal y ocultos', () => {
  assert.equal(sec.isSafeFilename('skill.md'), true);
  assert.equal(sec.isSafeFilename('../etc/passwd'), false);
  assert.equal(sec.isSafeFilename('.env'), false);
  assert.equal(sec.isSafeFilename('a/b.md'), false);
});

test('stripControlChars: conserva saltos y tabs, elimina el resto', () => {
  assert.equal(sec.stripControlChars('a\x00b\nc\td\x7f'), 'ab\nc\td');
});

test('wrapForLLM: delimita y sanea la etiqueta', () => {
  const out = sec.wrapForLLM('contenido', 'mi etiqueta!');
  assert.ok(out.startsWith('<<<mietiqueta_BEGIN>>>\n'));
  assert.ok(out.endsWith('\n<<<mietiqueta_END>>>'));
});
