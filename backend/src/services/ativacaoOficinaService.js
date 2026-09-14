export class ErroAtivacaoOficina extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const selectOficinaAtivada = {
  id: true,
  nomeFantasia: true,
  status: true,
  licenca: { select: { status: true, ativadaEm: true } },
};

function validarId(valor, rotulo) {
  if (!/^\d+$/.test(String(valor)) || !Number.isSafeInteger(Number(valor)) || Number(valor) <= 0) {
    throw new ErroAtivacaoOficina(`${rotulo} inválido.`);
  }
  return Number(valor);
}

// Usado somente após validar o token de e-mail, dentro da mesma transação.
export async function ativarOficinaNaTransacao(tx, { oficinaId, administradorId }) {
  const id = validarId(oficinaId, "ID da oficina");
  const usuarioId = validarId(administradorId, "ID do administrador");
    const oficinas = await tx.$queryRaw`SELECT id FROM "Oficina" WHERE id = ${id} FOR UPDATE`;
    if (!oficinas.length) throw new ErroAtivacaoOficina("Oficina não encontrada.", 404);

    const oficina = await tx.oficina.findUnique({ where: { id }, select: selectOficinaAtivada });
    const usuario = await tx.usuario.findFirst({
      where: { id: usuarioId, oficinaId: id },
      select: { id: true, Nome: true, Email: true, Role: true },
    });
    if (!usuario || !["OWNER", "ADMIN"].includes(usuario.Role)) {
      throw new ErroAtivacaoOficina("Escolha um responsável ou administrador desta oficina.", 409);
    }
    if (!oficina.licenca) throw new ErroAtivacaoOficina("Esta oficina não possui uma licença cadastrada.", 409);

    if (oficina.status === "ATIVA" && oficina.licenca.status === "ATIVA") {
      if (usuario.Role !== "ADMIN") throw new ErroAtivacaoOficina("A oficina já está ativa. Este fluxo não altera os perfis de uma oficina ativa.", 409);
      return { oficina, administrador: usuario, jaAtiva: true };
    }
    if (oficina.status !== "PENDENTE" || oficina.licenca.status !== "PENDENTE") {
      throw new ErroAtivacaoOficina("Somente oficinas e licenças pendentes podem ser ativadas neste fluxo.", 409);
    }

    const administrador = await tx.usuario.update({
      where: { id: usuario.id, oficinaId: id },
      data: { Role: "ADMIN" },
      select: { id: true, Nome: true, Email: true, Role: true },
    });
    await tx.licenca.update({
      where: { oficinaId: id },
      data: { status: "ATIVA", ativadaEm: new Date() },
    });
    const ativada = await tx.oficina.update({
      where: { id }, data: { status: "ATIVA" }, select: selectOficinaAtivada,
    });
    return { oficina: ativada, administrador, jaAtiva: false };
}
