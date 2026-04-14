const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

function formatarNumero(numero) {
  const apenasDigitos = String(numero || '').replace(/\D/g, '');

  if (!apenasDigitos) {
    throw new Error('Número inválido para ligação.');
  }

  return `+${apenasDigitos}`;
}

async function fazerLigacao(to, mensagem) {
  try {
    const numeroFormatado = formatarNumero(to);

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
