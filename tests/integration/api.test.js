import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../../server/database.js';
import { createApp } from '../../server/app.js';
let db, app, directory, filename;
const contact = { name: 'Visitante', email: 'visitante@example.com', message: 'Quiero conversar sobre un proyecto.' };
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), 'portfolio-test-')); filename = join(directory, 'test.sqlite'); db = openDatabase(filename); app = createApp(db); });
afterEach(() => { db.close(); rmSync(directory, { recursive: true, force: true }); });
test('API consulta los proyectos sembrados en una SQLite real y filtra por categoría', async () => {
  const response = await request(app).get('/api/projects').expect(200);
  assert.equal(response.body.length, 3); assert.ok(Array.isArray(response.body[0].technologies));
  const filtered = await request(app).get('/api/projects').query({ category: 'Videojuegos' }).expect(200);
  assert.equal(filtered.body.length, 1); assert.equal(filtered.body[0].title, 'Fragmentos del Olvido');
});
test('POST guarda el contacto y persiste después de reabrir la base', async () => {
  const response = await request(app).post('/api/contact').send(contact).expect(201);
  db.close(); db = openDatabase(filename);
  const saved = db.prepare('SELECT * FROM contacts WHERE id = ?').get(response.body.id);
  assert.equal(saved.email, contact.email); assert.equal(saved.message, contact.message);
  assert.equal(db.prepare('SELECT count(*) AS total FROM projects').get().total, 3);
});
test('rechaza datos inválidos sin insertar filas', async () => {
  const response = await request(app).post('/api/contact').send({ ...contact, email: 'invalido' }).expect(400);
  assert.ok(response.body.errors.email); assert.equal(db.prepare('SELECT count(*) AS total FROM contacts').get().total, 0);
});
test('usa parámetros SQL y trata una inyección como texto', async () => {
  const message = "Hola'); DROP TABLE contacts; --";
  await request(app).post('/api/contact').send({ ...contact, message }).expect(201);
  assert.equal(db.prepare('SELECT message FROM contacts').get().message, message);
  const response = await request(app).get('/api/projects').query({ category: "' OR 1=1 --" }).expect(200);
  assert.deepEqual(response.body, []);
});
test('limita el envío de contactos y no expone su listado', async () => {
  const limited = createApp(db, { contactLimit: 1 });
  await request(limited).post('/api/contact').send(contact).expect(201);
  await request(limited).post('/api/contact').send(contact).expect(429);
  await request(app).get('/api/contacts').expect(404);
});
test('health comprueba la BD y JSON malformado responde 400', async () => {
  const health = await request(app).get('/api/health').expect(200); assert.equal(health.body.database, 'connected');
  await request(app).post('/api/contact').set('Content-Type', 'application/json').send('{broken').expect(400);
});
