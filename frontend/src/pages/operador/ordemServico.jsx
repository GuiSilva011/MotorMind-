import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/operadorStyles/ordemServico.css';

/**
 * Chave usada para armazenar o rascunho da ordem de serviço no localStorage.
 *
 * @constant {string}
 */
const OS_RASCUNHO_KEY = 'motormind_ordem_servico_rascunho';

/**
 * Identificador do aviso exibido ao encontrar um rascunho de ordem de serviço.
 *
 * @constant {string}
 */
const OS_RASCUNHO_TOAST_ID = 'motormind_ordem_servico_rascunho_toast';

/**
 * Estrutura inicial usada para criar e limpar uma ordem de serviço.
 *
 * @constant {Object}
 */
const ordemInicial = {
  id: null,
  codigo: '',
  status: 'ABERTA',
  cliente: {
    id: '',
    nome: '',
    cpf: '',
    dataNascimento: '',
    celular: '',
    telefone: '',
    whatsapp: '',
    email: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    complemento: '',
  },
  veiculo: {
    id: '',
    placa: '',
    marca: '',
    modelo: '',
    ano: '',
    motor: '',
    cambio: '',
    cor: '',
    km: '',
    chassi: '',
    possuiAr: false,
  },
  observacoes: '',
  diagnosticos: [],
  servicosSemDiagnostico: [],
  pecasAvulsas: [],
};

/**
 * Estado inicial dos filtros usados na pesquisa de ordens de serviço antigas.
 *
 * @constant {Object}
 */
const filtrosBuscaOSInicial = {
  termo: '',
  status: '',
  dataInicio: '',
  dataFim: '',
};

/**
 * Tela principal de ordem de serviço do operador.
 *
 * Permite criar, editar, consultar, imprimir e enviar ordens de serviço,
 * além de gerenciar diagnósticos, serviços, peças, fornecedores e cotações.
 *
 * @component
 * @function OrdemServico
 * @returns {JSX.Element} Tela de gerenciamento de ordens de serviço.
 */
