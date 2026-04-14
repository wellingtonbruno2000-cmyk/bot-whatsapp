const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function fazerLigacao(to, mensagem) {
  try {
    await client.calls.create({
      to: to,
      from: process.env.TWILIO_PHONE,
      twiml: `<Response><Say language="pt-BR">${mensagem}</Say></Response>`
    });

    console.log("Ligação feita");
  } catch (err) {
    console.error("Erro:", err);
  }
}

module.exports = { fazerLigacao };
