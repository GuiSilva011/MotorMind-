import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import SeletorTema from '../../components/SeletorTema';
import useTemaOficina from '../../hooks/useTemaOficina';
import { Link } from 'react-router-dom';
import { FiEdit2, FiLock, FiMapPin, FiPlus, FiRefreshCw, FiSave, FiSearch, FiTrash2, FiUser, FiX } from 'react-icons/fi';
import ModalOficina from '../../components/ModalOficina';
import '../../styles/adminStyles/administracao.css';
import api from '../../services/api';


/**
 * Estado inicial usado no modal de edição de funcionários.
 *
 * @constant {Object}
 */
const funcionarioInicial = {
  id: null,
  usuarioId: null,
  Nome: '',
  Email: '',
  Senha: '',
  Role: 'OPERADOR',
  Cpf: '',
  Rg: '',
  DataNascimento: '',
  Celular: '',
  Cep: '',
  Endereco: '',
  Numero: '',
  Uf: '',
  Bairro: '',
  Cidade: '',
  Complemento: '',
  DataAdmissao: '',
};

/**
 * Tela responsável por visualizar, pesquisar, editar e excluir funcionários.
 *
 * @component
 * @function VisualizarFuncionarios
 * @returns {JSX.Element} Tela de gerenciamento de funcionários.
 */
