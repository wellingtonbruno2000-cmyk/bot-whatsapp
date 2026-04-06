const crypto = require('crypto');
const { readDb, writeDb, getUser } = require('./db');
const { brl, normalizeText, nowInTimezone, dateKey, monthKey, safeNumber } = require('./utils');

const DEFAULT_CATEGORIES = [
  'alimentação', 'mercado', 'gasolina', 'transporte', 'aluguel', 'contas', 'saúde', 'lazer',
  'salário', 'comissão', 'cartão', 'pix', 'outros'
];

function cleanCategory(category) {
  const raw = (category || 'outros').trim();
  if (!raw) return 'outros';
  return raw.slice(0, 40);
}

function cleanDescription(description) {
  const raw = (description || '').trim();
  return raw.slice(0, 80);
}

function addTransaction(phone, transaction, metadata = {}) {
  const db = readDb();
  const user = getUser(db, phone);
  const amount = safeNumber(transaction.amount);
  if (!amount || amount <= 0) {
    return 'Não consegui identificar o valor. Exemplo: “paguei 42 no almoço”.';
  }

  const type = transaction.type === 'entrada' ? 'entrada' : 'saida';
  const category = cleanCategory(transaction.category || inferCategory(transaction.description || ''));
  const description = cleanDescription(transaction.description || '');
  const signedAmount = type === 'entrada' ? amount : -amount;

  user.balance = Number((user.balance + signedAmount).toFixed(2));
  user.transactions.push({
    id: crypto.randomUUID(),
    type,
    amount,
    category,
    description,
    createdAt: new Date().toISOString(),
    source: metadata.source || 'text',
    rawText: metadata.rawText || '',
    transcript: metadata.transcript || '',
  });

  writeDb(db);

  const budget = user.budgets[category];
  let extra = '';
  if (type === 'saida' && budget) {
    const spent = getCategorySpentForCurrentMonth(user, category);
    const remaining = budget - spent;
    extra = remaining >= 0
      ? `\nOrçamento de ${category}: faltam ${brl(remaining)} neste mês.`
      : `\n⚠️ Orçamento de ${category} estourado em ${brl(Math.abs(remaining))}.`;
  }

  return [
    type === 'entrada' ? '✅ Entrada registrada' : '✅ Saída registrada',
    `Valor: ${brl(amount)}`,
    `Categoria: ${category}`,
    description ? `Descrição: ${description}` : null,
    `Saldo atual: ${brl(user.balance)}`,
    extra || null,
  ].filter(Boolean).join('\n');
}

function inferCategory(text) {
  const t = normalizeText(text);
  const rules = [
    ['alimentação', ['almoco', 'janta', 'lanche', 'restaurante', 'ifood', 'comida', 'padaria', 'pizza', 'sushi']],
    ['mercado', ['mercado', 'supermercado', 'atacadao', 'compras', 'assai']],
    ['gasolina', ['gasolina', 'combustivel', 'etanol', 'posto', 'abasteci']],
    ['transporte', ['uber', '99', 'onibus', 'transporte', 'taxi', 'estacionamento', 'pedagio']],
    ['aluguel', ['aluguel', 'condominio']],
    ['contas', ['internet', 'agua', 'luz', 'energia', 'telefone', 'fatura', 'boleto', 'parcela', 'assinatura']],
    ['saúde', ['farmacia', 'medico', 'consulta', 'exame', 'remedio', 'saude', 'dentista']],
    ['lazer', ['cinema', 'bar', 'show', 'lazer', 'festa', 'viagem', 'presente']],
    ['salário', ['salario', 'salário', 'pagamento']],
    ['comissão', ['comissao', 'comissão', 'bonus', 'bônus']],
    ['cartão', ['cartao', 'cartão', 'credito', 'crédito', 'debito', 'débito']],
    ['pix', ['pix']],
  ];

  for (const [category, keywords] of rules) {
    if (keywords.some(keyword => t.includes(normalizeText(keyword)))) {
      return category;
    }
  }

  return 'outros';
}

