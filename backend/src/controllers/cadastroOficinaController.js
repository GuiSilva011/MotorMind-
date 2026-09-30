import prisma from "../config/prisma.js";
import {
  cadastrarOficina,
  ErroCadastroOficina,
} from "../services/cadastroOficinaService.js";

export async function criarCadastroOficina(req, res) {
  res.set("Cache-Control", "no-store");
  try {
    const cadastro = await cadastrarOficina(prisma, req.body);
    return res.status(201).json(cadastro);
  } catch (error) {
    if (error instanceof ErroCadastroOficina) {
      return res
        .status(error.status)
        .json({ erro: error.message, campos: error.campos });
    }
    // Erros do Prisma podem conter dados recebidos; não registrar o objeto completo.
    console.error("Falha ao cadastrar oficina.");
    return res
      .status(500)
      .json({
        erro: "Não foi possível concluir o cadastro. Tente novamente em instantes.",
      });
  }
}