function VisualizarFuncionarios() {
  const [tema, setTema] = useTemaOficina();
  const [funcionarios, setFuncionarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [funcionarioEditando, setFuncionarioEditando] =
    useState(funcionarioInicial);

  // Carrega a lista de funcionarios ao abrir a tela.
  useEffect(() => {
    carregarFuncionarios();
  }, []);

/**
 * Busca a lista de funcionários e seus usuários vinculados na API.
 *
 * @async
 * @returns {Promise<void>}
 */
  async function carregarFuncionarios() {
    try {
      setCarregando(true);

      const response = await api.get('/funcionarios');

      setFuncionarios(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);

      toast.error(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao carregar funcionários.'
      );
    } finally {
      setCarregando(false);
    }
  }

/**
 * Formata uma data para o padrão aceito por inputs do tipo date.
 *
 * @param {string|Date} data - Data que será formatada.
 * @returns {string} Data no formato yyyy-mm-dd ou string vazia.
 */
  function formatarDataParaInput(data) {
    if (!data) return '';

    return new Date(data).toISOString().split('T')[0];
  }

/**
 * Formata uma data para exibição amigável na tela.
 *
 * @param {string|Date} data - Data que será formatada.
 * @returns {string} Data formatada no padrão brasileiro ou hífen.
 */
  function formatarDataTela(data) {
    if (!data) return '-';

    return new Date(data).toLocaleDateString('pt-BR');
  }

/**
 * Normaliza os dados de um funcionário para preencher o formulário de edição.
 *
 * @param {Object} funcionario - Funcionário selecionado na listagem.
 * @returns {Object} Dados do funcionário preparados para edição.
 */
  function montarFuncionarioParaEditar(funcionario) {
    return {
      id: funcionario.id,
      usuarioId: funcionario.usuarioId,
      Nome: funcionario.usuario?.Nome || '',
      Email: funcionario.usuario?.Email || '',
      Senha: '',
      Role: funcionario.usuario?.Role || 'OPERADOR',
      Cpf: funcionario.Cpf || '',
      Rg: funcionario.Rg || '',
      DataNascimento: formatarDataParaInput(funcionario.DataNascimento),
      Celular: funcionario.Celular || '',
      Cep: funcionario.Cep || '',
      Endereco: funcionario.Endereco || '',
      Numero: funcionario.Numero || '',
      Uf: funcionario.Uf || '',
      Bairro: funcionario.Bairro || '',
      Cidade: funcionario.Cidade || '',
      Complemento: funcionario.Complemento || '',
      DataAdmissao: formatarDataParaInput(funcionario.DataAdmissao),
    };
  }

/**
 * Abre o modal de edição com os dados do funcionário selecionado.
 *
 * @param {Object} funcionario - Funcionário que será editado.
 * @returns {void}
 */
  function abrirEdicao(funcionario) {
    setFuncionarioEditando(montarFuncionarioParaEditar(funcionario));
    setEditando(true);
  }

/**
 * Fecha o modal de edição e limpa os dados temporários do funcionário.
 *
 * @returns {void}
 */
  function fecharEdicao() {
    setEditando(false);
    setFuncionarioEditando(funcionarioInicial);
  }

/**
 * Atualiza um campo específico do formulário de edição.
 *
 * @param {string} campo - Nome do campo que será atualizado.
 * @param {*} valor - Novo valor do campo.
 * @returns {void}
 */
  function atualizarCampo(campo, valor) {
    setFuncionarioEditando((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

/**
 * Valida as informações obrigatórias antes de salvar a edição.
 *
 * @returns {boolean} Retorna true se os dados estiverem válidos.
 */
  function validarEdicao() {
    if (!funcionarioEditando.Nome.trim()) {
      toast.warning('Informe o nome do funcionário.');
      return false;
    }

    if (!funcionarioEditando.Email.trim()) {
      toast.warning('Informe o email do funcionário.');
      return false;
    }

    if (!funcionarioEditando.Role) {
      toast.warning('Selecione o perfil de acesso.');
      return false;
    }

    return true;
  }

/**
 * Envia para a API as alterações do funcionário e do usuário vinculado.
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
        Nome: funcionarioEditando.Nome.trim(),
        Email: funcionarioEditando.Email.trim(),
        Role: funcionarioEditando.Role,

        Cpf: funcionarioEditando.Cpf.trim() || null,
        Rg: funcionarioEditando.Rg.trim(),
        DataNascimento: funcionarioEditando.DataNascimento || null,
        Celular: funcionarioEditando.Celular.trim(),

        Cep: funcionarioEditando.Cep.trim(),
        Endereco: funcionarioEditando.Endereco.trim(),
        Numero: funcionarioEditando.Numero.trim(),
        Uf: funcionarioEditando.Uf.trim().toUpperCase(),
        Bairro: funcionarioEditando.Bairro.trim(),
        Cidade: funcionarioEditando.Cidade.trim(),
        Complemento: funcionarioEditando.Complemento.trim(),

        DataAdmissao: funcionarioEditando.DataAdmissao || null,
      };

      if (funcionarioEditando.Senha.trim()) {
        payload.Senha = funcionarioEditando.Senha.trim();
      }

      await api.put(`/funcionarios/${funcionarioEditando.id}`, payload);

      toast.success('Funcionário atualizado com sucesso!');
      fecharEdicao();
      carregarFuncionarios();
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);

      toast.error(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao atualizar funcionário.'
      );
    }
  }

/**
 * Exclui o funcionário e remove seu acesso ao sistema após confirmação.
 *
 * @async
 * @param {Object} funcionario - Funcionário que será excluído.
 * @returns {Promise<void>}
 */
  async function excluirFuncionario(funcionario) {
    const nome = funcionario.usuario?.Nome || 'este funcionário';

    const confirmar = window.confirm(
      `Deseja excluir ${nome} da equipe? O acesso ao sistema será encerrado. As ordens de serviço e o histórico serão preservados.`
    );

    if (!confirmar) return;

    try {
      const { data } = await api.delete(`/funcionarios/${funcionario.id}`);

      toast.success(data.mensagem);
      carregarFuncionarios();
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);

      toast.error(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao excluir funcionário.'
      );
    }
  }

/**
 * Lista de funcionários filtrada pelo termo pesquisado.
 *
 * @type {Array<Object>}
 */
  const funcionariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return funcionarios;

    return funcionarios.filter((funcionario) => {
      const nome = funcionario.usuario?.Nome?.toLowerCase() || '';
      const email = funcionario.usuario?.Email?.toLowerCase() || '';
      const role = funcionario.usuario?.Role?.toLowerCase() || '';
      const cpf = funcionario.Cpf?.toLowerCase() || '';
      const celular = funcionario.Celular?.toLowerCase() || '';

      return (
        nome.includes(termo) ||
        email.includes(termo) ||
        role.includes(termo) ||
        cpf.includes(termo) ||
        celular.includes(termo)
      );
    });
  }, [funcionarios, busca]);

/**
 * Renderiza o modal de edição de funcionário quando ele estiver aberto.
 *
 * @returns {JSX.Element|null} Modal de edição ou null.
 */
  function renderModalEdicao() {
    if (!editando) return null;

    return (
      <ModalOficina className="admin-modal" labelledBy="funcionarios-editar-titulo" onClose={fecharEdicao}>
        <div className="admin-modal-header">
          <div>
            <h2 id="funcionarios-editar-titulo">Editar funcionário</h2>
            <span>Atualize os dados cadastrais e de acesso.</span>
          </div>

          <button type="button" className="oficina-btn admin-close" onClick={fecharEdicao} aria-label="Fechar edição de funcionário">
            <FiX aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={salvarEdicao}>
          <section className="admin-form-section">
            <h3 className="oficina-section-heading"><FiUser aria-hidden="true" /> Dados pessoais</h3>

            <div className="oficina-form-grid admin-form-grid">
              <div className="oficina-field oficina-col-full">
                <label htmlFor="funcionarios-editar-nome">Nome completo</label>
                <input id="funcionarios-editar-nome"
                  value={funcionarioEditando.Nome}
                  onChange={(event) =>
                    atualizarCampo('Nome', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="funcionarios-editar-cpf">CPF</label>
                <input id="funcionarios-editar-cpf"
                  value={funcionarioEditando.Cpf}
                  onChange={(event) =>
                    atualizarCampo('Cpf', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="funcionarios-editar-rg">RG</label>
                <input id="funcionarios-editar-rg"
                  value={funcionarioEditando.Rg}
                  onChange={(event) =>
                    atualizarCampo('Rg', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="funcionarios-editar-datanascimento">Data de nascimento</label>
                <input id="funcionarios-editar-datanascimento"
                  type="date"
                  value={funcionarioEditando.DataNascimento}
                  onChange={(event) =>
                    atualizarCampo('DataNascimento', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="funcionarios-editar-celular">Celular</label>
                <input id="funcionarios-editar-celular"
                  value={funcionarioEditando.Celular}
                  onChange={(event) =>
                    atualizarCampo('Celular', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="funcionarios-editar-dataadmissao">Data de admissão</label>
                <input id="funcionarios-editar-dataadmissao"
                  type="date"
                  value={funcionarioEditando.DataAdmissao}
                  onChange={(event) =>
                    atualizarCampo('DataAdmissao', event.target.value)
                  }
                />
              </div>
            </div>
          </section>

          <section className="admin-form-section">
            <h3 className="oficina-section-heading"><FiMapPin aria-hidden="true" /> Endereço</h3>

            <div className="oficina-form-grid admin-form-grid">
              <div className="oficina-field">
                <label htmlFor="funcionarios-editar-cep">CEP</label>
                <input id="funcionarios-editar-cep"
                  value={funcionarioEditando.Cep}
                  onChange={(event) =>
                    atualizarCampo('Cep', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field admin-col-2">
                <label htmlFor="funcionarios-editar-endereco">Endereço</label>
                <input id="funcionarios-editar-endereco"
                  value={funcionarioEditando.Endereco}
                  onChange={(event) =>
                    atualizarCampo('Endereco', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="funcionarios-editar-numero">Número</label>
                <input id="funcionarios-editar-numero"
                  value={funcionarioEditando.Numero}
                  onChange={(event) =>
                    atualizarCampo('Numero', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="funcionarios-editar-uf">UF</label>
                <input id="funcionarios-editar-uf"
                  maxLength="2"
                  value={funcionarioEditando.Uf}
                  onChange={(event) =>
                    atualizarCampo('Uf', event.target.value.toUpperCase())
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="funcionarios-editar-bairro">Bairro</label>
                <input id="funcionarios-editar-bairro"
                  value={funcionarioEditando.Bairro}
                  onChange={(event) =>
                    atualizarCampo('Bairro', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="funcionarios-editar-cidade">Cidade</label>
                <input id="funcionarios-editar-cidade"
                  value={funcionarioEditando.Cidade}
                  onChange={(event) =>
                    atualizarCampo('Cidade', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field admin-col-2">
                <label htmlFor="funcionarios-editar-complemento">Complemento</label>
                <input id="funcionarios-editar-complemento"
                  value={funcionarioEditando.Complemento}
                  onChange={(event) =>
                    atualizarCampo('Complemento', event.target.value)
                  }
                />
              </div>
            </div>
          </section>

          <section className="admin-form-section">
            <h3 className="oficina-section-heading"><FiLock aria-hidden="true" /> Acesso ao sistema</h3>

            <div className="oficina-form-grid admin-form-grid">
              <div className="oficina-field">
                <label htmlFor="funcionarios-editar-email">Email</label>
                <input id="funcionarios-editar-email"
                  type="email"
                  value={funcionarioEditando.Email}
                  onChange={(event) =>
                    atualizarCampo('Email', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="funcionarios-editar-senha">Nova senha</label>
                <input id="funcionarios-editar-senha"
                  type="password"
                  value={funcionarioEditando.Senha}
                  onChange={(event) =>
                    atualizarCampo('Senha', event.target.value)
                  }
                  placeholder="Deixe vazio para manter"
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="funcionarios-editar-role">Perfil de acesso</label>
                <select id="funcionarios-editar-role"
                  value={funcionarioEditando.Role}
                  onChange={(event) =>
                    atualizarCampo('Role', event.target.value)
                  }
                >
                  <option value="OPERADOR">Operador</option>
                  <option value="TECNICO">Técnico</option>
                </select>
              </div>
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
      <main className="oficina-page" aria-labelledby="funcionarios-titulo">
        <header className="oficina-page-header">
          <div>
            <h1 id="funcionarios-titulo">Funcionários</h1>
            <p>Visualize, edite ou exclua funcionários cadastrados.</p>

            {carregando && <small>Carregando funcionários...</small>}
          </div>
          <Link className="oficina-btn oficina-btn-primary" to="/admin/funcionarios/cadastrar">
            <FiPlus aria-hidden="true" /> Novo funcionário
          </Link>
        </header>

        <section className="oficina-panel" aria-busy={carregando}>
          <div className="oficina-list-header">
            <div>
              <h2>Funcionários cadastrados</h2>
              <span>
                {funcionariosFiltrados.length} funcionário(s) encontrado(s)
              </span>
            </div>

            <button type="button" className="oficina-btn" onClick={carregarFuncionarios} disabled={carregando}>
              <FiRefreshCw aria-hidden="true" /> Atualizar
            </button>
          </div>

          <div className="oficina-search admin-search">
            <label htmlFor="funcionarios-busca">Pesquisar funcionário</label>
            <div className="admin-search-control">
              <FiSearch aria-hidden="true" />
              <input id="funcionarios-busca" type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por nome, email, CPF, celular ou perfil"
              />
            </div>
          </div>

          <div className="oficina-table-wrap">
            <table className="oficina-table admin-table">
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">Email</th>
                  <th scope="col">Perfil</th>
                  <th scope="col">CPF</th>
                  <th scope="col">Celular</th>
                  <th scope="col">Admissão</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>

              <tbody>
                {funcionariosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="7" className="oficina-empty">
                      {carregando ? 'Carregando funcionários...' : 'Nenhum funcionário encontrado.'}
                    </td>
                  </tr>
                )}

                {funcionariosFiltrados.map((funcionario) => (
                  <tr key={funcionario.id}>
                    <td data-label="Nome">
                      <strong>{funcionario.usuario?.Nome || '-'}</strong>
                    </td>

                    <td data-label="Email">{funcionario.usuario?.Email || '-'}</td>

                    <td data-label="Perfil">
                      <span className="oficina-badge">
                        {funcionario.usuario?.Role || '-'}
                      </span>
                    </td>

                    <td data-label="CPF">{funcionario.Cpf || '-'}</td>
                    <td data-label="Celular">{funcionario.Celular || '-'}</td>
                    <td data-label="Admissão">{formatarDataTela(funcionario.DataAdmissao)}</td>

                    <td data-label="Ações">
                      <div className="oficina-row-actions">
                        <button
                          type="button"
                          className="oficina-btn"
                          aria-label={`Editar funcionário: ${funcionario.usuario?.Nome || 'funcionário'}`}
                          onClick={() => abrirEdicao(funcionario)}
                        >
                          <FiEdit2 aria-hidden="true" /> Editar
                        </button>

                        <button
                          type="button"
                          className="oficina-btn oficina-btn-danger"
                          aria-label={`Excluir funcionário: ${funcionario.usuario?.Nome || 'funcionário'}`}
                          onClick={() => excluirFuncionario(funcionario)}
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

export default VisualizarFuncionarios;
