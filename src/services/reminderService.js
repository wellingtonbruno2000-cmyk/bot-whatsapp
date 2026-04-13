const { readDb, writeDb } = require('../utils/db');

function addReminder(phone, { description, date }) {
  const db = readDb();
  const reminder = {
    id: String(Date.now()),
    phone,
    description: description || 'lembrete',
    date: date || '',
    created_at: new Date().toISOString()
  };
  db.reminders.push(reminder);
  writeDb(db);
  return reminder;
}

module.exports = { addReminder };
