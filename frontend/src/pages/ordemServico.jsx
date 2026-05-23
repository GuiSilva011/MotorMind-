import { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import '../styles/ordemServico.css';

function OrdemServico() {
  const [ordem, setOrdem] = useState({
    codigo: '2778',
    cliente: {
      nome: '',
      cpfCnpj: '',
      telefone: '',
      email: '',
      tipoPessoa: 'Física',
    },
    veiculo: {
      placa: '',
      marca: '',
      modelo: '',
      ano: '',
      motor: '',
      combustivel: '',
      cor: '',
      km: '',
      chassi: '',
      possuiAr: false,
    },
    diagnosticos: [],
    servicosSemDiagnostico: [],
  });

  const [modalCotacaoAberto, setModalCotacaoAberto] = useState(false);

  const [fornecedores, setFornecedores] = useState([
    { id: 1, nome: 'Fornecedor Auto Peças Central', selecionado: false },
    { id: 2, nome: 'Distribuidora Motor Parts', selecionado: false },
    { id: 3, nome: 'Peças Rápidas Brasil', selecionado: false },
  ]);

  function letraDiagnostico(index) {
    return String.fromCharCode(65 + index);
  }

  function atualizarCliente(campo, valor) {
    setOrdem((prev) => ({
      ...prev,
      cliente: {
        ...prev.cliente,
        [campo]: valor,
      },
    }));
  }

  function atualizarVeiculo(campo, valor) {
    setOrdem((prev) => ({
      ...prev,
      veiculo: {
        ...prev.veiculo,
        [campo]: valor,
      },
    }));
  }

  function adicionarDiagnostico() {
    setOrdem((prev) => ({
      ...prev,
      diagnosticos: [
        ...prev.diagnosticos,
        {
          id: crypto.randomUUID(),
          descricao: '',
          observacao: '',
          servicos: [],
        },
      ],
    }));
  }

  function atualizarDiagnostico(diagnosticoId, campo, valor) {
    setOrdem((prev) => ({
      ...prev,
      diagnosticos: prev.diagnosticos.map((diagnostico) =>
        diagnostico.id === diagnosticoId
          ? { ...diagnostico, [campo]: valor }
          : diagnostico
      ),
    }));
  }

  function removerDiagnostico(diagnosticoId) {
    setOrdem((prev) => ({
      ...prev,
      diagnosticos: prev.diagnosticos.filter(
        (diagnostico) => diagnostico.id !== diagnosticoId
      ),
    }));
  }

  function criarServico() {
    return {
      id: crypto.randomUUID(),
      descricao: '',
      responsavel: '',
      tipo: '',
      precoVenda: '',
      desconto: '',
      pecas: [],
    };
  }

  function adicionarServicoAoDiagnostico(diagnosticoId) {
    setOrdem((prev) => ({
      ...prev,
      diagnosticos: prev.diagnosticos.map((diagnostico) =>
        diagnostico.id === diagnosticoId
          ? {
              ...diagnostico,
              servicos: [...diagnostico.servicos, criarServico()],
            }
          : diagnostico
      ),
    }));
  }

  function adicionarServicoSemDiagnostico() {
    setOrdem((prev) => ({
      ...prev,
      servicosSemDiagnostico: [
        ...prev.servicosSemDiagnostico,
        criarServico(),
      ],
    }));
  }

  function atualizarServicoDiagnostico(
    diagnosticoId,
    servicoId,
    campo,
    valor
  ) {
    setOrdem((prev) => ({
      ...prev,
      diagnosticos: prev.diagnosticos.map((diagnostico) =>
        diagnostico.id === diagnosticoId
          ? {
              ...diagnostico,
              servicos: diagnostico.servicos.map((servico) =>
                servico.id === servicoId
                  ? { ...servico, [campo]: valor }
                  : servico
              ),
            }
          : diagnostico
      ),
    }));
  }

  function atualizarServicoSemDiagnostico(servicoId, campo, valor) {
    setOrdem((prev) => ({
      ...prev,
      servicosSemDiagnostico: prev.servicosSemDiagnostico.map((servico) =>
        servico.id === servicoId ? { ...servico, [campo]: valor } : servico
      ),
    }));
  }

  function removerServicoDiagnostico(diagnosticoId, servicoId) {
    setOrdem((prev) => ({
      ...prev,
      diagnosticos: prev.diagnosticos.map((diagnostico) =>
        diagnostico.id === diagnosticoId
          ? {
              ...diagnostico,
              servicos: diagnostico.servicos.filter(
                (servico) => servico.id !== servicoId
              ),
            }
          : diagnostico
      ),
    }));
  }

  function removerServicoSemDiagnostico(servicoId) {
    setOrdem((prev) => ({
      ...prev,
      servicosSemDiagnostico: prev.servicosSemDiagnostico.filter(
        (servico) => servico.id !== servicoId
      ),
    }));
  }

  function criarPeca() {
    return {
      id: crypto.randomUUID(),
      descricao: '',
      fornecedor: '',
      quantidade: 1,
      custoUnitario: '',
      desconto: '',
    };
  }

  function adicionarPecaDiagnostico(diagnosticoId, servicoId) {
    setOrdem((prev) => ({
      ...prev,
      diagnosticos: prev.diagnosticos.map((diagnostico) =>
        diagnostico.id === diagnosticoId
          ? {
              ...diagnostico,
              servicos: diagnostico.servicos.map((servico) =>
                servico.id === servicoId
                  ? {
                      ...servico,
                      pecas: [...servico.pecas, criarPeca()],
                    }
                  : servico
              ),
            }
          : diagnostico
      ),
    }));
  }

  function adicionarPecaSemDiagnostico(servicoId) {
    setOrdem((prev) => ({
      ...prev,
      servicosSemDiagnostico: prev.servicosSemDiagnostico.map((servico) =>
        servico.id === servicoId
          ? {
              ...servico,
              pecas: [...servico.pecas, criarPeca()],
            }
          : servico
      ),
    }));
  }

  function atualizarPecaDiagnostico(
    diagnosticoId,
    servicoId,
    pecaId,
    campo,
    valor
  ) {
    setOrdem((prev) => ({
      ...prev,
      diagnosticos: prev.diagnosticos.map((diagnostico) =>
        diagnostico.id === diagnosticoId
          ? {
              ...diagnostico,
              servicos: diagnostico.servicos.map((servico) =>
                servico.id === servicoId
                  ? {
                      ...servico,
                      pecas: servico.pecas.map((peca) =>
                        peca.id === pecaId
                          ? { ...peca, [campo]: valor }
                          : peca
                      ),
                    }
                  : servico
              ),
            }
          : diagnostico
      ),
    }));
  }

  function atualizarPecaSemDiagnostico(servicoId, pecaId, campo, valor) {
    setOrdem((prev) => ({
      ...prev,
      servicosSemDiagnostico: prev.servicosSemDiagnostico.map((servico) =>
        servico.id === servicoId
          ? {
              ...servico,
              pecas: servico.pecas.map((peca) =>
                peca.id === pecaId ? { ...peca, [campo]: valor } : peca
              ),
            }
          : servico
      ),
    }));
  }

  function removerPecaDiagnostico(diagnosticoId, servicoId, pecaId) {
    setOrdem((prev) => ({
      ...prev,
      diagnosticos: prev.diagnosticos.map((diagnostico) =>
        diagnostico.id === diagnosticoId
          ? {
              ...diagnostico,
              servicos: diagnostico.servicos.map((servico) =>
                servico.id === servicoId
                  ? {
                      ...servico,
                      pecas: servico.pecas.filter((peca) => peca.id !== pecaId),
                    }
                  : servico
              ),
            }
          : diagnostico
      ),
    }));
  }

  function removerPecaSemDiagnostico(servicoId, pecaId) {
    setOrdem((prev) => ({
      ...prev,
      servicosSemDiagnostico: prev.servicosSemDiagnostico.map((servico) =>
        servico.id === servicoId
          ? {
              ...servico,
              pecas: servico.pecas.filter((peca) => peca.id !== pecaId),
            }
          : servico
      ),
    }));
  }

  const totais = useMemo(() => {
    const todosServicos = [
      ...ordem.servicosSemDiagnostico,
      ...ordem.diagnosticos.flatMap((diagnostico) => diagnostico.servicos),
    ];

    const totalServicos = todosServicos.reduce((acc, servico) => {
      const preco = Number(servico.precoVenda || 0);
      const desconto = Number(servico.desconto || 0);

      return acc + Math.max(preco - desconto, 0);
    }, 0);

    const totalPecas = todosServicos.reduce((acc, servico) => {
      const totalServicoPecas = servico.pecas.reduce((soma, peca) => {
        const qtd = Number(peca.quantidade || 0);
        const custo = Number(peca.custoUnitario || 0);
        const desconto = Number(peca.desconto || 0);

        return soma + Math.max(qtd * custo - desconto, 0);
      }, 0);

      return acc + totalServicoPecas;
    }, 0);

    return {
      totalServicos,
      totalPecas,
      totalGeral: totalServicos + totalPecas,
    };
  }, [ordem]);

  const pecasParaCotacao = useMemo(() => {
    const pecasComDiagnostico = ordem.diagnosticos.flatMap(
      (diagnostico, diagnosticoIndex) => {
        const codigoDiagnostico = letraDiagnostico(diagnosticoIndex);

        return diagnostico.servicos.flatMap((servico, servicoIndex) => {
          const codigoServico = `${codigoDiagnostico}.${servicoIndex + 1}`;

          return servico.pecas.map((peca, pecaIndex) => ({
            ...peca,
            codigoDiagnostico,
            codigoServico,
            codigoPeca: `${codigoServico}.${pecaIndex + 1}`,
            diagnostico: diagnostico.descricao,
            servico: servico.descricao,
          }));
        });
      }
    );

    const pecasSemDiagnostico = ordem.servicosSemDiagnostico.flatMap(
      (servico, servicoIndex) =>
        servico.pecas.map((peca, pecaIndex) => ({
          ...peca,
          codigoDiagnostico: null,
          codigoServico: `S.${servicoIndex + 1}`,
          codigoPeca: `S.${servicoIndex + 1}.${pecaIndex + 1}`,
          diagnostico: null,
          servico: servico.descricao,
        }))
    );

    return [...pecasComDiagnostico, ...pecasSemDiagnostico];
  }, [ordem]);

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function alternarFornecedor(id) {
    setFornecedores((prev) =>
      prev.map((fornecedor) =>
        fornecedor.id === id
          ? { ...fornecedor, selecionado: !fornecedor.selecionado }
          : fornecedor
      )
    );
  }

  function salvarOrdemServico() {
    console.log('OS para salvar:', ordem);
    alert('OS pronta para integrar com o backend.');
  }

  function enviarCotacao() {
    const payload = {
      ordemServicoCodigo: ordem.codigo,
      veiculo: {
        marca: ordem.veiculo.marca,
        modelo: ordem.veiculo.modelo,
        ano: ordem.veiculo.ano,
        motor: ordem.veiculo.motor,
        possuiAr: ordem.veiculo.possuiAr,
        chassi: ordem.veiculo.chassi,
      },
      pecas: pecasParaCotacao,
      fornecedores: fornecedores.filter((fornecedor) => fornecedor.selecionado),
    };

    console.log('Cotação:', payload);
    setModalCotacaoAberto(false);
    alert('Cotação pronta para envio.');
  }

  return (
    <Layout>
      <main className="os-page">
        <section className="os-top">
          <div>
            <h1>Ordem de Serviço</h1>
            <p>Monte a OS relacionando diagnóstico, serviço e peças.</p>
          </div>

          <div className="os-top-actions">
            <button type="button" className="os-action os-action-red">
              Voltar
            </button>

            <button
              type="button"
              className="os-action os-action-dark"
              onClick={salvarOrdemServico}
            >
              Salvar
            </button>
          </div>
        </section>

        <section className="os-panel">
          <div className="os-panel-title">
            <h2>Cliente e veículo</h2>
            <span>Dados principais da ordem de serviço</span>
          </div>

          <div className="os-subtitle">Dados do cliente</div>

          <div className="os-form-grid os-grid-4">
            <div className="os-field os-col-2">
              <label>Cliente</label>
              <input
                value={ordem.cliente.nome}
                onChange={(e) => atualizarCliente('nome', e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            <div className="os-field">
              <label>CPF/CNPJ</label>
              <input
                value={ordem.cliente.cpfCnpj}
                onChange={(e) => atualizarCliente('cpfCnpj', e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="os-field">
              <label>Tipo</label>
              <select
                value={ordem.cliente.tipoPessoa}
                onChange={(e) => atualizarCliente('tipoPessoa', e.target.value)}
              >
                <option>Física</option>
                <option>Jurídica</option>
              </select>
            </div>

            <div className="os-field">
              <label>Telefone</label>
              <input
                value={ordem.cliente.telefone}
                onChange={(e) => atualizarCliente('telefone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="os-field os-col-2">
              <label>E-mail</label>
              <input
                value={ordem.cliente.email}
                onChange={(e) => atualizarCliente('email', e.target.value)}
                placeholder="cliente@email.com"
              />
            </div>

            <div className="os-field">
              <label>Código da OS</label>
              <input
                value={ordem.codigo}
                onChange={(e) =>
                  setOrdem((prev) => ({ ...prev, codigo: e.target.value }))
                }
              />
            </div>

            <div className="os-divider" />

            <div className="os-subtitle os-col-full">Dados do veículo</div>

            <div className="os-field">
              <label>Placa</label>
              <input
                value={ordem.veiculo.placa}
                onChange={(e) => atualizarVeiculo('placa', e.target.value)}
                placeholder="ABC1D23"
              />
            </div>

            <div className="os-field">
              <label>Marca</label>
              <input
                value={ordem.veiculo.marca}
                onChange={(e) => atualizarVeiculo('marca', e.target.value)}
                placeholder="Ford"
              />
            </div>

            <div className="os-field">
              <label>Modelo</label>
              <input
                value={ordem.veiculo.modelo}
                onChange={(e) => atualizarVeiculo('modelo', e.target.value)}
                placeholder="Pinto 77"
              />
            </div>

            <div className="os-field">
              <label>Ano</label>
              <input
                value={ordem.veiculo.ano}
                onChange={(e) => atualizarVeiculo('ano', e.target.value)}
                placeholder="1977/1978"
              />
            </div>

            <div className="os-field">
              <label>Motor</label>
              <input
                value={ordem.veiculo.motor}
                onChange={(e) => atualizarVeiculo('motor', e.target.value)}
                placeholder="4000 Diesel"
              />
            </div>

            <div className="os-field">
              <label>Combustível</label>
              <input
                value={ordem.veiculo.combustivel}
                onChange={(e) =>
                  atualizarVeiculo('combustivel', e.target.value)
                }
                placeholder="Diesel"
              />
            </div>

            <div className="os-field">
              <label>Cor</label>
              <input
                value={ordem.veiculo.cor}
                onChange={(e) => atualizarVeiculo('cor', e.target.value)}
                placeholder="Preta"
              />
            </div>

            <div className="os-field">
              <label>KM</label>
              <input
                value={ordem.veiculo.km}
                onChange={(e) => atualizarVeiculo('km', e.target.value)}
                placeholder="78000"
              />
            </div>

            <div className="os-field os-col-3">
              <label>Chassi</label>
              <input
                value={ordem.veiculo.chassi}
                onChange={(e) => atualizarVeiculo('chassi', e.target.value)}
                placeholder="Chassi do veículo"
              />
            </div>

            <label className="os-check">
              <input
                type="checkbox"
                checked={ordem.veiculo.possuiAr}
                onChange={(e) =>
                  atualizarVeiculo('possuiAr', e.target.checked)
                }
              />
              Possui ar-condicionado
            </label>
          </div>
        </section>

        <section className="os-service-panel">
          <div className="os-panel-title os-title-row">
            <div>
              <h2>Diagnósticos, serviços e peças</h2>
              <span>Crie a hierarquia da ordem de serviço</span>
            </div>

            <div className="os-title-actions">
              <button
                type="button"
                className="os-small-btn os-blue"
                onClick={adicionarDiagnostico}
              >
                + Novo diagnóstico
              </button>

              <button
                type="button"
                className="os-small-btn os-dark"
                onClick={adicionarServicoSemDiagnostico}
              >
                + Serviço sem diagnóstico
              </button>
            </div>
          </div>

          {ordem.diagnosticos.length === 0 &&
            ordem.servicosSemDiagnostico.length === 0 && (
              <div className="os-empty">
                Nenhum diagnóstico ou serviço adicionado.
              </div>
            )}

          {ordem.diagnosticos.map((diagnostico, diagnosticoIndex) => {
            const codigoDiagnostico = letraDiagnostico(diagnosticoIndex);

            return (
              <article className="os-diagnostic-card" key={diagnostico.id}>
                <div className="os-diagnostic-header">
                  <div className="os-code os-code-diagnostic">
                    {codigoDiagnostico}
                  </div>

                  <div className="os-field os-grow">
                    <label>Diagnóstico {codigoDiagnostico}</label>
                    <input
                      value={diagnostico.descricao}
                      onChange={(e) =>
                        atualizarDiagnostico(
                          diagnostico.id,
                          'descricao',
                          e.target.value
                        )
                      }
                      placeholder="Ex: Carro trepidando"
                    />
                  </div>

                  <button
                    type="button"
                    className="os-small-btn os-blue"
                    onClick={() =>
                      adicionarServicoAoDiagnostico(diagnostico.id)
                    }
                  >
                    + Serviço
                  </button>

                  <button
                    type="button"
                    className="os-icon-btn"
                    onClick={() => removerDiagnostico(diagnostico.id)}
                  >
                    ×
                  </button>
                </div>

                {diagnostico.servicos.length === 0 && (
                  <div className="os-inner-empty">
                    Nenhum serviço vinculado a este diagnóstico.
                  </div>
                )}

                {diagnostico.servicos.map((servico, servicoIndex) => {
                  const codigoServicoCompleto = `${codigoDiagnostico}.${
                    servicoIndex + 1
                  }`;

                  return (
                    <article className="os-service-card" key={servico.id}>
                      <div className="os-service-title-row">
                        <div className="os-code os-code-service">
                          {servicoIndex + 1}
                        </div>

                        <div>
                          <strong>Serviço {servicoIndex + 1}</strong>
                          <small>Código interno: {codigoServicoCompleto}</small>
                        </div>
                      </div>

                      <div className="os-service-header">
                        <div className="os-form-grid os-grid-service">
                          <div className="os-field os-col-2">
                            <label>Descrição do serviço</label>
                            <input
                              value={servico.descricao}
                              onChange={(e) =>
                                atualizarServicoDiagnostico(
                                  diagnostico.id,
                                  servico.id,
                                  'descricao',
                                  e.target.value
                                )
                              }
                              placeholder="Ex: Troca da embreagem"
                            />
                          </div>

                          <div className="os-field">
                            <label>Responsável</label>
                            <input
                              value={servico.responsavel}
                              onChange={(e) =>
                                atualizarServicoDiagnostico(
                                  diagnostico.id,
                                  servico.id,
                                  'responsavel',
                                  e.target.value
                                )
                              }
                              placeholder="Técnico"
                            />
                          </div>

                          <div className="os-field">
                            <label>Tipo</label>
                            <select
                              value={servico.tipo}
                              onChange={(e) =>
                                atualizarServicoDiagnostico(
                                  diagnostico.id,
                                  servico.id,
                                  'tipo',
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Selecione</option>
                              <option value="mao_de_obra">Mão de obra</option>
                              <option value="reparo">Reparo</option>
                              <option value="troca_peca">Troca de peça</option>
                            </select>
                          </div>

                          <div className="os-field">
                            <label>Preço</label>
                            <input
                              type="number"
                              value={servico.precoVenda}
                              onChange={(e) =>
                                atualizarServicoDiagnostico(
                                  diagnostico.id,
                                  servico.id,
                                  'precoVenda',
                                  e.target.value
                                )
                              }
                              placeholder="0,00"
                            />
                          </div>

                          <div className="os-field">
                            <label>Desconto</label>
                            <input
                              type="number"
                              value={servico.desconto}
                              onChange={(e) =>
                                atualizarServicoDiagnostico(
                                  diagnostico.id,
                                  servico.id,
                                  'desconto',
                                  e.target.value
                                )
                              }
                              placeholder="0,00"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          className="os-icon-btn"
                          onClick={() =>
                            removerServicoDiagnostico(
                              diagnostico.id,
                              servico.id
                            )
                          }
                        >
                          ×
                        </button>
                      </div>

                      <div className="os-piece-area">
                        <button
                          type="button"
                          className="os-small-btn os-outline"
                          onClick={() =>
                            adicionarPecaDiagnostico(
                              diagnostico.id,
                              servico.id
                            )
                          }
                        >
                          + Adicionar peça
                        </button>

                        {servico.pecas.map((peca, pecaIndex) => {
                          const codigoPecaCompleto = `${codigoServicoCompleto}.${
                            pecaIndex + 1
                          }`;

                          return (
                            <div className="os-piece-row" key={peca.id}>
                              <div className="os-piece-title-row">
                                <div className="os-code os-code-piece">
                                  {pecaIndex + 1}
                                </div>

                                <div>
                                  <strong>Peça {pecaIndex + 1}</strong>
                                  <small>
                                    Código interno: {codigoPecaCompleto}
                                  </small>
                                </div>
                              </div>

                              <div className="os-form-grid os-grid-piece">
                                <div className="os-field os-col-2">
                                  <label>Descrição da peça</label>
                                  <input
                                    value={peca.descricao}
                                    onChange={(e) =>
                                      atualizarPecaDiagnostico(
                                        diagnostico.id,
                                        servico.id,
                                        peca.id,
                                        'descricao',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Ex: Pastilha de freio"
                                  />
                                </div>

                                <div className="os-field">
                                  <label>Fornecedor</label>
                                  <input
                                    value={peca.fornecedor}
                                    onChange={(e) =>
                                      atualizarPecaDiagnostico(
                                        diagnostico.id,
                                        servico.id,
                                        peca.id,
                                        'fornecedor',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Fornecedor"
                                  />
                                </div>

                                <div className="os-field">
                                  <label>Qtd.</label>
                                  <input
                                    type="number"
                                    value={peca.quantidade}
                                    onChange={(e) =>
                                      atualizarPecaDiagnostico(
                                        diagnostico.id,
                                        servico.id,
                                        peca.id,
                                        'quantidade',
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>

                                <div className="os-field">
                                  <label>Custo</label>
                                  <input
                                    type="number"
                                    value={peca.custoUnitario}
                                    onChange={(e) =>
                                      atualizarPecaDiagnostico(
                                        diagnostico.id,
                                        servico.id,
                                        peca.id,
                                        'custoUnitario',
                                        e.target.value
                                      )
                                    }
                                    placeholder="0,00"
                                  />
                                </div>

                                <div className="os-field">
                                  <label>Desconto</label>
                                  <input
                                    type="number"
                                    value={peca.desconto}
                                    onChange={(e) =>
                                      atualizarPecaDiagnostico(
                                        diagnostico.id,
                                        servico.id,
                                        peca.id,
                                        'desconto',
                                        e.target.value
                                      )
                                    }
                                    placeholder="0,00"
                                  />
                                </div>

                                <div className="os-field">
                                  <label>Total</label>
                                  <input
                                    readOnly
                                    value={formatarMoeda(
                                      Number(peca.quantidade || 0) *
                                        Number(peca.custoUnitario || 0) -
                                        Number(peca.desconto || 0)
                                    )}
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                className="os-icon-btn"
                                onClick={() =>
                                  removerPecaDiagnostico(
                                    diagnostico.id,
                                    servico.id,
                                    peca.id
                                  )
                                }
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </article>
            );
          })}

          {ordem.servicosSemDiagnostico.length > 0 && (
            <article className="os-diagnostic-card os-no-diagnostic">
              <div className="os-diagnostic-header">
                <div className="os-code os-code-free">S</div>
                <strong>Serviços sem diagnóstico</strong>
              </div>

              {ordem.servicosSemDiagnostico.map((servico, servicoIndex) => {
                const codigoServicoCompleto = `S.${servicoIndex + 1}`;

                return (
                  <article className="os-service-card" key={servico.id}>
                    <div className="os-service-title-row">
                      <div className="os-code os-code-service">
                        {servicoIndex + 1}
                      </div>

                      <div>
                        <strong>Serviço {servicoIndex + 1}</strong>
                        <small>Código interno: {codigoServicoCompleto}</small>
                      </div>
                    </div>

                    <div className="os-service-header">
                      <div className="os-form-grid os-grid-service">
                        <div className="os-field os-col-2">
                          <label>Descrição do serviço</label>
                          <input
                            value={servico.descricao}
                            onChange={(e) =>
                              atualizarServicoSemDiagnostico(
                                servico.id,
                                'descricao',
                                e.target.value
                              )
                            }
                            placeholder="Serviço sem diagnóstico"
                          />
                        </div>

                        <div className="os-field">
                          <label>Responsável</label>
                          <input
                            value={servico.responsavel}
                            onChange={(e) =>
                              atualizarServicoSemDiagnostico(
                                servico.id,
                                'responsavel',
                                e.target.value
                              )
                            }
                            placeholder="Técnico"
                          />
                        </div>

                        <div className="os-field">
                          <label>Tipo</label>
                          <select
                            value={servico.tipo}
                            onChange={(e) =>
                              atualizarServicoSemDiagnostico(
                                servico.id,
                                'tipo',
                                e.target.value
                              )
                            }
                          >
                            <option value="">Selecione</option>
                            <option value="mao_de_obra">Mão de obra</option>
                            <option value="reparo">Reparo</option>
                            <option value="troca_peca">Troca de peça</option>
                          </select>
                        </div>

                        <div className="os-field">
                          <label>Preço</label>
                          <input
                            type="number"
                            value={servico.precoVenda}
                            onChange={(e) =>
                              atualizarServicoSemDiagnostico(
                                servico.id,
                                'precoVenda',
                                e.target.value
                              )
                            }
                            placeholder="0,00"
                          />
                        </div>

                        <div className="os-field">
                          <label>Desconto</label>
                          <input
                            type="number"
                            value={servico.desconto}
                            onChange={(e) =>
                              atualizarServicoSemDiagnostico(
                                servico.id,
                                'desconto',
                                e.target.value
                              )
                            }
                            placeholder="0,00"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="os-icon-btn"
                        onClick={() =>
                          removerServicoSemDiagnostico(servico.id)
                        }
                      >
                        ×
                      </button>
                    </div>

                    <div className="os-piece-area">
                      <button
                        type="button"
                        className="os-small-btn os-outline"
                        onClick={() => adicionarPecaSemDiagnostico(servico.id)}
                      >
                        + Adicionar peça
                      </button>

                      {servico.pecas.map((peca, pecaIndex) => {
                        const codigoPecaCompleto = `${codigoServicoCompleto}.${
                          pecaIndex + 1
                        }`;

                        return (
                          <div className="os-piece-row" key={peca.id}>
                            <div className="os-piece-title-row">
                              <div className="os-code os-code-piece">
                                {pecaIndex + 1}
                              </div>

                              <div>
                                <strong>Peça {pecaIndex + 1}</strong>
                                <small>
                                  Código interno: {codigoPecaCompleto}
                                </small>
                              </div>
                            </div>

                            <div className="os-form-grid os-grid-piece">
                              <div className="os-field os-col-2">
                                <label>Descrição da peça</label>
                                <input
                                  value={peca.descricao}
                                  onChange={(e) =>
                                    atualizarPecaSemDiagnostico(
                                      servico.id,
                                      peca.id,
                                      'descricao',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Peça"
                                />
                              </div>

                              <div className="os-field">
                                <label>Fornecedor</label>
                                <input
                                  value={peca.fornecedor}
                                  onChange={(e) =>
                                    atualizarPecaSemDiagnostico(
                                      servico.id,
                                      peca.id,
                                      'fornecedor',
                                      e.target.value
                                    )
                                  }
                                />
                              </div>

                              <div className="os-field">
                                <label>Qtd.</label>
                                <input
                                  type="number"
                                  value={peca.quantidade}
                                  onChange={(e) =>
                                    atualizarPecaSemDiagnostico(
                                      servico.id,
                                      peca.id,
                                      'quantidade',
                                      e.target.value
                                    )
                                  }
                                />
                              </div>

                              <div className="os-field">
                                <label>Custo</label>
                                <input
                                  type="number"
                                  value={peca.custoUnitario}
                                  onChange={(e) =>
                                    atualizarPecaSemDiagnostico(
                                      servico.id,
                                      peca.id,
                                      'custoUnitario',
                                      e.target.value
                                    )
                                  }
                                />
                              </div>

                              <div className="os-field">
                                <label>Total</label>
                                <input
                                  readOnly
                                  value={formatarMoeda(
                                    Number(peca.quantidade || 0) *
                                      Number(peca.custoUnitario || 0)
                                  )}
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              className="os-icon-btn"
                              onClick={() =>
                                removerPecaSemDiagnostico(servico.id, peca.id)
                              }
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </article>
          )}
        </section>

        <section className="os-bottom">
          <div className="os-summary-card">
            <h3>Pagamento</h3>

            <div>
              <span>Serviços</span>
              <strong>{formatarMoeda(totais.totalServicos)}</strong>
            </div>

            <div>
              <span>Peças</span>
              <strong>{formatarMoeda(totais.totalPecas)}</strong>
            </div>

            <div className="os-summary-total">
              <span>Total</span>
              <strong>{formatarMoeda(totais.totalGeral)}</strong>
            </div>
          </div>

          <button
            type="button"
            className="os-quote-btn"
            disabled={pecasParaCotacao.length === 0}
            onClick={() => setModalCotacaoAberto(true)}
          >
            Enviar cotação para fornecedor
          </button>
        </section>

        {modalCotacaoAberto && (
          <div className="os-modal-overlay">
            <div className="os-modal">
              <div className="os-modal-header">
                <h2>Enviar cotação para fornecedores</h2>

                <button
                  type="button"
                  onClick={() => setModalCotacaoAberto(false)}
                >
                  ×
                </button>
              </div>

              <div className="os-modal-section">
                <h3>Veículo</h3>
                <p>
                  {ordem.veiculo.marca || '-'} {ordem.veiculo.modelo || '-'} |{' '}
                  Ano: {ordem.veiculo.ano || '-'} | Motor:{' '}
                  {ordem.veiculo.motor || '-'} | Ar:{' '}
                  {ordem.veiculo.possuiAr ? 'Sim' : 'Não'} | Chassi:{' '}
                  {ordem.veiculo.chassi || '-'}
                </p>
              </div>

              <div className="os-modal-section">
                <h3>Peças da cotação</h3>

                {pecasParaCotacao.map((peca) => (
                  <div className="os-modal-piece" key={peca.id}>
                    <strong>{peca.codigoPeca}</strong>
                    <span>{peca.descricao || 'Peça sem descrição'}</span>
                  </div>
                ))}
              </div>

              <div className="os-modal-section">
                <h3>Fornecedores</h3>

                {fornecedores.map((fornecedor) => (
                  <label className="os-provider" key={fornecedor.id}>
                    <input
                      type="checkbox"
                      checked={fornecedor.selecionado}
                      onChange={() => alternarFornecedor(fornecedor.id)}
                    />
                    {fornecedor.nome}
                  </label>
                ))}
              </div>

              <div className="os-modal-actions">
                <button
                  type="button"
                  className="os-small-btn os-dark"
                  onClick={() => setModalCotacaoAberto(false)}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="os-small-btn os-blue"
                  onClick={enviarCotacao}
                >
                  Enviar cotação
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}

export default OrdemServico;