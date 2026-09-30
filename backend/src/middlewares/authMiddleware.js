import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export async function authMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        erro: "Token não informado.",
      });
    }

    const [tipo, token] = authorization.split(" ");

    if (tipo !== "Bearer" || !token) {
      return res.status(401).json({
        erro: "Token inválido.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        erro: "JWT_SECRET não configurado.",
      });
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const id = Number(payload.sub);
    const oficinaId = Number(payload.oficinaId);
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(oficinaId) || oficinaId <= 0) {
      return res.status(401).json({ erro: "Sessão inválida." });
    }
    const usuario = await prisma.usuario.findFirst({
      where: { id, oficinaId, excluidoEm: null },
      select: { id: true, oficinaId: true, Role: true, Email: true, CreatedAt: true },
    });
    // Impede reutilizar a sessão de um ID que tenha sido recriado após um reset.
    if (!usuario || !Number.isFinite(payload.iat) || payload.iat < Math.floor(usuario.CreatedAt.getTime() / 1000)) {
      return res.status(401).json({ erro: "Acesso encerrado. Entre novamente no sistema." });
    }
    req.user = { id: usuario.id, oficinaId: usuario.oficinaId, role: usuario.Role, email: usuario.Email };

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        erro: "Sessão expirada.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        erro: "Token inválido.",
      });
    }

    console.error(error);

    return res.status(500).json({
      erro: "Erro ao validar autenticação.",
    });
  }
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        erro: "Usuário não autenticado.",
      });
    }

    if (
      req.user.role === "OWNER" ||
      roles.includes(req.user.role)
    ) {
      return next();
    }

    return res.status(403).json({
      erro: "Usuário sem permissão.",
    });
  };
}
