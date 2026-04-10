const { readDb, writeDb } = require('../utils/db');
const { todayIso, formatMoney } = require('../utils/dates');

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

function getSummary(phone) {
  const db = readDb();
  const today = todayIso();
  const entries = db.finance_entries.filter((e) => e.phone === phone && e.date === today);
  const income = entries.filter((e) => e.type === 'entrada').reduce((s, e) => s + e.amount, 0);
  const expense = entries.filter((e) => e.type === 'saida').reduce((s, e) => s + e.amount, 0);
  const balance = income - expense;
  return { entries, income, expense, balance };
}

function getOverallBalance(phone) {
  const db = readDb();
  const entries = db.finance_entries.filter((e) => e.phone === phone);
  const income = entries.filter((e) => e.type === 'entrada').reduce((s, e) => s + e.amount, 0);
  const expense = entries.filter((e) => e.type === 'saida').reduce((s, e) => s + e.amount, 0);
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
  return `📊 Resumo de hoje\nEntradas: ${formatMoney(summary.income)}\nSaídas: ${formatMoney(summary.expense)}\nSaldo geral: ${formatMoney(summary.balance)}`;
}

module.exports = {
  addEntry,
  getSummary,
  getOverallBalance,
  addFinancing,
  listFinancings,
  formatEntryResponse,
  formatSummaryResponse
};
