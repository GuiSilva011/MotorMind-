import "dotenv/config";

const resposta = await fetch(
  "https://api.brevo.com/v3/senders",
  {
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      Accept: "application/json",
    },
  }
);

const dados = await resposta.json();

console.log("STATUS:", resposta.status);
console.log("RESPOSTA:", dados);