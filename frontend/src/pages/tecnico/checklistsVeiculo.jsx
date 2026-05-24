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

  const carregouInicialmente = useRef(false);

  useEffect(() => {
    if (carregouInicialmente.current) return;

    if (veiculo?.id) {
      carregouInicialmente.current = true;
      carregarChecklists();
    }
  }, [veiculo?.id]);

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
  function montarNomeVeiculo() {
    if (!veiculo) return 'Nenhum veículo selecionado';

    const fabricante = veiculo.fabricante || '';
    const modelo = veiculo.modelo || '';

    return `${fabricante} ${modelo}`.trim() || 'Veículo sem descrição';
  }

  function formatarData(data) {
    if (!data) return '-';

    return new Date(data).toLocaleString('pt-BR');
  }

  function obterUrlFoto(caminho) {
    if (!caminho) return null;

    if (caminho.startsWith('http')) {
      return caminho;
    }

    return `http://localhost:3000${caminho}`;
  }

  function contarItens(lista) {
    if (!Array.isArray(lista)) return 0;

    return lista.length;
  }

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

  function voltarPainel() {
    navigate('/tecnico/painel');
  }

  function renderItens(lista) {
    if (!Array.isArray(lista) || lista.length === 0) {
      return <div className="checklists-empty-box">Nenhum item marcado.</div>;
    }

    return (
      <div className="checklists-itens-list">
        {lista.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    );
  }

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

            <button
              type="button"
              onClick={() => setChecklistSelecionada(null)}
            >
              ×
            </button>
          </div>

          <div className="checklists-modal-summary">
            <div>
              <span>Veículo</span>
              <strong>{montarNomeVeiculo()}</strong>
            </div>

            <div>
              <span>Placa</span>
              <strong>{veiculo?.placa || '-'}</strong>
            </div>

            <div>
              <span>Itens entrada</span>
              <strong>{contarItens(checklistSelecionada.itensEntrada)}</strong>
            </div>

            <div>
              <span>Itens diagnóstico</span>
              <strong>
                {contarItens(checklistSelecionada.itensDiagnostico)}
              </strong>
            </div>
          </div>

          <div className="checklists-modal-grid">
            <section className="checklists-modal-section">
              <h3>Inspeção de entrada</h3>

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
              <h3>Inspeção de diagnóstico</h3>

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
              {renderFoto(
                checklistSelecionada.fotoEsquerda,
                'Lateral esquerda'
              )}
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

                <div className="checklists-item-stats">
                  <span>Entrada: {contarItens(checklist.itensEntrada)}</span>
                  <span>
                    Diagnóstico: {contarItens(checklist.itensDiagnostico)}
                  </span>
                </div>

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