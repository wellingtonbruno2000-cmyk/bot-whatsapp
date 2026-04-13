const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    return { users: {}, messages: [], finance_entries: [], financings: [], events: [], reminders: [] };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function getUser(db, phone) {
  if (!db.users[phone]) {
    db.users[phone] = {
      phone,
      created_at: new Date().toISOString(),
      timezone: process.env.TIMEZONE || 'America/Sao_Paulo'
    };
  }
  return db.users[phone];
}

module.exports = { readDb, writeDb, getUser };