function getCategorySpentForCurrentMonth(user, category) {
  const month = monthKey(new Date(), user.timezone);
  return user.transactions
    .filter((tx) => tx.type === 'saida' && tx.category === category && monthKey(new Date(tx.createdAt), user.timezone) === month)
    .reduce((sum, tx) => sum + tx.amount, 0);
}

function getBalance(phone) {
  const db = readDb();
  const user = getUser(db, phone);
  return `💰 Saldo atual: ${brl(user.balance)}`;
}

function listRecent(phone, limit = 8) {
  const db = readDb();
  const user = getUser(db, phone);
  const items = user.transactions.slice(-limit).reverse();
  if (!items.length) return 'Ainda não há lançamentos.';

  return [
    '🧾 Últimos lançamentos:',
    ...items.map((tx) => {
      const emoji = tx.type === 'entrada' ? '🟢' : '🔴';
      const when = new Intl.DateTimeFormat('pt-BR', {
        timeZone: user.timezone,
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(tx.createdAt));
      return `${emoji} ${when} • ${tx.category} • ${brl(tx.amount)}${tx.description ? ` • ${tx.description}` : ''}`;
    })
  ].join('\n');
}

function summarize(phone, mode = 'month') {
  const db = readDb();
  const user = getUser(db, phone);
  const todayKey = dateKey(new Date(), user.timezone);
  const thisMonthKey = monthKey(new Date(), user.timezone);

  const filtered = user.transactions.filter((tx) => {
    const created = new Date(tx.createdAt);
    return mode === 'today'
      ? dateKey(created, user.timezone) === todayKey
      : monthKey(created, user.timezone) === thisMonthKey;
  });

  const entradas = filtered.filter(tx => tx.type === 'entrada').reduce((s, tx) => s + tx.amount, 0);
  const saidas = filtered.filter(tx => tx.type === 'saida').reduce((s, tx) => s + tx.amount, 0);
  const byCategory = {};
  filtered.filter(tx => tx.type === 'saida').forEach((tx) => {
    byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amount;
  });

  const top = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => `- ${category}: ${brl(amount)}`);

  return [
    mode === 'today' ? '📊 Resumo de hoje' : '📊 Resumo do mês',
    `Entradas: ${brl(entradas)}`,
    `Saídas: ${brl(saidas)}`,
    `Saldo geral: ${brl(user.balance)}`,
    top.length ? '' : null,
    top.length ? 'Maiores gastos:' : null,
    ...top,
  ].filter(Boolean).join('\n');
}

function deleteLast(phone) {
  const db = readDb();
  const user = getUser(db, phone);
  const last = user.transactions.pop();
  if (!last) return 'Não há lançamento para apagar.';

  user.balance = Number((user.balance - (last.type === 'entrada' ? last.amount : -last.amount)).toFixed(2));
  writeDb(db);

  return [
    '🗑️ Último lançamento apagado',
    `Tipo: ${last.type}`,
    `Valor: ${brl(last.amount)}`,
    `Categoria: ${last.category}`,
    last.description ? `Descrição: ${last.description}` : null,
    `Saldo atual: ${brl(user.balance)}`,
  ].filter(Boolean).join('\n');
}

function setBudget(phone, category, amount) {
  const db = readDb();
  const user = getUser(db, phone);
  const clean = cleanCategory(category || 'outros');
  const value = safeNumber(amount);
  if (!value || value <= 0) {
    return 'Me envie assim: “orçamento alimentação 800”.';
  }
  user.budgets[clean] = value;
  writeDb(db);
  return `🎯 Orçamento salvo\nCategoria: ${clean}\nValor mensal: ${brl(value)}`;
}

