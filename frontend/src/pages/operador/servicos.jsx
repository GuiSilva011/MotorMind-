import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/operadorStyles/servicos.css';

/**
 * Gera um código automático com prefixo, data atual e número aleatório.
 *
 * @param {string} prefixo - Prefixo usado no código.
 * @returns {string} Código gerado.
 */
function gerarCodigo(prefixo) {
  const data = new Date();

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const aleatorio = String(Math.floor(Math.random() * 9000) + 1000);

  return `${prefixo}-${ano}${mes}${dia}-${aleatorio}`;
}

/**
 * Cria o estado inicial do formulário de serviço.
 *
 * @returns {Object} Dados iniciais do serviço.
 */
function criarServicoInicial() {
  return {
    codigo: gerarCodigo('SERV'),
    nome: '',
    categoria: '',
    valorPadrao: '',
  };
}

/**
 * Tela responsável pelo cadastro, edição, listagem e exclusão de serviços.
 *
 * @component
 * @function Servicos
 * @returns {JSX.Element} Tela de manutenção de serviços.
 */
function Servicos() {
  const [servicos, setServicos] = useState([]);
  const [form, setForm] = useState(criarServicoInicial());
  const [editandoId, setEditandoId] = useState(null);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Carrega os servicos cadastrados quando a tela abre.
  useEffect(() => {
    carregarServicos();
  }, []);

/**
 * Busca todos os serviços cadastrados na API.
 *
 * @async
 * @returns {Promise<void>}
 */
  async function carregarServicos() {
    try {
      setCarregando(true);

      const response = await api.get('/servicos');

      setServicos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      alert('Erro ao carregar serviços.');
    } finally {
      setCarregando(false);
    }
  }

/**
 * Atualiza um campo específico do formulário de serviço.
 *
 * @param {string} campo - Nome do campo que será atualizado.
 * @param {string|number} valor - Novo valor do campo.
 * @returns {void}
 */
  function atualizarCampo(campo, valor) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

/**
 * Limpa o formulário e encerra o modo de edição.
 *
 * @returns {void}
 */
  function limparFormulario() {
    setForm(criarServicoInicial());
    setEditandoId(null);
  }
/**
 * Preenche o formulário com os dados de um serviço para edição.
 *
 * @param {Object} servico - Serviço selecionado na tabela.
 * @returns {void}
 */
  function editarServico(servico) {
    setEditandoId(servico.id);

    setForm({
      codigo: servico.codigo || '',
      nome: servico.nome || '',
      categoria: servico.categoria || '',
      valorPadrao: servico.valorPadrao || '',
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

/**
 * Valida os dados e envia o serviço para cadastro ou atualização na API.
 *
 * @async
 * @param {Object} event - Evento de envio do formulário.
 * @returns {Promise<void>}
 */
  async function salvarServico(event) {
    event.preventDefault();

    try {
      if (!form.codigo.trim()) {
        alert('Informe o código do serviço.');
        return;
      }

      if (!form.nome.trim()) {
        alert('Informe o nome do serviço.');
        return;
      }

      setSalvando(true);

      const payload = {
        codigo: form.codigo.trim().toUpperCase(),
        nome: form.nome.trim(),
        categoria: form.categoria?.trim() || null,
        valorPadrao: form.valorPadrao ? Number(form.valorPadrao) : null,
      };

      if (editandoId) {
        await api.put(`/servicos/${editandoId}`, payload);
        alert('Serviço atualizado com sucesso!');
      } else {
        await api.post('/servicos', payload);
        alert('Serviço cadastrado com sucesso!');
      }

      limparFormulario();
      await carregarServicos();
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);

      alert(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao salvar serviço.'
      );
    } finally {
      setSalvando(false);
    }
  }

/**
 * Exclui um serviço após confirmação do usuário.
 *
 * @async
 * @param {number} id - Identificador do serviço.
 * @returns {Promise<void>}
 */
  async function excluirServico(id) {
    const confirmar = window.confirm('Deseja realmente excluir este serviço?');

    if (!confirmar) return;

    try {
      await api.delete(`/servicos/${id}`);

      alert('Serviço excluído com sucesso!');
      await carregarServicos();
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);

      alert(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao excluir serviço.'
      );
    }
  }

 /**
 * Formata um valor numérico para moeda brasileira.
 *
 * @param {number|string|null|undefined} valor - Valor que será formatado.
 * @returns {string} Valor formatado em reais ou hífen.
 */
  function formatarMoeda(valor) {
    if (valor === null || valor === undefined || valor === '') {
      return '-';
    }

    return Number(valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

/**
 * Lista de serviços filtrada por código, nome ou categoria.
 *
 * @type {Array<Object>}
 */
  const servicosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return servicos;

    return servicos.filter((servico) => {
      const codigo = servico.codigo?.toLowerCase() || '';
      const nome = servico.nome?.toLowerCase() || '';
      const categoria = servico.categoria?.toLowerCase() || '';

      return (
        codigo.includes(termo) ||
        nome.includes(termo) ||
        categoria.includes(termo)
      );
    });
  }, [servicos, busca]);

  return (
    <Layout>
      <main className="servicos-page">
        <section className="servicos-top">
          <div>
            <h1>Cadastro de Serviços</h1>
            <p>Cadastre os serviços usados nas ordens de serviço.</p>

            {carregando && <small>Carregando serviços...</small>}
          </div>
        </section>

        <section className="servicos-card">
          <div className="servicos-card-title">
            <h2>{editandoId ? 'Editar serviço' : 'Novo serviço'}</h2>
            <span>
              O serviço cadastrado será usado como item cobrável dentro da OS.
            </span>
          </div>

          <form onSubmit={salvarServico}>
            <div className="servicos-form-grid">
              <div className="servicos-field">
                <label>Código</label>
                <input
                  value={form.codigo}
                  readOnly
                  placeholder="Código automático"
                />
              </div>

              <div className="servicos-field servicos-col-2">
                <label>Nome do serviço</label>
                <input
                  value={form.nome}
                  onChange={(event) =>
                    atualizarCampo('nome', event.target.value)
                  }
                  placeholder="Ex: Troca de embreagem"
                />
              </div>

              <div className="servicos-field">
                <label>Categoria</label>
                <input
                  value={form.categoria}
                  onChange={(event) =>
                    atualizarCampo('categoria', event.target.value)
                  }
                  placeholder="Ex: Mão de obra"
                />
              </div>

              <div className="servicos-field">
                <label>Valor padrão</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.valorPadrao}
                  onChange={(event) =>
                    atualizarCampo('valorPadrao', event.target.value)
                  }
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="servicos-actions">
              <button
                type="button"
                className="servicos-btn servicos-btn-light"
                onClick={limparFormulario}
              >
                Limpar
              </button>

              <button
                type="submit"
                className="servicos-btn servicos-btn-primary"
                disabled={salvando}
              >
                {salvando
                  ? 'Salvando...'
                  : editandoId
                  ? 'Salvar alterações'
                  : 'Cadastrar serviço'}
              </button>
            </div>
          </form>
        </section>

        <section className="servicos-card">
          <div className="servicos-list-header">
            <div>
              <h2>Serviços cadastrados</h2>
              <span>{servicosFiltrados.length} serviço(s) encontrado(s)</span>
            </div>

            <div className="servicos-search">
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por código, nome ou categoria"
              />
            </div>
          </div>

          <div className="servicos-table-wrap">
            <table className="servicos-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Valor padrão</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {servicosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="5" className="servicos-empty">
                      Nenhum serviço encontrado.
                    </td>
                  </tr>
                )}

                {servicosFiltrados.map((servico) => (
                  <tr key={servico.id}>
                    <td>
                      <strong>{servico.codigo}</strong>
                    </td>

                    <td>{servico.nome}</td>

                    <td>{servico.categoria || '-'}</td>

                    <td>{formatarMoeda(servico.valorPadrao)}</td>

                    <td>
                      <div className="servicos-table-actions">
                        <button
                          type="button"
                          className="servicos-mini-btn"
                          onClick={() => editarServico(servico)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="servicos-mini-btn danger"
                          onClick={() => excluirServico(servico.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </Layout>
  );
}

export default Servicos;