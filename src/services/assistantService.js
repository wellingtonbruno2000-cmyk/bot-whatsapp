const { addFinance, getSummary } = require('./financeService');

async function handleMessage(phone, text) {
  const original = String(text || '').trim();
  const msg = original.toLowerCase();

  if (!msg) {
    return 'Não entendi sua mensagem.';
  }

  if (msg === 'oi' || msg === 'ola' || msg === 'olá') {
    return 'Posso registrar suas finanças. Exemplos: "50 combustível", "entrada 1500 salário", "resumo".';
  }

  if (msg === 'resumo' || msg === 'resumo hoje') {
    const resumo = getSummary(phone);

    const entradas = Number(resumo.income || 0);
    const saidas = Number(resumo.expense || 0);
    const saldo = Number(resumo.balance || 0);

    const situacao =
      saldo > 0
        ? 'Situação: saldo positivo.'
        : saldo < 0
        ? 'Situação: saldo negativo.'
        : 'Situação: saldo zerado.';

    return `📊 Resumo financeiro do dia

Entradas: R$ ${entradas.toFixed(2).replace('.', ',')}
Saídas: R$ ${saidas.toFixed(2).replace('.', ',')}
Saldo: R$ ${saldo.toFixed(2).replace('.', ',')}

${situacao}`;
  }

  if (msg.startsWith('entrada ') || msg.startsWith('recebi ')) {
    const partes = original.split(/\s+/);
    const valor = Number((partes[1] || '').replace(',', '.'));
    const categoria = partes.slice(2).join(' ') || 'outros';

    if (!valor || valor <= 0) {
      return 'Envie assim: entrada 1500 salário';
    }

    addFinance(phone, {
      type: 'entrada',
      amount: valor,
      description: categoria
    });

    return `✅ Entrada registrada

Valor: R$ ${valor.toFixed(2).replace('.', ',')}
Categoria: ${categoria}`;
  }

  if (msg.startsWith('saida ') || msg.startsWith('saída ')) {
    const partes = original.split(/\s+/);
    const valor = Number((partes[1] || '').replace(',', '.'));
    const categoria = partes.slice(2).join(' ') || 'outros';

    if (!valor || valor <= 0) {
      return 'Envie assim: saida 50 combustível';
    }

    addFinance(phone, {
      type: 'saida',
      amount: valor,
      description: categoria
    });

    return `✅ Saída registrada

Valor: R$ ${valor.toFixed(2).replace('.', ',')}
Categoria: ${categoria}`;
  }

  const gastoRapido = original.match(/^(\d+[.,]?\d*)\s+(.+)$/);

  if (gastoRapido) {
    const valor = Number(gastoRapido[1].replace(',', '.'));
    const categoria = gastoRapido[2].trim();

    if (!valor || valor <= 0) {
      return 'Não consegui entender o valor.';
    }

    addFinance(phone, {
      type: 'saida',
      amount: valor,
      description: categoria
    });

    return `✅ Gasto registrado

Valor: R$ ${valor.toFixed(2).replace('.', ',')}
Categoria: ${categoria}`;
  }

  return 'Comando não reconhecido. Exemplos: "50 combustível", "entrada 1500 salário", "resumo".';
}

module.exports = { handleMessage };
