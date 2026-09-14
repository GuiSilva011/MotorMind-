import test from "node:test";
import assert from "node:assert/strict";
import { validarCadastroOficina, ErroCadastroOficina } from "../src/services/cadastroOficinaService.js";
import { criarLimitadorCadastro } from "../src/middlewares/limitarCadastroOficina.js";

const dados = () => ({ nomeFantasia: "Oficina de teste", telefone: "(11) 99999-0000", Nome: "Responsável de teste", Email: "teste@example.invalid", Senha: "somente-teste-123", confirmarSenha: "somente-teste-123" });

test("normaliza contatos e documento, mantém campos opcionais nulos e não aceita controles de acesso", () => {
  const resultado = validarCadastroOficina({ ...dados(), nomeFantasia: " Oficina de teste ", Email: " TESTE@EXAMPLE.INVALID ", cnpj: "AB.CDE.123/4567-89", uf: "sp", cep: "01001-000", oficinaId: 42, Role: "ADMIN", status: "ATIVA", valor: 0 });
  assert.equal(resultado.oficina.nomeFantasia, "Oficina de teste");
  assert.equal(resultado.oficina.telefone, "11999990000");
  assert.equal(resultado.oficina.cnpj, "ABCDE123456789");
  assert.equal(resultado.oficina.uf, "SP");
  assert.equal(resultado.oficina.cep, "01001000");
  assert.equal(resultado.oficina.endereco, null);
  assert.equal(resultado.responsavel.Email, "teste@example.invalid");
  assert.equal(resultado.oficina.oficinaId, undefined);
  assert.equal(resultado.oficina.status, undefined);
  assert.equal(resultado.responsavel.Role, undefined);
});

test("rejeita dados inválidos antes de persistir", async t => {
  const casos = [
    ["nomeFantasia", " "], ["nomeFantasia", "x".repeat(121)], ["telefone", "123"],
    ["Nome", {}], ["Email", "email-invalido"], ["email", "email-invalido"],
    ["cnpj", "12"], ["cep", "123"], ["uf", "XX"], ["numero", "x".repeat(11)],
    ["Senha", "curta"], ["Senha", "á".repeat(37)], ["Senha", {}], ["confirmarSenha", "diferente"],
  ];
  for (const [campo, valor] of casos) {
    await t.test(`validação de ${campo} (${typeof valor})`, () => {
      assert.throws(() => validarCadastroOficina({ ...dados(), [campo]: valor }), error => error instanceof ErroCadastroOficina && error.status === 400 && Boolean(error.campos[campo]));
    });
  }
  for (const body of [null, undefined, [], "texto"]) assert.throws(() => validarCadastroOficina(body), ErroCadastroOficina);
});

test("preserva espaços na senha e aceita o limite de 72 bytes sem truncar", () => {
  for (const senha of ["  senha-com-espacos  ", "á".repeat(36)]) {
    assert.equal(validarCadastroOficina({ ...dados(), Senha: senha, confirmarSenha: senha }).senha, senha);
  }
});

test("limita cadastros por IP e informa quando repetir", () => {
  const limitar = criarLimitadorCadastro({ limite: 2 });
  let aceitas = 0;
  const res = { status(code) { this.code = code; return this; }, set(nome, valor) { this[nome] = valor; }, json(data) { this.data = data; return this; } };
  for (let i = 0; i < 3; i++) limitar({ ip: "127.0.0.1" }, res, () => aceitas++);
  assert.equal(aceitas, 2);
  assert.equal(res.code, 429);
  assert.ok(Number(res["Retry-After"]) > 0);
  limitar({ ip: "127.0.0.2" }, res, () => aceitas++);
  assert.equal(aceitas, 3);
});
