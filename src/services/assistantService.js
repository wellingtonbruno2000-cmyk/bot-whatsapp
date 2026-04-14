const { addFinance, getSummary } = require('./financeService');
const { fazerLigacao } = require('./callService');
const fs = require('fs');

async function handleMessage(phone, text) {
  const original = String(text || '').trim();
  const msg = original.toLowerCase();

  if (!msg) {
    return 'Não entendi sua mensagem.';
  }

 // LEMBRETE COM LIGAÇÃO
if (msg.includes('me liga')) {
  const match = msg.match(/(\d{1,2}):(\d{2})/);

  if (!match) {
    return 'Me fala o horário assim: "me liga 18:30 reunião"';
  }

  const hora = match[1];
  const minuto = match[2];

  const texto = msg.split(match[0])[1].trim() || 'Lembrete';

const agora = new Date();

const horario = new Date();
horario.setHours(Number(hora));
horario.setMinutes(Number(minuto));
horario.setSeconds(0);
horario.setMilliseconds(0);

// se já passou, joga pro próximo dia
if (horario <= agora) {
  horario.setDate(horario.getDate() + 1);
}

const delay = horario.getTime() - agora.getTime();

setTimeout(() => {
  require('./callService').fazerLigacao(phone, texto);
}, delay);

return `📞 Ok. Vou te ligar às ${hora}:${minuto} pra: ${texto}`;
  
  if (msg === 'oi' || msg === 'ola' || msg === 'olá') {
    return 'Pode me mandar valores tipo: "50 combustível", "gastei 30 almoço", "recebi 500", "resumo".';
  }

  // RESUMO
  if (msg.includes('resumo')) {
    const resumo = getSummary(phone);

    const entradas = Number(resumo.income || 0);
    const saidas = Number(resumo.expense || 0);
    const saldo = Number(resumo.balance || 0);

    let situacao = 'equilíbrio';
    if (saldo > 0) situacao = 'positivo';
    if (saldo < 0) situacao = 'negativo';

    return `📊 Resumo financeiro

Entradas: R$ ${entradas.toFixed(2).replace('.', ',')}
Saídas: R$ ${saidas.toFixed(2).replace('.', ',')}
Saldo: R$ ${saldo.toFixed(2).replace('.', ',')}

Situação: ${situacao}`;
  }

  // ENTRADAS
  if (msg.includes('recebi') || msg.startsWith('entrada')) {
    const match = original.match(/(\d+[.,]?\d*)/);

    if (!match) {
      return 'Não consegui entender o valor.';
    }

    const valor = Number(match[1].replace(',', '.'));
    const categoria =
      original
        .replace(match[0], '')
        .replace(/recebi|entrada/gi, '')
        .trim() || 'outros';

    addFinance(phone, {
      type: 'entrada',
      amount: valor,
      description: categoria
    });

    return `💰 Entrada registrada

R$ ${valor.toFixed(2).replace('.', ',')}
${categoria}`;
  }

  // FRASE NATURAL DE GASTO
  if (msg.includes('gastei')) {
    const match = original.match(/(\d+[.,]?\d*)/);

    if (!match) {
      return 'Não consegui entender o valor.';
    }

    const valor = Number(match[1].replace(',', '.'));
    const categoria =
      original
        .replace(match[0], '')
        .replace(/gastei/gi, '')
        .trim() || 'outros';

    addFinance(phone, {
      type: 'saida',
      amount: valor,
      description: categoria
    });

    return `✅ Gasto registrado

R$ ${valor.toFixed(2).replace('.', ',')}
${categoria}`;
  }

  // FORMATO DIRETO: "50 combustível"
  const simples = original.match(/^(\d+[.,]?\d*)\s+(.+)$/);

  if (simples) {
    const valor = Number(simples[1].replace(',', '.'));
    const categoria = simples[2].trim() || 'outros';

    addFinance(phone, {
      type: 'saida',
      amount: valor,
      description: categoria
    });

    return `✅ Gasto registrado

R$ ${valor.toFixed(2).replace('.', ',')}
${categoria}`;
  }

  return 'Pode me mandar valores tipo: "50 combustível", "gastei 30 almoço", "recebi 500", "resumo".';
}

module.exports = { handleMessage };
