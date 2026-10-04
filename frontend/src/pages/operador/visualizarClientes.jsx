import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/Layout';
import SeletorTema from '../../components/SeletorTema';
import useTemaOficina from '../../hooks/useTemaOficina';
import { FiArrowRight, FiMail, FiMapPin, FiPhone, FiPlus, FiRefreshCw, FiSearch, FiUsers } from 'react-icons/fi';
import { TbCar } from 'react-icons/tb';
import '../../styles/operadorStyles/clientes.css';
import '../../styles/operadorStyles/visualizarClientes.css';


/**
 * Tela responsável pela consulta e visualização dos clientes cadastrados,
 * incluindo seus dados pessoais e veículos vinculados.
 *
 * @component
 * @function VisualizarClientes
 * @returns {JSX.Element} Tela de consulta de clientes.
 */
function VisualizarClientes() {
  const [tema, setTema] = useTemaOficina();
  const navigate = useNavigate();
  const location = useLocation();

  const [clientes, setClientes] = useState([]);
  const [buscaNome, setBuscaNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

/**
 * Busca na API a lista de clientes e seus veículos vinculados.
 *
 * @async
 * @function carregarClientes
 * @returns {Promise<void>}
 */
  const carregarClientes = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/clientes');
      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar os clientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza a lista assim que a pagina monta.
  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  // Processa retorno de navegacao para mostrar toast e recarregar dados.
  useEffect(() => {
    const state = location.state;

    if (state?.toast) {
      setToast(state.toast);
    }

    if (state?.refresh) {
      carregarClientes();
    }

    if (state?.toast || state?.refresh) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [carregarClientes, location.pathname, location.state, navigate]);

/**
 * Lista de clientes filtrada pelo nome do cliente ou pela placa do veículo.
 *
 * A pesquisa aceita variações de placa com ou sem espaços e hífens.
 *
 * @type {Array<Object>}
 */
  const clientesFiltrados = useMemo(() => {
    const termoOriginal = buscaNome.trim().toLowerCase();
    const termoNormalizado = normalizarTexto(buscaNome);

    if (!termoOriginal) return clientes;

    return clientes.filter((cliente) => {
      const nomeCliente = String(cliente.nome || '').toLowerCase();

      const encontrouNome = nomeCliente.includes(termoOriginal);

      const encontrouPlaca = cliente.veiculos?.some((veiculo) => {
        const placaOriginal = String(veiculo.placa || '').toLowerCase();
        const placaNormalizada = normalizarTexto(veiculo.placa);

        return (
          placaOriginal.includes(termoOriginal) ||
          placaNormalizada.includes(termoNormalizado)
        );
      });

      return encontrouNome || encontrouPlaca;
    });
  }, [buscaNome, clientes]);

  /**
 * Formata um CPF para exibição no padrão brasileiro.
 *
 * @param {string|number|null|undefined} cpf - CPF que será formatado.
 * @returns {string} CPF formatado ou hífen quando não informado.
 */
function formatCpf(cpf) {
  if (!cpf) return '-';

  const digits = String(cpf).replace(/\D/g, '');

  if (digits.length !== 11) {
    return cpf;
  }

  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

/**
 * Formata um telefone fixo ou celular para exibição.
 *
 * @param {string|number|null|undefined} phone - Telefone que será formatado.
 * @returns {string} Telefone formatado ou hífen quando não informado.
 */
function formatPhone(phone) {
  if (!phone) return '-';

  const digits = String(phone).replace(/\D/g, '');

  if (digits.length === 11) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

  if (digits.length === 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return phone;
}

/**
 * Normaliza um texto para facilitar comparações e pesquisas.
 *
 * Converte o conteúdo para letras minúsculas e remove espaços e hífens.
 *
 * @param {string|null|undefined} valor - Texto que será normalizado.
 * @returns {string} Texto normalizado.
 */
function normalizarTexto(valor) {
  return String(valor || '')
    .toLowerCase()
    .replace(/\s/g, '')
    .replace(/-/g, '');
}


/**
 * Abre a tela de cadastro de clientes no modo de visualização,
 * enviando os dados do cliente selecionado pela navegação.
 *
 * @param {Object} cliente - Cliente que será visualizado.
 * @param {number|string} cliente.id - Identificador do cliente.
 * @returns {void}
 */
  function abrirCliente(cliente) {
    if (!cliente?.id) return;

    navigate(`/operador/clientes/cadastro?id=${cliente.id}&visualizar=1`, {
      state: {
        cliente,
      },
    });
  }

  return (
    <Layout className="oficina-theme clientes-workspace" theme={tema}
      topbarActions={<SeletorTema tema={tema} onChange={setTema} />}>
      <main className="clientes-consulta oficina-page" aria-labelledby="clientes-consulta-title">
        <header className="oficina-page-header">
          <div>
            <h1 id="clientes-consulta-title">Consultar clientes</h1>
            <p>Dados de contato, endereços e veículos dos seus clientes.</p>
          </div>
          <Link className="oficina-btn oficina-btn-primary" to="/operador/clientes/cadastro">
            <FiPlus aria-hidden="true" />Novo cliente
          </Link>
        </header>

        {toast && (
          <p className={`clientes-feedback ${toast.type || ''}`} role="status">
            {toast.text}
          </p>
        )}

        <section className="oficina-panel clientes-directory-toolbar" aria-label="Buscar clientes">
            <div className="clientes-toolbar-copy">
              <h2 className="oficina-section-heading"><FiUsers aria-hidden="true" />Clientes cadastrados</h2>
              <p className="clientes-result-count" role="status">
                {loading
                  ? 'Carregando clientes…'
                  : error
                  ? 'Atualize a consulta para tentar novamente.'
                  : `${clientesFiltrados.length} ${clientesFiltrados.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}`}
              </p>
            </div>
            <div className="clientes-search">
              <label htmlFor="clientes-busca">Nome do cliente ou placa do veículo</label>
              <div className="clientes-search-control">
                <FiSearch aria-hidden="true" />
                <input
                  id="clientes-busca"
                  type="search"
                  placeholder="Digite um nome ou uma placa"
                  value={buscaNome}
                  onChange={(event) => setBuscaNome(event.target.value)}
                />
              </div>
            </div>
        </section>

        <section className="clientes-results" aria-label="Resultado da consulta de clientes" aria-busy={loading}>
          {loading && <p className="clientes-list-status" role="status">Carregando clientes...</p>}

          {!loading && error && (
            <div className="clientes-feedback error" role="alert">
              <p>{error}</p>
              <button type="button" className="oficina-btn" onClick={carregarClientes}>
                <FiRefreshCw aria-hidden="true" />Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && clientesFiltrados.length === 0 && (
            <div className="clientes-list-empty">
              <FiUsers aria-hidden="true" />
              <p>{clientes.length ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}</p>
              <span>{clientes.length ? 'Tente outro nome ou placa.' : 'Use Novo cliente para começar.'}</span>
            </div>
          )}

          {!loading && !error && clientesFiltrados.length > 0 && (
            <div className="clientes-directory">
              {clientesFiltrados.map((cliente) => (
                <article className="clientes-compact-card" key={cliente.id} aria-labelledby={`clientes-nome-${cliente.id}`}>
                  <header className="clientes-card-header">
                    <div className="clientes-card-identity">
                      <h2 id={`clientes-nome-${cliente.id}`} className="clientes-client-name">{cliente.nome || 'Nome não informado'}</h2>
                      <p>CPF · {cliente.cpf ? formatCpf(cliente.cpf) : 'Não informado'}</p>
                    </div>
                    <button
                      type="button"
                      className="clientes-open-btn"
                      aria-label={`Visualizar cliente ${cliente.nome}`}
                      onClick={() => abrirCliente(cliente)}
                    >
                      Visualizar<FiArrowRight aria-hidden="true" />
                    </button>
                  </header>

                  <dl className="clientes-card-details">
                    <div>
                      <dt><FiPhone aria-hidden="true" />Celular</dt>
                      <dd>{cliente.celular ? formatPhone(cliente.celular) : 'Não informado'}</dd>
                    </div>
                    <div>
                      <dt><FiMail aria-hidden="true" />E-mail</dt>
                      <dd>{cliente.email || 'Não informado'}</dd>
                    </div>
                    <div className="clientes-card-address">
                      <dt><FiMapPin aria-hidden="true" />Endereço</dt>
                      <dd>
                        {[cliente.endereco, cliente.numero, cliente.complemento].filter(Boolean).join(', ') || 'Endereço não informado'}
                        <small>
                          {[
                            cliente.bairro,
                            [cliente.cidade, cliente.uf].filter(Boolean).join(' / '),
                            cliente.cep ? `CEP ${String(cliente.cep).replace(/^(\d{5})(\d{3})$/, '$1-$2')}` : '',
                          ].filter(Boolean).join(' · ')}
                        </small>
                      </dd>
                    </div>
                  </dl>

                  <section className="clientes-card-vehicles" aria-label={`Veículos de ${cliente.nome}`}>
                    <div className="clientes-vehicles-heading">
                      <h3><TbCar aria-hidden="true" />Veículos</h3>
                      <span>{cliente.veiculos?.length || 0} {cliente.veiculos?.length === 1 ? 'vinculado' : 'vinculados'}</span>
                    </div>
                    {cliente.veiculos?.length > 0 ? (
                      <ul className="clientes-vehicles">
                        {cliente.veiculos.map((veiculo) => (
                          <li key={veiculo.id}>
                            <span className="clientes-car-plate" aria-label={`Placa ${veiculo.placa || 'não informada'}`}>{veiculo.placa || 'Sem placa'}</span>
                            <div className="clientes-car-info">
                              <strong>{veiculo.modelo || 'Modelo não informado'}</strong>
                              <small>{[veiculo.fabricante, veiculo.ano_modelo || veiculo.ano_fabricacao, veiculo.cor].filter(Boolean).join(' · ')}</small>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="clientes-no-vehicle">Nenhum veículo cadastrado.</p>}
                  </section>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
}

export default VisualizarClientes;
