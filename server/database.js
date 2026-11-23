import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { projects } from './projects.js';
export function openDatabase(filename = 'data/portfolio.sqlite') {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL,
      description TEXT NOT NULL, image TEXT NOT NULL, technologies TEXT NOT NULL, url TEXT NOT NULL, repository TEXT);
    CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
      email TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));`);
  const insert = db.prepare(`INSERT INTO projects (id,title,category,description,image,technologies,url,repository)
    VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title, category=excluded.category,
    description=excluded.description, image=excluded.image, technologies=excluded.technologies, url=excluded.url, repository=excluded.repository`);
  for (const p of projects) insert.run(p.id, p.title, p.category, p.description, p.image, JSON.stringify(p.technologies), p.url, p.repository);
  return db;
}
