const { createChatCompletion } = require('../adapters/openaiClient');

async function handleMessage(phone, text) {
  try {
    const systemPrompt = `
Você é um assessor pessoal inteligente.

Você ajuda com:
- finanças
- compromissos
- lembretes
- financiamentos

Responda sempre simples e direto.
`;

    const response = await createChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ]);

    return response;
  } catch (error) {
    console.error('Erro no assistant:', error);
    return 'Erro ao processar sua mensagem.';
  }
}

module.exports = { handleMessage };
