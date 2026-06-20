import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/operadorStyles/pecas.css';

/**
 * Lista de grupos disponíveis para classificação das peças.
 *
 * @constant {string[]}
 */
const gruposPecas = [
  'Arrefecimento',
  'Freios',
  'Suspensão',
  'Amortecedores',
  'Motor',
  'Filtros',
  'Lubrificação',
  'Elétrica',
  'Ignição',
  'Transmissão',
  'Direção',
  'Escapamento',
  'Pneus e rodas',
  'Outros',
];

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
 * Cria o estado inicial do formulário de peça.
 *
 * @returns {Object} Dados iniciais da peça.
 */
function criarPecaInicial() {
  return {
    codigo: gerarCodigo('PECA'),
    nome: '',
    marca: '',
    grupo: '',
    aplicacao: '',
    unidade: 'UN',
  };
}

/**
 * Tela responsável pelo cadastro, edição, listagem e exclusão de peças.
 *
 * @component
 * @function Pecas
 * @returns {JSX.Element} Tela de manutenção de peças.
 */
function Pecas() {
  const [pecas, setPecas] = useState([]);
  const [form, setForm] = useState(criarPecaInicial());
  const [editandoId, setEditandoId] = useState(null);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Carrega as pecas cadastradas ao iniciar a pagina.
  useEffect(() => {
    carregarPecas();
  }, []);

/**
 * Busca todas as peças cadastradas na API.
 *
 * @async
 * @returns {Promise<void>}
 */
  async function carregarPecas() {
    try {
      setCarregando(true);

      const response = await api.get('/pecas');

      setPecas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar peças:', error);
      alert('Erro ao carregar peças.');
    } finally {
      setCarregando(false);
    }
  }

/**
 * Atualiza um campo específico do formulário de peça.
 *
 * @param {string} campo - Nome do campo que será atualizado.
 * @param {string} valor - Novo valor do campo.
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
    setForm(criarPecaInicial());
    setEditandoId(null);
  }

/**
 * Preenche o formulário com os dados de uma peça para edição.
 *
 * @param {Object} peca - Peça selecionada na tabela.
 * @returns {void}
 */
  function editarPeca(peca) {
    setEditandoId(peca.id);

    setForm({
      codigo: peca.codigo || '',
      nome: peca.nome || '',
      marca: peca.marca || '',
      grupo: peca.grupo || '',
      aplicacao: peca.aplicacao || '',
      unidade: peca.unidade || 'UN',
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

/**
 * Valida os dados e envia a peça para cadastro ou atualização na API.
 *
 * @async
 * @param {Object} event - Evento de envio do formulário.
 * @returns {Promise<void>}
 */
  async function salvarPeca(event) {
    event.preventDefault();

    try {
      if (!form.codigo.trim()) {
        alert('O código da peça não foi gerado.');
        return;
      }

      if (!form.nome.trim()) {
        alert('Informe o nome da peça.');
        return;
      }

      if (!form.grupo.trim()) {
        alert('Selecione o grupo da peça.');
        return;
      }

      setSalvando(true);

      const payload = {
        codigo: form.codigo.trim().toUpperCase(),
        nome: form.nome.trim(),
        marca: form.marca?.trim() || null,
        grupo: form.grupo?.trim() || null,
        aplicacao: form.aplicacao?.trim() || null,
        unidade: form.unidade?.trim().toUpperCase() || 'UN',
      };

      if (editandoId) {
        await api.put(`/pecas/${editandoId}`, payload);
        alert('Peça atualizada com sucesso!');
      } else {
        await api.post('/pecas', payload);
        alert('Peça cadastrada com sucesso!');
      }

      limparFormulario();
      await carregarPecas();
    } catch (error) {
      console.error('Erro ao salvar peça:', error);

      alert(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao salvar peça.'
      );
    } finally {
      setSalvando(false);
    }
  }

/**
 * Exclui uma peça após confirmação do usuário.
 *
 * @async
 * @param {number} id - Identificador da peça.
 * @returns {Promise<void>}
 */
  async function excluirPeca(id) {
    const confirmar = window.confirm('Deseja realmente excluir esta peça?');

    if (!confirmar) return;

    try {
      await api.delete(`/pecas/${id}`);

      alert('Peça excluída com sucesso!');
      await carregarPecas();
    } catch (error) {
      console.error('Erro ao excluir peça:', error);

      alert(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao excluir peça.'
      );
    }
  }

/**
 * Lista de peças filtrada por código, nome, marca, grupo ou aplicação.
 *
 * @type {Array<Object>}
 */
  const pecasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return pecas;

    return pecas.filter((peca) => {
      const codigo = peca.codigo?.toLowerCase() || '';
      const nome = peca.nome?.toLowerCase() || '';
      const marca = peca.marca?.toLowerCase() || '';
      const grupo = peca.grupo?.toLowerCase() || '';
      const aplicacao = peca.aplicacao?.toLowerCase() || '';

      return (
        codigo.includes(termo) ||
        nome.includes(termo) ||
        marca.includes(termo) ||
        grupo.includes(termo) ||
        aplicacao.includes(termo)
      );
    });
  }, [pecas, busca]);

  return (
    <Layout>
      <main className="pecas-page">
        <section className="pecas-top">
          <div>
            <h1>Cadastro de Peças</h1>
            <p>Cadastre as peças usadas nas ordens de serviço.</p>

            {carregando && <small>Carregando peças...</small>}
          </div>
        </section>

        <section className="pecas-card">
          <div className="pecas-card-title">
            <h2>{editandoId ? 'Editar peça' : 'Nova peça'}</h2>
            <span>
              A peça cadastrada será usada como referência dentro da OS.
            </span>
          </div>

          <form onSubmit={salvarPeca}>
            <div className="pecas-form-grid">
              <div className="pecas-field">
                <label>Código</label>
                <input
                  value={form.codigo}
                  readOnly
                  placeholder="Código automático"
                />
              </div>

              <div className="pecas-field pecas-col-2">
                <label>Nome da peça</label>
                <input
                  value={form.nome}
                  onChange={(event) =>
                    atualizarCampo('nome', event.target.value)
                  }
                  placeholder="Ex: Pastilha de freio"
                />
              </div>

              <div className="pecas-field">
                <label>Marca</label>
                <input
                  value={form.marca}
                  onChange={(event) =>
                    atualizarCampo('marca', event.target.value)
                  }
                  placeholder="Ex: Bosch"
                />
              </div>

              <div className="pecas-field">
                <label>Grupo</label>
                <select
                  value={form.grupo}
                  onChange={(event) =>
                    atualizarCampo('grupo', event.target.value)
                  }
                >
                  <option value="">Selecione um grupo</option>

                  {gruposPecas.map((grupo) => (
                    <option key={grupo} value={grupo}>
                      {grupo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pecas-field">
                <label>Unidade</label>
                <select
                  value={form.unidade}
                  onChange={(event) =>
                    atualizarCampo('unidade', event.target.value)
                  }
                >
                  <option value="UN">UN</option>
                  <option value="PAR">PAR</option>
                  <option value="JG">JG</option>
                  <option value="KIT">KIT</option>
                </select>
              </div>

              <div className="pecas-field pecas-col-full">
                <label>Aplicação</label>
                <input
                  value={form.aplicacao}
                  onChange={(event) =>
                    atualizarCampo('aplicacao', event.target.value)
                  }
                  placeholder="Ex: Gol G5 1.0, motor EA111, freio dianteiro..."
                />
              </div>
            </div>

            <div className="pecas-actions">
              <button
                type="button"
                className="pecas-btn pecas-btn-light"
                onClick={limparFormulario}
              >
                Limpar
              </button>

              <button
                type="submit"
                className="pecas-btn pecas-btn-primary"
                disabled={salvando}
              >
                {salvando
                  ? 'Salvando...'
                  : editandoId
                  ? 'Salvar alterações'
                  : 'Cadastrar peça'}
              </button>
            </div>
          </form>
        </section>

        <section className="pecas-card">
          <div className="pecas-list-header">
            <div>
              <h2>Peças cadastradas</h2>
              <span>{pecasFiltradas.length} peça(s) encontrada(s)</span>
            </div>

            <div className="pecas-search">
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por código, nome, grupo, marca ou aplicação"
              />
            </div>
          </div>

          <div className="pecas-table-wrap">
            <table className="pecas-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nome</th>
                  <th>Grupo</th>
                  <th>Marca</th>
                  <th>Aplicação</th>
                  <th>Unidade</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {pecasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan="7" className="pecas-empty">
                      Nenhuma peça encontrada.
                    </td>
                  </tr>
                )}

                {pecasFiltradas.map((peca) => (
                  <tr key={peca.id}>
                    <td>
                      <strong>{peca.codigo}</strong>
                    </td>

                    <td>{peca.nome}</td>

                    <td>
                      <span className="pecas-grupo">
                        {peca.grupo || 'Sem grupo'}
                      </span>
                    </td>

                    <td>{peca.marca || '-'}</td>

                    <td>{peca.aplicacao || '-'}</td>

                    <td>{peca.unidade || 'UN'}</td>

                    <td>
                      <div className="pecas-table-actions">
                        <button
                          type="button"
                          className="pecas-mini-btn"
                          onClick={() => editarPeca(peca)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="pecas-mini-btn danger"
                          onClick={() => excluirPeca(peca.id)}
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

export default Pecas;