const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');
const systemPrompt = require('../prompts/systemPrompt');
const { convertOgaToMp3 } = require('../utils/convertAudio');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeAudio(filePath) {
  try {
    const response = await client.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'gpt-4o-transcribe'
    });

    return response.text || '';
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error);
    return '';
  }
}

  try {
    const transcript = await client.audio.transcriptions.create({
      file: fs.createReadStream(finalPath),
      model: 'gpt-4o-mini-transcribe'
    });
    return transcript.text || '';
  } finally {
    if (finalPath !== filePath && fs.existsSync(finalPath)) {
      fs.unlinkSync(finalPath);
    }
  }
}

async function classifyIntent(messageText) {
  if (!process.env.OPENAI_API_KEY) return { intent: 'unknown' };
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: `${systemPrompt}\nResponda sempre em JSON válido.` },
      {
        role: 'user',
        content: `Classifique a intenção e extraia dados da mensagem: ${messageText}

Formato JSON:
{
  "intent":"finance_add|finance_summary|finance_balance|financing_add|financing_list|schedule_add|schedule_list|schedule_cancel|reminder_add|unknown",
  "type":"entrada|saida|null",
  "amount":0,
  "description":"",
  "category":"",
  "title":"",
  "date":"",
  "time":"",
  "id":"",
  "installments":0,
  "monthly_amount":0
}`
      }
    ]
  });
  return JSON.parse(response.choices[0].message.content || '{}');
}

module.exports = { transcribeAudio, classifyIntent };
