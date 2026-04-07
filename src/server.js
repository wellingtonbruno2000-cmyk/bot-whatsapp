const axios = require("axios");

const token = "EAASnj8xc5tgBRCdk3t6TqiPBwBjGn0Gu3CqHY9DGIohbiS0MDyYFM4EmtLOidLvdVZBraOMyDGhWsJx5WBUAzdl93oXCiXiUOEKG80UTD8v9Rx322DWZBc097ZBx6cxVSco2WTMfZAbaCpZCvaYOScKVxHdwZAz6yd3F1kcEudIzngzsVEY1j75FibmXN7B4ZClvHTEX6dwkjaipMB8ZA6QMZBhBiTadZBcuutmeKZBoSx4tZC2JbH5Wxopf8KLsrXkwxQZAYzKOMZChIYknNLAtqPenuOygaa1ZAwC5flwdpK9";
const phoneNumberId = "1077075858819607";

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
