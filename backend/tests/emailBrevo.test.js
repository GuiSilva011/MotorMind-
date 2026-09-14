import test from "node:test";
import assert from "node:assert/strict";
import { configuracaoEmail, enviarConfirmacaoBrevo, ErroEnvioEmail } from "../src/services/emailBrevoService.js";

const env = { BREVO_API_KEY: "chave-sintetica", BREVO_SENDER_EMAIL: "envio@example.invalid", FRONTEND_URL: "https://oficinas.example.invalid", BREVO_SENDER_NAME: "MotorMind" };
const dados = { email: "admin@example.invalid", nome: "Nome <script>", oficina: "Oficina & Cia", token: "a".repeat(64) };

test("configuração exige chave, remetente e URL confiável", () => {
  assert.equal(configuracaoEmail(env).frontend, env.FRONTEND_URL);
  assert.equal(configuracaoEmail({ ...env, FRONTEND_URL: "http://localhost:5173" }).frontend, "http://localhost:5173");
  for (const invalido of [{ BREVO_API_KEY: "" }, { BREVO_SENDER_EMAIL: "invalido" }, { FRONTEND_URL: "http://site.example.invalid" }, { FRONTEND_URL: "https://site.example.invalid/?token=x" }, { FRONTEND_URL: "https://usuario:senha@site.example.invalid" }, { FRONTEND_URL: "javascript:alert(1)" }]) {
    assert.throws(() => configuracaoEmail({ ...env, ...invalido }), ErroEnvioEmail);
  }
});

test("integração Brevo envia confirmação HTML escapada, sem senha, com token no fragmento", async () => {
  let chamada;
  await enviarConfirmacaoBrevo(dados, { env, fetchImpl: async (url, options) => {
    chamada = { url, ...options, body: JSON.parse(options.body) };
    return new Response(JSON.stringify({ messageId: "mensagem-sintetica" }), { status: 201 });
  } });
  assert.equal(chamada.url, "https://api.brevo.com/v3/smtp/email");
  assert.equal(chamada.method, "POST");
  assert.equal(chamada.headers["api-key"], env.BREVO_API_KEY);
  assert.deepEqual(chamada.body.to, [{ email: dados.email, name: dados.nome }]);
  assert.equal(chamada.body.textContent, undefined);
  assert.ok(chamada.body.htmlContent.includes("Nome &lt;script&gt;"));
  assert.ok(chamada.body.htmlContent.includes("Oficina &amp; Cia"));
  assert.ok(chamada.body.htmlContent.includes(`/confirmar-oficina#token=${dados.token}`));
  assert.equal(chamada.body.htmlContent.includes(env.BREVO_API_KEY), false);
  assert.equal(chamada.body.htmlContent.includes("<script>"), false);
});

test("rejeição, timeout e resposta sem messageId nunca são tratados como envio confirmado", async () => {
  for (const fetchImpl of [
    async () => new Response("falha privada", { status: 401 }),
    async () => { throw new Error("detalhe externo privado"); },
    async () => new Response("{}", { status: 201 }),
  ]) {
    await assert.rejects(enviarConfirmacaoBrevo(dados, { env, fetchImpl }), error => error instanceof ErroEnvioEmail && error.status === 503 && !error.message.includes("privad"));
  }
});
