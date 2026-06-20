import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import api from '../../services/api';
import Layout from '../../components/Layout';

import '../../styles/operadorStyles/agendamento.css';
import '../../styles/operadorStyles/layout.css';


/**
 * Estado inicial do formulário de cadastro de agendamento.
 *
 * @constant {Object}
 */
const agendamentoInicial = {
  clienteId: '',
  veiculoId: '',
  data: '',
  hora: '',
  mecanico: '',
  tipo_servico: '',
  servico: '',
};

/**
 * Tela responsável pelo cadastro de agendamentos realizados pelo operador.
 *
 * @component
 * @function CadastroAgendamento
 * @returns {JSX.Element} Tela de cadastro de agendamento.
 */
function CadastroAgendamento() {
  const [clientes, setClientes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);

  const [buscaCliente, setBuscaCliente] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [veiculosCliente, setVeiculosCliente] = useState([]);

  const [formData, setFormData] = useState(agendamentoInicial);

  const [loading, setLoading] = useState(false);
  const [carregandoClientes, setCarregandoClientes] = useState(false);
  const [carregandoTecnicos, setCarregandoTecnicos] = useState(false);

 /**
 * Busca todos os clientes cadastrados para uso no autocomplete.
 *
 * @async
 * @returns {Promise<void>}
 */
  useEffect(() => {
    carregarClientes();
    carregarTecnicos();
  }, []);

/**
 * Busca todos os clientes cadastrados para uso no autocomplete.
 *
 * @async
 * @returns {Promise<void>}
 */
  async function carregarClientes() {
    try {
      setCarregandoClientes(true);

      const { data } = await api.get('/clientes');

      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes.');
    } finally {
      setCarregandoClientes(false);
    }
  }

/**
 * Busca os funcionários cadastrados e mantém apenas os técnicos.
 *
 * @async
 * @returns {Promise<void>}
 */
  async function carregarTecnicos() {
    try {
      setCarregandoTecnicos(true);

      const { data } = await api.get('/funcionarios');

      const tecnicosFiltrados = Array.isArray(data)
        ? data.filter((funcionario) => funcionario.usuario?.Role === 'TECNICO')
        : [];

      setTecnicos(tecnicosFiltrados);
    } catch (error) {
      console.error('Erro ao carregar técnicos:', error);
      toast.error('Erro ao carregar técnicos.');
    } finally {
      setCarregandoTecnicos(false);
    }
  }

 /**
 * Lista de clientes filtrada pelo nome, CPF ou placa digitada.
 *
 * @type {Array<Object>}
 */
  const resultados = useMemo(() => {
    const termo = buscaCliente.trim().toLowerCase();

    if (!termo || clienteSelecionado) {
      return [];
    }

    return clientes
      .filter((cliente) => {
        const nome = String(cliente.nome || '').toLowerCase();
        const cpf = String(cliente.cpf || '').toLowerCase();

        const placa = cliente.veiculos?.some((veiculo) =>
          String(veiculo.placa || '').toLowerCase().includes(termo)
        );

        return nome.includes(termo) || cpf.includes(termo) || placa;
      })
      .slice(0, 8);
  }, [buscaCliente, clientes, clienteSelecionado]);

/**
 * Seleciona um cliente e carrega seus veículos no formulário.
 *
 * @param {Object} cliente - Cliente selecionado na busca.
 * @returns {void}
 */
  function selecionarCliente(cliente) {
    setClienteSelecionado(cliente);
    setBuscaCliente(cliente.nome || '');
    setVeiculosCliente(cliente.veiculos || []);

    setFormData((prevState) => ({
      ...prevState,
      clienteId: cliente.id,
      veiculoId: '',
    }));
  }

/**
 * Remove o cliente selecionado e limpa os campos dependentes.
 *
 * @returns {void}
 */
  function removerClienteSelecionado() {
    setClienteSelecionado(null);
    setBuscaCliente('');
    setVeiculosCliente([]);

    setFormData((prevState) => ({
      ...prevState,
      clienteId: '',
      veiculoId: '',
    }));
  }

/**
 * Atualiza os campos simples do formulário de agendamento.
 *
 * @param {Object} event - Evento de alteração do campo.
 * @returns {void}
 */
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }

/**
 * Limpa o formulário e restaura os valores iniciais.
 *
 * @returns {void}
 */
  function limparFormulario() {
    setFormData(agendamentoInicial);
    setBuscaCliente('');
    setClienteSelecionado(null);
    setVeiculosCliente([]);
  }

/**
 * Valida os campos obrigatórios antes de cadastrar o agendamento.
 *
 * @returns {boolean} Retorna true se o formulário estiver válido.
 */
  function validarFormulario() {
    if (!formData.clienteId) {
      toast.warning('Selecione um cliente.');
      return false;
    }

    if (!formData.veiculoId) {
      toast.warning('Selecione um veículo.');
      return false;
    }

    if (!formData.data) {
      toast.warning('Informe a data do agendamento.');
      return false;
    }

    if (!formData.hora) {
      toast.warning('Informe a hora do agendamento.');
      return false;
    }

    if (!formData.mecanico) {
      toast.warning('Selecione o técnico responsável.');
      return false;
    }

    if (!formData.servico.trim()) {
      toast.warning('Informe a descrição do serviço.');
      return false;
    }

    return true;
  }

