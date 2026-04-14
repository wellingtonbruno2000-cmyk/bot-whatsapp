require('dotenv').config();
const express = require('express');
const fs = require('fs');

const { sendText, downloadMedia, sanitizePhone } = require('./adapters/whatsapp');
const { transcribeAudio } = require('./adapters/openaiClient');
const { handleMessage } = require('./services/assistantService');
const { fazerLigacao } = require('./services/callService');
const { readDb, writeDb, getUser } = require('./utils/db');

const app = express();
app.use(express.json({ limit: '10mb' }));

function formatPhoneForCall(phone) {
  const onlyDigits = String(phone || '').replace(/\D/g, '');
  if (!onlyDigits) return '';
  return `+${onlyDigits}`;
}

app.get('/', (_req, res) => {
  res.status(200).send('Assessor WhatsApp Bot online.');
});

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message || message.from === process.env.BUSINESS_PHONE) return;

    const phone = sanitizePhone(message.from);
    const db = readDb();

    getUser(db, phone);
    db.messages.push({
      id: message.id,
      phone,
      type: message.type,
      created_at: new Date().toISOString()
    });
    writeDb(db);

    let text = '';

    if (message.type === 'text') {
      text = message.text?.body || '';
    } else if (message.type === 'audio') {
      const filePath = await downloadMedia(message.audio.id);
      text = await transcribeAudio(filePath);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      if (!text) {
        await sendText(phone, 'Não consegui entender o áudio. Tente mandar em texto.');
        return;
      }
    } else {
      await sendText(phone, 'No momento eu entendo apenas texto e áudio.');
      return;
    }

    const normalizedText = String(text || '').trim().toLowerCase();

    if (normalizedText === 'ligar agora') {
      const phoneToCall = formatPhoneForCall(phone);

      if (!phoneToCall) {
        await sendText(phone, 'Não consegui identificar o número para a ligação.');
        return;
      }

      await fazerLigacao(phoneToCall, 'Olá. Este é um teste de ligação do seu assistente.');
      await sendText(phone, 'Ligação iniciada.');
      return;
    }

    const reply = await handleMessage(phone, text);
    await sendText(phone, reply);
  } catch (error) {
    console.error('Erro no webhook:', error.response?.data || error.message || error);
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
