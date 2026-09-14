import { createHash, randomBytes } from "node:crypto";
import { ativarOficinaNaTransacao, ErroAtivacaoOficina } from "./ativacaoOficinaService.js";
import { configuracaoEmail, enviarConfirmacaoBrevo } from "./emailBrevoService.js";

const DURACAO_LINK = 24 * 60 * 60 * 1000;
export const MENSAGEM_REENVIO = "Se houver um cadastro pendente para este e-mail, enviaremos as instruções de confirmação. Verifique a caixa de entrada e o spam. Aguarde um minuto antes de solicitar novamente.";
const hashToken = token => createHash("sha256").update(token).digest("hex");

export async function solicitarConfirmacaoOficina(db, emailInformado, { enviarEmail = enviarConfirmacaoBrevo, validarConfiguracao = configuracaoEmail } = {}) {
  if (typeof emailInformado !== "string" || emailInformado.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInformado.trim())) {
    throw new ErroAtivacaoOficina("Informe um e-mail válido.");
  }
  validarConfiguracao();
  const email = emailInformado.trim().toLowerCase();
  const envio = await db.$transaction(async tx => {
    const usuario = await tx.usuario.findFirst({
      where: { Email: { equals: email, mode: "insensitive" }, Role: { in: ["OWNER", "ADMIN"] } },
      select: { id: true, oficinaId: true, Nome: true, Email: true },
    });
    if (!usuario) return null;
    await tx.$queryRaw`SELECT id FROM "Oficina" WHERE id = ${usuario.oficinaId} FOR UPDATE`;
    const oficina = await tx.oficina.findUnique({
      where: { id: usuario.oficinaId },
      select: { status: true, nomeFantasia: true, licenca: { select: { status: true } },
        usuarios: { where: { Role: { in: ["OWNER", "ADMIN"] } }, orderBy: { id: "asc" }, take: 1, select: { id: true, Email: true } } },
    });
    if (oficina?.status !== "PENDENTE" || oficina.licenca?.status !== "PENDENTE"
      || oficina.usuarios[0]?.id !== usuario.id || oficina.usuarios[0].Email.toLowerCase() !== email) return null;
    const agora = new Date();
    const recentes = await tx.confirmacaoEmailOficina.findMany({
      where: { oficinaId: usuario.oficinaId, criadoEm: { gt: new Date(agora.getTime() - 60 * 60 * 1000) } },
      orderBy: { criadoEm: "desc" }, take: 5, select: { criadoEm: true },
    });
    if (recentes.length >= 5 || (recentes[0] && agora - recentes[0].criadoEm < 60000)) return null;
    const token = randomBytes(32).toString("hex");
    const registro = await tx.confirmacaoEmailOficina.create({
      data: { oficinaId: usuario.oficinaId, usuarioId: usuario.id, email, tokenHash: hashToken(token), expiraEm: new Date(agora.getTime() + DURACAO_LINK) },
      select: { id: true },
    });
    return { id: registro.id, token, email, nome: usuario.Nome, oficina: oficina.nomeFantasia };
  });
  if (!envio) return { enviado: false, mensagem: MENSAGEM_REENVIO };
  // Chamadas externas ficam fora da transação; falha de envio não apaga o cadastro.
  await enviarEmail(envio);
  await db.confirmacaoEmailOficina.update({ where: { id: envio.id }, data: { enviadoEm: new Date() } });
  return { enviado: true, mensagem: MENSAGEM_REENVIO };
}

export async function confirmarOficina(db, token) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) throw new ErroAtivacaoOficina("Link de confirmação inválido.");
  const tokenHash = hashToken(token);
  const inicial = await db.confirmacaoEmailOficina.findUnique({ where: { tokenHash }, select: { oficinaId: true } });
  if (!inicial) throw new ErroAtivacaoOficina("Link de confirmação inválido.");
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Oficina" WHERE id = ${inicial.oficinaId} FOR UPDATE`;
    const registro = await tx.confirmacaoEmailOficina.findUnique({ where: { tokenHash }, include: { usuario: { select: { id: true, oficinaId: true, Email: true } } } });
    const agora = new Date();
    if (!registro || registro.consumidoEm || registro.invalidadoEm || registro.expiraEm <= agora) {
      throw new ErroAtivacaoOficina("Este link expirou ou já foi utilizado. Entre no sistema ou solicite outro e-mail de confirmação.", 410);
    }
    if (registro.usuario.oficinaId !== registro.oficinaId || registro.usuario.Email.toLowerCase() !== registro.email) {
      throw new ErroAtivacaoOficina("Este link não corresponde mais ao cadastro. Solicite outro e-mail de confirmação.", 410);
    }
    const resultado = await ativarOficinaNaTransacao(tx, { oficinaId: registro.oficinaId, administradorId: registro.usuarioId });
    await tx.confirmacaoEmailOficina.update({ where: { id: registro.id }, data: { consumidoEm: agora } });
    await tx.confirmacaoEmailOficina.updateMany({
      where: { oficinaId: registro.oficinaId, id: { not: registro.id }, consumidoEm: null, invalidadoEm: null },
      data: { invalidadoEm: agora },
    });
    return { mensagem: "E-mail confirmado. Sua oficina está ativa e seu acesso de administrador foi liberado.", ...resultado };
  });
}
