import Database from 'better-sqlite3';
try {
  const db = new Database('test.db');
  db.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY)');
  console.log('SQLite is working');
  process.exit(0);
} catch (e) {
  console.error('SQLite failed:', e);
  process.exit(1);
}
