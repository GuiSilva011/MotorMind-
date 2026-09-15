import dotenv from "dotenv";
import { configuracaoEmail } from "../src/services/emailBrevoService.js";

dotenv.config({ quiet: true });
try {
  const config = configuracaoEmail();
  console.log("Variáveis de e-mail e URL do frontend válidas.");
  const resposta = await fetch("https://api.brevo.com/v3/senders", {
    headers: { "api-key": config.apiKey, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    console.error(`Brevo recusou a consulta (HTTP ${resposta.status}). Verifique a chave de API e suas permissões.`);
    if (/key not found|invalid.*key|not a valid.*key/i.test(erro.message || "")) {
      console.error("A chave não foi reconhecida. Use uma chave da aba API Keys do Brevo, e não uma chave SMTP.");
    } else if (/unrecognised ip|unrecognized ip|unauthorized ip|ip address/i.test(erro.message || "")) {
      console.error("O Brevo exige autorizar o IP de origem nas configurações de segurança da conta.");
    }
    process.exitCode = 1;
  } else {
    const dados = await resposta.json();
    const remetente = dados.senders?.find(item => item.email?.toLowerCase() === config.remetente.toLowerCase());
    console.log("Conexão autenticada com o Brevo: OK.");
    console.log(`Remetente configurado encontrado: ${remetente ? "sim" : "não"}.`);
    console.log(`Remetente ativo no Brevo: ${remetente?.active === true ? "sim" : "não"}.`);
    if (!remetente?.active) process.exitCode = 1;
    console.log("Consulta concluída. Nenhum e-mail foi enviado.");
  }
} catch (error) {
  console.error(error.status === 503 ? "Confira BREVO_API_KEY, BREVO_SENDER_EMAIL e FRONTEND_URL no backend/.env."
    : `Não foi possível consultar o Brevo (${error.cause?.code || error.name}).`);
  process.exitCode = 1;
}
