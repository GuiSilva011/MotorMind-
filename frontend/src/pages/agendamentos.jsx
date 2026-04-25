import { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import '../styles/agendamento.css';
import "../styles/layout.css";




const agendamentoInicial = {
  clienteId: '',
  veiculoId: '',
  data: '',
  hora: '',
  mecanico: '',
  tipo_servico: '',
  servico: '',
  status: 'AGENDADO'
};



function CadastroAgendamento() {
  const [clientes, setClientes] = useState([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [resultados, setResultados] = useState([]);
  const [veiculosCliente, setVeiculosCliente] = useState([]);
  const [formData, setFormData] = useState(agendamentoInicial);
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    carregarClientes();
    carregarAgendamentos();
  }, []);

  async function carregarClientes() {
    try {
      const { data } = await api.get('/clientes');
      setClientes(data);
    } catch (error) {
      console.error(error);
      setMensagem('Erro ao carregar clientes.');
    }
  }

  async function buscarClientes(nome) {
    try {
      if (!nome.trim()) {
        setResultados([]);
        return;
      }

      const filtrados = clientes.filter((cliente) =>
        cliente.nome.toLowerCase().includes(nome.toLowerCase())
      );

      setResultados(filtrados);
    } catch (error) {
      console.error(error);
    }
  }

  async function carregarAgendamentos() {
    try {
      const { data } = await api.get('/agendamentos');

      const eventosFormatados = data.map((agendamento) => ({
        title: `${agendamento.servico} - ${agendamento.cliente.nome}`,
        start: new Date(agendamento.dataHora),
        end: new Date(agendamento.dataHora)
      }));

      setEventos(eventosFormatados);
    } catch (error) {
      console.error(error);
    }
  }

  function selecionarCliente(cliente) {
    setFormData((prevState) => ({
      ...prevState,
      clienteId: cliente.id,
      veiculoId: ''
    }));

    setBuscaCliente(cliente.nome);
    setVeiculosCliente(cliente.veiculos || []);
    setResultados([]);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prevState) => ({
      ...prevState,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !formData.clienteId ||
      !formData.veiculoId ||
      !formData.data ||
      !formData.hora
    ) {
      setMensagem('Preencha cliente, veículo, data e hora.');
      return;
    }

    if (!formData.servico.trim()) {
      setMensagem('Informe o serviço do agendamento.');
      return;
    }

    const dataHora = new Date(`${formData.data}T${formData.hora}:00`);

    const payload = {
      clienteId: Number(formData.clienteId),
      veiculoId: Number(formData.veiculoId),
      dataHora,
      mecanico: formData.mecanico || null,
      tipo_servico: formData.tipo_servico || null,
      servico: formData.servico,
      status: formData.status
    };

    try {
      setLoading(true);

      await api.post('/agendamentos', payload);

      setMensagem('Agendamento cadastrado com sucesso!');
      setFormData(agendamentoInicial);
      setBuscaCliente('');
      setVeiculosCliente([]);
      await carregarAgendamentos();
    } catch (error) {
      console.error(error);
      setMensagem('Erro ao cadastrar agendamento.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <main className="agendamento-content">
        <div className="agendamento-header">
          <h1>Cadastro de Agendamento</h1>
          <p>Registre os serviços agendados pelos operadores da oficina.</p>
        </div>

        {mensagem && <p className="toast-message">{mensagem}</p>}

        <form className="agendamento-form" onSubmit={handleSubmit}>
          <section className="form-section">
            <h2>Dados do cliente</h2>

            <div className="form-grid two-columns">
              <div className="field-group">
                <label>Cliente</label>

                <input
                  type="text"
                  placeholder="Digite o nome do cliente"
                  value={buscaCliente}
                  onChange={(event) => {
                    setBuscaCliente(event.target.value);
                    buscarClientes(event.target.value);
                  }}
                />

                {resultados.length > 0 && (
                  <div className="dropdown-clientes">
                    {resultados.map((cliente) => (
                      <div
                        key={cliente.id}
                        className="item-cliente"
                        onClick={() => selecionarCliente(cliente)}
                      >
                        {cliente.nome}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="field-group">
                <label>Veículo</label>

                <select
                  name="veiculoId"
                  value={formData.veiculoId}
                  onChange={handleChange}
                  required
                  disabled={!formData.clienteId}
                >
                  <option value="">
                    {formData.clienteId
                      ? 'Selecione um veículo'
                      : 'Selecione um cliente primeiro'}
                  </option>

                  {veiculosCliente.map((veiculo) => (
                    <option key={veiculo.id} value={veiculo.id}>
                      {veiculo.placa} - {veiculo.modelo || 'Modelo não informado'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>Dados do agendamento</h2>

            <div className="form-grid three-columns">
              <div className="field-group">
                <label>Data</label>

                <input
                  type="date"
                  name="data"
                  value={formData.data}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field-group">
                <label>Hora</label>

                <input
                  type="time"
                  name="hora"
                  value={formData.hora}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field-group">
                <label>Status</label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="AGENDADO">Agendado</option>
                  <option value="EM_ANDAMENTO">Em andamento</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="form-grid two-columns">
              <div className="field-group">
                <label>Mecânico responsável</label>

                <input
                  type="text"
                  name="mecanico"
                  placeholder="Ex.: Carlos"
                  value={formData.mecanico}
                  onChange={handleChange}
                />
              </div>

              <div className="field-group">
                <label>Tipo de serviço</label>

                <input
                  type="text"
                  name="tipo_servico"
                  placeholder="Ex.: Revisão, troca de óleo, diagnóstico..."
                  value={formData.tipo_servico}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-grid one-column">
              <div className="field-group">
                <label>Descrição do serviço</label>

                <textarea
                  name="servico"
                  placeholder="Descreva o serviço solicitado pelo cliente"
                  value={formData.servico}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </section>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setFormData(agendamentoInicial);
                setBuscaCliente('');
                setVeiculosCliente([]);
                setMensagem('');
              }}
            >
              Limpar
            </button>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Cadastrar agendamento'}
            </button>
          </div>
        </form>
      </main>
    </Layout>
  );
}

export default CadastroAgendamento;