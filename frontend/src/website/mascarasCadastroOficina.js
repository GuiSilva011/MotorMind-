export const camposComMascara = new Set(["cnpj", "telefone", "whatsapp", "cep"]);

export function formatarCampoCadastro(campo, valor) {
  if (campo === "cnpj") {
    return valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 14)
      .replace(/^(.{2})(.)/, "$1.$2")
      .replace(/^(.{2})\.(.{3})(.)/, "$1.$2.$3")
      .replace(/^(.{2})\.(.{3})\.(.{3})(.)/, "$1.$2.$3/$4")
      .replace(/\/(.{4})(.)/, "/$1-$2");
  }
  if (campo === "cep") {
    return valor.replace(/\D/g, "").slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
  }
  if (campo === "telefone" || campo === "whatsapp") {
    const numeros = valor.replace(/\D/g, "");
    const comPais = valor.trimStart().startsWith("+55") || (numeros.startsWith("55") && numeros.length > 11);
    const local = comPais ? numeros.slice(2, 13) : numeros.slice(0, 11);
    const prefixo = comPais ? "+55 " : "";
    if (!local) return prefixo.trimEnd();
    const ddd = local.slice(0, 2);
    const numero = local.slice(2);
    const corte = numero.length > 8 ? 5 : 4;
    const sufixo = numero.length > corte ? `${numero.slice(0, corte)}-${numero.slice(corte)}` : numero;
    return `${prefixo}(${ddd}${numero ? `) ${sufixo}` : ""}`;
  }
  return valor;
}

export function posicaoCursorMascara(valorDigitado, valorFormatado, posicao, apagando) {
  const quantidade = (valorDigitado.slice(0, posicao).match(/[A-Za-z0-9]/g) || []).length;
  let cursor = 0;
  let encontrados = 0;
  while (cursor < valorFormatado.length && encontrados < quantidade) {
    if (/[A-Za-z0-9]/.test(valorFormatado[cursor])) encontrados++;
    cursor++;
  }
  if (!apagando) {
    while (cursor < valorFormatado.length && !/[A-Za-z0-9]/.test(valorFormatado[cursor])) cursor++;
  }
  return cursor;
}

export function selecionarExclusaoMascara(event) {
  if (!["Backspace", "Delete"].includes(event.key) || event.ctrlKey || event.metaKey || event.altKey) return;
  const input = event.currentTarget;
  const cursor = input.selectionStart;
  if (cursor == null || cursor !== input.selectionEnd) return;
  const direcao = event.key === "Backspace" ? -1 : 1;
  let indice = direcao === -1 ? cursor - 1 : cursor;
  const inicio = indice;
  while (indice >= 0 && indice < input.value.length && !/[A-Za-z0-9]/.test(input.value[indice])) indice += direcao;
  // Inclui o dígito adjacente para que apagar um separador não prenda o cursor.
  if (indice !== inicio && indice >= 0 && indice < input.value.length) {
    input.setSelectionRange(direcao === -1 ? indice : cursor, direcao === -1 ? cursor : indice + 1);
  }
}
