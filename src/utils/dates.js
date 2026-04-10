function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

function parseBrazilianValue(text) {
  if (!text) return 0;
  const normalized = String(text).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  return Number(normalized || 0);
}

module.exports = { todayIso, formatMoney, parseBrazilianValue };