function listBudgets(phone) {
  const db = readDb();
  const user = getUser(db, phone);
  const entries = Object.entries(user.budgets || {});
  if (!entries.length) return 'Você ainda não cadastrou orçamentos. Exemplo: “orçamento alimentação 800”.';

  const lines = entries
    .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
    .map(([category, limit]) => {
      const spent = getCategorySpentForCurrentMonth(user, category);
      const remaining = limit - spent;
      return `- ${category}: limite ${brl(limit)} • gasto ${brl(spent)} • restante ${brl(remaining)}`;
    });

  return ['🎯 Seus orçamentos:', ...lines].join('\n');
}

function help() {
  return [
    '👋 Eu posso controlar seu dinheiro por texto e por áudio.',
    '',
    'Exemplos que eu entendo:',
    '- “paguei 39,90 no almoço”',
    '- “comprei gasolina 120”',
    '- “pix de 60 para farmácia”',
    '- “recebi 2500 de salário”',
    '- “saldo”',
    '- “resumo hoje”',
    '- “resumo mês”',
    '- “últimos lançamentos”',
    '- “apagar último”',
    '- “orçamento alimentação 800”',
    '- “ver orçamentos”',
  ].join('\n');
}

function quickParse(text) {
  const original = text.trim();
  const normalized = normalizeText(original);

  if (['oi', 'ola', 'olá', 'menu', 'ajuda', 'start'].includes(normalized)) return { intent: 'help' };
  if (normalized === 'saldo') return { intent: 'balance' };
  if (normalized === 'resumo hoje') return { intent: 'summary_today' };
  if (normalized === 'resumo mes' || normalized === 'resumo mês') return { intent: 'summary_month' };
  if (normalized === 'ultimos lancamentos' || normalized === 'últimos lançamentos' || normalized === 'ultimos' || normalized === 'extrato') return { intent: 'list_recent' };
  if (normalized === 'apagar ultimo' || normalized === 'apagar último') return { intent: 'delete_last' };
  if (normalized === 'ver orcamentos' || normalized === 'ver orçamentos' || normalized === 'orcamentos' || normalized === 'orçamentos') return { intent: 'budget_list' };

  const budget = original.match(/^or[cç]amento\s+(.+?)\s+(\d+[\d.,]*)$/i);
  if (budget) {
    return { intent: 'budget_set', budget: { category: budget[1], amount: Number(budget[2].replace(/\./g, '').replace(',', '.')) } };
  }

  const direct = original.match(/^([+-])\s*(?:r\$\s*)?(\d+[\d.,]*)\s*(.*)$/i);
  if (direct) {
    return {
      intent: 'transaction',
      transaction: {
        type: direct[1] === '+' ? 'entrada' : 'saida',
        amount: Number(direct[2].replace(/\./g, '').replace(',', '.')),
        category: cleanCategory(direct[3] || ''),
        description: cleanDescription(direct[3] || ''),
        confidence: 0.99,
      }
    };
  }

  return null;
}

function executeIntent(phone, interpreted, metadata = {}) {
  const intent = interpreted?.intent || 'unknown';

  switch (intent) {
    case 'transaction':
      return addTransaction(phone, interpreted.transaction || {}, metadata);
    case 'balance':
      return getBalance(phone);
    case 'summary_today':
      return summarize(phone, 'today');
    case 'summary_month':
      return summarize(phone, 'month');
    case 'list_recent':
      return listRecent(phone);
    case 'delete_last':
      return deleteLast(phone);
    case 'budget_set':
      return setBudget(phone, interpreted.budget?.category, interpreted.budget?.amount);
    case 'budget_list':
      return listBudgets(phone);
    case 'help':
      return help();
    default:
      return 'Não entendi por completo. Tente assim: “paguei 42 no almoço”, “recebi 1500”, “saldo” ou “resumo mês”.';
  }
}

module.exports = {
  DEFAULT_CATEGORIES,
  addTransaction,
  getBalance,
  listRecent,
  summarize,
  deleteLast,
  setBudget,
  listBudgets,
  help,
  quickParse,
  executeIntent,
};
