import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/operadorStyles/ordemServico.css';

const OS_RASCUNHO_KEY = 'motormind_ordem_servico_rascunho';
const OS_RASCUNHO_TOAST_ID = 'motormind_ordem_servico_rascunho_toast';

const ordemInicial = {
  id: null,
  codigo: '',
  status: 'ABERTA',
  cliente: {
    id: '',
    nome: '',
  },
  veiculo: {
    id: '',
    placa: '',
    marca: '',
    modelo: '',
    ano: '',
    motor: '',
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

const filtrosBuscaOSInicial = {
  termo: '',
  status: '',
  dataInicio: '',
  dataFim: '',
};

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

  useEffect(() => {
  if (iniciouTelaRef.current) return;

  iniciouTelaRef.current = true;
  iniciarTelaOrdemServico();
}, []);

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

  function obterFabricanteVeiculo(veiculo) {
    return veiculo.fabricante || veiculo.marca || veiculo.modeloMarca || '';
  }

  function obterModeloVeiculo(veiculo) {
    return veiculo.modelo || veiculo.nomeModelo || '';
  }

  function obterKmVeiculo(veiculo) {
    return veiculo.km || veiculo.quilometragem || veiculo.kilometragem || '';
  }

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
      cliente: {
        id: cliente.id || '',
        nome: cliente.nome || cliente.Nome || '',
      },
      veiculo: {
        id: veiculo.id || agendamento.veiculoId || '',
        placa: veiculo.placa || '',
        marca: obterFabricanteVeiculo(veiculo),
        modelo: obterModeloVeiculo(veiculo),
        ano: montarAnoVeiculo(veiculo),
        motor: veiculo.motor || '',
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

  function selecionarVeiculo(veiculo) {
    const cliente = veiculo.cliente;

    setOrdem((prev) => ({
      ...prev,
      cliente: {
        id: cliente?.id || '',
        nome: cliente?.nome || '',
      },
      veiculo: {
        id: veiculo.id || '',
        placa: veiculo.placa || '',
        marca: veiculo.fabricante || '',
        modelo: veiculo.modelo || '',
        ano: montarAnoVeiculo(veiculo),
        motor: veiculo.motor || '',
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

  function montarAnoVeiculo(veiculo) {
    if (veiculo.ano_fabricacao && veiculo.ano_modelo) {
      return `${veiculo.ano_fabricacao}/${veiculo.ano_modelo}`;
    }

    return veiculo.ano_modelo || veiculo.ano_fabricacao || '';
  }

  function atualizarCampoOrdem(campo, valor) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  function letraDiagnostico(index) {
    return String.fromCharCode(65 + index);
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function formatarData(data) {
    if (!data) return '-';

    return new Date(data).toLocaleDateString('pt-BR');
  }

  function criarDiagnostico() {
    return {
      id: crypto.randomUUID(),
      diagnosticoCatalogoId: '',
      descricao: '',
      observacao: '',
      servicos: [],
    };
  }

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

  function adicionarDiagnostico() {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      diagnosticos: [...prev.diagnosticos, criarDiagnostico()],
    }));
  }

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

  function removerDiagnostico(diagnosticoId) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      diagnosticos: prev.diagnosticos.filter(
        (diagnostico) => diagnostico.id !== diagnosticoId
      ),
    }));
  }

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

  function atualizarServicoSemDiagnostico(servicoId, campo, valor) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      servicosSemDiagnostico: prev.servicosSemDiagnostico.map((servico) =>
        servico.id === servicoId ? { ...servico, [campo]: valor } : servico
      ),
    }));
  }

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

  function removerServicoSemDiagnostico(servicoId) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      servicosSemDiagnostico: prev.servicosSemDiagnostico.filter(
        (servico) => servico.id !== servicoId
      ),
    }));
  }

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

  function adicionarPecaAvulsa() {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      pecasAvulsas: [...prev.pecasAvulsas, criarPeca()],
    }));
  }

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

  function atualizarPecaAvulsa(pecaId, campo, valor) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      pecasAvulsas: prev.pecasAvulsas.map((peca) =>
        peca.id === pecaId ? { ...peca, [campo]: valor } : peca
      ),
    }));
  }

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

  function aplicarFornecedorPecaAvulsa(pecaId, fornecedorId) {
    const fornecedor = catalogos.fornecedores.find(
      (item) => Number(item.id) === Number(fornecedorId)
    );

    atualizarPecaAvulsa(pecaId, 'fornecedorId', fornecedorId);
    atualizarPecaAvulsa(pecaId, 'fornecedorNome', fornecedor?.nome || '');
  }

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

  function removerPecaAvulsa(pecaId) {
    if (!podeEditar) return;

    setOrdem((prev) => ({
      ...prev,
      pecasAvulsas: prev.pecasAvulsas.filter((peca) => peca.id !== pecaId),
    }));
  }

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

  function obterItensBaseModalCatalogo() {
    if (modalCatalogo.tipo === 'diagnostico') return catalogos.diagnosticos;
    if (modalCatalogo.tipo === 'servico') return catalogos.servicos;
    if (modalCatalogo.tipo === 'peca') return catalogos.pecas;

    return [];
  }

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

  function obterGrupoPeca(peca) {
    return peca.grupo?.trim() || 'Sem grupo';
  }

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

  function obterTituloModalCatalogo() {
    if (modalCatalogo.tipo === 'diagnostico') return 'Selecionar diagnóstico';
    if (modalCatalogo.tipo === 'servico') return 'Selecionar serviço';
    if (modalCatalogo.tipo === 'peca') return 'Selecionar peça';

    return 'Selecionar cadastro';
  }

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

  function abrirCadastroCatalogoNovaAba() {
    const rota = obterRotaCadastroCatalogo();

    window.open(rota, '_blank', 'noopener,noreferrer');
  }

  async function atualizarListaCatalogoModal() {
    await carregarCatalogos();
    toast.success('Lista atualizada.');
  }

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

  function abrirModalBuscarOS() {
    setModalBuscarOSAberto(true);
    buscarOrdensAntigas();
  }

  function fecharModalBuscarOS() {
    setModalBuscarOSAberto(false);
  }

  function atualizarFiltroBuscaOS(campo, valor) {
    setFiltrosBuscaOS((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

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

  function limparFiltrosBuscaOS() {
    setFiltrosBuscaOS(filtrosBuscaOSInicial);
    setOrdensEncontradas([]);
  }

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

  function carregarOrdemNaTela(os) {
    const veiculo = os.veiculo || {};
    const cliente = veiculo.cliente || {};

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
      cliente: {
        id: cliente.id || '',
        nome: cliente.nome || '',
      },
      veiculo: {
        id: veiculo.id || os.veiculoId || '',
        placa: veiculo.placa || '',
        marca: veiculo.fabricante || '',
        modelo: veiculo.modelo || '',
        ano: montarAnoVeiculo(veiculo),
        motor: veiculo.motor || '',
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

  function editarOrdemAtual() {
    setModoTela('edicao');
  }

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

  function voltarPagina() {
    navigate(-1);
  }

  function alternarFornecedorCotacao(id) {
    setFornecedoresCotacao((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function obterPecasValidasParaCotacao() {
    return pecasParaCotacao.filter((peca) => {
      const descricao = String(peca.descricao || '').trim();
      const quantidade = Number(peca.quantidade || 0);

      return descricao && quantidade > 0;
    });
  }

  function normalizarTelefoneWhatsApp(telefone) {
    if (!telefone) return '';

    const apenasNumeros = String(telefone).replace(/\D/g, '');

    if (!apenasNumeros) return '';

    if (apenasNumeros.startsWith('55')) {
      return apenasNumeros;
    }

    return `55${apenasNumeros}`;
  }

  function montarNomeVeiculoCotacao() {
    return [ordem.veiculo.marca, ordem.veiculo.modelo, ordem.veiculo.ano]
      .filter(Boolean)
      .join(' ');
  }

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
Chassi: ${ordem.veiculo.chassi || '-'}

Peças necessárias:

${linhasPecas}
 

Pode me enviar os valores e disponibilidade, por favor?`;
  }

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
                    {veiculo.modelo || '-'} | {montarAnoVeiculo(veiculo) || '-'}
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