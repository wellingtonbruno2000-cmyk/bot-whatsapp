const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mime = require('mime-types');

const GRAPH_VERSION = 'v23.0';

async function sendWhatsAppText(to, body) {
  const cleanTo = String(to).replace(/\D/g, '');

  const url = 'https://graph.facebook.com/' + GRAPH_VERSION + '/' + process.env.PHONE_NUMBER_ID + '/messages';

  console.log('Enviando para:', cleanTo);
  console.log('PHONE_NUMBER_ID:', process.env.PHONE_NUMBER_ID);

  await axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to: "5562994740555",
      type: 'text',
      text: {
        preview_url: false,
        body,
      },
    },
    {
      headers: {
        Authorization: 'Bearer ' + process.env.WHATSAPP_TOKEN,
        'Content-Type': 'application/json',
      },
    }
  );
}

async function getMediaInfo(mediaId) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}`;
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
  });
  return response.data;
}

async function downloadMedia(mediaId) {
  const info = await getMediaInfo(mediaId);
  const ext = mime.extension(info.mime_type) || 'bin';
  const tmpDir = path.join(__dirname, '..', 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, `${mediaId}.${ext}`);

  const response = await axios.get(info.url, {
    responseType: 'stream',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
  });

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  return { filePath, mimeType: info.mime_type };
}

module.exports = {
  sendWhatsAppText,
  downloadMedia,
};
