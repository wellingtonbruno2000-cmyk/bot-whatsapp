const { addFinance, getSummary } = require('./financeService');

async function handleMessage(phone, text) {
  const msg = String(text || '').trim().toLowerCase();

  if (!msg) {
    return 'Não entendi sua mensagem.';
  }

  if (msg === 'oi' || msg === 'ola' || msg === 'olá') {
    return 'Posso te ajudar com finanças. Exemplos: "entrada 100 salario", "saida 50 mercado", "resumo".';
  }

  if (msg.startsWith('entrada ')) {
    const partes = text.trim().split(/\s+/);
    const valor = Number((partes[1] || '').replace(',', '.'));
    const categoria = partes.slice(2).join(' ') || 'outros';

    if (!valor || valor <= 0) {
      return 'Envie assim: entrada 100 salario';
    }

    addFinance(phone, {
      tipo: 'entrada',
      valor,
      categoria
    });

    return `Entrada registrada: R$ ${valor.toFixed(2).replace('.', ',')} em ${categoria}.`;
  }

  if (msg.startsWith('saida ') || msg.startsWith('saída ')) {
    const partes = text.trim().split(/\s+/);
    const valor = Number((partes[1] || '').replace(',', '.'));
    const categoria = partes.slice(2).join(' ') || 'outros';

    if (!valor || valor <= 0) {
      return 'Envie assim: saida 50 mercado';
    }

    addFinance(phone, {
      tipo: 'saida',
      valor,
      categoria
    });

    return `Saída registrada: R$ ${valor.toFixed(2).replace('.', ',')} em ${categoria}.`;
  }

  if (msg === 'resumo' || msg === 'resumo hoje') {
    const resumo = getSummary(phone);

    return `📊 Resumo de hoje
Entradas: R$ ${resumo.entradas.toFixed(2).replace('.', ',')}
Saídas: R$ ${resumo.saidas.toFixed(2).replace('.', ',')}
Saldo geral: R$ ${resumo.saldo.toFixed(2).replace('.', ',')}`;
  }

  return 'Comando não reconhecido. Use: "entrada 100 salario", "saida 50 mercado" ou "resumo".';
}

module.exports = { handleMessage };
