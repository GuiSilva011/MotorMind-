import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/operadorStyles/diagnosticos.css';

/**
 * Gera um código automático usando prefixo, data atual e número aleatório.
 *
 * @param {string} prefixo - Prefixo usado no código gerado.
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
 * Cria o estado inicial do formulário de diagnóstico.
 *
 * @returns {Object} Dados iniciais do diagnóstico.
 */
function criarDiagnosticoInicial() {
  return {
    codigo: gerarCodigo('DIAG'),
    nome: '',
    descricao: '',
  };
}

/**
 * Tela responsável pelo cadastro, edição, listagem e exclusão de diagnósticos.
 *
 * @component
 * @function Diagnosticos
 * @returns {JSX.Element} Tela de manutenção de diagnósticos.
 */
function Diagnosticos() {
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [form, setForm] = useState(criarDiagnosticoInicial());
  const [editandoId, setEditandoId] = useState(null);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Carrega o catalogo de diagnosticos ao abrir a pagina.
  useEffect(() => {
    carregarDiagnosticos();
  }, []);

/**
 * Busca todos os diagnósticos cadastrados na API.
 *
 * @async
 * @returns {Promise<void>}
 */
  async function carregarDiagnosticos() {
    try {
      setCarregando(true);

      const response = await api.get('/diagnosticos');

      setDiagnosticos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar diagnósticos:', error);
      alert('Erro ao carregar diagnósticos.');
    } finally {
      setCarregando(false);
    }
  }

/**
 * Atualiza um campo específico do formulário de diagnóstico.
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
    setForm(criarDiagnosticoInicial());
    setEditandoId(null);
  }

/**
 * Preenche o formulário com os dados de um diagnóstico para edição.
 *
 * @param {Object} diagnostico - Diagnóstico selecionado na tabela.
 * @returns {void}
 */
  function editarDiagnostico(diagnostico) {
    setEditandoId(diagnostico.id);

    setForm({
      codigo: diagnostico.codigo || '',
      nome: diagnostico.nome || '',
      descricao: diagnostico.descricao || '',
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

/**
 * Valida os campos e envia o diagnóstico para cadastro ou atualização na API.
 *
 * @async
 * @param {Object} event - Evento de envio do formulário.
 * @returns {Promise<void>}
 */
  async function salvarDiagnostico(event) {
    event.preventDefault();

    try {
      if (!form.codigo.trim()) {
        alert('Informe o código do diagnóstico.');
        return;
      }

      if (!form.nome.trim()) {
        alert('Informe o nome do diagnóstico.');
        return;
      }

      setSalvando(true);

      const payload = {
        codigo: form.codigo.trim().toUpperCase(),
        nome: form.nome.trim(),
        descricao: form.descricao?.trim() || null,
      };

      if (editandoId) {
        await api.put(`/diagnosticos/${editandoId}`, payload);
        alert('Diagnóstico atualizado com sucesso!');
      } else {
        await api.post('/diagnosticos', payload);
        alert('Diagnóstico cadastrado com sucesso!');
      }

      limparFormulario();
      await carregarDiagnosticos();
    } catch (error) {
      console.error('Erro ao salvar diagnóstico:', error);

      alert(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao salvar diagnóstico.'
      );
    } finally {
      setSalvando(false);
    }
  }

/**
 * Exclui um diagnóstico após confirmação do usuário.
 *
 * @async
 * @param {number} id - Identificador do diagnóstico.
 * @returns {Promise<void>}
 */
  async function excluirDiagnostico(id) {
    const confirmar = window.confirm(
      'Deseja realmente excluir este diagnóstico?'
    );

    if (!confirmar) return;

    try {
      await api.delete(`/diagnosticos/${id}`);

      alert('Diagnóstico excluído com sucesso!');
      await carregarDiagnosticos();
    } catch (error) {
      console.error('Erro ao excluir diagnóstico:', error);

      alert(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao excluir diagnóstico.'
      );
    }
  }
/**
 * Lista de diagnósticos filtrada por código, nome ou descrição.
 *
 * @type {Array<Object>}
 */
  const diagnosticosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return diagnosticos;

    return diagnosticos.filter((diagnostico) => {
      const codigo = diagnostico.codigo?.toLowerCase() || '';
      const nome = diagnostico.nome?.toLowerCase() || '';
      const descricao = diagnostico.descricao?.toLowerCase() || '';

      return (
        codigo.includes(termo) ||
        nome.includes(termo) ||
        descricao.includes(termo)
      );
    });
  }, [diagnosticos, busca]);

  return (
    <Layout>
      <main className="diagnosticos-page">
        <section className="diagnosticos-top">
          <div>
            <h1>Cadastro de Diagnósticos</h1>
            <p>Cadastre os diagnósticos usados nas ordens de serviço.</p>

            {carregando && <small>Carregando diagnósticos...</small>}
          </div>
        </section>

        <section className="diagnosticos-card">
          <div className="diagnosticos-card-title">
            <h2>{editandoId ? 'Editar diagnóstico' : 'Novo diagnóstico'}</h2>
            <span>
              O diagnóstico cadastrado será usado como modelo dentro da OS.
            </span>
          </div>

          <form onSubmit={salvarDiagnostico}>
            <div className="diagnosticos-form-grid">
              <div className="diagnosticos-field">
                <label>Código</label>
                <input
                  value={form.codigo}
                  readOnly
                  placeholder="Código automático"
                />
              </div>

              <div className="diagnosticos-field diagnosticos-col-2">
                <label>Nome</label>
                <input
                  value={form.nome}
                  onChange={(event) =>
                    atualizarCampo('nome', event.target.value)
                  }
                  placeholder="Ex: Carro falhando"
                />
              </div>

              <div className="diagnosticos-field diagnosticos-col-full">
                <label>Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={(event) =>
                    atualizarCampo('descricao', event.target.value)
                  }
                  placeholder="Descreva quando este diagnóstico deve ser usado..."
                />
              </div>
            </div>

            <div className="diagnosticos-actions">
              <button
                type="button"
                className="diagnosticos-btn diagnosticos-btn-light"
                onClick={limparFormulario}
              >
                Limpar
              </button>

              <button
                type="submit"
                className="diagnosticos-btn diagnosticos-btn-primary"
                disabled={salvando}
              >
                {salvando
                  ? 'Salvando...'
                  : editandoId
                  ? 'Salvar alterações'
                  : 'Cadastrar diagnóstico'}
              </button>
            </div>
          </form>
        </section>

        <section className="diagnosticos-card">
          <div className="diagnosticos-list-header">
            <div>
              <h2>Diagnósticos cadastrados</h2>
              <span>
                {diagnosticosFiltrados.length} diagnóstico(s) encontrado(s)
              </span>
            </div>

            <div className="diagnosticos-search">
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por código, nome ou descrição"
              />
            </div>
          </div>

          <div className="diagnosticos-table-wrap">
            <table className="diagnosticos-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {diagnosticosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="4" className="diagnosticos-empty">
                      Nenhum diagnóstico encontrado.
                    </td>
                  </tr>
                )}

                {diagnosticosFiltrados.map((diagnostico) => (
                  <tr key={diagnostico.id}>
                    <td>
                      <strong>{diagnostico.codigo}</strong>
                    </td>

                    <td>{diagnostico.nome}</td>

                    <td>{diagnostico.descricao || '-'}</td>

                    <td>
                      <div className="diagnosticos-table-actions">
                        <button
                          type="button"
                          className="diagnosticos-mini-btn"
                          onClick={() => editarDiagnostico(diagnostico)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="diagnosticos-mini-btn danger"
                          onClick={() => excluirDiagnostico(diagnostico.id)}
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

export default Diagnosticos;