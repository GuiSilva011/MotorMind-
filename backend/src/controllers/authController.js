import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export async function login(req, res) {
  try {
    const { Email, Senha } = req.body;

    if (!Email?.trim() || !Senha) {
      return res.status(400).json({
        erro: "Email e senha são obrigatórios.",
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        Email: Email.trim(),
      },
      include: {
        oficina: {
          include: {
            licenca: true,
          },
        },
      },
    });

    if (!usuario) {
      return res.status(401).json({
        erro: "Email ou senha inválidos.",
      });
    }

    const senhaValida = await bcrypt.compare(
      Senha,
      usuario.Senha
    );

    if (!senhaValida) {
      return res.status(401).json({
        erro: "Email ou senha inválidos.",
      });
    }

    if (!usuario.oficina) {
      return res.status(403).json({
        erro: "Usuário sem oficina vinculada.",
      });
    }

    if (usuario.oficina.status !== "ATIVA") {
      return res.status(403).json({
        erro: "Oficina sem acesso ao MotorMind.",
      });
    }

    if (!usuario.oficina.licenca) {
      return res.status(403).json({
        erro: "Oficina sem licença.",
      });
    }

    if (usuario.oficina.licenca.status !== "ATIVA") {
      return res.status(403).json({
        erro: "Licença do MotorMind não está ativa.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        erro: "JWT_SECRET não configurado.",
      });
    }

    const token = jwt.sign(
      {
        oficinaId: usuario.oficinaId,
        role: usuario.Role,
        email: usuario.Email,
      },
      process.env.JWT_SECRET,
      {
        subject: String(usuario.id),
        expiresIn: process.env.JWT_EXPIRES_IN || "8h",
      }
    );

    return res.status(200).json({
      token,

      usuario: {
        id: usuario.id,
        Nome: usuario.Nome,
        Email: usuario.Email,
        Role: usuario.Role,
        oficinaId: usuario.oficinaId,

        oficina: {
          id: usuario.oficina.id,
          nomeFantasia: usuario.oficina.nomeFantasia,
          logoUrl: usuario.oficina.logoUrl,
        },
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);

    return res.status(500).json({
      erro: "Erro ao realizar login.",
    });
  }
}

export async function me(req, res) {
  try {
    const usuario = await prisma.usuario.findFirst({
      where: {
        id: req.user.id,
        oficinaId: req.user.oficinaId,
      },
      select: {
        id: true,
        Nome: true,
        Email: true,
        Role: true,
        oficinaId: true,

        oficina: {
          select: {
            id: true,
            nomeFantasia: true,
            razaoSocial: true,
            cnpj: true,
            logoUrl: true,
            status: true,

            licenca: {
              select: {
                status: true,
                compradaEm: true,
                ativadaEm: true,
              },
            },
          },
        },
      },
    });

    if (!usuario) {
      return res.status(404).json({
        erro: "Usuário não encontrado.",
      });
    }

    if (usuario.oficina.status !== "ATIVA") {
      return res.status(403).json({
        erro: "Oficina sem acesso.",
      });
    }

    if (
      !usuario.oficina.licenca ||
      usuario.oficina.licenca.status !== "ATIVA"
    ) {
      return res.status(403).json({
        erro: "Licença sem acesso.",
      });
    }

    return res.status(200).json({
      usuario,
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);

    return res.status(500).json({
      erro: "Erro ao buscar usuário.",
    });
  }
}