import bcrypt from "bcryptjs";

export class ErroCadastroOficina extends Error {
  constructor(message, status = 400, campos = {}) {
    super(message);
    this.status = status;
    this.campos = campos;
  }
}

const estados = new Set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" "));
const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarCadastroOficina(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ErroCadastroOficina("Informe os dados da oficina e do responsável.");
  }
  const campos = {};
  function texto(campo, rotulo, limite, obrigatorio = false) {
    const valor = body[campo];
    if (valor != null && typeof valor !== "string") {
      campos[campo] = `${rotulo}: informe um texto válido.`;
      return null;
    }
    const limpo = valor?.trim() || "";
    if (obrigatorio && !limpo) campos[campo] = `${rotulo} é obrigatório.`;
    if (limpo.length > limite) campos[campo] = `${rotulo}: use até ${limite} caracteres.`;
    return limpo || null;
  }
  function email(campo, rotulo, obrigatorio = false) {
    const valor = texto(campo, rotulo, 120, obrigatorio)?.toLowerCase() || null;
    if (valor && !emailValido.test(valor)) campos[campo] = "Informe um e-mail válido.";
    return valor;
  }
  function telefone(campo, rotulo, obrigatorio = false) {
    const valor = texto(campo, rotulo, 20, obrigatorio);
    const digitos = valor?.replace(/[\s()+.-]/g, "") || null;
    if (digitos && !/^\d{10,13}$/.test(digitos)) campos[campo] = "Informe um telefone com DDD.";
    return digitos;
  }

  const oficina = {
    nomeFantasia: texto("nomeFantasia", "Nome da oficina", 120, true),
    razaoSocial: texto("razaoSocial", "Razão social", 150),
    cnpj: texto("cnpj", "CNPJ", 18)?.replace(/[./-]/g, "").toUpperCase() || null,
    email: email("email", "E-mail da oficina"),
    telefone: telefone("telefone", "Telefone", true),
    whatsapp: telefone("whatsapp", "WhatsApp"),
    cep: texto("cep", "CEP", 9)?.replace(/-/g, "") || null,
    endereco: texto("endereco", "Endereço", 120),
    numero: texto("numero", "Número", 10),
    complemento: texto("complemento", "Complemento", 80),
    bairro: texto("bairro", "Bairro", 60),
    cidade: texto("cidade", "Cidade", 60),
    uf: texto("uf", "Estado", 2)?.toUpperCase() || null,
  };
  // Valida o formato; não consulta a situação cadastral do documento.
  if (oficina.cnpj && !/^[A-Z0-9]{12}\d{2}$/.test(oficina.cnpj)) campos.cnpj = "Informe o CNPJ completo, com 14 caracteres.";
  if (oficina.cep && !/^\d{8}$/.test(oficina.cep)) campos.cep = "Informe um CEP com 8 dígitos.";
  if (oficina.uf && !estados.has(oficina.uf)) campos.uf = "Selecione um estado válido.";

  const responsavel = {
    Nome: texto("Nome", "Nome do responsável", 120, true),
    Email: email("Email", "E-mail de acesso", true),
  };
  const senha = body.Senha;
  if (typeof senha !== "string" || senha.trim().length < 8 || Buffer.byteLength(senha, "utf8") > 72) {
    campos.Senha = "Use pelo menos 8 caracteres e no máximo 72 bytes na senha.";
  }
  if (typeof body.confirmarSenha !== "string" || senha !== body.confirmarSenha) {
    campos.confirmarSenha = "As senhas precisam ser iguais.";
  }
  if (Object.keys(campos).length) throw new ErroCadastroOficina("Revise os campos indicados.", 400, campos);
  return { oficina, responsavel, senha };
}

function erroDuplicado() {
  return new ErroCadastroOficina("Já existe um cadastro com este e-mail de acesso ou CNPJ. Se você já se cadastrou, aguarde a ativação ou acesse o login.", 409);
}

export async function cadastrarOficina(db, body) {
  const { oficina, responsavel, senha } = validarCadastroOficina(body);
  const senhaHash = await bcrypt.hash(senha, 12);
  try {
    return await db.$transaction(async (tx) => {
      // Serializa cadastros equivalentes, inclusive e-mails com capitalização diferente.
      const chaves = [`cadastro:email:${responsavel.Email}`];
      if (oficina.cnpj) chaves.push(`cadastro:cnpj:${oficina.cnpj}`);
      for (const chave of chaves.sort()) {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${chave})::bigint)::text`;
      }
      const usuario = await tx.usuario.findFirst({
        where: { Email: { equals: responsavel.Email, mode: "insensitive" } }, select: { id: true },
      });
      if (usuario) throw erroDuplicado();
      if (oficina.cnpj) {
        const cnpjFormatado = oficina.cnpj.replace(/^(.{2})(.{3})(.{3})(.{4})(.{2})$/, "$1.$2.$3/$4-$5");
        const existente = await tx.oficina.findFirst({
          where: { OR: [oficina.cnpj, cnpjFormatado].map(cnpj => ({ cnpj: { equals: cnpj, mode: "insensitive" } })) },
          select: { id: true },
        });
        if (existente) throw erroDuplicado();
      }
      const criada = await tx.oficina.create({
        data: {
          ...oficina,
          status: "PENDENTE",
          usuarios: { create: { ...responsavel, Senha: senhaHash, Role: "ADMIN" } },
          licenca: { create: { status: "PENDENTE" } },
          configuracao: { create: {} },
        },
        select: { nomeFantasia: true, status: true, licenca: { select: { status: true } } },
      });
      return { mensagem: "Cadastro recebido. Confirme seu e-mail para ativar a oficina e liberar o acesso de administrador.", oficina: criada };
    });
  } catch (error) {
    if (error.code === "P2002") throw erroDuplicado();
    throw error;
  }
}
