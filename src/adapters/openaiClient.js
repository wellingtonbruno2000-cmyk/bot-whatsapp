const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function createChatCompletion(messages) {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Erro OpenAI:", error);
    return "Erro ao falar com a IA.";
  }
}

async function transcribeAudio(filePath) {
  try {
    const fs = require('fs');

    const response = await client.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1"
    });

    return response.text;
  } catch (error) {
    console.error("Erro ao transcrever áudio:", error);
    return null;
  }
}

module.exports = {
  createChatCompletion,
  transcribeAudio
};
