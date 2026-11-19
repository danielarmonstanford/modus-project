import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.MODUS_DB_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Missing MODUS_DB_DATABASE_URL or DATABASE_URL.');
  process.exit(1);
}
const migration = await readFile(new URL('../migrations/001_create_subscribers.sql', import.meta.url), 'utf8');
await neon(databaseUrl).query(migration);
console.log('Subscriber migration completed.');
