export function calcularTotalServico(servico) {
  return Math.max(Number(servico.precoVenda || 0) - Number(servico.desconto || 0), 0);
}

export function calcularTotalPeca(peca) {
  return Math.max(Number(peca.quantidade || 0) * Number(peca.custoUnitario || 0) -
    Number(peca.desconto || 0), 0);
}

/** Mantém a regra da OS: desconto por item, sem permitir um total negativo. */
export function calcularTotaisOrdem(ordem) {
  const servicos = [...ordem.servicosSemDiagnostico,
    ...ordem.diagnosticos.flatMap(diagnostico => diagnostico.servicos)];
  const pecas = [...ordem.pecasAvulsas, ...servicos.flatMap(servico => servico.pecas)];
  const totalServicos = servicos.reduce((soma, servico) => soma + calcularTotalServico(servico), 0);
  const totalPecas = pecas.reduce((soma, peca) => soma + calcularTotalPeca(peca), 0);
  const brutoServicos = servicos.reduce((soma, servico) => soma + Number(servico.precoVenda || 0), 0);
  const brutoPecas = pecas.reduce((soma, peca) => soma +
    Number(peca.quantidade || 0) * Number(peca.custoUnitario || 0), 0);

  return { totalServicos, totalPecas, totalGeral: totalServicos + totalPecas,
    brutoServicos, brutoPecas, totalDescontos: brutoServicos + brutoPecas - totalServicos - totalPecas };
}
