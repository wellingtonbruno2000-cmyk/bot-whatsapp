require('dotenv').config();

const fs = require('fs');
const express = require('express');

const {
  readDb,
  writeDb,
  getUser,
  hasProcessedMessage,
  markProcessedMessage,
} = require('./db');

const {
  quickParse,
  executeIntent,
  DEFAULT_CATEGORIES,
} = require('./finance');

const {
  interpretFinanceMessage,
  transcribeAudio,
} = require('./openaiClient');

const {
  sendWhatsAppText,
  downloadMedia,
} = require('./whatsapp');

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

function validateEnv() {
  const missing = [];

  if (!VERIFY_TOKEN) missing.push('VERIFY_TOKEN');
  if (!WHATSAPP_TOKEN) missing.push('WHATSAPP_TOKEN');
  if (!PHONE_NUMBER_ID) missing.push('PHONE_NUMBER_ID');
  if (!OPENAI_API_KEY) missing.push('OPENAI_API_KEY');

  if (missing.length) {
    console.warn(`Variáveis ausentes: ${missing.join(', ')}`);
  }
}

validateEnv();

app.get('/', (_req, res) => {
  res.status(200).send('Bot financeiro premium do WhatsApp online.');
});

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message || !message.from || !message.id) return;

    const phone = String(message.from).replace(/\D/g, '');

    const db = readDb();
    if (hasProcessedMessage(db, message.id)) return;

    markProcessedMessage(db, message.id);
    writeDb(db);

    const user = getUser(db, phone);
    const categories = [
      ...new Set([
        ...DEFAULT_CATEGORIES,
        ...Object.keys(user?.budgets || {}),
      ]),
    ];

    let originalText = '';
    let source = message.type;

    if (message.type === 'text') {
      originalText = message.text?.body || '';
    } else if (message.type === 'audio' || message.type === 'voice') {
      const mediaId = message.audio?.id || message.voice?.id;

      if (!mediaId) {
        await sendWhatsAppText(phone, 'Erro ao baixar áudio.');
        return;
      }

      const { filePath } = await downloadMedia(mediaId);

      try {
        originalText = await transcribeAudio(filePath);
      } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      if (!originalText) {
        await sendWhatsAppText(phone, 'Não entendi o áudio.');
        return;
      }
    } else {
      await sendWhatsAppText(phone, 'Só entendo texto e áudio.');
      return;
    }

    let interpreted = quickParse(originalText);

    if (!interpreted) {
      interpreted = await interpretFinanceMessage({
        text: originalText,
        timezone: user?.timezone,
        categories,
      });
    }

    const reply = executeIntent(phone, interpreted, {
      source,
      rawText: message.type === 'text' ? originalText : '',
      transcript: message.type !== 'text' ? originalText : '',
    });

    const finalReply =
      message.type !== 'text' && interpreted?.intent === 'transaction'
        ? `🎤 Entendi do áudio: "${originalText}"\n\n${reply}`
        : reply;

    await sendWhatsAppText(phone, finalReply);
  } catch (error) {
    console.error('Erro no webhook:', error);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
