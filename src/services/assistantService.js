const { addFinance, getSummary } = require('./financeService');

async function handleMessage(phone, text) {
  const original = String(text || '').trim();
  const msg = original.toLowerCase();

  if (!msg) {
    return 'Não entendi sua mensagem.';
  }

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
