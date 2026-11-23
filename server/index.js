import { openDatabase } from './database.js';
import { createApp } from './app.js';
const db = openDatabase(process.env.DATABASE_PATH || 'data/portfolio.sqlite');
const server = createApp(db).listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log(`Portfolio listening on port ${process.env.PORT || 3000}`));
function shutdown() { server.close(() => { db.close(); process.exit(0); }); }
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
