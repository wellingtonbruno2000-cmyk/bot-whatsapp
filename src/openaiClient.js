const fs = require('fs');
const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeAudio(filePath) {
  const result = await client.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe',
    language: 'pt',
  });

  return (result.text || '').trim();
}

async function interpretFinanceMessage({ text, timezone = 'America/Sao_Paulo', categories = [] }) {
  const categoryList = categories.length
    ? categories.join(', ')
    : 'alimentação, mercado, gasolina, transporte, aluguel, contas, saúde, lazer, salário, comissão, cartão, pix, outros';

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.1,
    messages: [
      {
        role: 'system',
        content:
          'Você extrai intenções financeiras de mensagens do WhatsApp em português do Brasil. ' +
          'Responda SOMENTE JSON válido com este formato: ' +
          '{"intent":"transaction|balance|summary_today|summary_month|list_recent|delete_last|help|budget_set|budget_list|unknown","transaction":{"type":"entrada|saida","amount":123.45,"category":"texto curto","description":"texto curto","confidence":0.0},"budget":{"category":"texto curto","amount":0},"reply_hint":"texto curto","raw_text":"texto original"}. ' +
          'Se a pessoa disser qualquer compra, gasto, pagamento, pix enviado, débito, mercado, gasolina, lanche, parcela, assinatura, aluguel, conta, consulta, remédio, roupa, presente, viagem etc, isso é uma saída. ' +
          'Se disser recebeu, entrou, salário, comissão, bônus, venda recebida, pix recebido, isso é entrada. ' +
          'Para pedidos de saldo/resumo/listagem/ajuda, defina o intent correto. ' +
          `Prefira categorias dentro desta lista quando fizer sentido: ${categoryList}. ` +
          'amount deve ser número decimal em reais. confidence vai de 0 a 1. ' +
          'Se faltar valor para registrar transação, use intent unknown.'
      },
      {
        role: 'user',
        content: `Timezone do usuário: ${timezone}. Mensagem: ${text}`,
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content || '{}';
  return JSON.parse(content);
}

module.exports = {
  transcribeAudio,
  interpretFinanceMessage,
};
