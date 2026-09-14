export class ErroEnvioEmail extends Error {
  constructor(message = "Não foi possível enviar o e-mail de confirmação. Tente novamente em alguns minutos.") {
    super(message);
    this.status = 503;
  }
}

export function configuracaoEmail(env = process.env) {
  let url;
  try { url = new URL(env.FRONTEND_URL); } catch { throw new ErroEnvioEmail(); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (!env.BREVO_API_KEY?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.BREVO_SENDER_EMAIL || "")
    || (url.protocol !== "https:" && !(local && url.protocol === "http:"))
    || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new ErroEnvioEmail();
  }
  return { apiKey: env.BREVO_API_KEY, remetente: env.BREVO_SENDER_EMAIL, nome: env.BREVO_SENDER_NAME || "MotorMind", frontend: url.origin };
}

function escaparHtml(texto) {
  return String(texto).replace(/[&<>"']/g, caractere => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[caractere]);
}

export async function enviarConfirmacaoBrevo({ email, nome, oficina, token }, { env = process.env, fetchImpl = fetch } = {}) {
  const config = configuracaoEmail(env);
  // O fragmento não é enviado ao servidor da página nem em cabeçalhos Referer.
  const link = `${config.frontend}/confirmar-oficina#token=${encodeURIComponent(token)}`;
  const mensagem = `Olá, ${nome}. Confirme seu e-mail para ativar a oficina ${oficina} e seu acesso de administrador ao MotorMind. Use o e-mail e a senha informados no cadastro para entrar após a confirmação. O link é válido por 24 horas. Esta confirmação não registra um pagamento. Se você não fez este cadastro, ignore esta mensagem.`;
  let resposta;
  try {
    resposta = await fetchImpl("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": config.apiKey, "Content-Type": "application/json", Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        sender: { email: config.remetente, name: config.nome },
        to: [{ email, name: nome }],
        subject: "Confirme seu e-mail e ative sua oficina — MotorMind",
        htmlContent: `<html lang="pt-BR"><body style="font-family:Arial,sans-serif;color:#0e1830;line-height:1.6"><h1>Ative sua oficina no MotorMind</h1><p>${escaparHtml(mensagem)}</p><p><a href="${escaparHtml(link)}" style="display:inline-block;background:#2f8fe0;color:#0e1830;padding:14px 22px;text-decoration:none;border-radius:6px">Confirmar e ativar oficina</a></p><p>Se o botão não funcionar, copie este endereço:<br>${escaparHtml(link)}</p></body></html>`,
      }),
    });
    if (!resposta.ok || !(await resposta.json()).messageId) throw new ErroEnvioEmail();
  } catch {
    // Não propaga respostas/erros externos que possam conter destinatários, chave ou link.
    throw new ErroEnvioEmail();
  }
}
