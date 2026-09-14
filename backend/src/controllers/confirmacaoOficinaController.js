import prisma from "../config/prisma.js";
import { confirmarOficina, solicitarConfirmacaoOficina, MENSAGEM_REENVIO } from "../services/confirmacaoOficinaService.js";
import { ErroAtivacaoOficina } from "../services/ativacaoOficinaService.js";
import { ErroEnvioEmail } from "../services/emailBrevoService.js";

function responderErro(res, error) {
  if (error instanceof ErroAtivacaoOficina || error instanceof ErroEnvioEmail) {
    return res.status(error.status).json({ erro: error.message });
  }
  console.error("Falha na confirmação de e-mail da oficina.");
  return res.status(500).json({ erro: "Não foi possível concluir a operação. Tente novamente em instantes." });
}

export async function confirmarEmailOficina(req, res) {
  res.set("Cache-Control", "no-store");
  try { return res.json(await confirmarOficina(prisma, req.body?.token)); }
  catch (error) { return responderErro(res, error); }
}

export async function reenviarConfirmacaoOficina(req, res) {
  res.set("Cache-Control", "no-store");
  try {
    await solicitarConfirmacaoOficina(prisma, req.body?.Email);
    // A resposta pública não revela se o e-mail já existe ou qual o estado da oficina.
    return res.json({ mensagem: MENSAGEM_REENVIO });
  } catch (error) { return responderErro(res, error); }
}
