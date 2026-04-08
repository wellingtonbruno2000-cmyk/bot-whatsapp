const axios = require("axios");

const token = "SEU_TOKEN_AQUI";
const phoneNumberId = "SEU_PHONE_NUMBER_ID";

axios.post(
  `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
  {
    messaging_product: "whatsapp",
    to: "5562981284667",
    type: "text",
    text: {
      body: "Mensagem funcionando 🚀"
    }
  },
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  }
)
.then(res => console.log(res.data))
.catch(err => console.log(err.response.data));
