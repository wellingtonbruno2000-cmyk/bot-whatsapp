const { readDb, writeDb } = require('../utils/db');
const { todayIso } = require('../utils/dates');
const { createEvent } = require('../adapters/googleCalendar');

function addLocalEvent(phone, { title, date, time }) {
  const db = readDb();
  const event = {
    id: String(Date.now()),
    phone,
    title: title || 'compromisso',
    date: date || todayIso(),
    time: time || '09:00',
    created_at: new Date().toISOString()
  };
  db.events.push(event);
  writeDb(db);
  return event;
}

async function createAppointment(phone, payload) {
  const local = addLocalEvent(phone, payload);
  try {
    const google = await createEvent(payload);
    return { local, google };
  } catch {
    return { local, google: null };
  }
}

function listAppointments(phone, date) {
  const db = readDb();
  return db.events
    .filter((e) => e.phone === phone && (!date || e.date === date))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

function cancelAppointment(phone, id) {
  const db = readDb();
  const index = db.events.findIndex((e) => e.phone === phone && e.id === id);
  if (index === -1) return false;
  db.events.splice(index, 1);
  writeDb(db);
  return true;
}

module.exports = { createAppointment, listAppointments, cancelAppointment };
