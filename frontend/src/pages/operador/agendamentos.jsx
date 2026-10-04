import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCalendar, FiCheck, FiSearch, FiUser } from 'react-icons/fi';
import { TbCar } from 'react-icons/tb';

import api from '../../services/api';
import Layout from '../../components/Layout';
import SeletorTema from '../../components/SeletorTema';
import useTemaOficina from '../../hooks/useTemaOficina';

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
  const [tema, setTema] = useTemaOficina();
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
    <Layout className="oficina-theme agendamentos-workspace" theme={tema}
      topbarActions={<SeletorTema tema={tema} onChange={setTema} />}>
      <main className="oficina-page agendamento-content">
        <header className="oficina-page-header">
          <div>
            <h1>Cadastro de agendamento</h1>
            <p>Organize o atendimento com cliente, veículo e horário definidos.</p>
          </div>
          <Link className="oficina-btn" to="/operador/agendamentos/calendario">
            <FiCalendar aria-hidden="true" /> Visualizar agendamentos
          </Link>
        </header>

        <form className="agendamento-form" onSubmit={handleSubmit}>
          <section className="oficina-panel" aria-labelledby="agendamento-cliente-titulo">
            <div className="oficina-panel-title agendamento-section-title">
              <div>
                <h2 id="agendamento-cliente-titulo" className="oficina-section-heading">
                  <FiUser aria-hidden="true" /> Cliente e veículo
                </h2>
                <span>Pesquise o cliente e escolha o veículo que será atendido.</span>
              </div>

              {carregandoClientes && (
                <span className="agendamento-loading" role="status">Carregando clientes...</span>
              )}
            </div>

            <div className="oficina-form-grid agendamento-grid">
              <div className="oficina-field agendamento-cliente-busca">
                <label htmlFor="agendamento-cliente">Cliente</label>

                <div className="agendamento-search-control">
                  <FiSearch aria-hidden="true" />
                  <input
                    id="agendamento-cliente"
                    type="text"
                    placeholder="Digite o nome, CPF ou placa do cliente"
                    autoComplete="off"
                    aria-controls={resultados.length > 0 ? 'agendamento-clientes-resultados' : undefined}
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
                </div>

                {resultados.length > 0 && (
                  <div id="agendamento-clientes-resultados" className="agendamento-clientes-resultados"
                    role="group" aria-label="Clientes encontrados">
                    {resultados.map((cliente) => (
                      <button
                        type="button"
                        key={cliente.id}
                        className="agendamento-cliente-opcao"
                        onClick={() => selecionarCliente(cliente)}
                      >
                        <strong>{cliente.nome}</strong>
                        <span>
                          {cliente.cpf || 'CPF não informado'} ·{' '}
                          {cliente.veiculos?.length || 0} veículo(s)
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="oficina-field">
                <label htmlFor="agendamento-veiculo" className="agendamento-label-icon">
                  <TbCar aria-hidden="true" /> Veículo
                </label>

                <select
                  id="agendamento-veiculo"
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
              <div className="agendamento-cliente-selecionado">
                <dl>
                  <div>
                    <dt>Cliente selecionado</dt>
                    <dd>{clienteSelecionado.nome || '-'}</dd>
                  </div>
                  <div>
                    <dt>CPF</dt>
                    <dd>{clienteSelecionado.cpf || '-'}</dd>
                  </div>
                  <div>
                    <dt>Celular</dt>
                    <dd>{clienteSelecionado.celular || '-'}</dd>
                  </div>
                </dl>
                <button type="button" className="oficina-btn" onClick={removerClienteSelecionado}>
                  Trocar cliente
                </button>
              </div>
            )}
          </section>

          <section className="oficina-panel" aria-labelledby="agendamento-dados-titulo">
            <div className="oficina-panel-title">
              <h2 id="agendamento-dados-titulo" className="oficina-section-heading">
                <FiCalendar aria-hidden="true" /> Dados do agendamento
              </h2>
              <span>Defina quando será o atendimento e descreva o serviço solicitado.</span>
            </div>

            <div className="oficina-form-grid agendamento-grid">
              <div className="oficina-field">
                <label htmlFor="agendamento-data">Data</label>

                <input
                  id="agendamento-data"
                  type="date"
                  name="data"
                  value={formData.data}
                  onChange={handleChange}
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="agendamento-hora">Hora</label>

                <input
                  id="agendamento-hora"
                  type="time"
                  name="hora"
                  value={formData.hora}
                  onChange={handleChange}
                />
              </div>
              <div className="oficina-field">
                <label htmlFor="agendamento-tecnico">Técnico responsável</label>

                <select
                  id="agendamento-tecnico"
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

              <div className="oficina-field">
                <label htmlFor="agendamento-tipo">Tipo de serviço <span className="agendamento-opcional">(opcional)</span></label>

                <input
                  id="agendamento-tipo"
                  type="text"
                  name="tipo_servico"
                  placeholder="Ex: Revisão, troca de óleo, diagnóstico..."
                  value={formData.tipo_servico}
                  onChange={handleChange}
                />
              </div>
              <div className="oficina-field oficina-col-full">
                <label htmlFor="agendamento-descricao">Descrição do serviço</label>

                <textarea
                  id="agendamento-descricao"
                  name="servico"
                  placeholder="Descreva o serviço solicitado pelo cliente"
                  value={formData.servico}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          <div className="oficina-form-actions">
            <button
              type="button"
              className="oficina-btn"
              onClick={limparFormulario}
              disabled={loading}
            >
              Limpar
            </button>

            <button type="submit" className="oficina-btn oficina-btn-primary" disabled={loading}>
              <FiCheck aria-hidden="true" />
              {loading ? 'Salvando...' : 'Cadastrar agendamento'}
            </button>
          </div>
        </form>
      </main>
    </Layout>
  );
}

export default CadastroAgendamento;
