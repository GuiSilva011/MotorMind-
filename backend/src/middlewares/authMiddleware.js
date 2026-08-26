import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
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

    req.user = {
      id: Number(payload.sub),
      oficinaId: Number(payload.oficinaId),
      role: payload.role,
      email: payload.email,
    };

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