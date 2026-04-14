const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

function formatarNumero(numero) {
  let apenasDigitos = String(numero || '').replace(/\D/g, '');

  if (!apenasDigitos) {
    throw new Error('Número inválido para ligação.');
  }

  // Se vier sem código do país, adiciona 55
  if (!apenasDigitos.startsWith('55')) {
    apenasDigitos = '55' + apenasDigitos;
  }

  // Caso venha sem o 9 do celular brasileiro:
  // Exemplo errado: 556281284667
  // Correto:        5562981284667
  if (apenasDigitos.length === 12) {
    apenasDigitos = apenasDigitos.slice(0, 4) + '9' + apenasDigitos.slice(4);
  }

  return `+${apenasDigitos}`;
}

async function fazerLigacao(to, mensagem) {
  try {
    const numeroFormatado = formatarNumero(to);

    console.log('Ligando para:', numeroFormatado);

    const call = await client.calls.create({
      to: numeroFormatado,
      from: process.env.TWILIO_PHONE,
      twiml: `<Response><Say language="pt-BR" voice="alice">${mensagem}</Say></Response>`
    });

    return call.sid;
  } catch (error) {
    console.error('Erro ao fazer ligação:', error.message || error);
    throw error;
  }
}

module.exports = { fazerLigacao };
