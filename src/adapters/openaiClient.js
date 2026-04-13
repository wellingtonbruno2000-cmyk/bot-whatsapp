const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const { convertOgaToMp3 } = require('../utils/convertAudio');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function transcribeAudio(filePath) {
  try {
    if (!process.env.OPENAI_API_KEY) return '';

    let finalPath = filePath;
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.oga' || ext === '.ogg') {
      const mp3Path = filePath.replace(/\.(oga|ogg)$/i, '.mp3');
      await convertOgaToMp3(filePath, mp3Path);
      finalPath = mp3Path;
    }

    const response = await client.audio.transcriptions.create({
      file: fs.createReadStream(finalPath),
      model: 'gpt-4o-transcribe'
    });

    return response.text || '';
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error.response?.data || error.message || error);
    return '';
  } finally {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (_) {}

    try {
      if (finalPath !== filePath && finalPath && fs.existsSync(finalPath)) {
        fs.unlinkSync(finalPath);
      }
    } catch (_) {}
  }
}

async function createChatCompletion(messages) {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages
    });

    return response.choices?.[0]?.message?.content || 'Não consegui gerar resposta.';
  } catch (error) {
    console.error('Erro OpenAI:', error.response?.data || error.message || error);
    return 'Erro ao falar com a IA.';
  }
}

module.exports = {
  transcribeAudio,
  createChatCompletion
};
