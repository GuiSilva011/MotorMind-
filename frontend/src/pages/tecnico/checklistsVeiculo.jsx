import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/tecnicoStyles/checklistsVeiculo.css';

function ChecklistsVeiculo() {
  const navigate = useNavigate();
  const location = useLocation();

  const veiculo = location.state?.veiculo || null;

  const [checklists, setChecklists] = useState([]);
  const [checklistSelecionada, setChecklistSelecionada] = useState(null);
  const [carregando, setCarregando] = useState(false);

  // Flag para garantir que o carregamento inicial ocorra apenas uma vez.
  const carregouInicialmente = useRef(false);

  // Busca a lista de checklists apenas na primeira vez que ha veiculo selecionado.
  useEffect(() => {
    if (carregouInicialmente.current) return;

    if (veiculo?.id) {
      carregouInicialmente.current = true;
      carregarChecklists();
    }
  }, [veiculo?.id]);

  // Carrega todas as checklists do veiculo selecionado.
  async function carregarChecklists() {
    try {
      if (!veiculo?.id) {
        setChecklists([]);
        return;
      }

      setCarregando(true);

      const response = await api.get(`/checklists/veiculo/${veiculo.id}`);

      setChecklists(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar checklists:', error);

      const status = error.response?.status;

      if (status === 404) {
        setChecklists([]);
        return;
      }

      setChecklists([]);

      toast.error(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao listar checklists.',
        {
          toastId: 'erro-listar-checklists',
        }
      );
    } finally {
      setCarregando(false);
    }
  }

  // Monta o nome amigavel do veiculo exibido na tela.
  function montarNomeVeiculo() {
    if (!veiculo) return 'Nenhum veículo selecionado';

    const fabricante = veiculo.fabricante || '';
    const modelo = veiculo.modelo || '';

    return `${fabricante} ${modelo}`.trim() || 'Veículo sem descrição';
  }

  // Formata a data da checklist para visualizacao.
  function formatarData(data) {
    if (!data) return '-';

    return new Date(data).toLocaleString('pt-BR');
  }

  // Resolve a URL completa da imagem enviada no backend.
  function obterUrlFoto(caminho) {
    if (!caminho) return null;

    if (caminho.startsWith('http')) {
      return caminho;
    }

    return `http://localhost:3000${caminho}`;
  }

  // Normaliza itens que podem vir como texto ou objeto.
  function normalizarItensChecklist(lista) {
    if (!Array.isArray(lista)) return [];

    return lista.map((item) => {
      if (typeof item === 'string') {
        return {
          nome: item,
          valor: true,
        };
      }

      return {
        nome: item?.nome || item?.label || item?.descricao || '-',
        valor:
          item?.valor === true
            ? true
            : item?.valor === false
            ? false
            : null,
      };
    });
  }

  // Separa itens marcados como ok e nao ok.
  function separarItensMarcados(lista) {
    const itens = normalizarItensChecklist(lista);

    return {
      ok: itens.filter((item) => item.valor === true),
      no: itens.filter((item) => item.valor === false),
    };
  }

  // Conta quantos itens foram preenchidos na lista.
  function contarItensPreenchidos(lista) {
    const itens = normalizarItensChecklist(lista);

    return itens.filter((item) => item.valor !== null).length;
  }

  // Conta quantos itens foram marcados com ok.
  function contarItensOk(lista) {
    const itens = normalizarItensChecklist(lista);

    return itens.filter((item) => item.valor === true).length;
  }

  // Conta quantos itens foram marcados com nao.
  function contarItensNao(lista) {
    const itens = normalizarItensChecklist(lista);

    return itens.filter((item) => item.valor === false).length;
  }

  // Converte o valor da checklist em texto curto.
  function obterTextoStatus(valor) {
    if (valor === true) return '✓';
    if (valor === false) return 'X';
    return '';
  }

  // Escolhe a classe CSS conforme o estado do item.
  function obterClasseStatus(valor) {
    if (valor === true) return 'checklists-status-ok';
    if (valor === false) return 'checklists-status-no';
    return 'checklists-status-null';
  }

  // Abre a tela de nova checklist para o veiculo atual.
  function abrirNovaChecklist() {
    if (!veiculo) {
      toast.warning('Selecione um veículo antes de criar uma checklist.');
      return;
    }

    navigate('/tecnico/checklist', {
      state: {
        veiculo,
      },
    });
  }

  // Volta para o painel tecnico.
  function voltarPainel() {
    navigate('/tecnico/painel');
  }

  // Agrupa itens marcados por estado dentro do modal.
  function renderGrupoItens(titulo, itens, valor) {
    if (!itens.length) return null;

    return (
      <div className="checklists-itens-group">
        <div className="checklists-itens-group-title">
          <span className={`checklists-status-box ${obterClasseStatus(valor)}`}>
            {obterTextoStatus(valor)}
          </span>

          <h4>{titulo}</h4>

          <small>{itens.length} item(ns)</small>
        </div>

        <div className="checklists-itens-grid">
          {itens.map((item, index) => (
            <div className="checklists-item-check" key={`${item.nome}-${index}`}>
              <span>{item.nome}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Renderiza os itens de uma lista em blocos separados.
  function renderItens(lista) {
    const { ok, no } = separarItensMarcados(lista);

    if (!ok.length && !no.length) {
      return (
        <div className="checklists-empty-box">
          Nenhum item foi marcado nesta etapa.
        </div>
      );
    }

    return (
      <div className="checklists-itens-wrapper">
        {renderGrupoItens('Itens marcados com ✓', ok, true)}
        {renderGrupoItens('Itens marcados com X', no, false)}
      </div>
    );
  }

  // Renderiza a foto ou o estado vazio.
  function renderFoto(caminho, titulo) {
    const url = obterUrlFoto(caminho);

    return (
      <div className="checklists-photo-card">
        <strong>{titulo}</strong>

        {url ? (
          <img src={url} alt={titulo} />
        ) : (
          <div className="checklists-photo-empty">Sem foto</div>
        )}
      </div>
    );
  }

  // Resume os totais de preenchimento da checklist.
  function renderResumoChecklist(checklist) {
    const entradaPreenchida = contarItensPreenchidos(checklist.itensEntrada);
    const entradaOk = contarItensOk(checklist.itensEntrada);
    const entradaNao = contarItensNao(checklist.itensEntrada);

    const diagnosticoPreenchido = contarItensPreenchidos(
      checklist.itensDiagnostico
    );
    const diagnosticoOk = contarItensOk(checklist.itensDiagnostico);
    const diagnosticoNao = contarItensNao(checklist.itensDiagnostico);

    return (
      <div className="checklists-item-stats">
        <span>
          Entrada: {entradaPreenchida} preenchido(s) | ✓ {entradaOk} | X{' '}
          {entradaNao}
        </span>

        <span>
          Diagnóstico: {diagnosticoPreenchido} preenchido(s) | ✓{' '}
          {diagnosticoOk} | X {diagnosticoNao}
        </span>
      </div>
    );
  }


  // Protege valores usados dentro do HTML de impressão.
  function escaparHtml(valor) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Gera o documento de impressão da checklist selecionada.
  function imprimirChecklist(checklist) {
    if (!checklist) {
      toast.warning('Nenhuma checklist selecionada para impressão.');
      return;
    }

    const veiculoChecklist = checklist.veiculo || veiculo || {};
    const cliente = veiculoChecklist.cliente || veiculo?.cliente || {};

    const itensEntradaNormalizados = normalizarItensChecklist(
      checklist.itensEntrada
    );

    const itensDiagnosticoNormalizados = normalizarItensChecklist(
      checklist.itensDiagnostico
    );

    const entradaOk = itensEntradaNormalizados.filter(
      (item) => item.valor === true
    );

    const entradaNo = itensEntradaNormalizados.filter(
      (item) => item.valor === false
    );

    const diagnosticoOk = itensDiagnosticoNormalizados.filter(
      (item) => item.valor === true
    );

    const diagnosticoNo = itensDiagnosticoNormalizados.filter(
      (item) => item.valor === false
    );

    const dataChecklist = checklist.createdAt
      ? new Date(checklist.createdAt).toLocaleDateString('pt-BR')
      : new Date().toLocaleDateString('pt-BR');

    const horaChecklist = checklist.createdAt
      ? new Date(checklist.createdAt).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });

    function montarTabelaItens(titulo, itens, simbolo, classe) {
      return `
        <section class="box box-itens">
          <h2>${escaparHtml(titulo)}</h2>

          ${
            itens.length > 0
              ? `
                <div class="itens-print-grid">
                  ${itens
                    .map(
                      (item) => `
                        <div class="item-print">
                          <span class="status ${classe}">${simbolo}</span>
                          <span>${escaparHtml(item.nome || '-')}</span>
                        </div>
                      `
                    )
                    .join('')}
                </div>
              `
              : '<p class="vazio">Nenhum item registrado.</p>'
          }
        </section>
      `;
    }

    function montarFoto(caminho, titulo) {
      const url = obterUrlFoto(caminho);

      return `
        <div class="foto-card">
          <strong>${escaparHtml(titulo)}</strong>

          ${
            url
              ? `<img src="${escaparHtml(url)}" alt="${escaparHtml(titulo)}" />`
              : '<div class="foto-vazia">Sem foto</div>'
          }
        </div>
      `;
    }

    const nomeVeiculo =
      [
        veiculoChecklist.fabricante,
        veiculoChecklist.marca,
        veiculoChecklist.modelo,
      ]
        .filter(Boolean)
        .join(' ') || 'Veículo sem descrição';

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>Checklist - ${escaparHtml(veiculoChecklist.placa || '')}</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 14px;
              font-family: Arial, Helvetica, sans-serif;
              color: #07142f;
              background: #ffffff;
              font-size: 10px;
            }

            .documento {
              max-width: 100%;
              margin: 0 auto;
            }

            .cabecalho {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 3px solid #0066ff;
              padding-bottom: 10px;
              margin-bottom: 12px;
            }

            .marca h1 {
              margin: 0;
              font-size: 22px;
              color: #0066ff;
              letter-spacing: -0.5px;
            }

            .marca h1 span {
              color: #ff7a00;
            }

            .marca p {
              margin: 4px 0 0;
              color: #64748b;
            }

            .info {
              text-align: right;
            }

            .info strong {
              display: block;
              color: #0066ff;
              font-size: 14px;
              margin-bottom: 4px;
            }

            .info span {
              display: block;
              margin-top: 3px;
            }

            .box {
              border: 1px solid #dbe3ef;
              border-radius: 6px;
              padding: 10px;
              margin-bottom: 10px;
              break-inside: auto;
              page-break-inside: auto;
            }

            .box-dados,
            .box-observacao,
            .box-fotos,
            .assinaturas {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .box h2 {
              margin: 0 0 10px;
              padding-bottom: 6px;
              border-bottom: 1px solid #e5eaf2;
              color: #0066ff;
              font-size: 13px;
            }

            .grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px 12px;
            }

            .campo label {
              display: block;
              font-size: 8px;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 3px;
            }

            .campo span {
              display: block;
              font-weight: 700;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }

            th,
            td {
              border: 1px solid #dbe3ef;
              padding: 8px;
              text-align: left;
              vertical-align: top;
            }

            th {
              background: #f1f5f9;
              color: #07142f;
              font-size: 11px;
            }

            td {
              font-size: 11px;
            }

            .ok {
              width: 70px;
              color: #15803d;
              font-weight: bold;
              text-align: center;
            }

            .erro {
              width: 70px;
              color: #dc2626;
              font-weight: bold;
              text-align: center;
            }

            .vazio {
              color: #64748b;
              font-style: italic;
            }

            .itens-print-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 5px 8px;
            }

            .item-print {
              display: grid;
              grid-template-columns: 24px 1fr;
              align-items: center;
              gap: 6px;
              min-height: 23px;
              padding: 4px 6px;
              border: 1px solid #dbe3ef;
              border-radius: 5px;
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .status {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              font-weight: 800;
            }

            .observacao {
              min-height: 50px;
              white-space: pre-wrap;
              line-height: 1.5;
            }

            .foto-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
            }

            .foto-card {
              border: 1px solid #dbe3ef;
              border-radius: 8px;
              padding: 8px;
              min-height: 130px;
            }

            .foto-card strong {
              display: block;
              margin-bottom: 8px;
              font-size: 11px;
              color: #07142f;
            }

            .foto-card img {
              width: 100%;
              height: 80px;
              object-fit: cover;
              border-radius: 6px;
              display: block;
            }

            .foto-vazia {
              height: 80px;
              border-radius: 6px;
              background: #f1f5f9;
              color: #64748b;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
            }

            .assinaturas {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 48px;
              margin-top: 36px;
              page-break-inside: avoid;
            }

            .assinatura {
              border-top: 1px solid #07142f;
              text-align: center;
              padding-top: 8px;
              font-size: 11px;
            }

            .rodape {
              margin-top: 16px;
              padding-top: 12px;
              border-top: 1px solid #dbe3ef;
              text-align: center;
              color: #64748b;
              font-size: 10px;
            }

            @page {
              size: A4;
              margin: 8mm;
            }

            @media print {
              body {
                padding: 0;
              }

              .documento {
                max-width: 100%;
              }
            }
          </style>
        </head>

        <body>
          <main class="documento">
            <header class="cabecalho">
              <div class="marca">
                <h1>Motor<span>Mind</span></h1>
                <p>Sistema de Gestão para Oficinas Mecânicas</p>
              </div>

              <div class="info">
                <strong>Checklist do veículo</strong>
                <span>Checklist #${escaparHtml(checklist.id || '-')}</span>
                <span>Data: ${escaparHtml(dataChecklist)}</span>
                <span>Hora: ${escaparHtml(horaChecklist)}</span>
              </div>
            </header>

            <section class="box box-dados">
              <h2>Dados do veículo e cliente</h2>

              <div class="grid">
                <div class="campo">
                  <label>Veículo</label>
                  <span>${escaparHtml(nomeVeiculo)}</span>
                </div>

                <div class="campo">
                  <label>Placa</label>
                  <span>${escaparHtml(veiculoChecklist.placa || '-')}</span>
                </div>

                <div class="campo">
                  <label>Cliente</label>
                  <span>${escaparHtml(cliente.nome || cliente.Nome || '-')}</span>
                </div>

                <div class="campo">
                  <label>Checklist</label>
                  <span>#${escaparHtml(checklist.id || '-')}</span>
                </div>
              </div>
            </section>

            ${montarTabelaItens(
              'Entrada - Itens marcados com ✓',
              entradaOk,
              '✓',
              'ok'
            )}

            ${montarTabelaItens(
              'Entrada - Itens marcados com X',
              entradaNo,
              'X',
              'erro'
            )}

            ${montarTabelaItens(
              'Diagnóstico - Itens marcados com ✓',
              diagnosticoOk,
              '✓',
              'ok'
            )}

            ${montarTabelaItens(
              'Diagnóstico - Itens marcados com X',
              diagnosticoNo,
              'X',
              'erro'
            )}

            <section class="box box-observacao">
              <h2>Observações da entrada</h2>
              <div class="observacao">
                ${escaparHtml(
                  checklist.observacoesEntrada ||
                    'Nenhuma observação registrada.'
                )}
              </div>
            </section>

            <section class="box box-observacao">
              <h2>Observações do diagnóstico</h2>
              <div class="observacao">
                ${escaparHtml(
                  checklist.observacoesDiagnostico ||
                    'Nenhuma observação registrada.'
                )}
              </div>
            </section>

            <section class="box box-fotos">
              <h2>Fotos registradas</h2>

              <div class="foto-grid">
                ${montarFoto(checklist.fotoFrente, 'Foto frontal')}
                ${montarFoto(checklist.fotoTraseira, 'Foto traseira')}
                ${montarFoto(checklist.fotoEsquerda, 'Lateral esquerda')}
                ${montarFoto(checklist.fotoDireita, 'Lateral direita')}
              </div>
            </section>

            <section class="assinaturas">
              <div class="assinatura">
                Assinatura do cliente
              </div>

              <div class="assinatura">
                Responsável técnico
              </div>
            </section>

            <footer class="rodape">
              Documento gerado pelo MotorMind.
            </footer>
          </main>

          <script>
            window.onload = function () {
              // Aguarda a montagem completa do documento antes de disparar a impressão.
              setTimeout(function () {
                window.print();

                // Fecha automaticamente a aba auxiliar após finalizar a impressão.
                window.onafterprint = function () {
                  window.close();
                };
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    // Abre uma nova aba para imprimir sem alterar a tela principal do usuário.
    const janela = window.open('', '_blank');

    if (!janela) {
      toast.error('Não foi possível abrir a janela de impressão.');
      return;
    }

    janela.document.open();
    janela.document.write(html);
    janela.document.close();
  }

  // Renderiza o modal de detalhes da checklist selecionada.
  function renderModalDetalhes() {
    if (!checklistSelecionada) return null;

    return (
      <div className="checklists-modal-overlay">
        <div className="checklists-modal">
          <div className="checklists-modal-header">
            <div>
              <h2>Checklist #{checklistSelecionada.id}</h2>
              <span>{formatarData(checklistSelecionada.createdAt)}</span>
            </div>

            <div className="checklists-modal-header-actions">
              <button
                type="button"
                className="checklists-print-btn desktop-only-print"
                onClick={() => imprimirChecklist(checklistSelecionada)}
              >
                Imprimir checklist
              </button>

              <button
                type="button"
                className="checklists-modal-close"
                onClick={() => setChecklistSelecionada(null)}
              >
                ×
              </button>
            </div>
          </div>

          <div className="checklists-modal-vehicle">
            <div>
              <span>Veículo</span>
              <strong>{montarNomeVeiculo()}</strong>
            </div>

            <div>
              <span>Placa</span>
              <strong>{veiculo?.placa || '-'}</strong>
            </div>
          </div>

          <div className="checklists-modal-grid">
            <section className="checklists-modal-section">
              <h3>Inspeção mecânica na entrada</h3>

              {renderItens(checklistSelecionada.itensEntrada)}

              <div className="checklists-observacao-box">
                <span>Observações</span>
                <p>
                  {checklistSelecionada.observacoesEntrada ||
                    'Sem observações.'}
                </p>
              </div>
            </section>

            <section className="checklists-modal-section">
              <h3>Inspeção mecânica na fase de diagnóstico</h3>

              {renderItens(checklistSelecionada.itensDiagnostico)}

              <div className="checklists-observacao-box">
                <span>Observações</span>
                <p>
                  {checklistSelecionada.observacoesDiagnostico ||
                    'Sem observações.'}
                </p>
              </div>
            </section>
          </div>

          <section className="checklists-modal-section">
            <h3>Fotos registradas</h3>

            <div className="checklists-photo-grid">
              {renderFoto(checklistSelecionada.fotoFrente, 'Foto frontal')}
              {renderFoto(checklistSelecionada.fotoTraseira, 'Foto traseira')}
              {renderFoto(checklistSelecionada.fotoEsquerda, 'Lateral esquerda')}
              {renderFoto(checklistSelecionada.fotoDireita, 'Lateral direita')}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <main className="checklists-page">
        <section className="checklists-top">
          <div>
            <h1>Checklists do veículo</h1>
            <p>Consulte as inspeções já registradas para este veículo.</p>

            {carregando && <small>Carregando checklists...</small>}
          </div>

          <div className="checklists-top-actions">
            <button
              type="button"
              className="checklists-btn checklists-btn-outline"
              onClick={voltarPainel}
            >
              Voltar ao painel
            </button>

            <button
              type="button"
              className="checklists-btn checklists-btn-blue"
              onClick={abrirNovaChecklist}
              disabled={!veiculo}
            >
              Nova checklist
            </button>
          </div>
        </section>

        <section className="checklists-vehicle-card">
          <div className="checklists-vehicle-icon">
            <img src="/icons/veiculo.svg" alt="Veículo" />
          </div>

          <div>
            <span>Veículo selecionado</span>
            <strong>{montarNomeVeiculo()}</strong>
          </div>

          <div>
            <span>Placa</span>
            <strong>{veiculo?.placa || '-'}</strong>
          </div>

          <div>
            <span>Cliente</span>
            <strong>{veiculo?.cliente?.nome || '-'}</strong>
          </div>
        </section>

        <section className="checklists-card">
          <div className="checklists-card-header">
            <div>
              <h2>Checklists registradas</h2>
              <span>{checklists.length} checklist(s) encontrada(s)</span>
            </div>

            <button
              type="button"
              onClick={carregarChecklists}
              disabled={carregando || !veiculo}
            >
              Atualizar
            </button>
          </div>

          {!carregando && checklists.length === 0 && (
            <div className="checklists-empty">
              Nenhuma checklist encontrada para este veículo.
            </div>
          )}

          <div className="checklists-list">
            {checklists.map((checklist) => (
              <article className="checklists-item" key={checklist.id}>
                <div>
                  <strong>Checklist #{checklist.id}</strong>
                  <span>{formatarData(checklist.createdAt)}</span>
                </div>

                {renderResumoChecklist(checklist)}

                <button
                  type="button"
                  onClick={() => setChecklistSelecionada(checklist)}
                >
                  Ver detalhes
                </button>
              </article>
            ))}
          </div>
        </section>

        {renderModalDetalhes()}
      </main>
    </Layout>
  );
}

export default ChecklistsVeiculo;