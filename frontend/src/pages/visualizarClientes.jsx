import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import '../styles/visualizarClientes.css';
import "../styles/layout.css";


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

function VisualizarClientes() {
  const navigate = useNavigate();
  const location = useLocation();

  const [clientes, setClientes] = useState([]);
  const [buscaNome, setBuscaNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const carregarClientes = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/clientes');
      setClientes(data);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar os clientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

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

  const clientesFiltrados = useMemo(() => {
    const termo = buscaNome.trim().toLowerCase();

    if (!termo) return clientes;

    return clientes.filter((cliente) =>
      String(cliente.nome || '').toLowerCase().includes(termo)
    );
  }, [buscaNome, clientes]);

  return (
    <Layout>
      <main className="consulta-clientes-container">
        <div className="consulta-clientes-header">
          <div>
            <h1>Consultar clientes</h1>
            <p>Pesquise pelo nome do cliente para visualizar os dados.</p>
          </div>
        </div>

        <div className="barra-busca">
          <input
            type="text"
            placeholder="Digite o nome do cliente"
            value={buscaNome}
            onChange={(event) => setBuscaNome(event.target.value)}
          />
        </div>

        {toast && (
          <p className={`toast-message ${toast.type || ''}`}>
            {toast.text}
          </p>
        )}

        {loading && (
          <p className="status-message">Carregando clientes...</p>
        )}

        {!loading && error && (
          <p className="status-message error">{error}</p>
        )}

        {!loading && !error && clientesFiltrados.length === 0 && (
          <div className="sem-clientes">
            Nenhum cliente encontrado com esse nome.
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
                    onClick={() =>
                      navigate(
                        `/clientes/cadastro?nome=${encodeURIComponent(
                          cliente.nome || ''
                        )}&visualizar=1`
                      )
                    }
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