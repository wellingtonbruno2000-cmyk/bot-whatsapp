const { classifyIntent } = require('../adapters/openaiClient');
const finance = require('./financeService');
const calendar = require('./calendarService');
const reminders = require('./reminderService');
const { todayIso, formatMoney, parseBrazilianValue } = require('../utils/dates');

function inferTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function parseFinanceCommand(rawText, kind) {
  const withoutPrefix = rawText.replace(/^entrada\s+/i, '').replace(/^sa[ií]da\s+/i, '').trim();
  const parts = withoutPrefix.split(/\s+/);
  const firstToken = parts[0] || '';
  const amount = parseBrazilianValue(firstToken);
  const description = parts.slice(1).join(' ').trim() || 'geral';

  if (!amount || amount <= 0) return null;
  return {
    type: kind,
    amount,
    description,
    category: description
  };
}

async function handleMessage(phone, text) {
  const raw = String(text || '').trim();
  const lower = raw.toLowerCase();

  if (!lower) return 'Não entendi a mensagem.';

  if (['oi', 'ola', 'olá', 'menu', 'ajuda'].includes(lower)) {
    return 'Posso te ajudar com finanças, compromissos, lembretes e financiamentos. Exemplos: "entrada 100 salario", "saida 45 mercado", "resumo", "resumo mês", "agendar visita amanhã 15:00".';
  }

  if (/^entrada\s+/i.test(raw)) {
    const parsed = parseFinanceCommand(raw, 'entrada');
    if (!parsed) return 'Envie assim: entrada 100 salario';
    const entry = finance.addFinance(phone, parsed);
    const balance = finance.getOverallBalance(phone);
    return finance.formatEntryResponse(entry, balance);
  }

  if (/^sa[ií]da\s+/i.test(raw)) {
    const parsed = parseFinanceCommand(raw, 'saida');
    if (!parsed) return 'Envie assim: saida 50 mercado';
    const entry = finance.addFinance(phone, parsed);
    const balance = finance.getOverallBalance(phone);
    return finance.formatEntryResponse(entry, balance);
  }

  if (lower === 'resumo' || lower === 'resumo hoje') {
    return finance.formatSummaryResponse(finance.getSummary(phone));
  }

  if (lower === 'resumo mes' || lower === 'resumo mês') {
    return finance.formatSummaryResponse(finance.getMonthlySummary(phone));
  }

  if (lower === 'saldo') {
    return `💰 Seu saldo acumulado é ${formatMoney(finance.getOverallBalance(phone))}`;
  }

  const parsed = await classifyIntent(lower);

  if (parsed.intent === 'finance_summary') {
    return finance.formatSummaryResponse(finance.getSummary(phone));
  }

  if (parsed.intent === 'finance_balance') {
    return `💰 Seu saldo acumulado é ${formatMoney(finance.getOverallBalance(phone))}`;
  }

  if (parsed.intent === 'financing_add' || lower.startsWith('adicionar financiamento')) {
    const installmentsMatch = lower.match(/(\d+)x/);
    const amountMatch = lower.match(/(\d+[\d.,]*)$/);
    const item = finance.addFinancing(phone, {
      description: parsed.description || lower.replace('adicionar financiamento', '').trim() || 'financiamento',
      installments: parsed.installments || (installmentsMatch ? Number(installmentsMatch[1]) : 0),
      monthly_amount: parsed.monthly_amount || (amountMatch ? parseBrazilianValue(amountMatch[1]) : 0)
    });
    return `🏦 Financiamento salvo\nDescrição: ${item.description}\nParcelas: ${item.installments}\nValor mensal: ${formatMoney(item.monthly_amount)}`;
  }

  if (parsed.intent === 'financing_list' || lower === 'parcelas' || lower === 'financiamentos') {
    const list = finance.listFinancings(phone);
    if (!list.length) return 'Você ainda não cadastrou financiamentos.';
    return `🏦 Financiamentos\n${list.map((f, i) => `${i + 1}. ${f.description} - ${f.installments}x de ${formatMoney(f.monthly_amount)}`).join('\n')}`;
  }

  if (parsed.intent === 'schedule_add' || lower.startsWith('agendar ')) {
    const date = parsed.date || (lower.includes('amanhã') ? inferTomorrow() : todayIso());
    const timeMatch = lower.match(/(\d{1,2}:\d{2})/);
    const time = parsed.time || (timeMatch ? timeMatch[1] : '09:00');
    const title = parsed.title || lower.replace('agendar', '').replace('amanhã', '').replace(/\d{1,2}:\d{2}/, '').trim() || 'compromisso';
    const result = await calendar.createAppointment(phone, { title, date, time });
    return `📅 Compromisso agendado\nTítulo: ${result.local.title}\nData: ${result.local.date}\nHora: ${result.local.time}`;
  }

  if (parsed.intent === 'schedule_list' || lower === 'agenda hoje' || lower === 'agenda amanhã' || lower === 'agenda') {
    const date = lower.includes('amanhã') ? inferTomorrow() : (lower.includes('hoje') ? todayIso() : null);
    const events = calendar.listAppointments(phone, date);
    if (!events.length) return 'Você não tem compromissos nessa data.';
    return `📅 Compromissos\n${events.map((e) => `${e.id} - ${e.date} ${e.time} - ${e.title}`).join('\n')}`;
  }

  if (parsed.intent === 'schedule_cancel' || lower.startsWith('cancelar compromisso')) {
    const id = parsed.id || (lower.match(/(\d{6,})/) || [])[1];
    if (!id) return 'Me passe o ID do compromisso para cancelar.';
    return calendar.cancelAppointment(phone, id) ? '🗑️ Compromisso cancelado.' : 'Não encontrei esse compromisso.';
  }

  if (parsed.intent === 'reminder_add' || lower.startsWith('lembrar ') || lower.startsWith('lembrete ')) {
    const reminder = reminders.addReminder(phone, {
      description: parsed.description || lower.replace(/^lembrar |^lembrete /, '').trim(),
      date: parsed.date || ''
    });
    return `⏰ Lembrete salvo\nDescrição: ${reminder.description}${reminder.date ? `\nData: ${reminder.date}` : ''}`;
  }

  return 'Comando não reconhecido. Use: "entrada 100 salario", "saida 50 mercado", "resumo", "resumo mês", "saldo", "agendar visita amanhã 15:00".';
}

module.exports = { handleMessage };
