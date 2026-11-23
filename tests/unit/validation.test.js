import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateContact } from '../../server/validation.js';
const valid = { name: 'Ramiro', email: 'ramiro@example.com', message: 'Me gustaría crear una página web.' };
test('acepta y normaliza un contacto válido', () => {
  const result = validateContact({ ...valid, name: '  Ramiro  ', message: `  ${valid.message}  ` });
  assert.equal(result.valid, true); assert.deepEqual(result.values, valid);
});
test('rechaza correos incompletos o con espacios', () => {
  for (const email of ['persona@', 'sin-arroba.com', 'a b@example.com']) assert.ok(validateContact({ ...valid, email }).errors.email);
});
test('exige nombre y mensaje dentro de sus límites', () => {
  assert.ok(validateContact({ ...valid, name: 'R' }).errors.name);
  assert.ok(validateContact({ ...valid, name: 'a'.repeat(101) }).errors.name);
  assert.ok(validateContact({ ...valid, message: 'Corto' }).errors.message);
  assert.ok(validateContact({ ...valid, message: 'a'.repeat(2001) }).errors.message);
});
test('maneja objetos ausentes y tipos inesperados sin excepciones', () => {
  for (const input of [null, undefined, [], { name: {}, email: 5, message: [] }]) {
    const result = validateContact(input); assert.equal(result.valid, false); assert.equal(Object.keys(result.errors).length, 3);
  }
});
