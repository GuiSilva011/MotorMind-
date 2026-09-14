import prisma from "../config/prisma.js";
import { cadastrarOficina, ErroCadastroOficina } from "../services/cadastroOficinaService.js";
import { solicitarConfirmacaoOficina } from "../services/confirmacaoOficinaService.js";

export async function criarCadastroOficina(req, res) {
  res.set("Cache-Control", "no-store");
  try {
    const cadastro = await cadastrarOficina(prisma, req.body);
    let confirmacao;
    try {
      const envio = await solicitarConfirmacaoOficina(prisma, req.body.Email);
      confirmacao = { enviado: envio.enviado, mensagem: envio.enviado
        ? "Enviamos o link de confirmação para seu e-mail de acesso. Verifique também o spam."
        : "Solicite o e-mail de confirmação para ativar sua oficina." };
    } catch {
      confirmacao = { enviado: false, mensagem: "Seu cadastro foi salvo, mas não foi possível enviar o e-mail agora. Solicite um novo envio em alguns minutos." };
      console.error("Cadastro salvo; envio de confirmação indisponível.");
    }
    return res.status(201).json({ ...cadastro, confirmacao });
  } catch (error) {
    if (error instanceof ErroCadastroOficina) {
      return res.status(error.status).json({ erro: error.message, campos: error.campos });
    }
    // Erros do Prisma podem conter dados recebidos; não registrar o objeto completo.
    console.error("Falha ao cadastrar oficina.");
    return res.status(500).json({ erro: "Não foi possível concluir o cadastro. Tente novamente em instantes." });
  }
}
