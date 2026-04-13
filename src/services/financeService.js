const { readDb, writeDb } = require('../utils/db');
const { todayIso, formatMoney } = require('../utils/dates');

function currentMonthPrefix() {
  return new Date().toISOString().slice(0, 7);
}

function addEntry(phone, entry) {
  const db = readDb();
  const newEntry = {
    id: String(Date.now()),
    phone,
    date: todayIso(),
    created_at: new Date().toISOString(),
    type: entry.type,
    amount: Number(entry.amount || 0),
    description: entry.description || entry.category || 'sem descrição',
    category: entry.category || entry.description || 'geral'
  };
  db.finance_entries.push(newEntry);
  writeDb(db);
  return newEntry;
}

function addFinance(phone, entry) {
  return addEntry(phone, entry);
}

function sumEntries(entries, type) {
  return entries
    .filter((e) => e.type === type)
    .reduce((s, e) => s + Number(e.amount || 0), 0);
}

function topExpenses(entries, limit = 3) {
  const grouped = {};
  for (const e of entries.filter((x) => x.type === 'saida')) {
    const key = e.category || e.description || 'outros';
    grouped[key] = (grouped[key] || 0) + Number(e.amount || 0);
  }

  return Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, amount]) => ({ name, amount }));
}

function getSummary(phone) {
  const db = readDb();
  const today = todayIso();
  const entries = db.finance_entries.filter((e) => e.phone === phone && e.date === today);
  const income = sumEntries(entries, 'entrada');
  const expense = sumEntries(entries, 'saida');
  const balance = income - expense;
  return { period: 'day', entries, income, expense, balance, topExpenses: topExpenses(entries) };
}

function getMonthlySummary(phone) {
  const db = readDb();
  const month = currentMonthPrefix();
  const entries = db.finance_entries.filter((e) => e.phone === phone && String(e.date || '').startsWith(month));
  const income = sumEntries(entries, 'entrada');
  const expense = sumEntries(entries, 'saida');
  const balance = income - expense;
  return { period: 'month', entries, income, expense, balance, topExpenses: topExpenses(entries) };
}

function getOverallBalance(phone) {
  const db = readDb();
  const entries = db.finance_entries.filter((e) => e.phone === phone);
  const income = sumEntries(entries, 'entrada');
  const expense = sumEntries(entries, 'saida');
  return income - expense;
}

function addFinancing(phone, { description, installments, monthly_amount }) {
  const db = readDb();
  const item = {
    id: String(Date.now()),
    phone,
    description: description || 'financiamento',
    installments: Number(installments || 0),
    monthly_amount: Number(monthly_amount || 0),
    created_at: new Date().toISOString()
  };
  db.financings.push(item);
  writeDb(db);
  return item;
}

function listFinancings(phone) {
  const db = readDb();
  return db.financings.filter((f) => f.phone === phone);
}

function formatEntryResponse(entry, balance) {
  const label = entry.type === 'entrada' ? 'Entrada registrada' : 'Saída registrada';
  return `✅ ${label}\nValor: ${formatMoney(entry.amount)}\nCategoria: ${entry.category}\nDescrição: ${entry.description}\nSaldo atual: ${formatMoney(balance)}`;
}

function formatSummaryResponse(summary) {
  const title = summary.period === 'month' ? '📊 Resumo financeiro do mês' : '📊 Resumo financeiro do dia';
  const lines = [
    title,
    '',
    `Entradas totais: ${formatMoney(summary.income)}`,
    `Saídas totais: ${formatMoney(summary.expense)}`,
    `Saldo líquido: ${formatMoney(summary.balance)}`
  ];

  if (summary.topExpenses.length) {
    lines.push('', 'Principais despesas:');
    summary.topExpenses.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.name} — ${formatMoney(item.amount)}`);
    });
  }

  lines.push('', `Panorama: ${summary.balance > 0 ? 'resultado positivo.' : summary.balance < 0 ? 'resultado negativo. Vale revisar os gastos.' : 'dia em equilíbrio.'}`);
  return lines.join('\n');
}

module.exports = {
  addEntry,
  addFinance,
  getSummary,
  getMonthlySummary,
  getOverallBalance,
  addFinancing,
  listFinancings,
  formatEntryResponse,
  formatSummaryResponse
};
