import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/adminStyles/visualizarFornecedores.css';

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

function formatarCnpj(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatarTelefone(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 10)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatarCelular(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function formatarCep(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function formatarUf(valor) {
  return valor
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 2)
    .toUpperCase();
}

function VisualizarFornecedor() {
  const [fornecedores, setFornecedores] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [fornecedorEditando, setFornecedorEditando] =
    useState(fornecedorInicial);

  useEffect(() => {
    carregarFornecedores();
  }, []);

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

  function abrirEdicao(fornecedor) {
    setFornecedorEditando(montarFornecedorParaEditar(fornecedor));
    setEditando(true);
  }

  function fecharEdicao() {
    setEditando(false);
    setFornecedorEditando(fornecedorInicial);
  }

  function atualizarCampo(campo, valor) {
    setFornecedorEditando((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function validarEdicao() {
    if (!fornecedorEditando.nome.trim()) {
      toast.warning('Informe o nome do fornecedor.');
      return false;
    }

    if (!fornecedorEditando.cnpj.trim()) {
      toast.warning('Informe o CNPJ do fornecedor.');
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

  async function salvarEdicao(event) {
    event.preventDefault();

    try {
      if (!validarEdicao()) return;

      const payload = {
        codigo: fornecedorEditando.codigo.trim(),
        nome: fornecedorEditando.nome.trim(),
        cnpj: fornecedorEditando.cnpj.trim(),
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

  function renderModalEdicao() {
    if (!editando) return null;

    return (
      <div className="fornecedores-modal-overlay">
        <div className="fornecedores-modal">
          <div className="fornecedores-modal-header">
            <div>
              <h2>Editar fornecedor</h2>
              <span>Atualize os dados cadastrais do fornecedor.</span>
            </div>

            <button type="button" onClick={fecharEdicao}>
              ×
            </button>
          </div>

          <form onSubmit={salvarEdicao}>
            <section className="fornecedores-modal-section">
              <h3>Dados do fornecedor</h3>

              <div className="fornecedores-form-grid">
                <div className="fornecedores-field">
                  <label>Código</label>
                  <input value={fornecedorEditando.codigo} disabled />
                </div>

                <div className="fornecedores-field field-large">
                  <label>Nome / Razão social</label>
                  <input
                    value={fornecedorEditando.nome}
                    onChange={(event) =>
                      atualizarCampo('nome', event.target.value)
                    }
                  />
                </div>

                <div className="fornecedores-field">
                  <label>CNPJ</label>
                  <input
                    value={fornecedorEditando.cnpj}
                    onChange={(event) =>
                      atualizarCampo('cnpj', formatarCnpj(event.target.value))
                    }
                  />
                </div>

                <div className="fornecedores-field">
                  <label>Inscrição estadual</label>
                  <input
                    value={fornecedorEditando.inscricao}
                    onChange={(event) =>
                      atualizarCampo('inscricao', event.target.value)
                    }
                  />
                </div>

                <div className="fornecedores-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={fornecedorEditando.email}
                    onChange={(event) =>
                      atualizarCampo('email', event.target.value)
                    }
                  />
                </div>

                <div className="fornecedores-field">
                  <label>Telefone</label>
                  <input
                    value={fornecedorEditando.telefone}
                    onChange={(event) =>
                      atualizarCampo(
                        'telefone',
                        formatarTelefone(event.target.value)
                      )
                    }
                  />
                </div>

                <div className="fornecedores-field">
                  <label>Celular</label>
                  <input
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

            <section className="fornecedores-modal-section">
              <h3>Endereço</h3>

              <div className="fornecedores-form-grid">
                <div className="fornecedores-field">
                  <label>CEP</label>
                  <input
                    value={fornecedorEditando.cep}
                    onChange={(event) =>
                      atualizarCampo('cep', formatarCep(event.target.value))
                    }
                  />
                </div>

                <div className="fornecedores-field field-large">
                  <label>Endereço</label>
                  <input
                    value={fornecedorEditando.endereco}
                    onChange={(event) =>
                      atualizarCampo('endereco', event.target.value)
                    }
                  />
                </div>

                <div className="fornecedores-field">
                  <label>Número</label>
                  <input
                    value={fornecedorEditando.numero}
                    onChange={(event) =>
                      atualizarCampo('numero', event.target.value)
                    }
                  />
                </div>

                <div className="fornecedores-field">
                  <label>UF</label>
                  <input
                    value={fornecedorEditando.uf}
                    onChange={(event) =>
                      atualizarCampo('uf', formatarUf(event.target.value))
                    }
                  />
                </div>

                <div className="fornecedores-field">
                  <label>Bairro</label>
                  <input
                    value={fornecedorEditando.bairro}
                    onChange={(event) =>
                      atualizarCampo('bairro', event.target.value)
                    }
                  />
                </div>

                <div className="fornecedores-field">
                  <label>Cidade</label>
                  <input
                    value={fornecedorEditando.cidade}
                    onChange={(event) =>
                      atualizarCampo('cidade', event.target.value)
                    }
                  />
                </div>

                <div className="fornecedores-field field-large">
                  <label>Complemento</label>
                  <input
                    value={fornecedorEditando.complemento}
                    onChange={(event) =>
                      atualizarCampo('complemento', event.target.value)
                    }
                  />
                </div>
              </div>
            </section>

            <section className="fornecedores-modal-section">
              <h3>Tipo de fornecimento</h3>

              <div className="fornecedores-options">
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

              <div className="fornecedores-field field-full">
                <label>Observações</label>
                <textarea
                  value={fornecedorEditando.observacoes}
                  onChange={(event) =>
                    atualizarCampo('observacoes', event.target.value)
                  }
                  placeholder="Digite observações sobre o fornecedor..."
                />
              </div>
            </section>

            <div className="fornecedores-modal-actions">
              <button
                type="button"
                className="fornecedores-btn fornecedores-btn-outline"
                onClick={fecharEdicao}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="fornecedores-btn fornecedores-btn-dark"
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
      <main className="visualizar-fornecedores-page">
        <section className="visualizar-fornecedores-header">
          <div>
            <h1>Fornecedores</h1>
            <p>Visualize, edite ou exclua fornecedores cadastrados.</p>

            {carregando && <small>Carregando fornecedores...</small>}
          </div>
        </section>

        <section className="visualizar-fornecedores-card">
          <div className="visualizar-fornecedores-card-header">
            <div>
              <h2>Fornecedores cadastrados</h2>
              <span>
                {fornecedoresFiltrados.length} fornecedor(es) encontrado(s)
              </span>
            </div>

            <button type="button" onClick={carregarFornecedores}>
              Atualizar
            </button>
          </div>

          <div className="visualizar-fornecedores-search">
            <label>Pesquisar fornecedor</label>
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por código, nome, CNPJ, email, cidade ou UF"
            />
          </div>

          <div className="visualizar-fornecedores-table-wrap">
            <table className="visualizar-fornecedores-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Fornecedor</th>
                  <th>CNPJ</th>
                  <th>Contato</th>
                  <th>Cidade/UF</th>
                  <th>Tipo</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {!carregando && fornecedoresFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="7" className="fornecedores-empty">
                      Nenhum fornecedor encontrado.
                    </td>
                  </tr>
                )}

                {fornecedoresFiltrados.map((fornecedor) => (
                  <tr key={fornecedor.id}>
                    <td>
                      <strong>{fornecedor.codigo || '-'}</strong>
                    </td>

                    <td>
                      <strong>{fornecedor.nome || '-'}</strong>
                      <span>{fornecedor.email || 'Email não informado'}</span>
                    </td>

                    <td>{fornecedor.cnpj || '-'}</td>

                    <td>
                      <span>{fornecedor.telefone || '-'}</span>
                      <span>{fornecedor.celular || '-'}</span>
                    </td>

                    <td>
                      {fornecedor.cidade || '-'}
                      {fornecedor.uf ? `/${fornecedor.uf}` : ''}
                    </td>

                    <td>
                      <span className="fornecedores-tipo">
                        {renderTipoFornecedor(fornecedor)}
                      </span>
                    </td>

                    <td>
                      <div className="fornecedores-actions">
                        <button
                          type="button"
                          className="fornecedores-action-edit"
                          onClick={() => abrirEdicao(fornecedor)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="fornecedores-action-delete"
                          onClick={() => excluirFornecedor(fornecedor)}
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

export default VisualizarFornecedor;