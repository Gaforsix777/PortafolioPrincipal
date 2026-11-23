import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { resolve } from 'node:path';
import { validateContact } from './validation.js';
export function createApp(db, { staticDir = resolve('dist'), contactLimit = 5 } = {}) {
  const app = express();
  app.disable('x-powered-by');
  // Only the immediate reverse proxy is trusted; the application port is private.
  if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: { directives: { 'upgrade-insecure-requests': null } } }));
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', (_req, res) => { db.prepare('SELECT 1').get(); res.json({ status: 'ok', database: 'connected' }); });
  app.get('/api/projects', (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : '';
    const rows = category ? db.prepare('SELECT * FROM projects WHERE category = ? ORDER BY id').all(category) : db.prepare('SELECT * FROM projects ORDER BY id').all();
    res.json(rows.map(row => ({ ...row, technologies: JSON.parse(row.technologies) })));
  });
  app.post('/api/contact', rateLimit({ windowMs: 15 * 60 * 1000, limit: contactLimit, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Demasiados mensajes. Intenta de nuevo en 15 minutos.' } }), (req, res) => {
    const result = validateContact(req.body);
    if (!result.valid) return res.status(400).json({ errors: result.errors });
    const { name, email, message } = result.values;
    const record = db.prepare('INSERT INTO contacts (name,email,message) VALUES (?,?,?)').run(name, email, message);
    res.status(201).json({ id: Number(record.lastInsertRowid), message: '¡Gracias! Tu mensaje quedó guardado.' });
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
  app.use(express.static(staticDir));
  app.get('/', (_req, res) => res.sendFile(resolve(staticDir, 'index.html')));
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Solicitud demasiado grande.' });
    console.error('Request failed:', err.message);
    res.status(500).json({ error: 'No se pudo completar la solicitud.' });
  });
  return app;
}