function OrdemServico() {
  const navigate = useNavigate();
  const location = useLocation();
  const iniciouTelaRef = useRef(false);

  const agendamentoOrigem = location.state?.agendamento || null;
  const clienteOrigem = location.state?.cliente || agendamentoOrigem?.cliente || null;
  const veiculoOrigem = location.state?.veiculo || agendamentoOrigem?.veiculo || null;

  const [ordem, setOrdem] = useState(ordemInicial);
  const [modoTela, setModoTela] = useState('nova');
  const [rascunhoCarregado, setRascunhoCarregado] = useState(false);

  const [catalogos, setCatalogos] = useState({
    diagnosticos: [],
    servicos: [],
    pecas: [],
    fornecedores: [],
    tecnicos: [],
  });

  const [busca, setBusca] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [buscandoVeiculo, setBuscandoVeiculo] = useState(false);
  const [clienteNaoEncontrado, setClienteNaoEncontrado] = useState(false);

  const [carregandoCatalogos, setCarregandoCatalogos] = useState(false);
  const [carregandoCodigo, setCarregandoCodigo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [modalCotacaoAberto, setModalCotacaoAberto] = useState(false);
  const [fornecedoresCotacao, setFornecedoresCotacao] = useState([]);

  const [modalCatalogo, setModalCatalogo] = useState({
    aberto: false,
    tipo: '',
    diagnosticoId: null,
    servicoId: null,
    pecaId: null,
    origem: '',
  });

  const [buscaCatalogo, setBuscaCatalogo] = useState('');

  const [modalBuscarOSAberto, setModalBuscarOSAberto] = useState(false);
  const [filtrosBuscaOS, setFiltrosBuscaOS] = useState(filtrosBuscaOSInicial);
  const [ordensEncontradas, setOrdensEncontradas] = useState([]);
  const [buscandoOrdens, setBuscandoOrdens] = useState(false);
  const [carregandoOrdem, setCarregandoOrdem] = useState(false);

  const podeEditar = modoTela === 'nova' || modoTela === 'edicao';
  const estaVisualizando = modoTela === 'visualizacao';

  /**
   * Inicializa a tela apenas uma vez e evita execuções duplicadas durante
   * re-renderizações do componente.
   */
  useEffect(() => {
    if (iniciouTelaRef.current) return;

    iniciouTelaRef.current = true;
    iniciarTelaOrdemServico();
  }, []);

  /**
   * Salva automaticamente o rascunho da ordem de serviço enquanto houver
   * progresso de preenchimento e a tela estiver em modo editável.
   */
  useEffect(() => {
    if (!rascunhoCarregado) return;
    if (modoTela === 'visualizacao') return;

    const temAlgumProgresso =
      ordem.veiculo.id ||
      ordem.cliente.nome ||
      ordem.observacoes ||
      ordem.diagnosticos.length > 0 ||
      ordem.servicosSemDiagnostico.length > 0 ||
      ordem.pecasAvulsas.length > 0;

    if (!temAlgumProgresso) return;

    const dados = {
      ordem,
      modoTela,
      busca,
      fornecedoresCotacao,
      salvoEm: new Date().toISOString(),
    };

    localStorage.setItem(OS_RASCUNHO_KEY, JSON.stringify(dados));
  }, [ordem, modoTela, busca, fornecedoresCotacao, rascunhoCarregado]);

  /**
   * Inicializa catálogos, tenta recuperar rascunho e define código para nova OS.
   *
   * @async
   * @returns {Promise<void>} Promessa concluída após a operação.
   */
  async function iniciarTelaOrdemServico() {
    try {
      await carregarCatalogos();

      if (agendamentoOrigem && clienteOrigem && veiculoOrigem) {
        await prepararOrdemAPartirDoAgendamento({
          agendamento: agendamentoOrigem,
          cliente: clienteOrigem,
          veiculo: veiculoOrigem,
        });

        return;
      }

      const rascunho = localStorage.getItem(OS_RASCUNHO_KEY);

      if (rascunho) {
        toast.info(
          ({ closeToast }) => (
            <div className="os-toast-draft">
              <strong>OS em andamento encontrada</strong>

              <span>
                Existe um rascunho salvo desta ordem de serviço. Deseja
                recuperar?
              </span>

              <div className="os-toast-actions">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const dados = JSON.parse(rascunho);

                      setOrdem(dados.ordem || ordemInicial);
                      setModoTela(dados.modoTela || 'nova');
                      setBusca(dados.busca || '');
                      setFornecedoresCotacao(dados.fornecedoresCotacao || []);
                      setRascunhoCarregado(true);

                      toast.success('Rascunho recuperado com sucesso!');
                      closeToast();
                    } catch (error) {
                      console.error('Erro ao recuperar rascunho:', error);

                      localStorage.removeItem(OS_RASCUNHO_KEY);
                      setRascunhoCarregado(true);
                      carregarProximoCodigo();

                      toast.error(
                        'Erro ao recuperar rascunho. Ele foi descartado.'
                      );

                      closeToast();
                    }
                  }}
                >
                  Recuperar
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={async () => {
                    localStorage.removeItem(OS_RASCUNHO_KEY);

                    await carregarProximoCodigo();
                    setRascunhoCarregado(true);

                    toast.info('Rascunho descartado.');
                    closeToast();
                  }}
                >
                  Descartar
                </button>
              </div>
            </div>
          ),
          {
            toastId: OS_RASCUNHO_TOAST_ID,
            autoClose: false,
            closeOnClick: false,
            draggable: false,
          }
        );

        return;
      }

      await carregarProximoCodigo();
      setRascunhoCarregado(true);
    } catch (error) {
      console.error('Erro ao iniciar tela da OS:', error);
      setRascunhoCarregado(true);
      toast.error('Erro ao iniciar a tela da ordem de serviço.');
    }
  }

  /**
   * Busca e aplica o próximo código sequencial de OS na tela atual.
   *
   * @async
   * @returns {Promise<void>} Promessa concluída após a operação.
   */
  async function carregarProximoCodigo() {
    try {
      setCarregandoCodigo(true);

      const response = await api.get('/ordens-servico/proximo-codigo');

      setOrdem((prev) => ({
        ...prev,
        codigo: response.data?.codigo || '',
      }));
    } catch (error) {
      console.error('Erro ao carregar próximo código da OS:', error);
      toast.error('Erro ao gerar o próximo código da ordem de serviço.');
    } finally {
      setCarregandoCodigo(false);
    }
  }

  /**
   * Retorna o próximo código para montar ordens criadas por atalhos (ex.: agendamento).
   *
   * @async
   * @returns {Promise<string>} Código da próxima ordem de serviço.
   */
  async function buscarProximoCodigoOrdem() {
    try {
      setCarregandoCodigo(true);

      const response = await api.get('/ordens-servico/proximo-codigo');

      return response.data?.codigo || '';
    } catch (error) {
      console.error('Erro ao carregar próximo código da OS:', error);
      toast.error('Erro ao gerar o próximo código da ordem de serviço.');
      return '';
    } finally {
      setCarregandoCodigo(false);
    }
  }

  /**
   * Normaliza o fabricante quando o cadastro usa nomes diferentes para a marca.
   *
   * @param {Object} veiculo - Veículo utilizado na operação.
   * @returns {string} Texto resultante da operação.
   */
  function obterFabricanteVeiculo(veiculo) {
    return veiculo.fabricante || veiculo.marca || veiculo.modeloMarca || '';
  }

  /**
   * Normaliza o modelo do veículo para usar na tela e na cotação.
   *
   * @param {Object} veiculo - Veículo utilizado na operação.
   * @returns {string} Texto resultante da operação.
   */
  function obterModeloVeiculo(veiculo) {
    return veiculo.modelo || veiculo.nomeModelo || '';
  }

  /**
   * Normaliza a quilometragem exibida no cabeçalho da OS.
   *
   * @param {Object} veiculo - Veículo utilizado na operação.
   * @returns {string} Texto resultante da operação.
   */
  function obterKmVeiculo(veiculo) {
    return veiculo.km || veiculo.quilometragem || veiculo.kilometragem || '';
  }

  /**
   * Busca campos do cliente mesmo quando o backend retorna nomes em padrões diferentes.
   *
   * @param {Object} cliente - Cliente utilizado na operação.
   * @param {string[]} campos - Nomes de campos alternativos que serão consultados.
   * @returns {string} Texto resultante da operação.
   */
  function obterCampoCliente(cliente = {}, ...campos) {
    for (const campo of campos) {
      const valor = cliente?.[campo];

      if (valor !== undefined && valor !== null && valor !== '') {
        return valor;
      }
    }

    return '';
  }

  /**
   * Normaliza os dados completos do cliente para uso no WhatsApp e na impressão da OS.
   *
   * @param {Object} cliente - Cliente utilizado na operação.
   * @returns {Object} Objeto resultante da operação.
   */
  function mapearClienteParaTela(cliente = {}) {
    return {
      id: obterCampoCliente(cliente, 'id'),
      nome: obterCampoCliente(cliente, 'nome', 'Nome'),
      cpf: obterCampoCliente(cliente, 'cpf', 'CPF', 'Cpf'),
      dataNascimento: obterCampoCliente(
        cliente,
        'dataNascimento',
        'DataNascimento',
        'data_nascimento'
      ),
      celular: obterCampoCliente(cliente, 'celular', 'Celular'),
      telefone: obterCampoCliente(cliente, 'telefone', 'Telefone'),
      whatsapp: obterCampoCliente(cliente, 'whatsapp', 'Whatsapp', 'WhatsApp'),
      email: obterCampoCliente(cliente, 'email', 'Email'),
      cep: obterCampoCliente(cliente, 'cep', 'CEP', 'Cep'),
      endereco: obterCampoCliente(cliente, 'endereco', 'Endereco', 'logradouro'),
      numero: obterCampoCliente(cliente, 'numero', 'Numero', 'num'),
      bairro: obterCampoCliente(cliente, 'bairro', 'Bairro'),
      cidade: obterCampoCliente(cliente, 'cidade', 'Cidade'),
      uf: obterCampoCliente(cliente, 'uf', 'UF', 'Uf'),
      complemento: obterCampoCliente(cliente, 'complemento', 'Complemento'),
    };
  }

  /**
   * Monta o endereço do cliente para impressão.
   * @returns {string} Texto resultante da operação.
   */
  function montarEnderecoCliente() {
    return [
      ordem.cliente.endereco,
      ordem.cliente.numero,
      ordem.cliente.bairro,
      ordem.cliente.cidade,
      ordem.cliente.uf,
    ]
      .filter(Boolean)
      .join(', ');
  }

  /**
   * Prepara uma nova OS a partir de um agendamento já existente.
   *
   * @async
   *
   * @param {Object} dados - Dados utilizados para iniciar a ordem de serviço.
   * @param {Object} dados.agendamento - Agendamento de origem.
   * @param {Object} dados.cliente - Cliente vinculado ao agendamento.
   * @param {Object} dados.veiculo - Veículo vinculado ao agendamento.
   * @returns {Promise<void>} Promessa concluída após a operação.
   */
  async function prepararOrdemAPartirDoAgendamento({
    agendamento,
    cliente,
    veiculo,
  }) {
    localStorage.removeItem(OS_RASCUNHO_KEY);
    toast.dismiss(OS_RASCUNHO_TOAST_ID);

    const codigo = await buscarProximoCodigoOrdem();
    const descricaoAgendamento = agendamento.servico || '';
    const tipoServico = agendamento.tipo_servico || agendamento.tipoServico || '';

    const novaOrdem = {
      ...ordemInicial,
      codigo,
      status: 'ABERTA',
      cliente: mapearClienteParaTela(cliente),
      veiculo: {
        id: veiculo.id || agendamento.veiculoId || '',
        placa: veiculo.placa || '',
        marca: obterFabricanteVeiculo(veiculo),
        modelo: obterModeloVeiculo(veiculo),
        ano: montarAnoVeiculo(veiculo),
        motor: veiculo.motor || '',
        cambio: veiculo.cambio || veiculo.Cambio || '',
        cor: veiculo.cor || '',
        km: obterKmVeiculo(veiculo),
        chassi: veiculo.chassi || '',
        possuiAr: Boolean(veiculo.ar || veiculo.possuiAr),
      },
      observacoes: descricaoAgendamento || tipoServico || '',
      servicosSemDiagnostico:
        descricaoAgendamento || tipoServico
          ? [
              {
                ...criarServico(),
                descricao: descricaoAgendamento || tipoServico,
                responsavel: agendamento.mecanico || '',
                tipo: tipoServico || '',
              },
            ]
          : [],
      agendamentoId: agendamento.id || null,
    };

    setOrdem(novaOrdem);
    setModoTela('nova');
    setBusca(
      `${cliente.nome || cliente.Nome || ''}${veiculo.placa ? ` - ${veiculo.placa}` : ''}`
    );
    setResultadosBusca([]);
    setClienteNaoEncontrado(false);
    setFornecedoresCotacao([]);
    setRascunhoCarregado(true);

    window.history.replaceState({}, document.title, window.location.pathname);
    toast.success('Nova ordem de serviço iniciada a partir do agendamento.');
  }

  /**
   * Carrega catálogos auxiliares usados nos selects e buscas da tela.
   *
   * @async
   * @returns {Promise<void>} Promessa concluída após a operação.
   */
  async function carregarCatalogos() {
    try {
      setCarregandoCatalogos(true);

      const [
        diagnosticosResponse,
        servicosResponse,
        pecasResponse,
        fornecedoresResponse,
        funcionariosResponse,
      ] = await Promise.all([
        api.get('/diagnosticos'),
        api.get('/servicos'),
        api.get('/pecas'),
        api.get('/fornecedores'),
        api.get('/funcionarios'),
      ]);

      const fornecedoresPecas = Array.isArray(fornecedoresResponse.data)
        ? fornecedoresResponse.data.filter(
            (fornecedor) => fornecedor.fornecePecas === true
          )
        : [];

      const tecnicos = Array.isArray(funcionariosResponse.data)
        ? funcionariosResponse.data.filter(
            (funcionario) => funcionario.usuario?.Role === 'TECNICO'
          )
        : [];

      setCatalogos({
        diagnosticos: diagnosticosResponse.data || [],
        servicos: servicosResponse.data || [],
        pecas: pecasResponse.data || [],
        fornecedores: fornecedoresPecas,
        tecnicos,
      });
    } catch (error) {
      console.error('Erro ao carregar catálogos:', error);
      toast.error(
        'Erro ao carregar diagnósticos, serviços, peças ou fornecedores.'
      );
    } finally {
      setCarregandoCatalogos(false);
    }
  }

  /**
   * Busca cliente ou veículo para preencher a OS a partir de texto livre.
   *
   * @async
   * @returns {Promise<void>} Promessa concluída após a operação.
   */
  async function buscarClienteOuVeiculo() {
    try {
      const termo = busca.trim();

      if (!termo) {
        toast.warning('Digite o nome do cliente ou a placa do veículo.');
        return;
      }

      setBuscandoVeiculo(true);
      setClienteNaoEncontrado(false);

      const response = await api.get('/veiculos/buscar-para-os', {
        params: { termo },
      });

      const resultados = response.data || [];

      setResultadosBusca(resultados);
      setClienteNaoEncontrado(resultados.length === 0);

      if (resultados.length === 0) {
        toast.info('Nenhum cliente ou veículo encontrado.');
      }
    } catch (error) {
      console.error('Erro ao buscar cliente/veículo:', error);

      setResultadosBusca([]);
      setClienteNaoEncontrado(true);

      toast.error(
        error.response?.data?.erro ||
          'Nenhum cliente ou veículo encontrado para a busca informada.'
      );
    } finally {
      setBuscandoVeiculo(false);
    }
  }

  /**
   * Copia o veículo selecionado para o estado principal da ordem.
   *
   * @param {Object} veiculo - Veículo utilizado na operação.
   * @returns {void} Não possui retorno.
   */
  function selecionarVeiculo(veiculo) {
    const cliente = veiculo.cliente;

    setOrdem((prev) => ({
      ...prev,
      cliente: mapearClienteParaTela(cliente),
      veiculo: {
        id: veiculo.id || '',
        placa: veiculo.placa || '',
        marca: veiculo.fabricante || '',
        modelo: veiculo.modelo || '',
        ano: montarAnoVeiculo(veiculo),
        motor: veiculo.motor || '',
        cambio: veiculo.cambio || veiculo.Cambio || '',
        cor: veiculo.cor || '',
        km: veiculo.km || '',
        chassi: veiculo.chassi || '',
        possuiAr: Boolean(veiculo.ar),
      },
    }));

    setResultadosBusca([]);
    setBusca(`${cliente?.nome || ''} - ${veiculo.placa || ''}`);
    setClienteNaoEncontrado(false);
  }

  /**
   * Formata ano de fabricação/modelo para exibição compacta.
   *
   * @param {Object} veiculo - Veículo utilizado na operação.
   * @returns {string} Texto resultante da operação.
   */
  function montarAnoVeiculo(veiculo) {
    if (veiculo.ano_fabricacao && veiculo.ano_modelo) {
      return `${veiculo.ano_fabricacao}/${veiculo.ano_modelo}`;
    }

    return veiculo.ano_modelo || veiculo.ano_fabricacao || '';
  }

  /**
   * Atualiza campos simples da ordem enquanto a tela está editável.
   *
   * @param {string} campo - Nome do campo que será atualizado.
   * @param {*} valor - Novo valor do campo.
   * @returns {void} Não possui retorno.
   */
  function atualizarCampoOrdem(campo, valor) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  /**
   * Gera o identificador hierárquico dos diagnósticos.
   *
   * @param {number} index - Índice do elemento.
   * @returns {string} Texto resultante da operação.
   */
  function letraDiagnostico(index) {
    return String.fromCharCode(65 + index);
  }

  /**
   * Formata valores monetários para o padrão brasileiro.
   *
   * @param {*} valor - Novo valor do campo.
   * @returns {string} Texto resultante da operação.
   */
  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  /**
   * Formata datas simples para a apresentação da OS.
   *
   * @param {string} data - Data que será formatada.
   * @returns {string} Texto resultante da operação.
   */
  function formatarData(data) {
    if (!data) return '-';

    return new Date(data).toLocaleDateString('pt-BR');
  }

  /**
   * Cria um novo diagnóstico vazio para a estrutura da ordem.
   * @returns {Object} Objeto resultante da operação.
   */
  function criarDiagnostico() {
    return {
      id: crypto.randomUUID(),
      diagnosticoCatalogoId: '',
      descricao: '',
      observacao: '',
      servicos: [],
    };
  }

  /**
   * Cria um novo serviço vazio para ser encaixado em um diagnóstico.
   * @returns {Object} Objeto resultante da operação.
   */
  function criarServico() {
    return {
      id: crypto.randomUUID(),
      servicoCatalogoId: '',
      codigoServico: '',
      descricao: '',
      responsavel: '',
      tipo: '',
      precoVenda: '',
      desconto: '',
      pecas: [],
    };
  }

  /**
   * Cria uma nova peça vazia para os serviços ou peças avulsas.
   * @returns {Object} Objeto resultante da operação.
   */
  function criarPeca() {
    return {
      id: crypto.randomUUID(),
      pecaCatalogoId: '',
      codigoPeca: '',
      descricao: '',
      fornecedorId: '',
      fornecedorNome: '',
      quantidade: 1,
      custoUnitario: '',
      desconto: '',
    };
  }

  /**
   * Adiciona um novo diagnóstico à estrutura da OS.
   * @returns {void} Não possui retorno.
   */
  function adicionarDiagnostico() {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      diagnosticos: [...prev.diagnosticos, criarDiagnostico()],
    }));
  }

  /**
   * Atualiza um campo do diagnóstico selecionado.
   *
   * @param {string|number} diagnosticoId - Identificador do diagnóstico.
   * @param {string} campo - Nome do campo que será atualizado.
   * @param {*} valor - Novo valor do campo.
   * @returns {void} Não possui retorno.
   */
  function atualizarDiagnostico(diagnosticoId, campo, valor) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      diagnosticos: prev.diagnosticos.map((diagnostico) =>
        diagnostico.id === diagnosticoId
          ? { ...diagnostico, [campo]: valor }
          : diagnostico
      ),
    }));
  }

  /**
   * Aplica um diagnóstico vindo do catálogo à linha selecionada.
   *
   * @param {string|number} diagnosticoId - Identificador do diagnóstico.
   * @param {string|number} diagnosticoCatalogoId - Identificador do diagnóstico no catálogo.
   * @returns {void} Não possui retorno.
   */
  function aplicarDiagnosticoCatalogo(diagnosticoId, diagnosticoCatalogoId) {
    const diagnosticoCatalogo = catalogos.diagnosticos.find(
      (item) => Number(item.id) === Number(diagnosticoCatalogoId)
    );

    if (!diagnosticoCatalogo) {
      atualizarDiagnostico(diagnosticoId, 'diagnosticoCatalogoId', '');
      return;
    }

    atualizarDiagnostico(
      diagnosticoId,
      'diagnosticoCatalogoId',
      diagnosticoCatalogo.id
    );

    atualizarDiagnostico(diagnosticoId, 'descricao', diagnosticoCatalogo.nome);
  }

  /**
   * Remove um diagnóstico da OS.
   *
   * @param {string|number} diagnosticoId - Identificador do diagnóstico.
   * @returns {void} Não possui retorno.
   */
  function removerDiagnostico(diagnosticoId) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      diagnosticos: prev.diagnosticos.filter(
        (diagnostico) => diagnostico.id !== diagnosticoId
      ),
    }));
  }

  /**
   * Adiciona um novo serviço dentro de um diagnóstico.
   *
   * @param {string|number} diagnosticoId - Identificador do diagnóstico.
   * @returns {void} Não possui retorno.
   */
  function adicionarServicoAoDiagnostico(diagnosticoId) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      diagnosticos: prev.diagnosticos.map((diagnostico) =>
        diagnostico.id === diagnosticoId
          ? {
              ...diagnostico,
              servicos: [...diagnostico.servicos, criarServico()],
            }
          : diagnostico
      ),
    }));
  }

  /**
   * Adiciona um serviço que fica fora da hierarquia de diagnóstico.
   * @returns {void} Não possui retorno.
   */
  function adicionarServicoSemDiagnostico() {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      servicosSemDiagnostico: [
        ...prev.servicosSemDiagnostico,
        criarServico(),
      ],
    }));
  }

  /**
   * Atualiza um campo de um serviço vinculado a diagnóstico.
   *
   * @param {string|number} diagnosticoId - Identificador do diagnóstico.
   * @param {string|number} servicoId - Identificador do serviço.
   * @param {string} campo - Nome do campo que será atualizado.
   * @param {*} valor - Novo valor do campo.
   * @returns {void} Não possui retorno.
   */
  function atualizarServicoDiagnostico(
    diagnosticoId,
    servicoId,
    campo,
    valor
  ) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      diagnosticos: prev.diagnosticos.map((diagnostico) =>
        diagnostico.id === diagnosticoId
          ? {
              ...diagnostico,
              servicos: diagnostico.servicos.map((servico) =>
                servico.id === servicoId
                  ? { ...servico, [campo]: valor }
                  : servico
              ),
            }
          : diagnostico
      ),
    }));
  }

  /**
   * Atualiza um campo de um serviço sem diagnóstico.
   *
   * @param {string|number} servicoId - Identificador do serviço.
   * @param {string} campo - Nome do campo que será atualizado.
   * @param {*} valor - Novo valor do campo.
   * @returns {void} Não possui retorno.
   */
  function atualizarServicoSemDiagnostico(servicoId, campo, valor) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      servicosSemDiagnostico: prev.servicosSemDiagnostico.map((servico) =>
        servico.id === servicoId ? { ...servico, [campo]: valor } : servico
      ),
    }));
  }

  /**
   * Aplica um item do catálogo ao serviço de dentro de um diagnóstico.
   *
   * @param {string|number} diagnosticoId - Identificador do diagnóstico.
   * @param {string|number} servicoId - Identificador do serviço.
   * @param {string|number} servicoCatalogoId - Identificador do serviço no catálogo.
   * @returns {void} Não possui retorno.
   */
  function aplicarServicoCatalogo(diagnosticoId, servicoId, servicoCatalogoId) {
    const servicoCatalogo = catalogos.servicos.find(
      (item) => Number(item.id) === Number(servicoCatalogoId)
    );

    if (!servicoCatalogo) {
      atualizarServicoDiagnostico(
        diagnosticoId,
        servicoId,
        'servicoCatalogoId',
        ''
      );
      return;
    }

    atualizarServicoDiagnostico(
      diagnosticoId,
      servicoId,
      'servicoCatalogoId',
      servicoCatalogo.id
    );

    atualizarServicoDiagnostico(
      diagnosticoId,
      servicoId,
      'codigoServico',
      servicoCatalogo.codigo || ''
    );

    atualizarServicoDiagnostico(
      diagnosticoId,
      servicoId,
      'descricao',
      servicoCatalogo.nome || ''
    );

    atualizarServicoDiagnostico(
      diagnosticoId,
      servicoId,
      'tipo',
      servicoCatalogo.categoria || ''
    );

    atualizarServicoDiagnostico(
      diagnosticoId,
      servicoId,
      'precoVenda',
      servicoCatalogo.valorPadrao || ''
    );
  }

  /**
   * Aplica um item do catálogo ao serviço que não pertence a diagnóstico.
   *
   * @param {string|number} servicoId - Identificador do serviço.
   * @param {string|number} servicoCatalogoId - Identificador do serviço no catálogo.
   * @returns {void} Não possui retorno.
   */
  function aplicarServicoCatalogoSemDiagnostico(
    servicoId,
    servicoCatalogoId
  ) {
    const servicoCatalogo = catalogos.servicos.find(
      (item) => Number(item.id) === Number(servicoCatalogoId)
    );

    if (!servicoCatalogo) {
      atualizarServicoSemDiagnostico(servicoId, 'servicoCatalogoId', '');
      return;
    }

    atualizarServicoSemDiagnostico(
      servicoId,
      'servicoCatalogoId',
      servicoCatalogo.id
    );

    atualizarServicoSemDiagnostico(
      servicoId,
      'codigoServico',
      servicoCatalogo.codigo || ''
    );

    atualizarServicoSemDiagnostico(
      servicoId,
      'descricao',
      servicoCatalogo.nome || ''
    );

    atualizarServicoSemDiagnostico(
      servicoId,
      'tipo',
      servicoCatalogo.categoria || ''
    );

    atualizarServicoSemDiagnostico(
      servicoId,
      'precoVenda',
      servicoCatalogo.valorPadrao || ''
    );
  }

  /**
   * Remove um serviço da árvore de um diagnóstico.
   *
   * @param {string|number} diagnosticoId - Identificador do diagnóstico.
   * @param {string|number} servicoId - Identificador do serviço.
   * @returns {void} Não possui retorno.
   */
  function removerServicoDiagnostico(diagnosticoId, servicoId) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      diagnosticos: prev.diagnosticos.map((diagnostico) =>
        diagnostico.id === diagnosticoId
          ? {
              ...diagnostico,
              servicos: diagnostico.servicos.filter(
                (servico) => servico.id !== servicoId
              ),
            }
          : diagnostico
      ),
    }));
  }

  /**
   * Remove um serviço que não está ligado a diagnóstico.
   *
   * @param {string|number} servicoId - Identificador do serviço.
   * @returns {void} Não possui retorno.
   */
  function removerServicoSemDiagnostico(servicoId) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      servicosSemDiagnostico: prev.servicosSemDiagnostico.filter(
        (servico) => servico.id !== servicoId
      ),
    }));
  }

  /**
   * Adiciona uma nova peça dentro de um serviço de diagnóstico.
   *
   * @param {string|number} diagnosticoId - Identificador do diagnóstico.
   * @param {string|number} servicoId - Identificador do serviço.
   * @returns {void} Não possui retorno.
   */
  function adicionarPecaDiagnostico(diagnosticoId, servicoId) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      diagnosticos: prev.diagnosticos.map((diagnostico) =>
        diagnostico.id === diagnosticoId
          ? {
              ...diagnostico,
              servicos: diagnostico.servicos.map((servico) =>
                servico.id === servicoId
                  ? {
                      ...servico,
                      pecas: [...servico.pecas, criarPeca()],
                    }
                  : servico
              ),
            }
          : diagnostico
      ),
    }));
  }

  /**
   * Adiciona uma peça em um serviço fora de diagnóstico.
   *
   * @param {string|number} servicoId - Identificador do serviço.
   * @returns {void} Não possui retorno.
   */
  function adicionarPecaSemDiagnostico(servicoId) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      servicosSemDiagnostico: prev.servicosSemDiagnostico.map((servico) =>
        servico.id === servicoId
          ? {
              ...servico,
              pecas: [...servico.pecas, criarPeca()],
            }
          : servico
      ),
    }));
  }

  /**
   * Adiciona uma peça avulsa, sem vínculo com serviço.
   * @returns {void} Não possui retorno.
   */
  function adicionarPecaAvulsa() {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      pecasAvulsas: [...prev.pecasAvulsas, criarPeca()],
    }));
  }

  /**
   * Atualiza um campo de uma peça dentro do diagnóstico.
   *
   * @param {string|number} diagnosticoId - Identificador do diagnóstico.
   * @param {string|number} servicoId - Identificador do serviço.
   * @param {string|number} pecaId - Identificador da peça.
   * @param {string} campo - Nome do campo que será atualizado.
   * @param {*} valor - Novo valor do campo.
   * @returns {void} Não possui retorno.
   */
  function atualizarPecaDiagnostico(
    diagnosticoId,
    servicoId,
    pecaId,
    campo,
    valor
  ) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      diagnosticos: prev.diagnosticos.map((diagnostico) =>
        diagnostico.id === diagnosticoId
          ? {
              ...diagnostico,
              servicos: diagnostico.servicos.map((servico) =>
                servico.id === servicoId
                  ? {
                      ...servico,
                      pecas: servico.pecas.map((peca) =>
                        peca.id === pecaId ? { ...peca, [campo]: valor } : peca
                      ),
                    }
                  : servico
              ),
            }
          : diagnostico
      ),
    }));
  }

  /**
   * Atualiza um campo de uma peça fora do diagnóstico.
   *
   * @param {string|number} servicoId - Identificador do serviço.
   * @param {string|number} pecaId - Identificador da peça.
   * @param {string} campo - Nome do campo que será atualizado.
   * @param {*} valor - Novo valor do campo.
   * @returns {void} Não possui retorno.
   */
  function atualizarPecaSemDiagnostico(servicoId, pecaId, campo, valor) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      servicosSemDiagnostico: prev.servicosSemDiagnostico.map((servico) =>
        servico.id === servicoId
          ? {
              ...servico,
              pecas: servico.pecas.map((peca) =>
                peca.id === pecaId ? { ...peca, [campo]: valor } : peca
              ),
            }
          : servico
      ),
    }));
  }

  /**
   * Atualiza um campo de uma peça avulsa.
   *
   * @param {string|number} pecaId - Identificador da peça.
   * @param {string} campo - Nome do campo que será atualizado.
   * @param {*} valor - Novo valor do campo.
   * @returns {void} Não possui retorno.
   */
  function atualizarPecaAvulsa(pecaId, campo, valor) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      pecasAvulsas: prev.pecasAvulsas.map((peca) =>
        peca.id === pecaId ? { ...peca, [campo]: valor } : peca
      ),
    }));
  }

  /**
   * Vincula um item do catálogo de peças a uma peça de diagnóstico.
   *
   * @param {string|number} diagnosticoId - Identificador do diagnóstico.
   * @param {string|number} servicoId - Identificador do serviço.
   * @param {string|number} pecaId - Identificador da peça.
   * @param {string|number} pecaCatalogoId - Identificador da peça no catálogo.
   * @returns {void} Não possui retorno.
   */
  function aplicarPecaCatalogo(
    diagnosticoId,
    servicoId,
    pecaId,
    pecaCatalogoId
  ) {
    const pecaCatalogo = catalogos.pecas.find(
      (item) => Number(item.id) === Number(pecaCatalogoId)
    );

    if (!pecaCatalogo) {
      atualizarPecaDiagnostico(
        diagnosticoId,
        servicoId,
        pecaId,
        'pecaCatalogoId',
        ''
      );
      return;
    }

    atualizarPecaDiagnostico(
      diagnosticoId,
      servicoId,
      pecaId,
      'pecaCatalogoId',
      pecaCatalogo.id
    );

    atualizarPecaDiagnostico(
      diagnosticoId,
      servicoId,
      pecaId,
      'codigoPeca',
      pecaCatalogo.codigo || ''
    );

    atualizarPecaDiagnostico(
      diagnosticoId,
      servicoId,
      pecaId,
      'descricao',
      pecaCatalogo.nome || ''
    );
  }

  /**
   * Vincula um item do catálogo de peças a uma peça sem diagnóstico.
   *
   * @param {string|number} servicoId - Identificador do serviço.
   * @param {string|number} pecaId - Identificador da peça.
   * @param {string|number} pecaCatalogoId - Identificador da peça no catálogo.
   * @returns {void} Não possui retorno.
   */
  function aplicarPecaCatalogoSemDiagnostico(
    servicoId,
    pecaId,
    pecaCatalogoId
  ) {
    const pecaCatalogo = catalogos.pecas.find(
      (item) => Number(item.id) === Number(pecaCatalogoId)
    );

    if (!pecaCatalogo) {
      atualizarPecaSemDiagnostico(servicoId, pecaId, 'pecaCatalogoId', '');
      return;
    }

    atualizarPecaSemDiagnostico(
      servicoId,
      pecaId,
      'pecaCatalogoId',
      pecaCatalogo.id
    );

    atualizarPecaSemDiagnostico(
      servicoId,
      pecaId,
      'codigoPeca',
      pecaCatalogo.codigo || ''
    );

    atualizarPecaSemDiagnostico(
      servicoId,
      pecaId,
      'descricao',
      pecaCatalogo.nome || ''
    );
  }

  /**
   * Vincula um item do catálogo de peças a uma peça avulsa.
   *
   * @param {string|number} pecaId - Identificador da peça.
   * @param {string|number} pecaCatalogoId - Identificador da peça no catálogo.
   * @returns {void} Não possui retorno.
   */
  function aplicarPecaCatalogoAvulsa(pecaId, pecaCatalogoId) {
    const pecaCatalogo = catalogos.pecas.find(
      (item) => Number(item.id) === Number(pecaCatalogoId)
    );

    if (!pecaCatalogo) {
      atualizarPecaAvulsa(pecaId, 'pecaCatalogoId', '');
      return;
    }

    atualizarPecaAvulsa(pecaId, 'pecaCatalogoId', pecaCatalogo.id);
    atualizarPecaAvulsa(pecaId, 'codigoPeca', pecaCatalogo.codigo || '');
    atualizarPecaAvulsa(pecaId, 'descricao', pecaCatalogo.nome || '');
  }

  /**
   * Define o fornecedor de uma peça dentro do diagnóstico.
   *
   * @param {string|number} diagnosticoId - Identificador do diagnóstico.
   * @param {string|number} servicoId - Identificador do serviço.
   * @param {string|number} pecaId - Identificador da peça.
   * @param {string|number} fornecedorId - Identificador do fornecedor.
   * @returns {void} Não possui retorno.
   */
  function aplicarFornecedorPecaDiagnostico(
    diagnosticoId,
    servicoId,
    pecaId,
    fornecedorId
  ) {
    const fornecedor = catalogos.fornecedores.find(
      (item) => Number(item.id) === Number(fornecedorId)
    );

    atualizarPecaDiagnostico(
      diagnosticoId,
      servicoId,
      pecaId,
      'fornecedorId',
      fornecedorId
    );

    atualizarPecaDiagnostico(
      diagnosticoId,
      servicoId,
      pecaId,
      'fornecedorNome',
      fornecedor?.nome || ''
    );
  }

  /**
   * Define o fornecedor de uma peça fora do diagnóstico.
   *
   * @param {string|number} servicoId - Identificador do serviço.
   * @param {string|number} pecaId - Identificador da peça.
   * @param {string|number} fornecedorId - Identificador do fornecedor.
   * @returns {void} Não possui retorno.
   */
  function aplicarFornecedorPecaSemDiagnostico(servicoId, pecaId, fornecedorId) {
    const fornecedor = catalogos.fornecedores.find(
      (item) => Number(item.id) === Number(fornecedorId)
    );

    atualizarPecaSemDiagnostico(
      servicoId,
      pecaId,
      'fornecedorId',
      fornecedorId
    );

    atualizarPecaSemDiagnostico(
      servicoId,
      pecaId,
      'fornecedorNome',
      fornecedor?.nome || ''
    );
  }

  /**
   * Define o fornecedor de uma peça avulsa.
   *
   * @param {string|number} pecaId - Identificador da peça.
   * @param {string|number} fornecedorId - Identificador do fornecedor.
   * @returns {void} Não possui retorno.
   */
  function aplicarFornecedorPecaAvulsa(pecaId, fornecedorId) {
    const fornecedor = catalogos.fornecedores.find(
      (item) => Number(item.id) === Number(fornecedorId)
    );

    atualizarPecaAvulsa(pecaId, 'fornecedorId', fornecedorId);
    atualizarPecaAvulsa(pecaId, 'fornecedorNome', fornecedor?.nome || '');
  }

  /**
   * Remove uma peça vinculada a diagnóstico.
   *
   * @param {string|number} diagnosticoId - Identificador do diagnóstico.
   * @param {string|number} servicoId - Identificador do serviço.
   * @param {string|number} pecaId - Identificador da peça.
   * @returns {void} Não possui retorno.
   */
  function removerPecaDiagnostico(diagnosticoId, servicoId, pecaId) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      diagnosticos: prev.diagnosticos.map((diagnostico) =>
        diagnostico.id === diagnosticoId
          ? {
              ...diagnostico,
              servicos: diagnostico.servicos.map((servico) =>
                servico.id === servicoId
                  ? {
                      ...servico,
                      pecas: servico.pecas.filter((peca) => peca.id !== pecaId),
                    }
                  : servico
              ),
            }
          : diagnostico
      ),
    }));
  }

  /**
   * Remove uma peça de um serviço sem diagnóstico.
   *
   * @param {string|number} servicoId - Identificador do serviço.
   * @param {string|number} pecaId - Identificador da peça.
   * @returns {void} Não possui retorno.
   */
  function removerPecaSemDiagnostico(servicoId, pecaId) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      servicosSemDiagnostico: prev.servicosSemDiagnostico.map((servico) =>
        servico.id === servicoId
          ? {
              ...servico,
              pecas: servico.pecas.filter((peca) => peca.id !== pecaId),
            }
          : servico
      ),
    }));
  }

  /**
   * Remove uma peça avulsa.
   *
   * @param {string|number} pecaId - Identificador da peça.
   * @returns {void} Não possui retorno.
   */
  function removerPecaAvulsa(pecaId) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      pecasAvulsas: prev.pecasAvulsas.filter((peca) => peca.id !== pecaId),
    }));
  }

  /**
   * Abre o modal genérico para escolher diagnóstico, serviço ou peça do catálogo.
   *
   * @param {Object} configuracao - Configuração do modal de catálogo.
   * @param {string} configuracao.tipo - Tipo de item que será selecionado.
   * @param {string|number|null} configuracao.diagnosticoId - Identificador do diagnóstico relacionado.
   * @param {string|number|null} configuracao.servicoId - Identificador do serviço relacionado.
   * @param {string|number|null} configuracao.pecaId - Identificador da peça relacionada.
   * @param {string} configuracao.origem - Origem da solicitação de seleção.
   * @returns {void} Não possui retorno.
   */
  function abrirModalCatalogo({
    tipo,
    diagnosticoId = null,
    servicoId = null,
    pecaId = null,
    origem = '',
  }) {
    if (!podeEditar) return;

    setBuscaCatalogo('');

    setModalCatalogo({
      aberto: true,
      tipo,
      diagnosticoId,
      servicoId,
      pecaId,
      origem,
    });
  }

  /**
   * Fecha o modal de catálogo e limpa a busca interna.
   * @returns {void} Não possui retorno.
   */
  function fecharModalCatalogo() {
    setBuscaCatalogo('');

    setModalCatalogo({
      aberto: false,
      tipo: '',
      diagnosticoId: null,
      servicoId: null,
      pecaId: null,
      origem: '',
    });
  }

  /**
   * Retorna a lista base conforme o tipo de cadastro selecionado.
   * @returns {Object[]} Lista resultante da operação.
   */
  function obterItensBaseModalCatalogo() {
    if (modalCatalogo.tipo === 'diagnostico') return catalogos.diagnosticos;
    if (modalCatalogo.tipo === 'servico') return catalogos.servicos;
    if (modalCatalogo.tipo === 'peca') return catalogos.pecas;

    return [];
  }

  /**
   * Filtra os itens do catálogo pelo texto digitado no modal.
   * @returns {Object[]} Lista resultante da operação.
   */
  function obterItensModalCatalogo() {
    const itens = obterItensBaseModalCatalogo();
    const termo = buscaCatalogo.trim().toLowerCase();

    if (!termo) return itens;

    return itens.filter((item) => {
      const codigo = String(item.codigo || '').toLowerCase();
      const nome = String(item.nome || '').toLowerCase();
      const descricao = String(item.descricao || '').toLowerCase();
      const categoria = String(item.categoria || '').toLowerCase();
      const marca = String(item.marca || '').toLowerCase();
      const aplicacao = String(item.aplicacao || '').toLowerCase();
      const grupo = String(item.grupo || '').toLowerCase();

      return (
        codigo.includes(termo) ||
        nome.includes(termo) ||
        descricao.includes(termo) ||
        categoria.includes(termo) ||
        marca.includes(termo) ||
        aplicacao.includes(termo) ||
        grupo.includes(termo)
      );
    });
  }

  /**
   * Identifica o grupo de uma peça para organizar a tabela.
   *
   * @param {Object} peca - Peça utilizada na operação.
   * @returns {string} Texto resultante da operação.
   */
  function obterGrupoPeca(peca) {
    return peca.grupo?.trim() || 'Sem grupo';
  }

  /**
   * Agrupa as peças por grupo para exibição em blocos.
   *
   * @param {Object[]} pecas - Lista de peças que será processada.
   * @returns {Object} Objeto resultante da operação.
   */
  function agruparPecasPorGrupo(pecas) {
    return pecas.reduce((grupos, peca) => {
      const grupo = obterGrupoPeca(peca);

      if (!grupos[grupo]) {
        grupos[grupo] = [];
      }

      grupos[grupo].push(peca);

      return grupos;
    }, {});
  }

  /**
   * Define o título do modal de acordo com o tipo de cadastro.
   * @returns {string} Texto resultante da operação.
   */
  function obterTituloModalCatalogo() {
    if (modalCatalogo.tipo === 'diagnostico') return 'Selecionar diagnóstico';
    if (modalCatalogo.tipo === 'servico') return 'Selecionar serviço';
    if (modalCatalogo.tipo === 'peca') return 'Selecionar peça';

    return 'Selecionar cadastro';
  }

  /**
   * Define a mensagem de vazio do modal de catálogo.
   * @returns {string} Texto resultante da operação.
   */
  function obterTextoVazioModalCatalogo() {
    if (modalCatalogo.tipo === 'diagnostico') {
      return 'Nenhum diagnóstico encontrado.';
    }

    if (modalCatalogo.tipo === 'servico') {
      return 'Nenhum serviço encontrado.';
    }

    if (modalCatalogo.tipo === 'peca') {
      return 'Nenhuma peça encontrada.';
    }

    return 'Nenhum cadastro encontrado.';
  }

  /**
   * Escolhe a rota para abrir o cadastro em uma nova aba.
   * @returns {string} Texto resultante da operação.
   */
  function obterRotaCadastroCatalogo() {
    if (modalCatalogo.tipo === 'diagnostico') {
      return '/diagnosticos/cadastro';
    }

    if (modalCatalogo.tipo === 'servico') {
      return '/servicos/cadastro';
    }

    if (modalCatalogo.tipo === 'peca') {
      return '/pecas/cadastro';
    }

    return '/';
  }

  /**
   * Define o texto do botão de cadastro conforme o tipo selecionado.
   * @returns {string} Texto resultante da operação.
   */
  function obterTextoBotaoCadastroCatalogo() {
    if (modalCatalogo.tipo === 'diagnostico') {
      return '+ Cadastrar novo diagnóstico';
    }

    if (modalCatalogo.tipo === 'servico') {
      return '+ Cadastrar novo serviço';
    }

    if (modalCatalogo.tipo === 'peca') {
      return '+ Cadastrar nova peça';
    }

    return '+ Cadastrar novo';
  }

  /**
   * Abre a tela de cadastro do catálogo em uma nova aba do navegador.
   * @returns {void} Não possui retorno.
   */
  function abrirCadastroCatalogoNovaAba() {
    const rota = obterRotaCadastroCatalogo();

    window.open(rota, '_blank', 'noopener,noreferrer');
  }

  /**
   * Recarrega catálogos e sinaliza sucesso no feedback.
   *
   * @async
   * @returns {Promise<void>} Promessa concluída após a operação.
   */
  async function atualizarListaCatalogoModal() {
    await carregarCatalogos();
    toast.success('Lista atualizada.');
  }

  /**
   * Aplica o item selecionado no modal ao ponto da OS correspondente.
   *
   * @param {Object} item - Item selecionado no catálogo.
   * @returns {void} Não possui retorno.
   */
  function selecionarItemCatalogo(item) {
    if (modalCatalogo.tipo === 'diagnostico') {
      aplicarDiagnosticoCatalogo(modalCatalogo.diagnosticoId, item.id);
      fecharModalCatalogo();
      return;
    }

    if (modalCatalogo.tipo === 'servico') {
      if (modalCatalogo.origem === 'diagnostico') {
        aplicarServicoCatalogo(
          modalCatalogo.diagnosticoId,
          modalCatalogo.servicoId,
          item.id
        );
      } else {
        aplicarServicoCatalogoSemDiagnostico(modalCatalogo.servicoId, item.id);
      }

      fecharModalCatalogo();
      return;
    }

    if (modalCatalogo.tipo === 'peca') {
      if (modalCatalogo.origem === 'diagnostico') {
        aplicarPecaCatalogo(
          modalCatalogo.diagnosticoId,
          modalCatalogo.servicoId,
          modalCatalogo.pecaId,
          item.id
        );
      } else if (modalCatalogo.origem === 'servico-sem-diagnostico') {
        aplicarPecaCatalogoSemDiagnostico(
          modalCatalogo.servicoId,
          modalCatalogo.pecaId,
          item.id
        );
      } else {
        aplicarPecaCatalogoAvulsa(modalCatalogo.pecaId, item.id);
      }

      fecharModalCatalogo();
    }
  }

  /**
   * Gera uma linha resumida do catálogo com detalhes contextuais.
   *
   * @param {Object} item - Item selecionado no catálogo.
   * @returns {string} Texto resultante da operação.
   */
  function obterDetalheCatalogo(item) {
    if (modalCatalogo.tipo === 'diagnostico') {
      return item.descricao || '-';
    }

    if (modalCatalogo.tipo === 'servico') {
      const valor = item.valorPadrao
        ? Number(item.valorPadrao).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })
        : null;

      return [item.categoria, valor].filter(Boolean).join(' | ') || '-';
    }

    if (modalCatalogo.tipo === 'peca') {
      const detalhe = [item.grupo, item.marca, item.aplicacao]
        .filter(Boolean)
        .join(' | ');

      return detalhe || '-';
    }

    return '-';
  }

  /**
   * Renderiza a tabela reutilizável para os modais de seleção.
   *
   * @param {Object[]} itens - Itens que serão processados ou exibidos.
   * @returns {JSX.Element} Elemento JSX renderizado.
   */
  function renderTabelaCatalogo(itens) {
    return (
      <div className="os-catalog-table-wrap">
        <table className="os-catalog-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Detalhes</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {itens.map((item) => (
              <tr key={item.id}>
                <td>{item.codigo || '-'}</td>
                <td>{item.nome || '-'}</td>
                <td>{obterDetalheCatalogo(item)}</td>

                <td>
                  <button
                    type="button"
                    className="os-small-btn os-blue"
                    onClick={() => selecionarItemCatalogo(item)}
                  >
                    Selecionar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /**
   * Renderiza o conteúdo do modal de catálogo conforme o tipo pesquisado.
   * @returns {JSX.Element} Elemento JSX renderizado.
   */
  function renderConteudoModalCatalogo() {
    const itens = obterItensModalCatalogo();

    if (itens.length === 0) {
      return (
        <div className="os-catalog-empty">
          <p>{obterTextoVazioModalCatalogo()}</p>

          <button
            type="button"
            className="os-small-btn os-blue"
            onClick={abrirCadastroCatalogoNovaAba}
          >
            {obterTextoBotaoCadastroCatalogo()}
          </button>
        </div>
      );
    }

    if (modalCatalogo.tipo !== 'peca') {
      return renderTabelaCatalogo(itens);
    }

    const grupos = agruparPecasPorGrupo(itens);

    return (
      <div className="os-catalog-groups">
        {Object.entries(grupos)
          .sort(([grupoA], [grupoB]) => grupoA.localeCompare(grupoB))
          .map(([grupo, pecas]) => (
            <section className="os-catalog-group" key={grupo}>
              <div className="os-catalog-group-title">
                <strong>{grupo}</strong>
                <span>{pecas.length} peça(s)</span>
              </div>

              {renderTabelaCatalogo(pecas)}
            </section>
          ))}
      </div>
    );
  }

  /**
   * Abre a busca de ordens de servico antigas.
   * @returns {void} Não possui retorno.
   */
  function abrirModalBuscarOS() {
    setModalBuscarOSAberto(true);
    buscarOrdensAntigas();
  }

  /**
   * Fecha a modal de busca de OS antigas.
   * @returns {void} Não possui retorno.
   */
  function fecharModalBuscarOS() {
    setModalBuscarOSAberto(false);
  }

  /**
   * Atualiza um filtro da busca de ordens antigas.
   *
   * @param {string} campo - Nome do campo que será atualizado.
   * @param {*} valor - Novo valor do campo.
   * @returns {void} Não possui retorno.
   */
  function atualizarFiltroBuscaOS(campo, valor) {
    setFiltrosBuscaOS((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  /**
   * Consulta ordens antigas usando os filtros informados.
   *
   * @async
   * @returns {Promise<void>} Promessa concluída após a operação.
   */
  async function buscarOrdensAntigas() {
    try {
      setBuscandoOrdens(true);

      const params = {};

      if (filtrosBuscaOS.termo) params.termo = filtrosBuscaOS.termo;
      if (filtrosBuscaOS.status) params.status = filtrosBuscaOS.status;
      if (filtrosBuscaOS.dataInicio) {
        params.dataInicio = filtrosBuscaOS.dataInicio;
      }
      if (filtrosBuscaOS.dataFim) {
        params.dataFim = filtrosBuscaOS.dataFim;
      }

      const response = await api.get('/ordens-servico/buscar', { params });

      setOrdensEncontradas(response.data || []);

      if (!response.data || response.data.length === 0) {
        toast.info('Nenhuma ordem de serviço encontrada.');
      }
    } catch (error) {
      console.error('Erro ao buscar OS antigas:', error);

      toast.error(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao buscar ordens de serviço.'
      );
    } finally {
      setBuscandoOrdens(false);
    }
  }

  /**
   * Limpa os filtros e o resultado da busca de OS.
   * @returns {void} Não possui retorno.
   */
  function limparFiltrosBuscaOS() {
    setFiltrosBuscaOS(filtrosBuscaOSInicial);
    setOrdensEncontradas([]);
  }

  /**
   * Abre uma ordem já existente para visualizacao ou edicao.
   *
   * @async
   *
   * @param {string|number} ordemId - Identificador da ordem de serviço.
   * @returns {Promise<void>} Promessa concluída após a operação.
   */
  async function abrirOrdemExistente(ordemId) {
    try {
      setCarregandoOrdem(true);

      const response = await api.get(`/ordens-servico/${ordemId}`);

      carregarOrdemNaTela(response.data);

      setModoTela('visualizacao');
      setModalBuscarOSAberto(false);
      localStorage.removeItem(OS_RASCUNHO_KEY);

      toast.success('Ordem de serviço carregada.');
    } catch (error) {
      console.error('Erro ao abrir OS:', error);

      toast.error(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao abrir ordem de serviço.'
      );
    } finally {
      setCarregandoOrdem(false);
    }
  }

  /**
   * Reconstrói o estado da tela a partir de uma OS carregada da API.
   *
   * @param {Object} os - Ordem de serviço retornada pela API.
   * @returns {void} Não possui retorno.
   */
  function carregarOrdemNaTela(os) {
    const veiculo = os.veiculo || {};
    const cliente = veiculo.cliente || os.cliente || {};

    const diagnosticos = (os.diagnosticos || []).map((diagnostico) => ({
      id: diagnostico.id,
      diagnosticoCatalogoId: diagnostico.diagnosticoCatalogoId || '',
      descricao: diagnostico.nomeDiagnostico || diagnostico.descricao || '',
      observacao: diagnostico.observacoes || '',
      servicos: (diagnostico.servicos || []).map((servico) =>
        mapearServicoParaTela(servico)
      ),
    }));

    const servicosSemDiagnostico = (os.servicos || [])
      .filter((servico) => !servico.ordemDiagnosticoId)
      .map((servico) => mapearServicoParaTela(servico));

    const pecasAvulsas = (os.pecas || [])
      .filter((peca) => !peca.ordemDiagnosticoId && !peca.ordemServicoItemId)
      .map((peca) => mapearPecaParaTela(peca));

    setOrdem({
      id: os.id || null,
      codigo: os.codigo || '',
      status: os.status || 'ABERTA',
      cliente: mapearClienteParaTela(cliente),
      veiculo: {
        id: veiculo.id || os.veiculoId || '',
        placa: veiculo.placa || '',
        marca: veiculo.fabricante || '',
        modelo: veiculo.modelo || '',
        ano: montarAnoVeiculo(veiculo),
        motor: veiculo.motor || '',
        cambio: veiculo.cambio || veiculo.Cambio || '',
        cor: veiculo.cor || '',
        km: veiculo.km || '',
        chassi: veiculo.chassi || '',
        possuiAr: Boolean(veiculo.ar),
      },
      observacoes: os.observacoes || '',
      diagnosticos,
      servicosSemDiagnostico,
      pecasAvulsas,
    });

    setBusca(
      `${cliente.nome || ''}${veiculo.placa ? ` - ${veiculo.placa}` : ''}`
    );
  }

  /**
   * Converte um serviço da API para o formato usado pela tela.
   *
   * @param {Object} servico - Serviço utilizado na operação.
   * @returns {Object} Objeto resultante da operação.
   */
  function mapearServicoParaTela(servico) {
    return {
      id: servico.id,
      servicoCatalogoId: servico.servicoCatalogoId || '',
      codigoServico: servico.codigoVisual || '',
      descricao: servico.nomeServico || servico.descricao || '',
      responsavel: servico.responsavel || '',
      tipo: servico.tipo || '',
      precoVenda: servico.precoVenda || '',
      desconto: servico.desconto || '',
      pecas: (servico.pecas || []).map((peca) => mapearPecaParaTela(peca)),
    };
  }

  /**
   * Converte uma peça da API para o formato usado pela tela.
   *
   * @param {Object} peca - Peça utilizada na operação.
   * @returns {Object} Objeto resultante da operação.
   */
  function mapearPecaParaTela(peca) {
    return {
      id: peca.id,
      pecaCatalogoId: peca.pecaCatalogoId || '',
      codigoPeca: peca.codigoPeca || '',
      descricao: peca.nomePeca || '',
      fornecedorId: peca.fornecedorId || '',
      fornecedorNome: peca.fornecedorNome || '',
      quantidade: peca.quantidade || 1,
      custoUnitario: peca.custoUnitario || '',
      desconto: peca.desconto || '',
    };
  }

  /**
   * Inicia uma nova OS, descartando o rascunho atual com confirmação.
   * @returns {void} Não possui retorno.
   */
  function novaOrdemServico() {
    toast.warning(
      ({ closeToast }) => (
        <div className="os-toast-draft">
          <strong>Iniciar nova OS?</strong>

          <span>O rascunho atual será apagado. Deseja continuar?</span>

          <div className="os-toast-actions">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(OS_RASCUNHO_KEY);

                setModoTela('nova');
                setOrdem(ordemInicial);
                setBusca('');
                setResultadosBusca([]);
                setClienteNaoEncontrado(false);
                setFornecedoresCotacao([]);
                carregarProximoCodigo();

                toast.success('Nova ordem de serviço iniciada.');
                closeToast();
              }}
            >
              Sim, iniciar
            </button>

            <button type="button" className="secondary" onClick={closeToast}>
              Cancelar
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  }

  /**
   * Muda a tela atual para o modo de edicao da OS carregada.
   * @returns {void} Não possui retorno.
   */
  function editarOrdemAtual() {
    setModoTela('edicao');
  }

  /**
   * Calcula os totais de servicos e peças usados no rodape da OS.
   *
   * @type {Object}
   */
  const totais = useMemo(() => {
    const todosServicos = [
      ...ordem.servicosSemDiagnostico,
      ...ordem.diagnosticos.flatMap((diagnostico) => diagnostico.servicos),
    ];

    const totalServicos = todosServicos.reduce((acc, servico) => {
      const preco = Number(servico.precoVenda || 0);
      const desconto = Number(servico.desconto || 0);

      return acc + Math.max(preco - desconto, 0);
    }, 0);

    const totalPecasDosServicos = todosServicos.reduce((acc, servico) => {
      const totalServicoPecas = servico.pecas.reduce((soma, peca) => {
        const quantidade = Number(peca.quantidade || 0);
        const custoUnitario = Number(peca.custoUnitario || 0);
        const desconto = Number(peca.desconto || 0);

        return soma + Math.max(quantidade * custoUnitario - desconto, 0);
      }, 0);

      return acc + totalServicoPecas;
    }, 0);

    const totalPecasAvulsas = ordem.pecasAvulsas.reduce((acc, peca) => {
      const quantidade = Number(peca.quantidade || 0);
      const custoUnitario = Number(peca.custoUnitario || 0);
      const desconto = Number(peca.desconto || 0);

      return acc + Math.max(quantidade * custoUnitario - desconto, 0);
    }, 0);

    const totalPecas = totalPecasDosServicos + totalPecasAvulsas;

    return {
      totalServicos,
      totalPecas,
      totalGeral: totalServicos + totalPecas,
    };
  }, [ordem]);

  /**
   * Prepara a lista de peças para montar a cotação por WhatsApp.
   *
   * @type {Object[]}
   */
  const pecasParaCotacao = useMemo(() => {
    const pecasComDiagnostico = ordem.diagnosticos.flatMap(
      (diagnostico, diagnosticoIndex) => {
        const codigoDiagnostico = letraDiagnostico(diagnosticoIndex);

        return diagnostico.servicos.flatMap((servico, servicoIndex) => {
          const codigoServico = `${codigoDiagnostico}.${servicoIndex + 1}`;

          return servico.pecas.map((peca, pecaIndex) => ({
            ...peca,
            codigoDiagnostico,
            codigoServico,
            codigoPeca: `${codigoServico}.${pecaIndex + 1}`,
            diagnostico: diagnostico.descricao,
            servico: servico.descricao,
          }));
        });
      }
    );

    const pecasSemDiagnostico = ordem.servicosSemDiagnostico.flatMap(
      (servico, servicoIndex) =>
        servico.pecas.map((peca, pecaIndex) => ({
          ...peca,
          codigoDiagnostico: null,
          codigoServico: `S.${servicoIndex + 1}`,
          codigoPeca: `S.${servicoIndex + 1}.${pecaIndex + 1}`,
          diagnostico: null,
          servico: servico.descricao,
        }))
    );

    const pecasAvulsas = ordem.pecasAvulsas.map((peca, pecaIndex) => ({
      ...peca,
      codigoDiagnostico: null,
      codigoServico: null,
      codigoPeca: `P.${pecaIndex + 1}`,
      diagnostico: null,
      servico: null,
    }));

    return [...pecasComDiagnostico, ...pecasSemDiagnostico, ...pecasAvulsas];
  }, [ordem]);

  /**
   * Monta o payload final da ordem para criação ou atualização.
   * @returns {Object} Objeto resultante da operação.
   */
  function montarPayloadOrdemServico() {
    return {
      codigo: ordem.codigo,
      status: ordem.status || 'ABERTA',
      veiculoId: Number(ordem.veiculo.id),
      operadorId: 1,
      tecnicoId: 1,
      observacoes: ordem.observacoes || null,

      diagnosticos: ordem.diagnosticos.map((diagnostico) => ({
        diagnosticoCatalogoId: diagnostico.diagnosticoCatalogoId
          ? Number(diagnostico.diagnosticoCatalogoId)
          : null,
        descricao: diagnostico.descricao || null,
        observacoes: diagnostico.observacao || null,

        servicos: diagnostico.servicos.map((servico) => ({
          servicoCatalogoId: servico.servicoCatalogoId
            ? Number(servico.servicoCatalogoId)
            : null,
          descricao: servico.descricao || null,
          responsavel: servico.responsavel || null,
          tipo: servico.tipo || null,
          precoVenda: Number(servico.precoVenda || 0),
          desconto: Number(servico.desconto || 0),

          pecas: servico.pecas.map((peca) => ({
            pecaCatalogoId: peca.pecaCatalogoId
              ? Number(peca.pecaCatalogoId)
              : null,
            descricao: peca.descricao || null,
            fornecedorId: peca.fornecedorId ? Number(peca.fornecedorId) : null,
            fornecedorNome: peca.fornecedorNome || null,
            quantidade: Number(peca.quantidade || 1),
            custoUnitario: Number(peca.custoUnitario || 0),
            desconto: Number(peca.desconto || 0),
          })),
        })),
      })),

      servicosSemDiagnostico: ordem.servicosSemDiagnostico.map((servico) => ({
        servicoCatalogoId: servico.servicoCatalogoId
          ? Number(servico.servicoCatalogoId)
          : null,
        descricao: servico.descricao || null,
        responsavel: servico.responsavel || null,
        tipo: servico.tipo || null,
        precoVenda: Number(servico.precoVenda || 0),
        desconto: Number(servico.desconto || 0),

        pecas: servico.pecas.map((peca) => ({
          pecaCatalogoId: peca.pecaCatalogoId
            ? Number(peca.pecaCatalogoId)
            : null,
          descricao: peca.descricao || null,
          fornecedorId: peca.fornecedorId ? Number(peca.fornecedorId) : null,
          fornecedorNome: peca.fornecedorNome || null,
          quantidade: Number(peca.quantidade || 1),
          custoUnitario: Number(peca.custoUnitario || 0),
          desconto: Number(peca.desconto || 0),
        })),
      })),

      pecasAvulsas: ordem.pecasAvulsas.map((peca) => ({
        pecaCatalogoId: peca.pecaCatalogoId
          ? Number(peca.pecaCatalogoId)
          : null,
        descricao: peca.descricao || null,
        fornecedorId: peca.fornecedorId ? Number(peca.fornecedorId) : null,
        fornecedorNome: peca.fornecedorNome || null,
        quantidade: Number(peca.quantidade || 1),
        custoUnitario: Number(peca.custoUnitario || 0),
        desconto: Number(peca.desconto || 0),
      })),
    };
  }

  /**
   * Salva a OS no backend respeitando o modo atual da tela.
   *
   * @async
   * @returns {Promise<void>} Promessa concluída após a operação.
   */
  async function salvarOrdemServico() {
    try {
      if (!ordem.codigo) {
        toast.warning('O código da OS ainda não foi gerado.');
        return;
      }

      if (!ordem.veiculo.id) {
        toast.warning(
          'Busque e selecione um cliente/veículo antes de salvar a OS.'
        );
        return;
      }

      setSalvando(true);

      const payload = montarPayloadOrdemServico();

      const response =
        modoTela === 'edicao' && ordem.id
          ? await api.put(`/ordens-servico/${ordem.id}`, payload)
          : await api.post('/ordens-servico', payload);

      carregarOrdemNaTela(response.data);
      setModoTela('visualizacao');

      localStorage.removeItem(OS_RASCUNHO_KEY);

      toast.success('Ordem de serviço salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar OS:', error);

      toast.error(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao salvar ordem de serviço.'
      );
    } finally {
      setSalvando(false);
    }
  }

  /**
   * Volta para a tela anterior do navegador.
   * @returns {void} Não possui retorno.
   */
  function voltarPagina() {
    navigate(-1);
  }

  /**
   * Marca ou desmarca um fornecedor para a cotação.
   *
   * @param {string|number} id - Identificador do registro.
   * @returns {void} Não possui retorno.
   */
  function alternarFornecedorCotacao(id) {
    setFornecedoresCotacao((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  /**
   * Retorna apenas peças com descrição e quantidade válidas para cotação.
   * @returns {Object[]} Lista resultante da operação.
   */
  function obterPecasValidasParaCotacao() {
    return pecasParaCotacao.filter((peca) => {
      const descricao = String(peca.descricao || '').trim();
      const quantidade = Number(peca.quantidade || 0);

      return descricao && quantidade > 0;
    });
  }

  /**
   * Normaliza o telefone para abrir a URL do WhatsApp.
   *
   * @param {string} telefone - Número de telefone que será normalizado.
   * @returns {string} Texto resultante da operação.
   */
  function normalizarTelefoneWhatsApp(telefone) {
    if (!telefone) return '';

    const apenasNumeros = String(telefone).replace(/\D/g, '');

    if (!apenasNumeros) return '';

    if (apenasNumeros.startsWith('55')) {
      return apenasNumeros;
    }

    return `55${apenasNumeros}`;
  }

  /**
   * Monta o nome do veículo para a mensagem de cotação.
   * @returns {string} Texto resultante da operação.
   */
  function montarNomeVeiculoCotacao() {
    return [ordem.veiculo.marca, ordem.veiculo.modelo, ordem.veiculo.ano]
      .filter(Boolean)
      .join(' ');
  }

    /**
     * Gera a mensagem de texto usada no envio da cotação.
     *
     * @param {Object} fornecedor - Fornecedor utilizado na operação.
     * @returns {string} Texto resultante da operação.
     */
  function montarMensagemCotacao(fornecedor) {
    const pecasValidas = obterPecasValidasParaCotacao();

    const linhasPecas = pecasValidas
      .map((peca) => {
        const nome = String(peca.descricao || 'Peça não informada').trim();
        const quantidade = Number(peca.quantidade || 1);

        return `${nome} - Quantidade: ${quantidade}`;
      })
      .join('\n');

    return `Olá, ${fornecedor.nome || 'fornecedor'}!

Gostaria de solicitar uma cotação de peças para a seguinte ordem de serviço:


Veículo: ${montarNomeVeiculoCotacao() || '-'}
Placa: ${ordem.veiculo.placa || '-'}
Motor: ${ordem.veiculo.motor || '-'}
Câmbio: ${ordem.veiculo.cambio || '-'}
Chassi: ${ordem.veiculo.chassi || '-'}

Peças necessárias:

${linhasPecas}
 

Pode me enviar os valores e disponibilidade, por favor?`;
  }

  /**
   * Abre as cotações no WhatsApp dos fornecedores selecionados.
   * @returns {void} Não possui retorno.
   */
  function enviarCotacao() {
    const fornecedoresSelecionados = catalogos.fornecedores.filter(
      (fornecedor) => fornecedoresCotacao.includes(fornecedor.id)
    );

    if (fornecedoresSelecionados.length === 0) {
      toast.warning('Selecione pelo menos um fornecedor para enviar a cotação.');
      return;
    }

    const pecasValidas = obterPecasValidasParaCotacao();

    if (pecasValidas.length === 0) {
      toast.warning('Adicione pelo menos uma peça válida para cotação.');
      return;
    }

    let fornecedoresSemTelefone = 0;
    let fornecedoresComEnvio = 0;

    fornecedoresSelecionados.forEach((fornecedor, index) => {
      const telefone =
        fornecedor.celular || fornecedor.telefone || fornecedor.whatsapp || '';

      const telefoneWhatsApp = normalizarTelefoneWhatsApp(telefone);

      if (!telefoneWhatsApp) {
        fornecedoresSemTelefone += 1;
        toast.warning(
          `Fornecedor ${fornecedor.nome || 'sem nome'} não possui telefone/celular cadastrado.`
        );
        return;
      }

      fornecedoresComEnvio += 1;

      const mensagem = montarMensagemCotacao(fornecedor);
      const url = `https://wa.me/${telefoneWhatsApp}?text=${encodeURIComponent(
        mensagem
      )}`;

      setTimeout(() => {
        window.open(url, '_blank', 'noopener,noreferrer');
      }, index * 450);
    });

    if (fornecedoresComEnvio > 0) {
      setModalCotacaoAberto(false);
      toast.success('Cotação aberta no WhatsApp dos fornecedores selecionados.');
    }

    if (fornecedoresComEnvio === 0 && fornecedoresSemTelefone > 0) {
      toast.error('Nenhuma cotação foi enviada. Cadastre telefone/celular nos fornecedores selecionados.');
    }
  }

  /**
   * Retorna todos os serviços da OS para montar mensagens e impressão.
   * @returns {Object[]} Lista resultante da operação.
   */
  function obterTodosServicosOS() {
    return [
      ...ordem.diagnosticos.flatMap((diagnostico, diagnosticoIndex) =>
        diagnostico.servicos.map((servico, servicoIndex) => ({
          ...servico,
          codigoVisual: `${letraDiagnostico(diagnosticoIndex)}.${servicoIndex + 1}`,
          diagnostico: diagnostico.descricao || '',
        }))
      ),
      ...ordem.servicosSemDiagnostico.map((servico, servicoIndex) => ({
        ...servico,
        codigoVisual: `S.${servicoIndex + 1}`,
        diagnostico: '',
      })),
    ];
  }

  /**
   * Retorna todas as peças da OS para montar mensagens e impressão.
   * @returns {Object[]} Lista resultante da operação.
   */
  function obterTodasPecasOS() {
    const pecasDosServicos = obterTodosServicosOS().flatMap((servico) =>
      (servico.pecas || []).map((peca, pecaIndex) => ({
        ...peca,
        codigoVisual: `${servico.codigoVisual}.${pecaIndex + 1}`,
        servico: servico.descricao || '',
        diagnostico: servico.diagnostico || '',
      }))
    );

    const pecasAvulsas = ordem.pecasAvulsas.map((peca, pecaIndex) => ({
      ...peca,
      codigoVisual: `P.${pecaIndex + 1}`,
      servico: '',
      diagnostico: '',
    }));

    return [...pecasDosServicos, ...pecasAvulsas];
  }

  /**
   * Monta a mensagem que será enviada para o cliente pelo WhatsApp.
   * @returns {string} Texto resultante da operação.
   */
  function montarMensagemOSCliente() {
    const diagnosticos = ordem.diagnosticos.filter((diagnostico) =>
      String(diagnostico.descricao || '').trim()
    );

    const servicos = obterTodosServicosOS().filter((servico) =>
      String(servico.descricao || '').trim()
    );

    const pecas = obterTodasPecasOS().filter((peca) =>
      String(peca.descricao || '').trim()
    );

    const linhasDiagnosticos = diagnosticos.length
      ? diagnosticos
          .map(
            (diagnostico, index) =>
              `${letraDiagnostico(index)} - ${diagnostico.descricao}`
          )
          .join('\n')
      : 'Nenhum diagnóstico informado.';

    const linhasServicos = servicos.length
      ? servicos
          .map((servico) => {
            const valor = formatarMoeda(
              Math.max(
                Number(servico.precoVenda || 0) - Number(servico.desconto || 0),
                0
              )
            );

            return `${servico.codigoVisual} - ${servico.descricao} | ${valor}`;
          })
          .join('\n')
      : 'Nenhum serviço informado.';

    const linhasPecas = pecas.length
      ? pecas
          .map((peca) => {
            const quantidade = Number(peca.quantidade || 1);
            const total = formatarMoeda(
              Math.max(
                quantidade * Number(peca.custoUnitario || 0) -
                  Number(peca.desconto || 0),
                0
              )
            );

            return `${peca.codigoVisual} - ${peca.descricao} | Qtd: ${quantidade} | ${total}`;
          })
          .join('\n')
      : 'Nenhuma peça informada.';

    return `Olá, ${ordem.cliente.nome || 'cliente'}!

Segue o resumo da sua Ordem de Serviço.

OS: ${ordem.codigo || '-'}
Status: ${ordem.status || '-'}

Cliente: ${ordem.cliente.nome || '-'}
Veículo: ${[ordem.veiculo.marca, ordem.veiculo.modelo, ordem.veiculo.ano]
      .filter(Boolean)
      .join(' ') || '-'}
Placa: ${ordem.veiculo.placa || '-'}
Motor: ${ordem.veiculo.motor || '-'}
Câmbio: ${ordem.veiculo.cambio || '-'}
KM: ${ordem.veiculo.km || '-'}

Diagnósticos:
${linhasDiagnosticos}

Serviços:
${linhasServicos}

Peças:
${linhasPecas}

Total de serviços: ${formatarMoeda(totais.totalServicos)}
Total de peças: ${formatarMoeda(totais.totalPecas)}
Total geral: ${formatarMoeda(totais.totalGeral)}

Observações:
${ordem.observacoes || '-'}`;

  }

  /**
   * Abre o WhatsApp do cliente com o resumo da OS preenchido.
   * @returns {void} Não possui retorno.
   */
  function enviarOSParaCliente() {
    if (!ordem.cliente.nome || !ordem.veiculo.id) {
      toast.warning('Selecione um cliente/veículo antes de enviar a OS.');
      return;
    }

    const telefoneCliente =
      ordem.cliente.whatsapp || ordem.cliente.celular || ordem.cliente.telefone || '';

    const telefoneWhatsApp = normalizarTelefoneWhatsApp(telefoneCliente);

    if (!telefoneWhatsApp) {
      toast.warning('O cliente não possui telefone/celular cadastrado.');
      return;
    }

    const mensagem = montarMensagemOSCliente();
    const url = `https://wa.me/${telefoneWhatsApp}?text=${encodeURIComponent(
      mensagem
    )}`;

    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success('OS aberta no WhatsApp do cliente.');
  }

  /**
   * Abre a janela de impressão do navegador para imprimir a OS.
   * @returns {void} Não possui retorno.
   */
  function imprimirOrdemServico() {
  if (!ordem.cliente.nome || !ordem.veiculo.placa) {
    toast.warning('Selecione um cliente/veículo antes de imprimir a OS.');
    return;
  }

  const listarDiagnosticos = ordem.diagnosticos
    .map((diagnostico, diagnosticoIndex) => {
      const letra = letraDiagnostico(diagnosticoIndex);

      const servicosHtml = diagnostico.servicos
        .map((servico, servicoIndex) => {
          const codigoServico = `${letra}.${servicoIndex + 1}`;

          const pecasHtml = servico.pecas
            .map((peca, pecaIndex) => {
              const totalPeca =
                Number(peca.quantidade || 0) *
                  Number(peca.custoUnitario || 0) -
                Number(peca.desconto || 0);

              return `
                <tr>
                  <td>${codigoServico}.${pecaIndex + 1}</td>
                  <td>${peca.descricao || '-'}</td>
                  <td>${peca.quantidade || 0}</td>
                  <td>${formatarMoeda(peca.custoUnitario || 0)}</td>
                  <td>${formatarMoeda(peca.desconto || 0)}</td>
                  <td>${formatarMoeda(totalPeca)}</td>
                </tr>
              `;
            })
            .join('');

          return `
            <div class="item-bloco">
              <h4>Serviço ${codigoServico}</h4>

              <table>
                <tbody>
                  <tr>
                    <th>Descrição</th>
                    <td>${servico.descricao || '-'}</td>
                  </tr>
                  <tr>
                    <th>Responsável</th>
                    <td>${servico.responsavel || '-'}</td>
                  </tr>
                  <tr>
                    <th>Tipo</th>
                    <td>${servico.tipo || '-'}</td>
                  </tr>
                  <tr>
                    <th>Valor</th>
                    <td>${formatarMoeda(servico.precoVenda || 0)}</td>
                  </tr>
                  <tr>
                    <th>Desconto</th>
                    <td>${formatarMoeda(servico.desconto || 0)}</td>
                  </tr>
                </tbody>
              </table>

              ${
                servico.pecas.length > 0
                  ? `
                    <h5>Peças vinculadas</h5>
                    <table>
                      <thead>
                        <tr>
                          <th>Cód.</th>
                          <th>Peça</th>
                          <th>Qtd.</th>
                          <th>Valor unit.</th>
                          <th>Desc.</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${pecasHtml}
                      </tbody>
                    </table>
                  `
                  : ''
              }
            </div>
          `;
        })
        .join('');

      return `
        <section class="secao">
          <h3>Diagnóstico ${letra}</h3>

          <table>
            <tbody>
              <tr>
                <th>Descrição</th>
                <td>${diagnostico.descricao || '-'}</td>
              </tr>
              <tr>
                <th>Observação</th>
                <td>${diagnostico.observacao || '-'}</td>
              </tr>
            </tbody>
          </table>

          ${servicosHtml || '<p class="vazio">Nenhum serviço vinculado.</p>'}
        </section>
      `;
    })
    .join('');

  const listarServicosSemDiagnostico = ordem.servicosSemDiagnostico
    .map((servico, index) => {
      return `
        <tr>
          <td>S.${index + 1}</td>
          <td>${servico.descricao || '-'}</td>
          <td>${servico.responsavel || '-'}</td>
          <td>${servico.tipo || '-'}</td>
          <td>${formatarMoeda(servico.precoVenda || 0)}</td>
          <td>${formatarMoeda(servico.desconto || 0)}</td>
        </tr>
      `;
    })
    .join('');

  const listarPecasAvulsas = ordem.pecasAvulsas
    .map((peca, index) => {
      const totalPeca =
        Number(peca.quantidade || 0) * Number(peca.custoUnitario || 0) -
        Number(peca.desconto || 0);

      return `
        <tr>
          <td>P.${index + 1}</td>
          <td>${peca.descricao || '-'}</td>
          <td>${peca.fornecedorNome || '-'}</td>
          <td>${peca.quantidade || 0}</td>
          <td>${formatarMoeda(peca.custoUnitario || 0)}</td>
          <td>${formatarMoeda(peca.desconto || 0)}</td>
          <td>${formatarMoeda(totalPeca)}</td>
        </tr>
      `;
    })
    .join('');

  const conteudoImpressao = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Ordem de Serviço ${ordem.codigo || ''}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 24px;
            font-family: Arial, Helvetica, sans-serif;
            color: #1d1d1b;
            background: #ffffff;
            font-size: 12px;
          }

          .documento {
            width: 100%;
            max-width: 900px;
            margin: 0 auto;
          }

          .cabecalho {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #0e352d;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }

          .empresa h1 {
            margin: 0;
            color: #0e352d;
            font-size: 26px;
            letter-spacing: 0.5px;
          }

          .empresa p {
            margin: 4px 0 0;
            color: #555;
            font-size: 12px;
          }

          .os-info {
            text-align: right;
          }

          .os-info strong {
            display: block;
            font-size: 18px;
            color: #0e352d;
          }

          .os-info span {
            display: block;
            margin-top: 4px;
          }

          .box {
            border: 1px solid #d6d6d6;
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 14px;
            page-break-inside: avoid;
          }

          .box-title {
            margin: 0 0 10px;
            font-size: 15px;
            color: #0e352d;
            border-bottom: 1px solid #eeeeee;
            padding-bottom: 6px;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px 14px;
          }

          .campo {
            min-height: 34px;
          }

          .campo label {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 3px;
          }

          .campo span {
            display: block;
            font-weight: 600;
            color: #1d1d1b;
          }

          .span-2 {
            grid-column: span 2;
          }

          .span-4 {
            grid-column: span 4;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            margin-bottom: 12px;
          }

          th,
          td {
            border: 1px solid #dcdcdc;
            padding: 7px;
            text-align: left;
            vertical-align: top;
          }

          th {
            background: #f3f5f4;
            color: #0e352d;
            font-size: 11px;
          }

          td {
            font-size: 11px;
          }

          .secao {
            margin-bottom: 16px;
            page-break-inside: avoid;
          }

          .secao h3 {
            margin: 0 0 8px;
            background: #0e352d;
            color: #ffffff;
            padding: 8px 10px;
            border-radius: 6px;
            font-size: 14px;
          }

          .item-bloco {
            margin-top: 10px;
            padding: 10px;
            border: 1px solid #e2e2e2;
            border-radius: 6px;
            page-break-inside: avoid;
          }

          .item-bloco h4 {
            margin: 0 0 8px;
            color: #1d1d1b;
            font-size: 13px;
          }

          .item-bloco h5 {
            margin: 10px 0 4px;
            color: #0e352d;
            font-size: 12px;
          }

          .vazio {
            color: #777;
            font-style: italic;
          }

          .totais {
            margin-left: auto;
            width: 320px;
            border: 1px solid #d6d6d6;
            border-radius: 8px;
            overflow: hidden;
            page-break-inside: avoid;
          }

          .total-linha {
            display: flex;
            justify-content: space-between;
            padding: 9px 12px;
            border-bottom: 1px solid #e5e5e5;
          }

          .total-linha:last-child {
            border-bottom: none;
          }

          .total-geral {
            background: #0e352d;
            color: #ffffff;
            font-size: 15px;
            font-weight: bold;
          }

          .assinaturas {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 48px;
            margin-top: 56px;
            page-break-inside: avoid;
          }

          .assinatura {
            border-top: 1px solid #1d1d1b;
            text-align: center;
            padding-top: 8px;
            font-size: 11px;
          }

          .rodape {
            margin-top: 28px;
            padding-top: 12px;
            border-top: 1px solid #d6d6d6;
            text-align: center;
            color: #666;
            font-size: 10px;
          }

          @page {
            size: A4;
            margin: 12mm;
          }

          @media print {
            body {
              padding: 0;
            }

            .documento {
              max-width: 100%;
            }
          }
        </style>
      </head>

      <body>
        <div class="documento">
          <header class="cabecalho">
            <div class="empresa">
              <h1>MotorMind</h1>
              <p>Sistema de Gestão para Oficinas Mecânicas</p>
            </div>

            <div class="os-info">
              <strong>Ordem de Serviço</strong>
              <span>Nº ${ordem.codigo || '-'}</span>
              <span>Status: ${ordem.status || '-'}</span>
              <span>Data: ${new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </header>

          <section class="box">
            <h2 class="box-title">Dados do cliente</h2>

            <div class="grid">
              <div class="campo span-2">
                <label>Cliente</label>
                <span>${ordem.cliente.nome || '-'}</span>
              </div>

              <div class="campo">
                <label>CPF</label>
                <span>${ordem.cliente.cpf || '-'}</span>
              </div>

              <div class="campo">
                <label>Data de nascimento</label>
                <span>${formatarData(ordem.cliente.dataNascimento)}</span>
              </div>

              <div class="campo">
                <label>Celular</label>
                <span>${ordem.cliente.celular || ordem.cliente.whatsapp || '-'}</span>
              </div>

              <div class="campo">
                <label>Telefone</label>
                <span>${ordem.cliente.telefone || '-'}</span>
              </div>

              <div class="campo span-2">
                <label>E-mail</label>
                <span>${ordem.cliente.email || '-'}</span>
              </div>

              <div class="campo span-2">
                <label>Endereço</label>
                <span>${montarEnderecoCliente() || '-'}</span>
              </div>

              <div class="campo">
                <label>CEP</label>
                <span>${ordem.cliente.cep || '-'}</span>
              </div>

              <div class="campo span-2">
                <label>Complemento</label>
                <span>${ordem.cliente.complemento || '-'}</span>
              </div>
            </div>
          </section>

          <section class="box">
            <h2 class="box-title">Dados do veículo</h2>

            <div class="grid">
              <div class="campo">
                <label>Placa</label>
                <span>${ordem.veiculo.placa || '-'}</span>
              </div>

              <div class="campo">
                <label>Marca</label>
                <span>${ordem.veiculo.marca || '-'}</span>
              </div>

              <div class="campo">
                <label>Modelo</label>
                <span>${ordem.veiculo.modelo || '-'}</span>
              </div>

              <div class="campo">
                <label>Ano</label>
                <span>${ordem.veiculo.ano || '-'}</span>
              </div>

              <div class="campo">
                <label>Motor</label>
                <span>${ordem.veiculo.motor || '-'}</span>
              </div>

              <div class="campo">
                <label>Câmbio</label>
                <span>${ordem.veiculo.cambio || '-'}</span>
              </div>

              <div class="campo">
                <label>Cor</label>
                <span>${ordem.veiculo.cor || '-'}</span>
              </div>

              <div class="campo">
                <label>KM</label>
                <span>${ordem.veiculo.km || '-'}</span>
              </div>

              <div class="campo span-2">
                <label>Chassi</label>
                <span>${ordem.veiculo.chassi || '-'}</span>
              </div>

              <div class="campo">
                <label>Ar-condicionado</label>
                <span>${ordem.veiculo.possuiAr ? 'Sim' : 'Não'}</span>
              </div>
            </div>
          </section>

          <section class="box">
            <h2 class="box-title">Diagnósticos e serviços</h2>

            ${
              listarDiagnosticos ||
              '<p class="vazio">Nenhum diagnóstico informado.</p>'
            }
          </section>

          ${
            ordem.servicosSemDiagnostico.length > 0
              ? `
                <section class="box">
                  <h2 class="box-title">Serviços sem diagnóstico</h2>

                  <table>
                    <thead>
                      <tr>
                        <th>Cód.</th>
                        <th>Descrição</th>
                        <th>Responsável</th>
                        <th>Tipo</th>
                        <th>Valor</th>
                        <th>Desconto</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${listarServicosSemDiagnostico}
                    </tbody>
                  </table>
                </section>
              `
              : ''
          }

          ${
            ordem.pecasAvulsas.length > 0
              ? `
                <section class="box">
                  <h2 class="box-title">Peças avulsas</h2>

                  <table>
                    <thead>
                      <tr>
                        <th>Cód.</th>
                        <th>Peça</th>
                        <th>Fornecedor</th>
                        <th>Qtd.</th>
                        <th>Valor unit.</th>
                        <th>Desc.</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${listarPecasAvulsas}
                    </tbody>
                  </table>
                </section>
              `
              : ''
          }

          <section class="box">
            <h2 class="box-title">Observações</h2>
            <p>${ordem.observacoes || 'Nenhuma observação informada.'}</p>
          </section>

          <section class="totais">
            <div class="total-linha">
              <span>Total de serviços</span>
              <strong>${formatarMoeda(totais.totalServicos)}</strong>
            </div>

            <div class="total-linha">
              <span>Total de peças</span>
              <strong>${formatarMoeda(totais.totalPecas)}</strong>
            </div>

            <div class="total-linha total-geral">
              <span>Total geral</span>
              <strong>${formatarMoeda(totais.totalGeral)}</strong>
            </div>
          </section>

          <section class="assinaturas">
            <div class="assinatura">
              Assinatura do cliente
            </div>

            <div class="assinatura">
              Responsável da oficina
            </div>
          </section>

          <footer class="rodape">
            Documento gerado pelo MotorMind.
          </footer>
        </div>

        <script>
          window.onload = function () {
            window.print();
            window.onafterprint = function () {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `;

  const janelaImpressao = window.open('', '_blank');

  if (!janelaImpressao) {
    toast.error('Não foi possível abrir a janela de impressão.');
    return;
  }

  janelaImpressao.document.open();
  janelaImpressao.document.write(conteudoImpressao);
  janelaImpressao.document.close();
}

  /**
   * Renderiza uma linha de peça reutilizada nos blocos da OS.
   *
   * @param {Object} configuracao - Dados usados para renderizar a linha de peça.
   * @returns {JSX.Element} Elemento JSX renderizado.
   */
  function renderPeca({
    peca,
    pecaIndex,
    codigoPecaCompleto,
    onAbrirCatalogo,
    onAplicarFornecedor,
    onAtualizar,
    onRemover,
  }) {
    return (
      <div className="os-piece-row" key={peca.id}>
        <div className="os-piece-title-row">
          <div className="os-code os-code-piece">{pecaIndex + 1}</div>

          <div>
            <strong>Peça {pecaIndex + 1}</strong>
            <small>{codigoPecaCompleto}</small>
          </div>
        </div>

        <div className="os-form-grid os-grid-piece">
          <div className="os-field os-col-2">
            <label>Peça</label>

            <button
              type="button"
              className="os-select-modal-btn"
              onClick={onAbrirCatalogo}
              disabled={!podeEditar}
            >
              {peca.pecaCatalogoId
                ? peca.descricao
                : 'Selecionar peça cadastrada'}
            </button>
          </div>

          <div className="os-field os-col-2">
            <label>Descrição complementar</label>
            <input
              value={peca.descricao}
              disabled={!podeEditar}
              onChange={(event) => onAtualizar('descricao', event.target.value)}
              placeholder="Detalhe específico desta peça na OS"
            />
          </div>

          <div className="os-field">
            <label>Fornecedor</label>
            <select
              value={peca.fornecedorId}
              disabled={!podeEditar}
              onChange={(event) => onAplicarFornecedor(event.target.value)}
            >
              <option value="">Selecione</option>

              {catalogos.fornecedores.map((fornecedor) => (
                <option key={fornecedor.id} value={fornecedor.id}>
                  {fornecedor.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="os-field">
            <label>Qtd.</label>
            <input
              type="number"
              value={peca.quantidade}
              disabled={!podeEditar}
              onChange={(event) =>
                onAtualizar('quantidade', event.target.value)
              }
            />
          </div>

          <div className="os-field">
            <label>Custo</label>
            <input
              type="number"
              value={peca.custoUnitario}
              disabled={!podeEditar}
              onChange={(event) =>
                onAtualizar('custoUnitario', event.target.value)
              }
              placeholder="0,00"
            />
          </div>

          <div className="os-field">
            <label>Desconto</label>
            <input
              type="number"
              value={peca.desconto}
              disabled={!podeEditar}
              onChange={(event) => onAtualizar('desconto', event.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="os-field">
            <label>Total</label>
            <input
              readOnly
              value={formatarMoeda(
                Number(peca.quantidade || 0) *
                  Number(peca.custoUnitario || 0) -
                  Number(peca.desconto || 0)
              )}
            />
          </div>
        </div>

        {podeEditar && (
          <button type="button" className="os-icon-btn" onClick={onRemover}>
            ×
          </button>
        )}
      </div>
    );
  }

  return (
    <Layout>
      <main className="os-page">
        <section className="os-top">
          <div>
            <h1>Ordem de Serviço</h1>

            <p>
              {modoTela === 'nova' && 'Monte uma nova OS.'}
              {modoTela === 'visualizacao' &&
                'Visualizando uma ordem de serviço existente.'}
              {modoTela === 'edicao' &&
                'Editando uma ordem de serviço existente.'}
            </p>

            {(carregandoCatalogos || carregandoCodigo || carregandoOrdem) && (
              <small>Carregando dados da OS...</small>
            )}
          </div>

          <div className="os-top-actions">
            <button
              type="button"
              className="os-small-btn os-dark"
              onClick={abrirModalBuscarOS}
            >
              Buscar OS existente
            </button>

            {modoTela !== 'nova' && (
              <button
                type="button"
                className="os-small-btn os-outline"
                onClick={novaOrdemServico}
              >
                Nova OS
              </button>
            )}

            {estaVisualizando && (
              <button
                type="button"
                className="os-small-btn os-blue"
                onClick={editarOrdemAtual}
              >
                Editar OS
              </button>
            )}
          </div>
        </section>

        <section className="os-panel">
          <div className="os-panel-title">
            <h2>Cliente e veículo</h2>
            <span>Busque por nome do cliente ou placa do veículo.</span>
          </div>

          <div className="os-form-grid os-grid-4">
            <div className="os-field os-col-2">
              <label>Buscar cliente ou placa</label>

              <div className="os-search-line">
                <input
                  value={busca}
                  disabled={!podeEditar}
                  onChange={(event) => setBusca(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      buscarClienteOuVeiculo();
                    }
                  }}
                  placeholder="Digite o nome do cliente ou placa"
                />

                <button
                  type="button"
                  onClick={buscarClienteOuVeiculo}
                  disabled={buscandoVeiculo || !podeEditar}
                >
                  {buscandoVeiculo ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </div>

            <div className="os-field">
              <label>Código da OS</label>
              <input value={ordem.codigo} readOnly placeholder="Automático" />
            </div>

            <div className="os-field">
              <label>Status da OS</label>

              <select
                value={ordem.status || 'ABERTA'}
                disabled={!podeEditar}
                onChange={(event) =>
                  atualizarCampoOrdem('status', event.target.value)
                }
              >
                <option value="ABERTA">Aberta</option>
                <option value="EM_ANDAMENTO">Em andamento</option>
                <option value="AGUARDANDO_PECA">Aguardando peça</option>
                <option value="FINALIZADA">Finalizada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
          </div>

          {resultadosBusca.length > 0 && podeEditar && (
            <div className="os-search-results">
              {resultadosBusca.map((veiculo) => (
                <button
                  type="button"
                  key={veiculo.id}
                  className="os-search-result-item"
                  onClick={() => selecionarVeiculo(veiculo)}
                >
                  <strong>{veiculo.cliente?.nome || 'Cliente sem nome'}</strong>

                  <span>
                    {veiculo.placa || '-'} | {veiculo.fabricante || '-'}{' '}
                    {veiculo.modelo || '-'} | {montarAnoVeiculo(veiculo) || '-'} | Câmbio: {veiculo.cambio || '-'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {clienteNaoEncontrado && podeEditar && (
            <div className="os-not-found">
              <span>Nenhum cliente ou veículo encontrado.</span>

              <button
                type="button"
                className="os-small-btn os-blue"
                onClick={() => navigate('/clientes/cadastro')}
              >
                Cadastrar novo cliente
              </button>
            </div>
          )}

          <div className="os-divider" />

          <div className="os-subtitle">Cliente selecionado</div>

          <div className="os-form-grid os-grid-4">
            <div className="os-field os-col-2">
              <label>Nome do cliente</label>
              <input
                value={ordem.cliente.nome}
                readOnly
                placeholder="Nenhum cliente selecionado"
              />
            </div>
          </div>

          <div className="os-divider" />

          <div className="os-subtitle">Dados do veículo</div>

          <div className="os-form-grid os-grid-4">
            <div className="os-field">
              <label>Placa</label>
              <input value={ordem.veiculo.placa} readOnly />
            </div>

            <div className="os-field">
              <label>Marca</label>
              <input value={ordem.veiculo.marca} readOnly />
            </div>

            <div className="os-field">
              <label>Modelo</label>
              <input value={ordem.veiculo.modelo} readOnly />
            </div>

            <div className="os-field">
              <label>Ano</label>
              <input value={ordem.veiculo.ano} readOnly />
            </div>

            <div className="os-field">
              <label>Motor</label>
              <input value={ordem.veiculo.motor} readOnly />
            </div>

            <div className="os-field">
              <label>Câmbio</label>
              <input value={ordem.veiculo.cambio || '-'} readOnly />
            </div>

            <div className="os-field">
              <label>Cor</label>
              <input value={ordem.veiculo.cor} readOnly />
            </div>

            <div className="os-field">
              <label>KM</label>
              <input value={ordem.veiculo.km} readOnly />
            </div>

            <div className="os-field os-col-2">
              <label>Chassi</label>
              <input value={ordem.veiculo.chassi} readOnly />
            </div>

            <label className="os-check">
              <input
                type="checkbox"
                checked={ordem.veiculo.possuiAr}
                readOnly
              />
              Possui ar-condicionado
            </label>

            <div className="os-field os-col-full">
              <label>Observações da OS</label>
              <input
                value={ordem.observacoes}
                disabled={!podeEditar}
                onChange={(event) =>
                  atualizarCampoOrdem('observacoes', event.target.value)
                }
                placeholder="Observações gerais da ordem de serviço"
              />
            </div>
          </div>
        </section>

        <section className="os-service-panel">
          <div className="os-panel-title os-title-row">
            <div>
              <h2>Diagnósticos, serviços e peças</h2>
              <span>Crie a hierarquia da ordem de serviço.</span>
            </div>

            {podeEditar && (
              <div className="os-title-actions">
                <button
                  type="button"
                  className="os-small-btn os-blue"
                  onClick={adicionarDiagnostico}
                >
                  + Novo diagnóstico
                </button>

                <button
                  type="button"
                  className="os-small-btn os-dark"
                  onClick={adicionarServicoSemDiagnostico}
                >
                  + Serviço sem diagnóstico
                </button>

                <button
                  type="button"
                  className="os-small-btn os-outline"
                  onClick={adicionarPecaAvulsa}
                >
                  + Peça avulsa
                </button>
              </div>
            )}
          </div>

          {ordem.diagnosticos.length === 0 &&
            ordem.servicosSemDiagnostico.length === 0 &&
            ordem.pecasAvulsas.length === 0 && (
              <div className="os-empty">
                Nenhum diagnóstico, serviço ou peça adicionado.
              </div>
            )}

          {ordem.diagnosticos.map((diagnostico, diagnosticoIndex) => {
            const codigoDiagnostico = letraDiagnostico(diagnosticoIndex);

            return (
              <article className="os-diagnostic-card" key={diagnostico.id}>
                <div className="os-diagnostic-header">
                  <div className="os-code os-code-diagnostic">
                    {codigoDiagnostico}
                  </div>

                  <div className="os-field">
                    <label>Modelo de diagnóstico</label>

                    <button
                      type="button"
                      className="os-select-modal-btn"
                      onClick={() =>
                        abrirModalCatalogo({
                          tipo: 'diagnostico',
                          diagnosticoId: diagnostico.id,
                        })
                      }
                      disabled={!podeEditar}
                    >
                      {diagnostico.diagnosticoCatalogoId
                        ? diagnostico.descricao
                        : 'Selecionar diagnóstico cadastrado'}
                    </button>
                  </div>

                  <div className="os-field os-grow">
                    <label>Descrição do diagnóstico</label>

                    <input
                      value={diagnostico.descricao}
                      disabled={!podeEditar}
                      onChange={(event) =>
                        atualizarDiagnostico(
                          diagnostico.id,
                          'descricao',
                          event.target.value
                        )
                      }
                      placeholder="Ex: Carro falhando, barulho no motor..."
                    />
                  </div>

                  {podeEditar && (
                    <>
                      <button
                        type="button"
                        className="os-small-btn os-blue"
                        onClick={() =>
                          adicionarServicoAoDiagnostico(diagnostico.id)
                        }
                      >
                        + Serviço
                      </button>

                      <button
                        type="button"
                        className="os-icon-btn"
                        onClick={() => removerDiagnostico(diagnostico.id)}
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>

                {diagnostico.servicos.length === 0 && (
                  <div className="os-inner-empty">
                    Nenhum serviço vinculado a este diagnóstico.
                  </div>
                )}

                {diagnostico.servicos.map((servico, servicoIndex) => {
                  const codigoServicoCompleto = `${codigoDiagnostico}.${
                    servicoIndex + 1
                  }`;

                  return (
                    <article className="os-service-card" key={servico.id}>
                      <div className="os-service-title-row">
                        <div className="os-code os-code-service">
                          {servicoIndex + 1}
                        </div>

                        <div>
                          <strong>Serviço {servicoIndex + 1}</strong>
                          <small>{codigoServicoCompleto}</small>
                        </div>
                      </div>

                      <div className="os-service-header">
                        <div className="os-form-grid os-grid-service">
                          <div className="os-field os-col-2">
                            <label>Serviço</label>

                            <button
                              type="button"
                              className="os-select-modal-btn"
                              onClick={() =>
                                abrirModalCatalogo({
                                  tipo: 'servico',
                                  diagnosticoId: diagnostico.id,
                                  servicoId: servico.id,
                                  origem: 'diagnostico',
                                })
                              }
                              disabled={!podeEditar}
                            >
                              {servico.servicoCatalogoId
                                ? servico.descricao
                                : 'Selecionar serviço cadastrado'}
                            </button>
                          </div>

                          <div className="os-field os-col-2">
                            <label>Descrição complementar</label>

                            <input
                              value={servico.descricao}
                              disabled={!podeEditar}
                              onChange={(event) =>
                                atualizarServicoDiagnostico(
                                  diagnostico.id,
                                  servico.id,
                                  'descricao',
                                  event.target.value
                                )
                              }
                              placeholder="Detalhe específico deste serviço"
                            />
                          </div>

                          <div className="os-field">
                            <label>Responsável</label>

                            <select
                              value={servico.responsavel}
                              disabled={!podeEditar}
                              onChange={(event) =>
                                atualizarServicoDiagnostico(
                                  diagnostico.id,
                                  servico.id,
                                  'responsavel',
                                  event.target.value
                                )
                              }
                            >
                              <option value="">Selecione um técnico</option>

                              {catalogos.tecnicos.map((tecnico) => (
                                <option
                                  key={tecnico.id}
                                  value={tecnico.usuario?.Nome || ''}
                                >
                                  {tecnico.usuario?.Nome || 'Técnico sem nome'}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="os-field">
                            <label>Tipo</label>

                            <input
                              value={servico.tipo}
                              disabled={!podeEditar}
                              onChange={(event) =>
                                atualizarServicoDiagnostico(
                                  diagnostico.id,
                                  servico.id,
                                  'tipo',
                                  event.target.value
                                )
                              }
                              placeholder="Mão de obra, troca..."
                            />
                          </div>

                          <div className="os-field">
                            <label>Preço</label>

                            <input
                              type="number"
                              value={servico.precoVenda}
                              disabled={!podeEditar}
                              onChange={(event) =>
                                atualizarServicoDiagnostico(
                                  diagnostico.id,
                                  servico.id,
                                  'precoVenda',
                                  event.target.value
                                )
                              }
                              placeholder="0,00"
                            />
                          </div>

                          <div className="os-field">
                            <label>Desconto</label>

                            <input
                              type="number"
                              value={servico.desconto}
                              disabled={!podeEditar}
                              onChange={(event) =>
                                atualizarServicoDiagnostico(
                                  diagnostico.id,
                                  servico.id,
                                  'desconto',
                                  event.target.value
                                )
                              }
                              placeholder="0,00"
                            />
                          </div>
                        </div>

                        {podeEditar && (
                          <button
                            type="button"
                            className="os-icon-btn"
                            onClick={() =>
                              removerServicoDiagnostico(
                                diagnostico.id,
                                servico.id
                              )
                            }
                          >
                            ×
                          </button>
                        )}
                      </div>

                      <div className="os-piece-area">
                        {podeEditar && (
                          <button
                            type="button"
                            className="os-small-btn os-outline"
                            onClick={() =>
                              adicionarPecaDiagnostico(
                                diagnostico.id,
                                servico.id
                              )
                            }
                          >
                            + Adicionar peça
                          </button>
                        )}

                        {servico.pecas.map((peca, pecaIndex) => {
                          const codigoPecaCompleto = `${codigoServicoCompleto}.${
                            pecaIndex + 1
                          }`;

                          return renderPeca({
                            peca,
                            pecaIndex,
                            codigoPecaCompleto,
                            onAbrirCatalogo: () =>
                              abrirModalCatalogo({
                                tipo: 'peca',
                                diagnosticoId: diagnostico.id,
                                servicoId: servico.id,
                                pecaId: peca.id,
                                origem: 'diagnostico',
                              }),
                            onAplicarFornecedor: (fornecedorId) =>
                              aplicarFornecedorPecaDiagnostico(
                                diagnostico.id,
                                servico.id,
                                peca.id,
                                fornecedorId
                              ),
                            onAtualizar: (campo, valor) =>
                              atualizarPecaDiagnostico(
                                diagnostico.id,
                                servico.id,
                                peca.id,
                                campo,
                                valor
                              ),
                            onRemover: () =>
                              removerPecaDiagnostico(
                                diagnostico.id,
                                servico.id,
                                peca.id
                              ),
                          });
                        })}
                      </div>
                    </article>
                  );
                })}
              </article>
            );
          })}

          {ordem.servicosSemDiagnostico.length > 0 && (
            <div className="os-free-items">
              {ordem.servicosSemDiagnostico.map((servico, servicoIndex) => {
                const codigoServicoCompleto = `S.${servicoIndex + 1}`;

                return (
                  <article className="os-service-card" key={servico.id}>
                    <div className="os-service-title-row">
                      <div className="os-code os-code-service">
                        {servicoIndex + 1}
                      </div>

                      <div>
                        <strong>Serviço {servicoIndex + 1}</strong>
                        <small>{codigoServicoCompleto}</small>
                      </div>
                    </div>

                    <div className="os-service-header">
                      <div className="os-form-grid os-grid-service">
                        <div className="os-field os-col-2">
                          <label>Serviço</label>

                          <button
                            type="button"
                            className="os-select-modal-btn"
                            onClick={() =>
                              abrirModalCatalogo({
                                tipo: 'servico',
                                servicoId: servico.id,
                                origem: 'sem-diagnostico',
                              })
                            }
                            disabled={!podeEditar}
                          >
                            {servico.servicoCatalogoId
                              ? servico.descricao
                              : 'Selecionar serviço cadastrado'}
                          </button>
                        </div>

                        <div className="os-field os-col-2">
                          <label>Descrição complementar</label>

                          <input
                            value={servico.descricao}
                            disabled={!podeEditar}
                            onChange={(event) =>
                              atualizarServicoSemDiagnostico(
                                servico.id,
                                'descricao',
                                event.target.value
                              )
                            }
                            placeholder="Detalhe específico deste serviço"
                          />
                        </div>

                        <div className="os-field">
                          <label>Responsável</label>

                          <select
                            value={servico.responsavel}
                            disabled={!podeEditar}
                            onChange={(event) =>
                              atualizarServicoSemDiagnostico(
                                servico.id,
                                'responsavel',
                                event.target.value
                              )
                            }
                          >
                            <option value="">Selecione um técnico</option>

                            {catalogos.tecnicos.map((tecnico) => (
                              <option
                                key={tecnico.id}
                                value={tecnico.usuario?.Nome || ''}
                              >
                                {tecnico.usuario?.Nome || 'Técnico sem nome'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="os-field">
                          <label>Tipo</label>

                          <input
                            value={servico.tipo}
                            disabled={!podeEditar}
                            onChange={(event) =>
                              atualizarServicoSemDiagnostico(
                                servico.id,
                                'tipo',
                                event.target.value
                              )
                            }
                            placeholder="Mão de obra, troca..."
                          />
                        </div>

                        <div className="os-field">
                          <label>Preço</label>

                          <input
                            type="number"
                            value={servico.precoVenda}
                            disabled={!podeEditar}
                            onChange={(event) =>
                              atualizarServicoSemDiagnostico(
                                servico.id,
                                'precoVenda',
                                event.target.value
                              )
                            }
                            placeholder="0,00"
                          />
                        </div>

                        <div className="os-field">
                          <label>Desconto</label>

                          <input
                            type="number"
                            value={servico.desconto}
                            disabled={!podeEditar}
                            onChange={(event) =>
                              atualizarServicoSemDiagnostico(
                                servico.id,
                                'desconto',
                                event.target.value
                              )
                            }
                            placeholder="0,00"
                          />
                        </div>
                      </div>

                      {podeEditar && (
                        <button
                          type="button"
                          className="os-icon-btn"
                          onClick={() =>
                            removerServicoSemDiagnostico(servico.id)
                          }
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div className="os-piece-area">
                      {podeEditar && (
                        <button
                          type="button"
                          className="os-small-btn os-outline"
                          onClick={() => adicionarPecaSemDiagnostico(servico.id)}
                        >
                          + Adicionar peça
                        </button>
                      )}

                      {servico.pecas.map((peca, pecaIndex) => {
                        const codigoPecaCompleto = `${codigoServicoCompleto}.${
                          pecaIndex + 1
                        }`;

                        return renderPeca({
                          peca,
                          pecaIndex,
                          codigoPecaCompleto,
                          onAbrirCatalogo: () =>
                            abrirModalCatalogo({
                              tipo: 'peca',
                              servicoId: servico.id,
                              pecaId: peca.id,
                              origem: 'servico-sem-diagnostico',
                            }),
                          onAplicarFornecedor: (fornecedorId) =>
                            aplicarFornecedorPecaSemDiagnostico(
                              servico.id,
                              peca.id,
                              fornecedorId
                            ),
                          onAtualizar: (campo, valor) =>
                            atualizarPecaSemDiagnostico(
                              servico.id,
                              peca.id,
                              campo,
                              valor
                            ),
                          onRemover: () =>
                            removerPecaSemDiagnostico(servico.id, peca.id),
                        });
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {ordem.pecasAvulsas.length > 0 && (
            <div className="os-free-items">
              <div className="os-piece-area os-piece-area-loose">
                {ordem.pecasAvulsas.map((peca, pecaIndex) =>
                  renderPeca({
                    peca,
                    pecaIndex,
                    codigoPecaCompleto: `P.${pecaIndex + 1}`,
                    onAbrirCatalogo: () =>
                      abrirModalCatalogo({
                        tipo: 'peca',
                        pecaId: peca.id,
                        origem: 'avulsa',
                      }),
                    onAplicarFornecedor: (fornecedorId) =>
                      aplicarFornecedorPecaAvulsa(peca.id, fornecedorId),
                    onAtualizar: (campo, valor) =>
                      atualizarPecaAvulsa(peca.id, campo, valor),
                    onRemover: () => removerPecaAvulsa(peca.id),
                  })
                )}
              </div>
            </div>
          )}
        </section>

        <section className="os-bottom">
          <div className="os-summary-card">
            <h3>Pagamento</h3>

            <div>
              <span>Serviços</span>
              <strong>{formatarMoeda(totais.totalServicos)}</strong>
            </div>

            <div>
              <span>Peças</span>
              <strong>{formatarMoeda(totais.totalPecas)}</strong>
            </div>

            <div className="os-summary-total">
              <span>Total</span>
              <strong>{formatarMoeda(totais.totalGeral)}</strong>
            </div>
          </div>

          <button
            type="button"
            className="os-quote-btn"
            disabled={pecasParaCotacao.length === 0}
            onClick={() => setModalCotacaoAberto(true)}
          >
            Enviar cotação para fornecedor
          </button>
        </section>

        <section className="os-final-actions">
          <button
            type="button"
            className="os-action os-action-green"
            onClick={enviarOSParaCliente}
            disabled={!ordem.veiculo.id}
          >
            Enviar OS para o cliente
          </button>

          <button
            type="button"
            className="os-action os-action-blue"
            onClick={imprimirOrdemServico}
            disabled={!ordem.veiculo.id}
          >
            Imprimir OS
          </button>

          <button
            type="button"
            className="os-action os-action-red"
            onClick={voltarPagina}
          >
            Voltar
          </button>

          {estaVisualizando && (
            <button
              type="button"
              className="os-action os-action-dark"
              onClick={editarOrdemAtual}
            >
              Editar OS
            </button>
          )}

          {podeEditar && (
            <button
              type="button"
              className="os-action os-action-dark"
              onClick={salvarOrdemServico}
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          )}
        </section>

        {modalBuscarOSAberto && (
          <div className="os-modal-overlay">
            <div className="os-modal os-catalog-modal">
              <div className="os-modal-header">
                <h2>Buscar ordem de serviço</h2>

                <button
                  type="button"
                  className="os-modal-close-btn"
                  onClick={fecharModalBuscarOS}
                >
                  ×
                </button>
              </div>

              <div className="os-form-grid os-grid-4">
                <div className="os-field os-col-2">
                  <label>Código, cliente, placa ou veículo</label>

                  <input
                    value={filtrosBuscaOS.termo}
                    onChange={(event) =>
                      atualizarFiltroBuscaOS('termo', event.target.value)
                    }
                    placeholder="Ex: OS-0001, João, ABC1D23"
                  />
                </div>

                <div className="os-field">
                  <label>Status</label>

                  <select
                    value={filtrosBuscaOS.status}
                    onChange={(event) =>
                      atualizarFiltroBuscaOS('status', event.target.value)
                    }
                  >
                    <option value="">Todos</option>
                    <option value="ABERTA">Aberta</option>
                    <option value="EM_ANDAMENTO">Em andamento</option>
                    <option value="AGUARDANDO_PECA">Aguardando peça</option>
                    <option value="FINALIZADA">Finalizada</option>
                    <option value="CANCELADA">Cancelada</option>
                  </select>
                </div>

                <div className="os-field">
                  <label>Data inicial</label>

                  <input
                    type="date"
                    value={filtrosBuscaOS.dataInicio}
                    onChange={(event) =>
                      atualizarFiltroBuscaOS('dataInicio', event.target.value)
                    }
                  />
                </div>

                <div className="os-field">
                  <label>Data final</label>

                  <input
                    type="date"
                    value={filtrosBuscaOS.dataFim}
                    onChange={(event) =>
                      atualizarFiltroBuscaOS('dataFim', event.target.value)
                    }
                  />
                </div>

                <div className="os-field">
                  <label>&nbsp;</label>

                  <button
                    type="button"
                    className="os-small-btn os-blue"
                    onClick={buscarOrdensAntigas}
                    disabled={buscandoOrdens}
                  >
                    {buscandoOrdens ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>

                <div className="os-field">
                  <label>&nbsp;</label>

                  <button
                    type="button"
                    className="os-small-btn os-outline"
                    onClick={limparFiltrosBuscaOS}
                  >
                    Limpar
                  </button>
                </div>
              </div>

              <div className="os-catalog-table-wrap">
                <table className="os-catalog-table">
                  <thead>
                    <tr>
                      <th>OS</th>
                      <th>Cliente</th>
                      <th>Veículo</th>
                      <th>Data</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {ordensEncontradas.length === 0 && (
                      <tr>
                        <td colSpan="7">Nenhuma OS encontrada.</td>
                      </tr>
                    )}

                    {ordensEncontradas.map((item) => (
                      <tr key={item.id}>
                        <td>{item.codigo}</td>
                        <td>{item.clienteNome || '-'}</td>

                        <td>
                          {item.veiculo?.placa || '-'} |{' '}
                          {item.veiculo?.fabricante || '-'}{' '}
                          {item.veiculo?.modelo || '-'}
                        </td>

                        <td>{formatarData(item.dataEmissao)}</td>
                        <td>{item.status}</td>
                        <td>{formatarMoeda(item.totalGeral)}</td>

                        <td>
                          <button
                            type="button"
                            className="os-small-btn os-blue"
                            onClick={() => abrirOrdemExistente(item.id)}
                            disabled={carregandoOrdem}
                          >
                            Abrir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {modalCatalogo.aberto && (
          <div className="os-modal-overlay">
            <div className="os-modal os-catalog-modal">
              <div className="os-modal-header os-catalog-header">
                <div>
                  <h2>{obterTituloModalCatalogo()}</h2>

                  <span>
                    Selecione um cadastro existente ou cadastre um novo em outra
                    aba.
                  </span>
                </div>

                <div className="os-catalog-header-actions">
                  <button
                    type="button"
                    className="os-small-btn os-blue"
                    onClick={abrirCadastroCatalogoNovaAba}
                  >
                    {obterTextoBotaoCadastroCatalogo()}
                  </button>

                  <button
                    type="button"
                    className="os-small-btn os-outline"
                    onClick={atualizarListaCatalogoModal}
                    disabled={carregandoCatalogos}
                  >
                    {carregandoCatalogos ? 'Atualizando...' : 'Atualizar lista'}
                  </button>

                  <button
                    type="button"
                    className="os-modal-close-btn"
                    onClick={fecharModalCatalogo}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="os-catalog-search">
                <input
                  value={buscaCatalogo}
                  onChange={(event) => setBuscaCatalogo(event.target.value)}
                  placeholder={`Pesquisar ${obterTituloModalCatalogo().toLowerCase()} por código, nome, grupo ou descrição...`}
                />
              </div>

              {renderConteudoModalCatalogo()}
            </div>
          </div>
        )}

        {modalCotacaoAberto && (
          <div className="os-modal-overlay">
            <div className="os-modal">
              <div className="os-modal-header">
                <h2>Enviar cotação para fornecedores</h2>

                <button
                  type="button"
                  className="os-modal-close-btn"
                  onClick={() => setModalCotacaoAberto(false)}
                >
                  ×
                </button>
              </div>

              <div className="os-modal-section">
                <h3>Veículo</h3>

                <p>
                  {ordem.veiculo.marca || '-'} {ordem.veiculo.modelo || '-'} |{' '}
                  Ano: {ordem.veiculo.ano || '-'} | Motor:{' '}
                  {ordem.veiculo.motor || '-'} | Ar:{' '}
                  {ordem.veiculo.possuiAr ? 'Sim' : 'Não'} | Chassi:{' '}
                  {ordem.veiculo.chassi || '-'}
                </p>
              </div>

              <div className="os-modal-section">
                <h3>Peças da cotação</h3>

                {obterPecasValidasParaCotacao().map((peca) => (
                  <div className="os-modal-piece" key={peca.id}>
                    <strong>{peca.descricao || 'Peça sem descrição'}</strong>
                    <span>Quantidade: {Number(peca.quantidade || 1)}</span>
                  </div>
                ))}
              </div>

              <div className="os-modal-section">
                <h3>Fornecedores</h3>

                {catalogos.fornecedores.map((fornecedor) => (
                  <label className="os-provider" key={fornecedor.id}>
                    <input
                      type="checkbox"
                      checked={fornecedoresCotacao.includes(fornecedor.id)}
                      onChange={() => alternarFornecedorCotacao(fornecedor.id)}
                    />

                    <div>
                      <strong>{fornecedor.nome}</strong>
                      <span>
                        {fornecedor.celular ||
                          fornecedor.telefone ||
                          fornecedor.whatsapp ||
                          'Sem telefone cadastrado'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="os-modal-actions">
                <button
                  type="button"
                  className="os-small-btn os-dark"
                  onClick={() => setModalCotacaoAberto(false)}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="os-small-btn os-blue"
                  onClick={enviarCotacao}
                >
                  Enviar cotação
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}

export default OrdemServico;
