import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import express from "express";
import { cadastrarOficina } from "../src/services/cadastroOficinaService.js";

test("cadastro público via HTTP/PostgreSQL isolado", { skip: process.env.MOTORMIND_TESTE_CADASTRO !== "1", timeout: 120000 }, async t => {
  dotenv.config({ quiet: true });
  const urlOriginal = process.env.DATABASE_URL;
  const segredoOriginal = process.env.JWT_SECRET;
  const brevoOriginal = process.env.BREVO_API_KEY;
  const envioOriginal = Object.fromEntries(["BREVO_SENDER_EMAIL", "BREVO_SENDER_NAME", "FRONTEND_URL"].map(nome => [nome, process.env[nome]]));
  // Valor vazio impede que a carga automática de .env pelo Prisma restaure a chave real.
  process.env.BREVO_API_KEY = "";
  assert.ok(urlOriginal, "Configure o PostgreSQL de desenvolvimento.");
  const schemaTeste = `cadastro_test_${randomUUID().replaceAll("-", "")}`;
  assert.match(schemaTeste, /^cadastro_test_[a-f0-9]{32}$/);
  const urlTeste = new URL(urlOriginal);
  assert.notEqual(urlTeste.searchParams.get("schema"), schemaTeste);
  urlTeste.searchParams.set("schema", schemaTeste);
  const admin = new PrismaClient({ datasources: { db: { url: urlOriginal } } });
  let criado = false;
  let db; let servidor;
  try {
    await admin.$executeRawUnsafe(`CREATE SCHEMA "${schemaTeste}"`);
    criado = true;
    process.env.DATABASE_URL = urlTeste.toString();
    process.env.JWT_SECRET = randomUUID();
    const migration = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env: process.env, encoding: "utf8", windowsHide: true, timeout: 60000 });
    assert.equal(migration.status, 0, "As migrations precisam funcionar no schema descartável.");
    db = (await import("../src/config/prisma.js")).default;
    const auth = (await import("../src/routes/authRoutes.js")).default;
    const estoque = (await import("../src/routes/estoqueRoutes.js")).default;
    const app = express();
    app.use(express.json());
    app.use("/auth", auth);
    app.use("/estoque", estoque);
    servidor = app.listen(0, "127.0.0.1");
    await new Promise(resolve => servidor.once("listening", resolve));
    const base = `http://127.0.0.1:${servidor.address().port}`;
    const fetchOriginal = globalThis.fetch;
    const emails = [];
    let falharEnvio = false;
    let simularBrevo = false;
    t.mock.method(globalThis, "fetch", async (url, options) => {
      if (url === "https://api.brevo.com/v3/smtp/email") {
        assert.ok(simularBrevo, "O envio deve permanecer desabilitado antes de configurar o simulador.");
        const body = JSON.parse(options.body);
        const tokenEmail = body.htmlContent.match(/#token=([a-f0-9]{64})/)[1];
        emails.push({ email: body.to[0].email, token: tokenEmail });
        return new Response(JSON.stringify(falharEnvio ? { message: "Falha sintética" } : { messageId: randomUUID() }), { status: falharEnvio ? 503 : 201 });
      }
      assert.ok(String(url).startsWith(base), "O teste só pode acessar o servidor local ou o simulador do Brevo.");
      return fetchOriginal(url, options);
    });
    async function call(method, path, body, token) {
      const response = await fetch(`${base}${path}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
      return { status: response.status, data: await response.json() };
    }
    const senha = `  ${randomUUID()}  `;
    const dados = (email = "oficina@example.invalid") => ({ nomeFantasia: "Oficina sintética", telefone: "(11) 99999-0000", Nome: "Responsável sintético", Email: email, Senha: senha, confirmarSenha: senha });
    const contagens = async () => Promise.all([db.oficina.count(), db.usuario.count(), db.licenca.count(), db.configuracaoOficina.count()]);
    let primeira; let token;

    await t.test("dados inválidos retornam 400 e não criam registros", async () => {
      const result = await call("POST", "/auth/cadastro-oficina", { ...dados(), Email: "inválido", Senha: {}, uf: "XX" });
      assert.equal(result.status, 400);
      assert.ok(result.data.campos.Email && result.data.campos.Senha && result.data.campos.uf);
      assert.deepEqual(await contagens(), [0, 0, 0, 0]);
      const divergente = await call("POST", "/auth/cadastro-oficina", { ...dados(), email: "outro@example.invalid" });
      assert.equal(divergente.status, 400);
      assert.ok(divergente.data.campos.Email);
      assert.deepEqual(await contagens(), [0, 0, 0, 0]);
    });
    await t.test("cadastro é público, cria responsável e licença pendentes e ignora vínculos/status forjados", async () => {
      const result = await call("POST", "/auth/cadastro-oficina", { ...dados(), oficinaId: 99999, Role: "ADMIN", status: "ATIVA", licenca: { status: "ATIVA", valor: 0 }, codigoCompra: "forjado", ativadaEm: new Date().toISOString() });
      assert.equal(result.status, 201);
      assert.equal(result.data.oficina.status, "PENDENTE");
      assert.equal(result.data.oficina.licenca.status, "PENDENTE");
      assert.equal(result.data.token, undefined);
      assert.equal(JSON.stringify(result.data).includes(senha), false);
      primeira = await db.oficina.findFirst({ include: { usuarios: true, licenca: true, configuracao: true } });
      assert.equal(primeira.usuarios.length, 1);
      assert.equal(primeira.email, "oficina@example.invalid");
      assert.equal(primeira.email, primeira.usuarios[0].Email);
      assert.equal(result.data.oficina.email, primeira.email);
      assert.equal(result.data.confirmacao.enviado, false);
      assert.match(result.data.confirmacao.mensagem, /serviço de envio precisa de ajuste/);
      assert.equal(primeira.usuarios[0].Role, "ADMIN");
      assert.equal(primeira.usuarios[0].oficinaId, primeira.id);
      assert.equal(await bcrypt.compare(senha, primeira.usuarios[0].Senha), true);
      assert.equal(primeira.licenca.valor, null);
      assert.equal(primeira.licenca.codigoCompra, null);
      assert.equal(primeira.licenca.compradaEm, null);
      assert.equal(primeira.licenca.ativadaEm, null);
      assert.equal(primeira.configuracao.oficinaId, primeira.id);
      assert.deepEqual(await contagens(), [1, 1, 1, 1]);
    });
    await t.test("cadastro pendente não recebe sessão e rotas privadas exigem autenticação", async () => {
      const login = await call("POST", "/auth/login", { Email: "OFICINA@EXAMPLE.INVALID", Senha: senha });
      assert.equal(login.status, 403);
      assert.match(login.data.erro, /aguarda ativação/);
      assert.equal(login.data.token, undefined);
      assert.equal((await call("GET", "/auth/me")).status, 401);
      assert.equal((await call("GET", "/estoque")).status, 401);
    });
    await t.test("login só libera quando oficina E licença estão ativas; preserva senha com espaços", async () => {
      await db.oficina.update({ where: { id: primeira.id }, data: { status: "ATIVA" } });
      assert.equal((await call("POST", "/auth/login", { Email: "oficina@example.invalid", Senha: senha })).status, 403);
      await db.licenca.update({ where: { oficinaId: primeira.id }, data: { status: "ATIVA" } });
      const login = await call("POST", "/auth/login", { Email: " OFICINA@EXAMPLE.INVALID ", Senha: senha });
      assert.equal(login.status, 200);
      token = login.data.token;
      const me = await call("GET", "/auth/me", undefined, token);
      assert.equal(me.status, 200);
      assert.equal(me.data.usuario.oficinaId, primeira.id);
    });
    await t.test("novo cadastro cria outro ambiente mesmo com JWT e oficinaId da primeira oficina", async () => {
      const result = await call("POST", "/auth/cadastro-oficina", { ...dados("segunda@example.invalid"), oficinaId: primeira.id }, token);
      assert.equal(result.status, 201);
      const segunda = await db.usuario.findUnique({ where: { Email: "segunda@example.invalid" } });
      assert.notEqual(segunda.oficinaId, primeira.id);
      assert.deepEqual(await contagens(), [2, 2, 2, 2]);
    });
    await t.test("reenvio e e-mail com outra capitalização retornam 409 sem duplicar", async () => {
      const antes = await contagens();
      assert.equal((await call("POST", "/auth/cadastro-oficina", dados(" OFICINA@EXAMPLE.INVALID "))).status, 409);
      assert.deepEqual(await contagens(), antes);
      await db.usuario.update({ where: { Email: "segunda@example.invalid" }, data: { Email: "Segunda@Example.Invalid" } });
      await assert.rejects(cadastrarOficina(db, dados("segunda@example.invalid")), error => error.status === 409);
      assert.deepEqual(await contagens(), antes);
    });
    await t.test("concorrência de e-mail cria exatamente uma oficina", async () => {
      const antes = await contagens();
      const resultados = await Promise.allSettled([cadastrarOficina(db, dados("concorrente@example.invalid")), cadastrarOficina(db, dados("CONCORRENTE@EXAMPLE.INVALID"))]);
      assert.equal(resultados.filter(r => r.status === "fulfilled").length, 1);
      assert.equal(resultados.find(r => r.status === "rejected").reason.status, 409);
      assert.deepEqual(await contagens(), antes.map(n => n + 1));
    });
    await t.test("concorrência de CNPJ formatado/normalizado cria exatamente uma oficina", async () => {
      const antes = await contagens();
      const resultados = await Promise.allSettled([
        cadastrarOficina(db, { ...dados("cnpj1@example.invalid"), cnpj: "12.345.678/0001-95" }),
        cadastrarOficina(db, { ...dados("cnpj2@example.invalid"), cnpj: "12345678000195" }),
      ]);
      assert.equal(resultados.filter(r => r.status === "fulfilled").length, 1);
      assert.equal(resultados.find(r => r.status === "rejected").reason.status, 409);
      assert.deepEqual(await contagens(), antes.map(n => n + 1));
    });
    await t.test("CNPJ já salvo com máscara também impede duplicação", async () => {
      await db.oficina.update({ where: { cnpj: "12345678000195" }, data: { cnpj: "12.345.678/0001-95" } });
      const antes = await contagens();
      await assert.rejects(cadastrarOficina(db, { ...dados("cnpj3@example.invalid"), cnpj: "12345678000195" }), error => error.status === 409);
      assert.deepEqual(await contagens(), antes);
    });
    await t.test("falha na configuração reverte também oficina, responsável e licença", async () => {
      const antes = await contagens();
      await db.$executeRawUnsafe('ALTER TABLE "ConfiguracaoOficina" ADD CONSTRAINT "cadastro_teste_rollback" CHECK (false) NOT VALID');
      try {
        const result = await call("POST", "/auth/cadastro-oficina", dados("rollback@example.invalid"));
        assert.equal(result.status, 500);
        assert.equal(JSON.stringify(result.data).includes(senha), false);
        assert.deepEqual(await contagens(), antes);
      } finally {
        await db.$executeRawUnsafe('ALTER TABLE "ConfiguracaoOficina" DROP CONSTRAINT "cadastro_teste_rollback"');
      }
      assert.equal((await call("POST", "/auth/cadastro-oficina", dados("rollback@example.invalid"))).status, 201);
    });
    await t.test("login malformado retorna 400", async () => {
      assert.equal((await call("POST", "/auth/login", { Email: {}, Senha: [] })).status, 400);
    });

    await t.test("sem configurar envio, reenvio informa indisponibilidade sem ativar", async () => {
      assert.equal((await call("POST", "/auth/reenviar-confirmacao", { Email: "segunda@example.invalid" })).status, 503);
      assert.equal(await db.confirmacaoEmailOficina.count(), 0);
    });

    process.env.BREVO_API_KEY = "chave-de-teste-sem-acesso-externo";
    process.env.BREVO_SENDER_EMAIL = "envio@example.invalid";
    process.env.FRONTEND_URL = "https://motormind.example.invalid";
    simularBrevo = true;
    const { solicitarConfirmacaoOficina } = await import("../src/services/confirmacaoOficinaService.js");
    const tokenPara = email => emails.findLast(item => item.email === email).token;
    async function usuarioPorEmail(email) { return db.usuario.findUnique({ where: { Email: email } }); }
    async function criarPendente(email, role = "ADMIN") {
      await cadastrarOficina(db, dados(email));
      const usuario = await usuarioPorEmail(email);
      if (role !== "ADMIN") await db.usuario.update({ where: { id: usuario.id }, data: { Role: role } });
      return usuario;
    }
    async function liberarReenvio(oficinaId) {
      await db.confirmacaoEmailOficina.updateMany({ where: { oficinaId }, data: { criadoEm: new Date(Date.now() - 61000) } });
    }
    let novo;

    await t.test("cadastro envia link e persiste somente hash/validade; login aguarda confirmação", async () => {
      const result = await call("POST", "/auth/cadastro-oficina", dados(" NOVO@EXAMPLE.INVALID "));
      assert.equal(result.status, 201);
      assert.equal(result.data.confirmacao.enviado, true);
      assert.equal(result.data.oficina.status, "PENDENTE");
      novo = await usuarioPorEmail("novo@example.invalid");
      assert.equal(novo.Role, "ADMIN");
      assert.equal(result.data.oficina.email, novo.Email);
      assert.equal((await db.oficina.findUnique({ where: { id: novo.oficinaId } })).email, novo.Email);
      assert.equal(emails.at(-1).email, novo.Email);
      const tokenEmail = tokenPara(novo.Email);
      const registro = await db.confirmacaoEmailOficina.findFirst({ where: { usuarioId: novo.id } });
      assert.equal(registro.email, novo.Email);
      assert.equal(registro.tokenHash, createHash("sha256").update(tokenEmail).digest("hex"));
      assert.ok(registro.enviadoEm);
      assert.equal(registro.consumidoEm, null);
      assert.ok(registro.expiraEm > new Date());
      assert.equal(JSON.stringify(result.data).includes(tokenEmail), false);
      assert.equal((await call("POST", "/auth/login", { Email: novo.Email, Senha: senha })).status, 403);
    });
    await t.test("abrir por GET não ativa; POST com link válido libera ADMIN da oficina vinculada ao token", async () => {
      const tokenEmail = tokenPara(novo.Email);
      const get = await fetch(`${base}/auth/confirmar-oficina?token=${tokenEmail}`);
      assert.equal(get.status, 404);
      const result = await call("POST", "/auth/confirmar-oficina", { token: tokenEmail, oficinaId: primeira.id, administradorId: primeira.usuarios[0].id, Role: "OWNER", valor: 0 });
      assert.equal(result.status, 200);
      assert.equal(result.data.oficina.id, novo.oficinaId);
      assert.equal(result.data.administrador.id, novo.id);
      assert.equal(result.data.administrador.Role, "ADMIN");
      assert.equal(result.data.administrador.Senha, undefined);
      assert.equal(result.data.token, undefined);
      const licenca = await db.licenca.findUnique({ where: { oficinaId: novo.oficinaId } });
      assert.equal(licenca.status, "ATIVA");
      assert.ok(licenca.ativadaEm);
      assert.equal(licenca.compradaEm, null);
      assert.equal(licenca.valor, null);
      const login = await call("POST", "/auth/login", { Email: novo.Email, Senha: senha });
      assert.equal(login.status, 200);
      assert.equal(login.data.usuario.Role, "ADMIN");
      assert.equal(login.data.usuario.oficinaId, novo.oficinaId);
      assert.equal((await call("GET", "/auth/me", undefined, login.data.token)).data.usuario.oficinaId, novo.oficinaId);
    });
    await t.test("link usado não repete ativação nem altera a data", async () => {
      const antes = await db.licenca.findUnique({ where: { oficinaId: novo.oficinaId } });
      assert.equal((await call("POST", "/auth/confirmar-oficina", { token: tokenPara(novo.Email) })).status, 410);
      const depois = await db.licenca.findUnique({ where: { oficinaId: novo.oficinaId } });
      assert.deepEqual(depois.ativadaEm, antes.ativadaEm);
    });
    await t.test("links desconhecidos, malformados e expirados não ativam", async () => {
      const expirado = await criarPendente("expirado@example.invalid");
      await solicitarConfirmacaoOficina(db, expirado.Email);
      await db.confirmacaoEmailOficina.updateMany({ where: { usuarioId: expirado.id }, data: { expiraEm: new Date(Date.now() - 1000) } });
      assert.equal((await call("POST", "/auth/confirmar-oficina", { token: tokenPara(expirado.Email) })).status, 410);
      assert.equal((await call("POST", "/auth/confirmar-oficina", { token: "f".repeat(64) })).status, 400);
      assert.equal((await call("POST", "/auth/confirmar-oficina", { token: {} })).status, 400);
      assert.equal((await db.oficina.findUnique({ where: { id: expirado.oficinaId } })).status, "PENDENTE");
    });
    await t.test("pendente antigo OWNER recebe reenvio; confirmação concorrente promove uma única vez a ADMIN", async () => {
      const legado = await criarPendente("legado@example.invalid", "OWNER");
      assert.equal((await call("POST", "/auth/reenviar-confirmacao", { Email: legado.Email })).status, 200);
      const tokenEmail = tokenPara(legado.Email);
      const respostas = await Promise.all([call("POST", "/auth/confirmar-oficina", { token: tokenEmail }), call("POST", "/auth/confirmar-oficina", { token: tokenEmail })]);
      assert.deepEqual(respostas.map(item => item.status).sort(), [200, 410]);
      assert.equal((await usuarioPorEmail(legado.Email)).Role, "ADMIN");
      assert.equal(await db.usuario.count({ where: { oficinaId: legado.oficinaId } }), 1);
    });
    await t.test("reenvios respeitam intervalo, mantêm links anteriores válidos e invalidam os demais após confirmar", async () => {
      const reenvio = await criarPendente("reenvio@example.invalid");
      await solicitarConfirmacaoOficina(db, reenvio.Email);
      const primeiroToken = tokenPara(reenvio.Email);
      const quantidade = emails.length;
      const limitado = await call("POST", "/auth/reenviar-confirmacao", { Email: reenvio.Email });
      const desconhecido = await call("POST", "/auth/reenviar-confirmacao", { Email: "nao-existe@example.invalid" });
      assert.deepEqual(limitado, desconhecido);
      assert.equal(emails.length, quantidade);
      await liberarReenvio(reenvio.oficinaId);
      assert.equal((await call("POST", "/auth/reenviar-confirmacao", { Email: reenvio.Email })).status, 200);
      const segundoToken = tokenPara(reenvio.Email);
      assert.notEqual(segundoToken, primeiroToken);
      assert.equal((await call("POST", "/auth/confirmar-oficina", { token: primeiroToken })).status, 200);
      assert.equal((await call("POST", "/auth/confirmar-oficina", { token: segundoToken })).status, 410);
    });
    await t.test("falha do Brevo preserva cadastro pendente e não marca envio; reenvio posterior funciona", async () => {
      falharEnvio = true;
      try {
        const result = await call("POST", "/auth/cadastro-oficina", dados("falha-email@example.invalid"));
        assert.equal(result.status, 201);
        assert.equal(result.data.confirmacao.enviado, false);
        assert.equal(result.data.oficina.status, "PENDENTE");
      } finally { falharEnvio = false; }
      const pendente = await usuarioPorEmail("falha-email@example.invalid");
      const registro = await db.confirmacaoEmailOficina.findFirst({ where: { usuarioId: pendente.id } });
      assert.equal(registro.enviadoEm, null);
      await liberarReenvio(pendente.oficinaId);
      assert.equal((await solicitarConfirmacaoOficina(db, pendente.Email)).enviado, true);
      assert.equal((await call("POST", "/auth/confirmar-oficina", { token: tokenPara(pendente.Email) })).status, 200);
    });
    await t.test("falha na ativação reverte perfil, estados e consumo do link", async () => {
      const rollback = await criarPendente("rollback-confirmacao@example.invalid", "OWNER");
      await solicitarConfirmacaoOficina(db, rollback.Email);
      const tokenEmail = tokenPara(rollback.Email);
      await db.$executeRawUnsafe(`ALTER TABLE "Licenca" ADD CONSTRAINT "ativacao_teste_rollback" CHECK ("oficinaId" <> ${rollback.oficinaId} OR "status" <> 'ATIVA') NOT VALID`);
      try {
        assert.equal((await call("POST", "/auth/confirmar-oficina", { token: tokenEmail })).status, 500);
        assert.equal((await usuarioPorEmail(rollback.Email)).Role, "OWNER");
        assert.equal((await db.oficina.findUnique({ where: { id: rollback.oficinaId } })).status, "PENDENTE");
        assert.equal((await db.licenca.findUnique({ where: { oficinaId: rollback.oficinaId } })).status, "PENDENTE");
        assert.equal((await db.confirmacaoEmailOficina.findFirst({ where: { usuarioId: rollback.id } })).consumidoEm, null);
      } finally { await db.$executeRawUnsafe('ALTER TABLE "Licenca" DROP CONSTRAINT "ativacao_teste_rollback"'); }
      assert.equal((await call("POST", "/auth/confirmar-oficina", { token: tokenEmail })).status, 200);
    });
    await t.test("link não reativa oficina suspensa nem confirma e-mail alterado", async () => {
      const suspensa = await criarPendente("suspensa@example.invalid");
      await solicitarConfirmacaoOficina(db, suspensa.Email);
      await db.oficina.update({ where: { id: suspensa.oficinaId }, data: { status: "SUSPENSA" } });
      assert.equal((await call("POST", "/auth/confirmar-oficina", { token: tokenPara(suspensa.Email) })).status, 409);
      const alterado = await criarPendente("alterado@example.invalid");
      await solicitarConfirmacaoOficina(db, alterado.Email);
      await db.usuario.update({ where: { id: alterado.id }, data: { Email: "outro-email@example.invalid" } });
      assert.equal((await call("POST", "/auth/confirmar-oficina", { token: tokenPara(alterado.Email) })).status, 410);
    });
    await t.test("operador e administrador secundário não podem ativar a oficina pelo próprio e-mail", async () => {
      const principal = await criarPendente("principal@example.invalid");
      for (const Role of ["OPERADOR", "ADMIN"]) {
        const secundario = await db.usuario.create({ data: { oficinaId: principal.oficinaId, Nome: "Secundário sintético", Email: `secundario-${Role}@example.invalid`, Role, Senha: principal.Senha } });
        assert.equal((await solicitarConfirmacaoOficina(db, secundario.Email)).enviado, false);
      }
      assert.equal(await db.confirmacaoEmailOficina.count({ where: { oficinaId: principal.oficinaId } }), 0);
    });
  } finally {
    if (servidor) { servidor.closeAllConnections(); await new Promise(resolve => servidor.close(resolve)); }
    if (db) await db.$disconnect();
    if (criado) {
      assert.match(schemaTeste, /^cadastro_test_[a-f0-9]{32}$/);
      await admin.$executeRawUnsafe(`DROP SCHEMA "${schemaTeste}" CASCADE`);
    }
    await admin.$disconnect();
    process.env.DATABASE_URL = urlOriginal;
    if (segredoOriginal === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = segredoOriginal;
    if (brevoOriginal === undefined) delete process.env.BREVO_API_KEY;
    else process.env.BREVO_API_KEY = brevoOriginal;
    for (const [nome, valor] of Object.entries(envioOriginal)) {
      if (valor === undefined) delete process.env[nome]; else process.env[nome] = valor;
    }
  }
});
