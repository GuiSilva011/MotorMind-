import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/Layout';
import '../../styles/operadorStyles/visualizarClientes.css';
import '../../styles/operadorStyles/layout.css';


/**
 * Tela responsável pela consulta e visualização dos clientes cadastrados,
 * incluindo seus dados pessoais e veículos vinculados.
 *
 * @component
 * @function VisualizarClientes
 * @returns {JSX.Element} Tela de consulta de clientes.
 */
function VisualizarClientes() {
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
    <Layout>
      <main className="consulta-clientes-container">
        <div className="consulta-clientes-header">
          <div>
            <h1>Consultar clientes</h1>
            <p>Pesquise pelo nome do cliente ou pela placa do veículo.</p>
          </div>
        </div>

        <div className="barra-busca">
          <input
            type="text"
            placeholder="Digite o nome do cliente ou a placa do veículo"
            value={buscaNome}
            onChange={(event) => setBuscaNome(event.target.value)}
          />
        </div>

        {toast && (
          <p className={`toast-message ${toast.type || ''}`}>
            {toast.text}
          </p>
        )}

        {loading && <p className="status-message">Carregando clientes...</p>}

        {!loading && error && (
          <p className="status-message error">{error}</p>
        )}

        {!loading && !error && clientesFiltrados.length === 0 && (
          <div className="sem-clientes">
            Nenhum cliente encontrado com esse nome ou placa.
          </div>
        )}

        {!loading && !error && clientesFiltrados.length > 0 && (
          <div className="lista-clientes">
            {clientesFiltrados.map((cliente) => (
              <div className="card-cliente" key={cliente.id}>
                <div className="cliente-info">
                  <h2>{cliente.nome || '-'}</h2>

                  <div className="cliente-dados">
                    <p>CPF: {formatCpf(cliente.cpf)}</p>
                    <p>Celular: {formatPhone(cliente.celular)}</p>
                    <p>Email: {cliente.email || '-'}</p>
                    <p>
                      Cidade: {cliente.cidade || '-'} / {cliente.uf || '-'}
                    </p>
                  </div>
                </div>

                <div className="veiculos-area">
                  <h3>Veículos</h3>

                  {cliente.veiculos && cliente.veiculos.length > 0 ? (
                    <div className="lista-veiculos">
                      {cliente.veiculos.map((veiculo) => (
                        <div className="veiculo-item" key={veiculo.id}>
                          <strong>
                            {veiculo.modelo || 'Modelo não informado'}
                          </strong>

                          <span>Placa: {veiculo.placa || '-'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="sem-veiculo">
                      Nenhum veículo cadastrado.
                    </p>
                  )}
                </div>

                <div className="acoes-cliente">
                  <button
                    type="button"
                    onClick={() => abrirCliente(cliente)}
                  >
                    Visualizar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
}

export default VisualizarClientes;