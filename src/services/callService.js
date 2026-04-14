const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function fazerLigacao(to, mensagem) {
  try {
    const call = await client.calls.create({
      to,
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
