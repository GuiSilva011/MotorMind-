import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/adminStyles/visualizarFuncionarios.css';


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
      `Deseja realmente excluir ${nome}? Essa ação também removerá o acesso dele ao sistema.`
    );

    if (!confirmar) return;

    try {
      await api.delete(`/funcionarios/${funcionario.id}`);

      toast.success('Funcionário excluído com sucesso!');
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
      <div className="funcionarios-modal-overlay">
        <div className="funcionarios-modal">
          <div className="funcionarios-modal-header">
            <div>
              <h2>Editar funcionário</h2>
              <span>Atualize os dados cadastrais e de acesso.</span>
            </div>

            <button type="button" onClick={fecharEdicao}>
              ×
            </button>
          </div>

          <form onSubmit={salvarEdicao}>
            <section className="funcionarios-modal-section">
              <h3>Dados pessoais</h3>

              <div className="funcionarios-form-grid">
                <div className="funcionarios-field field-full">
                  <label>Nome completo</label>
                  <input
                    value={funcionarioEditando.Nome}
                    onChange={(event) =>
                      atualizarCampo('Nome', event.target.value)
                    }
                  />
                </div>

                <div className="funcionarios-field">
                  <label>CPF</label>
                  <input
                    value={funcionarioEditando.Cpf}
                    onChange={(event) =>
                      atualizarCampo('Cpf', event.target.value)
                    }
                  />
                </div>

                <div className="funcionarios-field">
                  <label>RG</label>
                  <input
                    value={funcionarioEditando.Rg}
                    onChange={(event) =>
                      atualizarCampo('Rg', event.target.value)
                    }
                  />
                </div>

                <div className="funcionarios-field">
                  <label>Data de nascimento</label>
                  <input
                    type="date"
                    value={funcionarioEditando.DataNascimento}
                    onChange={(event) =>
                      atualizarCampo('DataNascimento', event.target.value)
                    }
                  />
                </div>

                <div className="funcionarios-field">
                  <label>Celular</label>
                  <input
                    value={funcionarioEditando.Celular}
                    onChange={(event) =>
                      atualizarCampo('Celular', event.target.value)
                    }
                  />
                </div>

                <div className="funcionarios-field">
                  <label>Data de admissão</label>
                  <input
                    type="date"
                    value={funcionarioEditando.DataAdmissao}
                    onChange={(event) =>
                      atualizarCampo('DataAdmissao', event.target.value)
                    }
                  />
                </div>
              </div>
            </section>

            <section className="funcionarios-modal-section">
              <h3>Endereço</h3>

              <div className="funcionarios-form-grid">
                <div className="funcionarios-field">
                  <label>CEP</label>
                  <input
                    value={funcionarioEditando.Cep}
                    onChange={(event) =>
                      atualizarCampo('Cep', event.target.value)
                    }
                  />
                </div>

                <div className="funcionarios-field field-large">
                  <label>Endereço</label>
                  <input
                    value={funcionarioEditando.Endereco}
                    onChange={(event) =>
                      atualizarCampo('Endereco', event.target.value)
                    }
                  />
                </div>

                <div className="funcionarios-field">
                  <label>Número</label>
                  <input
                    value={funcionarioEditando.Numero}
                    onChange={(event) =>
                      atualizarCampo('Numero', event.target.value)
                    }
                  />
                </div>

                <div className="funcionarios-field">
                  <label>UF</label>
                  <input
                    maxLength="2"
                    value={funcionarioEditando.Uf}
                    onChange={(event) =>
                      atualizarCampo('Uf', event.target.value.toUpperCase())
                    }
                  />
                </div>

                <div className="funcionarios-field">
                  <label>Bairro</label>
                  <input
                    value={funcionarioEditando.Bairro}
                    onChange={(event) =>
                      atualizarCampo('Bairro', event.target.value)
                    }
                  />
                </div>

                <div className="funcionarios-field">
                  <label>Cidade</label>
                  <input
                    value={funcionarioEditando.Cidade}
                    onChange={(event) =>
                      atualizarCampo('Cidade', event.target.value)
                    }
                  />
                </div>

                <div className="funcionarios-field field-large">
                  <label>Complemento</label>
                  <input
                    value={funcionarioEditando.Complemento}
                    onChange={(event) =>
                      atualizarCampo('Complemento', event.target.value)
                    }
                  />
                </div>
              </div>
            </section>

            <section className="funcionarios-modal-section">
              <h3>Acesso ao sistema</h3>

              <div className="funcionarios-form-grid">
                <div className="funcionarios-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={funcionarioEditando.Email}
                    onChange={(event) =>
                      atualizarCampo('Email', event.target.value)
                    }
                  />
                </div>

                <div className="funcionarios-field">
                  <label>Nova senha</label>
                  <input
                    type="password"
                    value={funcionarioEditando.Senha}
                    onChange={(event) =>
                      atualizarCampo('Senha', event.target.value)
                    }
                    placeholder="Deixe vazio para manter"
                  />
                </div>

                <div className="funcionarios-field field-full">
                  <label>Perfil de acesso</label>
                  <select
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

            <div className="funcionarios-modal-actions">
              <button
                type="button"
                className="funcionarios-btn funcionarios-btn-outline"
                onClick={fecharEdicao}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="funcionarios-btn funcionarios-btn-dark"
              >
                Salvar alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <main className="visualizar-funcionarios-page">
        <section className="visualizar-funcionarios-header">
          <div>
            <h1>Funcionários</h1>
            <p>Visualize, edite ou exclua funcionários cadastrados.</p>

            {carregando && <small>Carregando funcionários...</small>}
          </div>
        </section>

        <section className="visualizar-funcionarios-card">
          <div className="visualizar-funcionarios-card-header">
            <div>
              <h2>Funcionários cadastrados</h2>
              <span>
                {funcionariosFiltrados.length} funcionário(s) encontrado(s)
              </span>
            </div>

            <button type="button" onClick={carregarFuncionarios}>
              Atualizar
            </button>
          </div>

          <div className="visualizar-funcionarios-search">
            <label>Pesquisar funcionário</label>
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome, email, CPF, celular ou perfil"
            />
          </div>

          <div className="visualizar-funcionarios-table-wrap">
            <table className="visualizar-funcionarios-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Perfil</th>
                  <th>CPF</th>
                  <th>Celular</th>
                  <th>Admissão</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {!carregando && funcionariosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="7" className="funcionarios-empty">
                      Nenhum funcionário encontrado.
                    </td>
                  </tr>
                )}

                {funcionariosFiltrados.map((funcionario) => (
                  <tr key={funcionario.id}>
                    <td>
                      <strong>{funcionario.usuario?.Nome || '-'}</strong>
                    </td>

                    <td>{funcionario.usuario?.Email || '-'}</td>

                    <td>
                      <span className="funcionarios-role">
                        {funcionario.usuario?.Role || '-'}
                      </span>
                    </td>

                    <td>{funcionario.Cpf || '-'}</td>
                    <td>{funcionario.Celular || '-'}</td>
                    <td>{formatarDataTela(funcionario.DataAdmissao)}</td>

                    <td>
                      <div className="funcionarios-actions">
                        <button
                          type="button"
                          className="funcionarios-action-edit"
                          onClick={() => abrirEdicao(funcionario)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="funcionarios-action-delete"
                          onClick={() => excluirFuncionario(funcionario)}
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

        {renderModalEdicao()}
      </main>
    </Layout>
  );
}

export default VisualizarFuncionarios;