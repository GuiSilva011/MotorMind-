export function criarLimitadorCadastro({ limite = 10, janelaMs = 15 * 60 * 1000 } = {}) {
  const tentativas = new Map();
  return (req, res, next) => {
    const agora = Date.now();
    for (const [ip, item] of tentativas) {
      if (item.expiraEm <= agora) tentativas.delete(ip);
    }
    const ip = req.ip;
    let item = tentativas.get(ip);
    if (!item) {
      if (tentativas.size >= 10000) return res.status(429).json({ erro: "Tente o cadastro novamente em alguns minutos." });
      item = { total: 0, expiraEm: agora + janelaMs };
      tentativas.set(ip, item);
    }
    item.total += 1;
    if (item.total > limite) {
      res.set("Retry-After", String(Math.ceil((item.expiraEm - agora) / 1000)));
      return res.status(429).json({ erro: "Muitas tentativas de cadastro. Aguarde alguns minutos antes de tentar novamente." });
    }
    next();
  };
}
