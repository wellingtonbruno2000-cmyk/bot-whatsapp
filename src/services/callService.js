const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

function formatarNumero(numero) {
  let apenasDigitos = String(numero).replace(/\D/g, '');

  if (!apenasDigitos.startsWith('55')) {
    apenasDigitos = '55' + apenasDigitos;
  }

  if (apenasDigitos.length === 12) {
    apenasDigitos =
      apenasDigitos.slice(0, 4) + '9' + apenasDigitos.slice(4);
  }

  return `+${apenasDigitos}`;
}

async function fazerLigacao(to, mensagem) {
  const numeroFormatado = formatarNumero(to);

  console.log('Ligando para:', numeroFormatado);

  const call = await client.calls.create({
    to: numeroFormatado,
    from: process.env.TWILIO_PHONE,
    twiml: `<Response><Say voice="Polly.Camila" language="pt-BR">${mensagem}</Say></Response>`
  });

  return call.sid;
}

module.exports = { fazerLigacao };
