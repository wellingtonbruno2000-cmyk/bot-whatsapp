const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'ledger.json');

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: {}, processedMessageIds: [] }, null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function getUser(db, phone, timezone = process.env.DEFAULT_TIMEZONE || 'America/Sao_Paulo') {
  if (!db.users[phone]) {
    db.users[phone] = {
      timezone,
      balance: 0,
      transactions: [],
      budgets: {},
      notes: [],
      preferences: {
        currency: 'BRL'
      }
    };
  }
  return db.users[phone];
}

function hasProcessedMessage(db, messageId) {
  return db.processedMessageIds.includes(messageId);
}

function markProcessedMessage(db, messageId) {
  if (!messageId) return;
  db.processedMessageIds.push(messageId);
  if (db.processedMessageIds.length > 5000) {
    db.processedMessageIds = db.processedMessageIds.slice(-2000);
  }
}

module.exports = {
  readDb,
  writeDb,
  getUser,
  hasProcessedMessage,
  markProcessedMessage,
  DB_PATH,
};