/**
 * Envia os dados do agendamento para a API.
 *
 * @async
 * @param {Object} event - Evento de envio do formulário.
 * @returns {Promise<void>}
 */
  async function handleSubmit(event) {
    event.preventDefault();

    try {
      if (!validarFormulario()) return;

      setLoading(true);

      const dataHora = new Date(`${formData.data}T${formData.hora}:00`);

      const payload = {
        clienteId: Number(formData.clienteId),
        veiculoId: Number(formData.veiculoId),
        dataHora,
        mecanico: formData.mecanico,
        tipo_servico: formData.tipo_servico.trim() || null,
        servico: formData.servico.trim(),

        // Se o backend ainda tiver status obrigatório, mantém fixo.
        // Não aparece na tela.
        status: 'AGENDADO',
      };

      await api.post('/agendamentos', payload);

      toast.success('Agendamento cadastrado com sucesso!');
      limparFormulario();
    } catch (error) {
      console.error('Erro ao cadastrar agendamento:', error);

      toast.error(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao cadastrar agendamento.'
      );
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

        <form className="agendamento-form" onSubmit={handleSubmit}>
          <section className="form-section">
            <div className="section-title-row">
              <div>
                <h2>Dados do cliente</h2>
                <p>Pesquise e selecione o cliente antes de escolher o veículo.</p>
              </div>

              {carregandoClientes && (
                <span className="loading-label">Carregando clientes...</span>
              )}
            </div>

            <div className="form-grid two-columns">
              <div className="field-group campo-com-dropdown">
                <label>Cliente</label>

                <input
                  type="text"
                  placeholder="Digite o nome, CPF ou placa do cliente"
                  value={buscaCliente}
                  onChange={(event) => {
                    setBuscaCliente(event.target.value);
                    setClienteSelecionado(null);

                    setFormData((prevState) => ({
                      ...prevState,
                      clienteId: '',
                      veiculoId: '',
                    }));

                    setVeiculosCliente([]);
                  }}
                />

                {resultados.length > 0 && (
                  <div className="dropdown-clientes">
                    {resultados.map((cliente) => (
                      <button
                        type="button"
                        key={cliente.id}
                        className="item-cliente"
                        onClick={() => selecionarCliente(cliente)}
                      >
                        <strong>{cliente.nome}</strong>
                        <span>
                          {cliente.cpf || 'CPF não informado'} |{' '}
                          {cliente.veiculos?.length || 0} veículo(s)
                        </span>
                      </button>
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
                  disabled={!formData.clienteId}
                >
                  <option value="">
                    {formData.clienteId
                      ? 'Selecione um veículo'
                      : 'Selecione um cliente primeiro'}
                  </option>

                  {veiculosCliente.map((veiculo) => (
                    <option key={veiculo.id} value={veiculo.id}>
                      {veiculo.placa || 'Sem placa'} -{' '}
                      {veiculo.modelo || 'Modelo não informado'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {clienteSelecionado && (
              <div className="cliente-selecionado-card">
                <div>
                  <span>Cliente selecionado</span>
                  <strong>{clienteSelecionado.nome || '-'}</strong>
                </div>

                <div>
                  <span>CPF</span>
                  <strong>{clienteSelecionado.cpf || '-'}</strong>
                </div>

                <div>
                  <span>Celular</span>
                  <strong>{clienteSelecionado.celular || '-'}</strong>
                </div>

                <button type="button" onClick={removerClienteSelecionado}>
                  Trocar cliente
                </button>
              </div>
            )}
          </section>

          <section className="form-section">
            <h2>Dados do agendamento</h2>

            <div className="form-grid two-columns">
              <div className="field-group">
                <label>Data</label>

                <input
                  type="date"
                  name="data"
                  value={formData.data}
                  onChange={handleChange}
                />
              </div>

              <div className="field-group">
                <label>Hora</label>

                <input
                  type="time"
                  name="hora"
                  value={formData.hora}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-grid two-columns">
              <div className="field-group">
                <label>Técnico responsável</label>

                <select
                  name="mecanico"
                  value={formData.mecanico}
                  onChange={handleChange}
                  disabled={carregandoTecnicos}
                >
                  <option value="">
                    {carregandoTecnicos
                      ? 'Carregando técnicos...'
                      : 'Selecione um técnico'}
                  </option>

                  {tecnicos.map((tecnico) => (
                    <option key={tecnico.id} value={tecnico.usuario?.Nome || ''}>
                      {tecnico.usuario?.Nome || 'Técnico sem nome'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label>Tipo de serviço</label>

                <input
                  type="text"
                  name="tipo_servico"
                  placeholder="Ex: Revisão, troca de óleo, diagnóstico..."
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
                />
              </div>
            </div>
          </section>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={limparFormulario}
              disabled={loading}
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