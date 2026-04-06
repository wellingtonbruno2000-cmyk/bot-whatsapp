# Bot Financeiro Premium para WhatsApp

Bot de controle financeiro com cara de produto pago:
- entende texto livre
- entende áudio do WhatsApp
- classifica categorias
- registra entradas e saídas
- mostra saldo
- resumo do dia e do mês
- últimos lançamentos
- apagar último lançamento
- orçamentos mensais por categoria

## Exemplos que ele entende

### Texto
- `paguei 39,90 no almoço`
- `comprei gasolina 120`
- `pix de 85 para farmácia`
- `recebi 2500 de salário`
- `saldo`
- `resumo hoje`
- `resumo mês`
- `últimos lançamentos`
- `apagar último`
- `orçamento alimentação 800`
- `ver orçamentos`

### Áudio
Pode mandar áudio normal como:
- “paguei 42 reais no lanche agora”
- “acabei de abastecer 150 de gasolina”
- “recebi 3 mil do salário”

## Tecnologias
- WhatsApp Cloud API
- OpenAI para transcrição de áudio
- OpenAI para interpretar linguagem natural
- Node.js + Express

## Variáveis obrigatórias
Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

- `VERIFY_TOKEN`
- `WHATSAPP_TOKEN`
- `PHONE_NUMBER_ID`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_TRANSCRIBE_MODEL`

## Rodando localmente

```bash
npm install
npm start
```

## Webhook do Meta
Configure no painel da Meta:
- Callback URL: `https://SEU-DOMINIO/webhook`
- Verify token: o mesmo `VERIFY_TOKEN`
- Assinar campo: `messages`

## Deploy rápido

### Railway
1. Crie um projeto novo
2. Faça upload desta pasta ou conecte ao GitHub
3. Adicione as variáveis do `.env`
4. Faça deploy
5. Copie a URL pública e configure no painel da Meta

### Render
1. Crie um novo Web Service
2. Suba essa pasta ou conecte ao GitHub
3. Informe as variáveis do `.env`
4. Deploy

## Estrutura dos dados
Os lançamentos ficam em `data/ledger.json`.
Para produção mais séria, o ideal é trocar para Postgres ou Supabase.

## Observações
- O bot já faz um parser rápido para comandos comuns.
- Se o texto vier solto, a IA interpreta a intenção.
- Se chegar áudio, ele baixa o arquivo do WhatsApp, transcreve e depois registra.
