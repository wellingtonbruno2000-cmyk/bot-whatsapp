const axios = require('axios');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const API_VERSION = 'v19.0';

function sanitizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

async function sendText(to, body) {
  const url = `https://graph.facebook.com/${API_VERSION}/${process.env.PHONE_NUMBER_ID}/messages`;
  return axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to: sanitizePhone(to),
      type: 'text',
      text: { body }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
}

async function getMediaInfo(mediaId) {
  const url = `https://graph.facebook.com/${API_VERSION}/${mediaId}`;
  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }
  });
  return data;
}

async function downloadMedia(mediaId) {
  const mediaInfo = await getMediaInfo(mediaId);
  const ext = mime.extension(mediaInfo.mime_type) || 'bin';
  const dir = path.join(__dirname, '..', 'data', 'tmp');
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${mediaId}.${ext}`);

  const response = await axios.get(mediaInfo.url, {
    responseType: 'stream',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }
  });

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  return filePath;
}

module.exports = { sendText, downloadMedia, sanitizePhone };
