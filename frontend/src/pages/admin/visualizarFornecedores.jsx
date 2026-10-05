import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import SeletorTema from '../../components/SeletorTema';
import useTemaOficina from '../../hooks/useTemaOficina';
import { Link } from 'react-router-dom';
import { FiEdit2, FiMapPin, FiPlus, FiRefreshCw, FiSave, FiSearch, FiTrash2, FiTruck, FiX } from 'react-icons/fi';
import ModalOficina from '../../components/ModalOficina';
import '../../styles/adminStyles/administracao.css';
import api from '../../services/api';


/**
 * Estado inicial usado no modal de edição de fornecedores.
 *
 * @constant {Object}
 */
const fornecedorInicial = {
  id: null,
  codigo: '',
  nome: '',
  cnpj: '',
  email: '',
  telefone: '',
  celular: '',
  inscricao: '',
  cep: '',
  endereco: '',
  numero: '',
  uf: '',
  bairro: '',
  cidade: '',
  complemento: '',
  fornecePecas: false,
  forneceServicos: false,
  observacoes: '',
};

/**
 * Formata um valor como CNPJ.
 *
 * @param {string} valor - Valor digitado no campo.
 * @returns {string} CNPJ formatado.
 */
function formatarCnpj(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/**
 * Formata um valor como telefone fixo.
 *
 * @param {string} valor - Valor digitado no campo.
 * @returns {string} Telefone formatado.
 */
function formatarTelefone(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 10)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/**
 * Formata um valor como número de celular.
 *
 * @param {string} valor - Valor digitado no campo.
 * @returns {string} Celular formatado.
 */
function formatarCelular(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Formata um valor como CEP.
 *
 * @param {string} valor - Valor digitado no campo.
 * @returns {string} CEP formatado.
 */
function formatarCep(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Formata a sigla da UF, permitindo apenas letras maiúsculas.
 *
 * @param {string} valor - Valor digitado no campo.
 * @returns {string} UF formatada.
 */
function formatarUf(valor) {
  return valor
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Tela responsável por visualizar, pesquisar, editar e excluir fornecedores.
 *
 * @component
 * @function VisualizarFornecedor
 * @returns {JSX.Element} Tela de gerenciamento de fornecedores.
 */
function VisualizarFornecedor() {
  const [tema, setTema] = useTemaOficina();
  const [fornecedores, setFornecedores] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [fornecedorEditando, setFornecedorEditando] =
    useState(fornecedorInicial);

  // Carrega os fornecedores quando a tela abre.
  useEffect(() => {
    carregarFornecedores();
  }, []);

/**
 * Busca a lista completa de fornecedores cadastrados na API.
 *
 * @async
 * @returns {Promise<void>}
 */
  async function carregarFornecedores() {
    try {
      setCarregando(true);

      const response = await api.get('/fornecedores');

      setFornecedores(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);

      toast.error(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao carregar fornecedores.'
      );
    } finally {
      setCarregando(false);
    }
  }

/**
 * Normaliza os dados de um fornecedor para preencher o formulário de edição.
 *
 * @param {Object} fornecedor - Fornecedor selecionado na listagem.
 * @returns {Object} Dados do fornecedor preparados para edição.
 */
  function montarFornecedorParaEditar(fornecedor) {
    return {
      id: fornecedor.id,
      codigo: fornecedor.codigo || '',
      nome: fornecedor.nome || '',
      cnpj: fornecedor.cnpj || '',
      email: fornecedor.email || '',
      telefone: fornecedor.telefone || '',
      celular: fornecedor.celular || '',
      inscricao: fornecedor.inscricao || '',
      cep: fornecedor.cep || '',
      endereco: fornecedor.endereco || '',
      numero: fornecedor.numero || '',
      uf: fornecedor.uf || '',
      bairro: fornecedor.bairro || '',
      cidade: fornecedor.cidade || '',
      complemento: fornecedor.complemento || '',
      fornecePecas: Boolean(fornecedor.fornecePecas),
      forneceServicos: Boolean(fornecedor.forneceServicos),
      observacoes: fornecedor.observacoes || '',
    };
  }

 /**
 * Abre o modal de edição com os dados do fornecedor selecionado.
 *
 * @param {Object} fornecedor - Fornecedor que será editado.
 * @returns {void}
 */
  function abrirEdicao(fornecedor) {
    setFornecedorEditando(montarFornecedorParaEditar(fornecedor));
    setEditando(true);
  }

/**
 * Fecha o modal de edição e limpa os dados do fornecedor em edição.
 *
 * @returns {void}
 */
  function fecharEdicao() {
    setEditando(false);
    setFornecedorEditando(fornecedorInicial);
  }

 /**
 * Atualiza um campo específico do formulário de edição.
 *
 * @param {string} campo - Nome do campo que será atualizado.
 * @param {*} valor - Novo valor do campo.
 * @returns {void}
 */
  function atualizarCampo(campo, valor) {
    setFornecedorEditando((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  /**
 * Valida os campos obrigatórios antes de salvar a edição.
 *
 * @returns {boolean} Retorna true se os dados estiverem válidos.
 */
  function validarEdicao() {
    if (!fornecedorEditando.nome.trim()) {
      toast.warning('Informe o nome do fornecedor.');
      return false;
    }

    if (
      !fornecedorEditando.fornecePecas &&
      !fornecedorEditando.forneceServicos
    ) {
      toast.warning('Selecione se o fornecedor fornece peças ou serviços.');
      return false;
    }

    return true;
  }

/**
 * Envia as alterações do fornecedor para a API.
 *
 * @async
 * @param {Object} event - Evento de envio do formulário.
 * @returns {Promise<void>}
 */
  async function salvarEdicao(event) {
    event.preventDefault();

    try {
      if (!validarEdicao()) return;

      const payload = {
        codigo: fornecedorEditando.codigo.trim(),
        nome: fornecedorEditando.nome.trim(),
        cnpj: fornecedorEditando.cnpj.trim() || null,
        email: fornecedorEditando.email.trim(),
        telefone: fornecedorEditando.telefone.trim(),
        celular: fornecedorEditando.celular.trim(),
        inscricao: fornecedorEditando.inscricao.trim(),

        cep: fornecedorEditando.cep.trim(),
        endereco: fornecedorEditando.endereco.trim(),
        numero: fornecedorEditando.numero.trim(),
        uf: fornecedorEditando.uf.trim().toUpperCase(),
        bairro: fornecedorEditando.bairro.trim(),
        cidade: fornecedorEditando.cidade.trim(),
        complemento: fornecedorEditando.complemento.trim(),

        fornecePecas: fornecedorEditando.fornecePecas,
        forneceServicos: fornecedorEditando.forneceServicos,
        observacoes: fornecedorEditando.observacoes.trim(),
      };

      await api.put(`/fornecedores/${fornecedorEditando.id}`, payload);

      toast.success('Fornecedor atualizado com sucesso!');
      fecharEdicao();
      carregarFornecedores();
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);

      toast.error(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao atualizar fornecedor.'
      );
    }
  }

 /**
 * Exclui um fornecedor após confirmação do usuário.
 *
 * @async
 * @param {Object} fornecedor - Fornecedor que será excluído.
 * @returns {Promise<void>}
 */
  async function excluirFornecedor(fornecedor) {
    const confirmar = window.confirm(
      `Deseja realmente excluir ${fornecedor.nome || 'este fornecedor'}?`
    );

    if (!confirmar) return;

    try {
      await api.delete(`/fornecedores/${fornecedor.id}`);

      toast.success('Fornecedor excluído com sucesso!');
      carregarFornecedores();
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);

      toast.error(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao excluir fornecedor.'
      );
    }
  }

/**
 * Lista de fornecedores filtrada de acordo com o termo pesquisado.
 *
 * @type {Array<Object>}
 */
  const fornecedoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return fornecedores;

    return fornecedores.filter((fornecedor) => {
      const codigo = fornecedor.codigo?.toLowerCase() || '';
      const nome = fornecedor.nome?.toLowerCase() || '';
      const cnpj = fornecedor.cnpj?.toLowerCase() || '';
      const email = fornecedor.email?.toLowerCase() || '';
      const telefone = fornecedor.telefone?.toLowerCase() || '';
      const celular = fornecedor.celular?.toLowerCase() || '';
      const cidade = fornecedor.cidade?.toLowerCase() || '';
      const uf = fornecedor.uf?.toLowerCase() || '';

      return (
        codigo.includes(termo) ||
        nome.includes(termo) ||
        cnpj.includes(termo) ||
        email.includes(termo) ||
        telefone.includes(termo) ||
        celular.includes(termo) ||
        cidade.includes(termo) ||
        uf.includes(termo)
      );
    });
  }, [fornecedores, busca]);

/**
 * Retorna uma descrição textual do tipo de fornecimento.
 *
 * @param {Object} fornecedor - Fornecedor usado na verificação.
 * @returns {string} Tipo de fornecimento do fornecedor.
 */
  function renderTipoFornecedor(fornecedor) {
    if (fornecedor.fornecePecas && fornecedor.forneceServicos) {
      return 'Peças e serviços';
    }

    if (fornecedor.fornecePecas) {
      return 'Peças';
    }

    if (fornecedor.forneceServicos) {
      return 'Serviços';
    }

    return '-';
  }

/**
 * Renderiza o modal de edição de fornecedor quando ele estiver aberto.
 *
 * @returns {JSX.Element|null} Modal de edição ou null.
 */
  function renderModalEdicao() {
    if (!editando) return null;

    return (
      <ModalOficina className="admin-modal" labelledBy="fornecedores-editar-titulo" onClose={fecharEdicao}>
        <div className="admin-modal-header">
          <div>
            <h2 id="fornecedores-editar-titulo">Editar fornecedor</h2>
            <span>Atualize os dados cadastrais do fornecedor.</span>
          </div>

          <button type="button" className="oficina-btn admin-close" onClick={fecharEdicao} aria-label="Fechar edição de fornecedor">
            <FiX aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={salvarEdicao}>
          <section className="admin-form-section">
            <h3 className="oficina-section-heading"><FiTruck aria-hidden="true" /> Dados do fornecedor</h3>

            <div className="oficina-form-grid admin-form-grid">
              <div className="oficina-field">
                <label htmlFor="fornecedores-editar-codigo">Código</label>
                <input id="fornecedores-editar-codigo" value={fornecedorEditando.codigo} disabled />
              </div>

              <div className="oficina-field admin-col-2">
                <label htmlFor="fornecedores-editar-nome">Nome / Razão social</label>
                <input id="fornecedores-editar-nome"
                  value={fornecedorEditando.nome}
                  onChange={(event) =>
                    atualizarCampo('nome', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fornecedores-editar-cnpj">CNPJ</label>
                <input id="fornecedores-editar-cnpj"
                  value={fornecedorEditando.cnpj}
                  onChange={(event) =>
                    atualizarCampo('cnpj', formatarCnpj(event.target.value))
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fornecedores-editar-inscricao">Inscrição estadual</label>
                <input id="fornecedores-editar-inscricao"
                  value={fornecedorEditando.inscricao}
                  onChange={(event) =>
                    atualizarCampo('inscricao', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fornecedores-editar-email">Email</label>
                <input id="fornecedores-editar-email"
                  type="email"
                  value={fornecedorEditando.email}
                  onChange={(event) =>
                    atualizarCampo('email', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fornecedores-editar-telefone">Telefone</label>
                <input id="fornecedores-editar-telefone"
                  value={fornecedorEditando.telefone}
                  onChange={(event) =>
                    atualizarCampo(
                      'telefone',
                      formatarTelefone(event.target.value)
                    )
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fornecedores-editar-celular">Celular</label>
                <input id="fornecedores-editar-celular"
                  value={fornecedorEditando.celular}
                  onChange={(event) =>
                    atualizarCampo(
                      'celular',
                      formatarCelular(event.target.value)
                    )
                  }
                />
              </div>
            </div>
          </section>

          <section className="admin-form-section">
            <h3 className="oficina-section-heading"><FiMapPin aria-hidden="true" /> Endereço</h3>

            <div className="oficina-form-grid admin-form-grid">
              <div className="oficina-field">
                <label htmlFor="fornecedores-editar-cep">CEP</label>
                <input id="fornecedores-editar-cep"
                  value={fornecedorEditando.cep}
                  onChange={(event) =>
                    atualizarCampo('cep', formatarCep(event.target.value))
                  }
                />
              </div>

              <div className="oficina-field admin-col-2">
                <label htmlFor="fornecedores-editar-endereco">Endereço</label>
                <input id="fornecedores-editar-endereco"
                  value={fornecedorEditando.endereco}
                  onChange={(event) =>
                    atualizarCampo('endereco', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fornecedores-editar-numero">Número</label>
                <input id="fornecedores-editar-numero"
                  value={fornecedorEditando.numero}
                  onChange={(event) =>
                    atualizarCampo('numero', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fornecedores-editar-uf">UF</label>
                <input id="fornecedores-editar-uf"
                  value={fornecedorEditando.uf}
                  onChange={(event) =>
                    atualizarCampo('uf', formatarUf(event.target.value))
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fornecedores-editar-bairro">Bairro</label>
                <input id="fornecedores-editar-bairro"
                  value={fornecedorEditando.bairro}
                  onChange={(event) =>
                    atualizarCampo('bairro', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fornecedores-editar-cidade">Cidade</label>
                <input id="fornecedores-editar-cidade"
                  value={fornecedorEditando.cidade}
                  onChange={(event) =>
                    atualizarCampo('cidade', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field admin-col-2">
                <label htmlFor="fornecedores-editar-complemento">Complemento</label>
                <input id="fornecedores-editar-complemento"
                  value={fornecedorEditando.complemento}
                  onChange={(event) =>
                    atualizarCampo('complemento', event.target.value)
                  }
                />
              </div>
            </div>
          </section>

          <section className="admin-form-section">
            <h3 className="oficina-section-heading"><FiTruck aria-hidden="true" /> Tipo de fornecimento</h3>

            <div className="admin-options">
              <label>
                <input
                  type="checkbox"
                  checked={fornecedorEditando.fornecePecas}
                  onChange={(event) =>
                    atualizarCampo('fornecePecas', event.target.checked)
                  }
                />
                <span>Fornece peças</span>
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={fornecedorEditando.forneceServicos}
                  onChange={(event) =>
                    atualizarCampo('forneceServicos', event.target.checked)
                  }
                />
                <span>Fornece serviços</span>
              </label>
            </div>

            <div className="oficina-field oficina-col-full">
              <label htmlFor="fornecedores-editar-observacoes">Observações</label>
              <textarea id="fornecedores-editar-observacoes"
                value={fornecedorEditando.observacoes}
                onChange={(event) =>
                  atualizarCampo('observacoes', event.target.value)
                }
                placeholder="Digite observações sobre o fornecedor..."
              />
            </div>
          </section>

          <div className="oficina-form-actions">
            <button
              type="button"
              className="oficina-btn"
              onClick={fecharEdicao}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="oficina-btn oficina-btn-primary"
            >
              <FiSave aria-hidden="true" /> Salvar alterações
            </button>
          </div>
        </form>
      </ModalOficina>
    );
  }

  return (
    <Layout className="oficina-theme admin-workspace" theme={tema}
      topbarActions={<SeletorTema tema={tema} onChange={setTema} />}>
      <main className="oficina-page" aria-labelledby="fornecedores-titulo">
        <header className="oficina-page-header">
          <div>
            <h1 id="fornecedores-titulo">Fornecedores</h1>
            <p>Visualize, edite ou exclua fornecedores cadastrados.</p>

            {carregando && <small>Carregando fornecedores...</small>}
          </div>
          <Link className="oficina-btn oficina-btn-primary" to="/admin/fornecedores/cadastrar">
            <FiPlus aria-hidden="true" /> Novo fornecedor
          </Link>
        </header>

        <section className="oficina-panel" aria-busy={carregando}>
          <div className="oficina-list-header">
            <div>
              <h2>Fornecedores cadastrados</h2>
              <span>
                {fornecedoresFiltrados.length} fornecedor(es) encontrado(s)
              </span>
            </div>

            <button type="button" className="oficina-btn" onClick={carregarFornecedores} disabled={carregando}>
              <FiRefreshCw aria-hidden="true" /> Atualizar
            </button>
          </div>

          <div className="oficina-search admin-search">
            <label htmlFor="fornecedores-busca">Pesquisar fornecedor</label>
            <div className="admin-search-control">
              <FiSearch aria-hidden="true" />
              <input id="fornecedores-busca" type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por código, nome, CNPJ, email, cidade ou UF"
              />
            </div>
          </div>

          <div className="oficina-table-wrap">
            <table className="oficina-table admin-table">
              <thead>
                <tr>
                  <th scope="col">Código</th>
                  <th scope="col">Fornecedor</th>
                  <th scope="col">CNPJ</th>
                  <th scope="col">Contato</th>
                  <th scope="col">Cidade/UF</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>

              <tbody>
                {fornecedoresFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="7" className="oficina-empty">
                      {carregando ? 'Carregando fornecedores...' : 'Nenhum fornecedor encontrado.'}
                    </td>
                  </tr>
                )}

                {fornecedoresFiltrados.map((fornecedor) => (
                  <tr key={fornecedor.id}>
                    <td data-label="Código">
                      <strong>{fornecedor.codigo || '-'}</strong>
                    </td>

                    <td data-label="Fornecedor">
                      <strong>{fornecedor.nome || '-'}</strong>
                      <span>{fornecedor.email || 'Email não informado'}</span>
                    </td>

                    <td data-label="CNPJ">{fornecedor.cnpj || '-'}</td>

                    <td data-label="Contato">
                      <span>{fornecedor.telefone || '-'}</span>
                      <span>{fornecedor.celular || '-'}</span>
                    </td>

                    <td data-label="Cidade/UF">
                      {fornecedor.cidade || '-'}
                      {fornecedor.uf ? `/${fornecedor.uf}` : ''}
                    </td>

                    <td data-label="Tipo">
                      <span className="oficina-badge">
                        {renderTipoFornecedor(fornecedor)}
                      </span>
                    </td>

                    <td data-label="Ações">
                      <div className="oficina-row-actions">
                        <button
                          type="button"
                          className="oficina-btn"
                          aria-label={`Editar fornecedor: ${fornecedor.nome || 'fornecedor'}`}
                          onClick={() => abrirEdicao(fornecedor)}
                        >
                          <FiEdit2 aria-hidden="true" /> Editar
                        </button>

                        <button
                          type="button"
                          className="oficina-btn oficina-btn-danger"
                          aria-label={`Excluir fornecedor: ${fornecedor.nome || 'fornecedor'}`}
                          onClick={() => excluirFornecedor(fornecedor)}
                        >
                          <FiTrash2 aria-hidden="true" /> Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {renderModalEdicao()}
      </main>
    </Layout>
  );
}

export default VisualizarFornecedor;
