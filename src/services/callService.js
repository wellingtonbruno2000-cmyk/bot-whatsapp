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

  // Se não tiver código do país, adiciona Brasil
  if (!apenasDigitos.startsWith('55')) {
    apenasDigitos = '55' + apenasDigitos;
  }

  // Garante que tenha o 9 no celular
  if (apenasDigitos.length === 12) {
    // Ex: 5562981284667 -> ok
  } else if (apenasDigitos.length === 11) {
    // Ex: 62981284667 -> adiciona 55
    apenasDigitos = '55' + apenasDigitos;
  }

  return `+${apenasDigitos}`;
}

async function fazerLigacao(to, mensagem) {
  try {
    const numeroFormatado = '+5562981284667';

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
