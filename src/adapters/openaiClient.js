const OpenAI = require('openai');
const systemPrompt = require('../prompts/systemPrompt');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeAudio(filePath) {
  if (!process.env.OPENAI_API_KEY) return '';
  const fs = require('fs');
  const transcript = await client.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: 'gpt-4o-mini-transcribe'
  });
  return transcript.text || '';
}

async function classifyIntent(messageText) {
  if (!process.env.OPENAI_API_KEY) return { intent: 'unknown' };
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt + '\nResponda sempre em JSON.' },
      {
        role: 'user',
        content: `Classifique a intenção e extraia dados da mensagem: ${messageText}\n\nFormato JSON:\n{\n  "intent":"finance_add|finance_summary|finance_balance|financing_add|financing_list|schedule_add|schedule_list|schedule_cancel|reminder_add|unknown",\n  "type":"entrada|saida|null",\n  "amount":0,\n  "description":"",\n  "category":"",\n  "title":"",\n  "date":"",\n  "time":"",\n  "id":"",\n  "installments":0,\n  "monthly_amount":0\n}`
      }
    ]
  });
  return JSON.parse(response.choices[0].message.content || '{}');
}

module.exports = { transcribeAudio, classifyIntent };
