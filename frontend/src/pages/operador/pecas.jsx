import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/operadorStyles/pecas.css';

function gerarCodigo(prefixo) {
  const data = new Date();

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const aleatorio = String(Math.floor(Math.random() * 9000) + 1000);

  return `${prefixo}-${ano}${mes}${dia}-${aleatorio}`;
}

function criarPecaInicial() {
  return {
    codigo: gerarCodigo('PECA'),
    nome: '',
    marca: '',
    aplicacao: '',
    unidade: 'UN',
    ativo: true,
  };
}

function Pecas() {
  const [pecas, setPecas] = useState([]);
  const [form, setForm] = useState(criarPecaInicial());
  const [editandoId, setEditandoId] = useState(null);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarPecas();
  }, []);

  async function carregarPecas() {
    try {
      setCarregando(true);

      const response = await api.get('/pecas');

      setPecas(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar peças:', error);
      alert('Erro ao carregar peças.');
    } finally {
      setCarregando(false);
    }
  }

  function atualizarCampo(campo, valor) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function limparFormulario() {
    setForm(criarPecaInicial());
    setEditandoId(null);
  }

  function editarPeca(peca) {
    setEditandoId(peca.id);

    setForm({
      codigo: peca.codigo || '',
      nome: peca.nome || '',
      marca: peca.marca || '',
      aplicacao: peca.aplicacao || '',
      unidade: peca.unidade || 'UN',
      ativo: Boolean(peca.ativo),
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

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

      setSalvando(true);

      const payload = {
        codigo: form.codigo.trim().toUpperCase(),
        nome: form.nome.trim(),
        marca: form.marca?.trim() || null,
        aplicacao: form.aplicacao?.trim() || null,
        unidade: form.unidade?.trim().toUpperCase() || 'UN',
        ativo: Boolean(form.ativo),
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

  async function alternarStatus(peca) {
    try {
      const payload = {
        codigo: peca.codigo,
        nome: peca.nome,
        marca: peca.marca,
        aplicacao: peca.aplicacao,
        unidade: peca.unidade || 'UN',
        ativo: !peca.ativo,
      };

      await api.put(`/pecas/${peca.id}`, payload);

      await carregarPecas();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status da peça.');
    }
  }

  const pecasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return pecas;

    return pecas.filter((peca) => {
      const codigo = peca.codigo?.toLowerCase() || '';
      const nome = peca.nome?.toLowerCase() || '';
      const marca = peca.marca?.toLowerCase() || '';
      const aplicacao = peca.aplicacao?.toLowerCase() || '';

      return (
        codigo.includes(termo) ||
        nome.includes(termo) ||
        marca.includes(termo) ||
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

              <label className="pecas-check">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(event) =>
                    atualizarCampo('ativo', event.target.checked)
                  }
                />
                Peça ativa
              </label>

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
                placeholder="Buscar por código, nome, marca ou aplicação"
              />
            </div>
          </div>

          <div className="pecas-table-wrap">
            <table className="pecas-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nome</th>
                  <th>Marca</th>
                  <th>Aplicação</th>
                  <th>Unidade</th>
                  <th>Status</th>
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

                    <td>{peca.marca || '-'}</td>

                    <td>{peca.aplicacao || '-'}</td>

                    <td>{peca.unidade || 'UN'}</td>

                    <td>
                      <span
                        className={
                          peca.ativo
                            ? 'pecas-status ativo'
                            : 'pecas-status inativo'
                        }
                      >
                        {peca.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

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
                          className="pecas-mini-btn"
                          onClick={() => alternarStatus(peca)}
                        >
                          {peca.ativo ? 'Inativar' : 'Ativar'}
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