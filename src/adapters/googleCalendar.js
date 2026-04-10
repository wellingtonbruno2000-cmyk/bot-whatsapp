const { google } = require('googleapis');

function getCalendarClient() {
  if (process.env.ENABLE_GOOGLE_CALENDAR !== 'true') return null;
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) return null;

  const auth = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/calendar']
  );

  return google.calendar({ version: 'v3', auth });
}

async function createEvent({ title, date, time }) {
  const calendar = getCalendarClient();
  if (!calendar) return null;

  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const event = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    requestBody: {
      summary: title,
      start: { dateTime: start.toISOString(), timeZone: process.env.TIMEZONE || 'America/Sao_Paulo' },
      end: { dateTime: end.toISOString(), timeZone: process.env.TIMEZONE || 'America/Sao_Paulo' }
    }
  });

  return event.data;
}

module.exports = { createEvent };
