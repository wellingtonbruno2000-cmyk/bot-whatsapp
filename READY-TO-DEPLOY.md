# Deploy rápido

## 1) Preencha as variáveis
- VERIFY_TOKEN
- WHATSAPP_TOKEN
- PHONE_NUMBER_ID
- OPENAI_API_KEY
- OPENAI_MODEL
- OPENAI_TRANSCRIBE_MODEL

## 2) Suba no Railway ou Render
Já deixei `Dockerfile`, `railway.json` e `render.yaml` prontos.

## 3) Configure no painel da Meta
- Callback URL: `https://SEU-DOMINIO/webhook`
- Verify token: exatamente o mesmo do `.env`
- Campo assinado: `messages`

## 4) Autorize seu número para teste
Na fase de teste do WhatsApp Cloud API, só números autorizados conseguem conversar com o bot.

## 5) Teste
Envie:
- `paguei 29 no café`
- `recebi 2000`
- um áudio dizendo uma compra
- `saldo`
- `resumo mês`
