import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
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
    let chamadasExternas = 0;
    t.mock.method(globalThis, "fetch", async (url, options) => {
      if (new URL(url).origin !== base) chamadasExternas++;
      assert.equal(new URL(url).origin, base, "Cadastro e login não devem chamar serviços externos.");
      return fetchOriginal(url, options);
    });
    async function call(method, path, body, token) {
      const response = await fetch(`${base}${path}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
      const data = response.headers.get("content-type")?.includes("application/json") ? await response.json() : await response.text();
      return { status: response.status, data };
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
    await t.test("cadastro público cria ADMIN, oficina e licença ativas e ignora vínculos/status forjados", async () => {
      const inicio = new Date();
      const result = await call("POST", "/auth/cadastro-oficina", { ...dados(), oficinaId: 99999, Role: "OWNER", status: "SUSPENSA", licenca: { status: "CANCELADA", valor: 0 }, codigoCompra: "forjado", ativadaEm: "2000-01-01T00:00:00.000Z" });
      assert.equal(result.status, 201);
      assert.equal(result.data.oficina.status, "ATIVA");
      assert.equal(result.data.oficina.licenca.status, "ATIVA");
      assert.equal(result.data.token, undefined);
      assert.equal(JSON.stringify(result.data).includes(senha), false);
      primeira = await db.oficina.findFirst({ include: { usuarios: true, licenca: true, configuracao: true } });
      assert.equal(primeira.usuarios.length, 1);
      assert.equal(primeira.email, "oficina@example.invalid");
      assert.equal(primeira.email, primeira.usuarios[0].Email);
      assert.equal(result.data.oficina.email, primeira.email);
      assert.equal(result.data.confirmacao, undefined);
      assert.equal(chamadasExternas, 0);
      assert.equal(await db.confirmacaoEmailOficina.count(), 0);
      assert.equal(primeira.usuarios[0].Role, "ADMIN");
      assert.equal(primeira.usuarios[0].oficinaId, primeira.id);
      assert.equal(await bcrypt.compare(senha, primeira.usuarios[0].Senha), true);
      assert.equal(primeira.licenca.valor, null);
      assert.equal(primeira.licenca.codigoCompra, null);
      assert.equal(primeira.licenca.compradaEm, null);
      assert.ok(primeira.licenca.ativadaEm >= inicio);
      assert.ok(primeira.licenca.ativadaEm <= new Date());
      assert.equal(primeira.configuracao.oficinaId, primeira.id);
      assert.deepEqual(await contagens(), [1, 1, 1, 1]);
    });
    await t.test("login funciona imediatamente após cadastro e rotas privadas exigem autenticação", async () => {
      const login = await call("POST", "/auth/login", { Email: "OFICINA@EXAMPLE.INVALID", Senha: senha });
      assert.equal(login.status, 200);
      assert.equal(login.data.usuario.Role, "ADMIN");
      assert.equal(login.data.usuario.oficinaId, primeira.id);
      token = login.data.token;
      assert.ok(token);
      const me = await call("GET", "/auth/me", undefined, token);
      assert.equal(me.status, 200);
      assert.equal(me.data.usuario.oficinaId, primeira.id);
      assert.equal(me.data.usuario.oficina.status, "ATIVA");
      assert.equal(me.data.usuario.oficina.licenca.status, "ATIVA");
      assert.equal((await call("GET", "/estoque", undefined, token)).status, 200);
      assert.equal((await call("POST", "/auth/login", { Email: "oficina@example.invalid", Senha: "senha-incorreta" })).status, 401);
      assert.equal((await call("GET", "/auth/me")).status, 401);
      assert.equal((await call("GET", "/estoque")).status, 401);
    });
    await t.test("login mantém bloqueios de oficina/licença e preserva senha com espaços", async () => {
      for (const status of ["PENDENTE", "SUSPENSA", "CANCELADA"]) {
        await db.oficina.update({ where: { id: primeira.id }, data: { status } });
        const login = await call("POST", "/auth/login", { Email: "oficina@example.invalid", Senha: senha });
        assert.equal(login.status, 403);
        assert.equal(login.data.token, undefined);
        assert.doesNotMatch(login.data.erro, /e-mail|link|reenvio/i);
        assert.equal((await call("GET", "/auth/me", undefined, token)).status, 403);
      }
      await db.oficina.update({ where: { id: primeira.id }, data: { status: "ATIVA" } });
      for (const status of ["PENDENTE", "CANCELADA"]) {
        await db.licenca.update({ where: { oficinaId: primeira.id }, data: { status } });
        assert.equal((await call("POST", "/auth/login", { Email: "oficina@example.invalid", Senha: senha })).status, 403);
        assert.equal((await call("GET", "/auth/me", undefined, token)).status, 403);
      }
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

    await t.test("rotas de confirmação e reenvio foram removidas", async () => {
      const antes = await contagens();
      for (const path of ["/auth/confirmar-oficina", "/auth/reenviar-confirmacao"]) {
        assert.equal((await call("POST", path, { Email: "oficina@example.invalid", token: "a".repeat(64) })).status, 404);
      }
      assert.deepEqual(await contagens(), antes);
      assert.equal(await db.confirmacaoEmailOficina.count(), 0);
      assert.equal(chamadasExternas, 0);
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
  }
});
