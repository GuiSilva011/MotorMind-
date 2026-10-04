import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/Layout';
import ModalOficina from '../../components/ModalOficina';
import SeletorTema from '../../components/SeletorTema';
import useTemaOficina from '../../hooks/useTemaOficina';
import { FiArrowLeft, FiEdit2, FiEye, FiMapPin, FiPlus, FiSave, FiTrash2, FiUser, FiX } from 'react-icons/fi';
import { TbCar } from 'react-icons/tb';
import '../../styles/operadorStyles/clientes.css';
import '../../styles/operadorStyles/cadastroClientes.css';


/**
 * Estado inicial do formulário de cadastro de cliente.
 *
 * @constant {Object}
 */
const formClienteCadastro = {
  nome: '',
  cpf: '',
  email: '',
  dataNascimento: '',
  cep: '',
  endereco: '',
  bairro: '',
  cidade: '',
  uf: '',
  numero: '',
  complemento: '',
  celular: '',
};

/**
 * Opções disponíveis para o campo de câmbio do veículo.
 *
 * @constant {string[]}
 */
const opcoesCambio = [
  'Manual',
  'Automático Convencional',
  'CVT',
  'Automatizado',
  'Dupla Embreagem',
];

/**
 * Estado inicial do formulário de veículo.
 *
 * @constant {Object}
 */
const veiculoInicial = {
  id: null,
  placa: '',
  chassi: '',
  modelo: '',
  fabricante: '',
  ano_modelo: '',
  ano_fabricacao: '',
  motor: '',
  km: '',
  cor: '',
  ar: '',
  Cambio: '',
  _remover: false,
};

/**
 * Formata uma data para o padrão aceito por inputs do tipo date.
 *
 * @param {string|Date} value - Data que será formatada.
 * @returns {string} Data no formato yyyy-mm-dd ou string vazia.
 */
function formatDateInput(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

/**
 * Converte um valor booleano para string usada em campos select.
 *
 * @param {boolean|string|null|undefined} value - Valor que será convertido.
 * @returns {string} Valor convertido para o select.
 */
function formatBooleanToSelect(value) {
  if (value === null || value === undefined || value === '') return '';
  return value ? 'true' : 'false';
}

/**
 * Tela responsável pelo cadastro, edição e visualização de clientes,
 * incluindo os veículos vinculados ao cliente.
 *
 * @component
 * @function CadastroCliente
 * @returns {JSX.Element} Tela de cadastro de cliente.
 */
function CadastroCliente() {
  const [tema, setTema] = useTemaOficina();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const idBusca = searchParams.get('id');
  const nomeBusca = searchParams.get('nome');
  const isVisualizacao = searchParams.get('visualizar') === '1';
  const clienteRecebido = location.state?.cliente || null;

  const [formData, setFormData] = useState(formClienteCadastro);
  const [clienteEmEdicaoId, setClienteEmEdicaoId] = useState(null);
  const [podeExcluirCliente, setPodeExcluirCliente] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [veiculos, setVeiculos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [novoVeiculo, setNovoVeiculo] = useState(veiculoInicial);
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [loadingCliente, setLoadingCliente] = useState(false);

/**
 * Lista de veículos visíveis, removendo os veículos marcados para exclusão.
 *
 * @type {Array<Object>}
 */
  const veiculosVisiveis = useMemo(
    () => veiculos.filter((veiculo) => !veiculo._remover),
    [veiculos]
  );

/**
 * Remove todos os caracteres que não sejam números.
 *
 * @param {string} value - Valor original.
 * @returns {string} Valor contendo apenas números.
 */
  function onlyNumbers(value) {
    return String(value || '').replace(/\D/g, '');
  }

/**
 * Converte a primeira letra de cada palavra para maiúscula.
 *
 * @param {string} value - Texto original.
 * @returns {string} Texto capitalizado.
 */
  function capitalizeWords(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

/**
 * Formata a placa do veículo, removendo caracteres inválidos.
 *
 * @param {string} value - Placa digitada.
 * @returns {string} Placa formatada.
 */
  function maskPlaca(value) {
    return String(value || '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 7);
  }

/**
 * Limita o ano a quatro dígitos numéricos.
 *
 * @param {string} value - Ano digitado.
 * @returns {string} Ano formatado.
 */
  function maskAno(value) {
    return String(value || '').replace(/\D/g, '').slice(0, 4);
  }

/**
 * Formata o chassi do veículo, removendo espaços e limitando a 17 caracteres.
 *
 * @param {string} value - Chassi digitado.
 * @returns {string} Chassi formatado.
 */
  function maskChassi(value) {
    return String(value || '').replace(/\s/g, '').toUpperCase().slice(0, 17);
  }

/**
 * Aplica a formatação correspondente ao campo do veículo.
 *
 * @param {string} name - Nome do campo do veículo.
 * @param {string} value - Valor digitado.
 * @returns {string} Valor formatado.
 */
  function formatVeiculoField(name, value) {
    const map = {
      placa: maskPlaca,
      chassi: maskChassi,
      ano_modelo: maskAno,
      ano_fabricacao: maskAno,
      modelo: capitalizeWords,
      fabricante: capitalizeWords,
      motor: (v) => String(v || '').toUpperCase(),
      cor: capitalizeWords,
    };

    return map[name] ? map[name](value) : value;
  }

  
/**
 * Converte os dados de um veículo vindo da API para o formato usado na tela.
 *
 * @param {Object} veiculo - Veículo retornado pela API.
 * @returns {Object} Veículo preparado para exibição ou edição.
 */
  function mapearVeiculoParaTela(veiculo) {
    return {
      id: veiculo.id || null,
      placa: veiculo.placa || '',
      chassi: veiculo.chassi || '',
      modelo: veiculo.modelo || '',
      fabricante: veiculo.fabricante || '',
      ano_modelo: veiculo.ano_modelo ? String(veiculo.ano_modelo) : '',
      ano_fabricacao: veiculo.ano_fabricacao
        ? String(veiculo.ano_fabricacao)
        : '',
      motor: veiculo.motor || '',
      km: veiculo.km || '',
      cor: veiculo.cor || '',
      ar: veiculo.ar,
      Cambio: veiculo.Cambio || veiculo.cambio || '',
      _remover: false,
    };
  }

/**
 * Preenche o formulário com os dados de um cliente selecionado.
 *
 * @param {Object} cliente - Cliente retornado pela API ou recebido pela navegação.
 * @returns {void}
 */
  function preencherClienteNaTela(cliente) {
    if (!cliente) return;

    setClienteEmEdicaoId(cliente.id || null);
    setPodeExcluirCliente(cliente.podeExcluir === true);

    setFormData({
      nome: cliente.nome || '',
      cpf: cliente.cpf ? maskCPF(String(cliente.cpf)) : '',
      email: cliente.email || '',
      dataNascimento: formatDateInput(cliente.dataNascimento),
      cep: cliente.cep ? maskCEP(String(cliente.cep)) : '',
      endereco: cliente.endereco || '',
      bairro: cliente.bairro || '',
      cidade: cliente.cidade || '',
      uf: cliente.uf || '',
      numero: cliente.numero || '',
      complemento: cliente.complemento || '',
      celular: cliente.celular ? maskPhone(String(cliente.celular)) : '',
    });

    setVeiculos((cliente.veiculos || []).map(mapearVeiculoParaTela));
  }

/**
 * Atualiza os campos do veículo temporário aberto no modal.
 *
 * @param {Object} event - Evento de alteração do campo.
 * @returns {void}
 */
  function handleVeiculoChange(event) {
    if (isVisualizacao) return;

    const { name, value } = event.target;

    setNovoVeiculo((prevState) => ({
      ...prevState,
      [name]: formatVeiculoField(name, value),
    }));
  }

/**
 * Abre o modal para cadastro de um novo veículo.
 *
 * @returns {void}
 */
  function abrirModalNovoVeiculo() {
    if (isVisualizacao) return;

    setNovoVeiculo(veiculoInicial);
    setEditandoIndex(null);
    setModalOpen(true);
    setMensagem('');
  }
  
/**
 * Fecha o modal de veículo e limpa os dados temporários.
 *
 * @returns {void}
 */
  function fecharModalVeiculo() {
    setModalOpen(false);
    setNovoVeiculo(veiculoInicial);
    setEditandoIndex(null);
  }


  function editarVeiculo(indexOriginal) {
    const veiculoSelecionado = veiculos[indexOriginal];
    /**
 * Adiciona um novo veículo ou atualiza um veículo já existente na lista local.
 *
 * @returns {void}
 */
    setNovoVeiculo({
      ...veiculoSelecionado,
      ar: formatBooleanToSelect(veiculoSelecionado.ar),
      Cambio: veiculoSelecionado.Cambio || veiculoSelecionado.cambio || '',
    });

    setEditandoIndex(indexOriginal);
    setModalOpen(true);
    setMensagem('');
  }

/**
 * Carrega os dados do cliente quando a tela está em modo de edição ou visualização.
 *
 * @async
 * @returns {Promise<void>}
 */
  useEffect(() => {
    async function carregarClienteEmEdicao() {
      if (!idBusca && !nomeBusca && !clienteRecebido) {
        setClienteEmEdicaoId(null);
        return;
      }

      setLoadingCliente(true);
      setMensagem('');

      try {
        if (clienteRecebido) {
          preencherClienteNaTela(clienteRecebido);
          return;
        }

        if (idBusca) {
          try {
            const { data } = await api.get(`/clientes/${idBusca}`);
            preencherClienteNaTela(data);
            return;
          } catch (error) {
            console.warn(
              'Não foi possível buscar cliente por ID. Tentando lista de clientes.',
              error
            );

            const { data } = await api.get('/clientes');
            const clienteEncontrado = Array.isArray(data)
              ? data.find((cliente) => Number(cliente.id) === Number(idBusca))
              : null;

            if (!clienteEncontrado) {
              throw error;
            }

            preencherClienteNaTela(clienteEncontrado);
            return;
          }
        }

        const { data } = await api.get('/clientes/buscar-por-nome', {
          params: { nome: nomeBusca },
        });

        preencherClienteNaTela(data);
      } catch (error) {
        console.error(error);
        setClienteEmEdicaoId(null);
        setMensagem('Não foi possível carregar os dados do cliente para edição.');
      } finally {
        setLoadingCliente(false);
      }
    }

    carregarClienteEmEdicao();
  }, [idBusca, nomeBusca, clienteRecebido]);

  // Adiciona um veiculo novo ou substitui o veiculo em edicao.
  function adicionarVeiculo() {
    if (isVisualizacao) return;

    if (!novoVeiculo.placa) {
      setMensagem('Preencha pelo menos a placa do veículo.');
      return;
    }

    const veiculoFormatado = {
      ...novoVeiculo,
      id: novoVeiculo.id || null,
      chassi: novoVeiculo.chassi || null,
      modelo: novoVeiculo.modelo || null,
      fabricante: novoVeiculo.fabricante || null,
      ano_modelo: novoVeiculo.ano_modelo || null,
      ano_fabricacao: novoVeiculo.ano_fabricacao || null,
      motor: novoVeiculo.motor || null,
      km: novoVeiculo.km || null,
      cor: novoVeiculo.cor || null,
      Cambio: novoVeiculo.Cambio || null,
      ar: novoVeiculo.ar === '' ? null : novoVeiculo.ar === 'true',
      _remover: false,
    };

    if (editandoIndex !== null) {
      setVeiculos((prevState) =>
        prevState.map((veiculo, index) =>
          index === editandoIndex ? veiculoFormatado : veiculo
        )
      );
    } else {
      setVeiculos((prevState) => [...prevState, veiculoFormatado]);
    }

    setNovoVeiculo(veiculoInicial);
    setEditandoIndex(null);
    setModalOpen(false);
    setMensagem('');
  }

/**
 * Remove um veículo novo da lista local ou marca um veículo salvo para remoção.
 *
 * @param {number} indexOriginal - Índice original do veículo na lista.
 * @returns {void}
 */
  function removerVeiculo(indexOriginal) {
    if (isVisualizacao) return;

    const confirmar = window.confirm('Deseja remover este veículo?');

    if (!confirmar) return;

    setVeiculos((prevState) => {
      const veiculo = prevState[indexOriginal];

      // Veículo novo, ainda não salvo no banco: remove direto da tela.
      if (!veiculo?.id) {
        return prevState.filter((_, index) => index !== indexOriginal);
      }

      // Veículo já salvo no banco: marca para remoção no backend.
      return prevState.map((item, index) =>
        index === indexOriginal
          ? {
              ...item,
              _remover: true,
            }
          : item
      );
    });

    setMensagem('Veículo marcado para remoção. Clique em "Salvar alterações" para confirmar.');
  }

/**
 * Aplica máscara de CPF.
 *
 * @param {string} value - CPF digitado.
 * @returns {string} CPF formatado.
 */
  function maskCPF(value) {
    const numbers = onlyNumbers(value).slice(0, 11);

    return numbers
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

/**
 * Aplica máscara de telefone ou celular.
 *
 * @param {string} value - Telefone digitado.
 * @returns {string} Telefone formatado.
 */
  function maskPhone(value) {
    const numbers = onlyNumbers(value).slice(0, 11);

    if (numbers.length <= 10) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }

    return numbers
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }

/**
 * Aplica máscara de CEP.
 *
 * @param {string} value - CEP digitado.
 * @returns {string} CEP formatado.
 */
  function maskCEP(value) {
    const numbers = onlyNumbers(value).slice(0, 8);
    return numbers.replace(/^(\d{5})(\d)/, '$1-$2');
  }

/**
 * Formata a UF com até duas letras maiúsculas.
 *
 * @param {string} value - UF digitada.
 * @returns {string} UF formatada.
 */
  function maskUF(value) {
    return String(value || '').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
  }

/**
 * Limita o número do endereço a dígitos.
 *
 * @param {string} value - Número digitado.
 * @returns {string} Número formatado.
 */
  function maskNumero(value) {
    return onlyNumbers(value).slice(0, 6);
  }

/**
 * Escolhe e aplica a máscara correspondente ao campo alterado.
 *
 * @param {string} name - Nome do campo.
 * @param {string} value - Valor digitado.
 * @returns {string} Valor formatado.
 */
  function applyMask(name, value) {
    const maskMap = {
      cpf: maskCPF,
      celular: maskPhone,
      cep: maskCEP,
      uf: maskUF,
      numero: maskNumero,
    };

    return maskMap[name] ? maskMap[name](value) : value;
  }

/**
 * Atualiza os campos do formulário principal aplicando máscara quando necessário.
 *
 * @param {Object} event - Evento de alteração do campo.
 * @returns {void}
 */
  function handleChange(event) {
    if (isVisualizacao) return;

    const { name, value } = event.target;

    setFormData((prevState) => ({
      ...prevState,
      [name]: applyMask(name, value),
    }));
  }

 /**
 * Limpa o formulário e retorna para a tela adequada quando necessário.
 *
 * @returns {void}
 */
  function limparFormulario() {
    setFormData(formClienteCadastro);
    setVeiculos([]);
    setNovoVeiculo(veiculoInicial);
    setMensagem('');
    setModalOpen(false);
    setEditandoIndex(null);

    if (isVisualizacao) {
      navigate('/operador/clientes/consultar', { replace: true });
      return;
    }

    if (idBusca || nomeBusca) {
      navigate('/operador/clientes/cadastro', { replace: true });
    }
  }

/**
 * Exclui o cliente atual após confirmação do usuário.
 *
 * @async
 * @returns {Promise<void>}
 */
  async function handleExcluirCliente() {
    if (!clienteEmEdicaoId) {
      setMensagem('Não foi possível identificar o cliente para exclusão.');
      return;
    }

    const confirmar = window.confirm('Tem certeza que deseja excluir?');

    if (!confirmar) {
      return;
    }

    try {
      await api.delete(`/clientes/${clienteEmEdicaoId}`);
      navigate('/operador/clientes/consultar', {
        replace: true,
        state: {
          refresh: true,
          toast: {
            type: 'success',
            text: 'Cliente excluído com sucesso.',
          },
        },
      });
    } catch (error) {
      console.error(error);
      setMensagem(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao excluir cliente.'
      );
    }
  }

/**
 * Envia para a API o cadastro ou atualização do cliente e de seus veículos.
 *
 * @async
 * @param {Object} event - Evento de envio do formulário.
 * @returns {Promise<void>}
 */
  async function handleSubmit(event) {
    event.preventDefault();

    if (isVisualizacao) {
      return;
    }

    try {
      const payload = {
        ...formData,
        cpf: formData.cpf.replace(/\D/g, '') || null,
        celular: formData.celular.replace(/\D/g, '') || null,
        cep: formData.cep.replace(/\D/g, '') || null,
        dataNascimento: formData.dataNascimento || null,
        veiculos: veiculos.map((veiculo) => ({
          id: veiculo.id || null,
          placa: veiculo.placa,
          chassi: veiculo.chassi,
          modelo: veiculo.modelo,
          fabricante: veiculo.fabricante,
          ano_modelo: veiculo.ano_modelo,
          ano_fabricacao: veiculo.ano_fabricacao,
          motor: veiculo.motor,
          km: veiculo.km,
          cor: veiculo.cor,
          ar: veiculo.ar,
          Cambio: veiculo.Cambio || veiculo.cambio || null,
          _remover: veiculo._remover || false,
        })),
      };

      if (clienteEmEdicaoId) {
        await api.put(`/clientes/${clienteEmEdicaoId}`, payload);
        navigate('/operador/clientes/consultar', {
          replace: true,
          state: {
            refresh: true,
            toast: {
              type: 'success',
              text: 'Cliente atualizado com sucesso.',
            },
          },
        });
        return;
      }

      await api.post('/clientes', payload);
      setMensagem('Cliente cadastrado com sucesso!');
      limparFormulario();
    } catch (error) {
      console.error(error);
      setMensagem(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          (clienteEmEdicaoId
            ? 'Erro ao atualizar cliente.'
            : 'Erro ao cadastrar cliente.')
      );
    }
  }

  return (
    <Layout className="oficina-theme clientes-workspace" theme={tema}
      topbarActions={<SeletorTema tema={tema} onChange={setTema} />}>
      <main className="clientes-cadastro oficina-page" aria-labelledby="clientes-cadastro-title">
        <header className="oficina-page-header">
          <div>
            <h1 id="clientes-cadastro-title">
              {isVisualizacao
                ? 'Visualizar Cliente'
                : clienteEmEdicaoId
                ? 'Editar Cliente'
                : 'Cadastro de Clientes'}
            </h1>

            <p>
              {isVisualizacao
                ? 'Confira os dados do cliente e dos veículos cadastrados.'
                : clienteEmEdicaoId
                ? 'Atualize os dados do cliente e dos veículos cadastrados.'
                : 'Preencha os dados do cliente'}
            </p>
          </div>
        </header>

        {isVisualizacao && (
          <div className="clientes-view-banner">
            <FiEye aria-hidden="true" />
            Modo visualização: para alterar dados, clique em "Editar".
          </div>
        )}

        {loadingCliente && (
          <p className="clientes-feedback" role="status">Carregando dados do cliente...</p>
        )}

        {mensagem && !modalOpen && <p className="clientes-feedback" role="status">{mensagem}</p>}

        <form className="clientes-form" onSubmit={handleSubmit}>
          <section className="oficina-panel" aria-labelledby="clientes-dados-title">
            <h2 id="clientes-dados-title" className="oficina-section-heading clientes-section-title">
              <FiUser aria-hidden="true" />
              Dados do cliente
            </h2>

            <div className="oficina-form-grid clientes-grid clientes-grid-2">
              <div className="oficina-field">
                <label htmlFor="nome">Nome completo</label>
                <input
                  id="nome"
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  readOnly={isVisualizacao}
                  required
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="dataNascimento">Data de nascimento</label>
                <input
                  id="dataNascimento"
                  type="date"
                  name="dataNascimento"
                  value={formData.dataNascimento}
                  onChange={handleChange}
                  disabled={isVisualizacao}
                />
              </div>
            </div>

            <div className="oficina-form-grid clientes-grid clientes-grid-3">
              <div className="oficina-field">
                <label htmlFor="cpf">CPF</label>
                <input
                  id="cpf"
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  maxLength={14}
                  readOnly={isVisualizacao}
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="celular">Celular</label>
                <input
                  id="celular"
                  type="text"
                  name="celular"
                  value={formData.celular}
                  onChange={handleChange}
                  maxLength={15}
                  readOnly={isVisualizacao}
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  readOnly={isVisualizacao}
                />
              </div>
            </div>
          </section>

          <section className="oficina-panel" aria-labelledby="clientes-endereco-title">
            <h2 id="clientes-endereco-title" className="oficina-section-heading clientes-section-title">
              <FiMapPin aria-hidden="true" />
              Endereço
            </h2>

            <div className="oficina-form-grid clientes-grid clientes-address-grid">
              <div className="oficina-field">
                <label htmlFor="cep">CEP</label>

                  <input
                    id="cep"
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleChange}
                    maxLength={9}
                    readOnly={isVisualizacao}
                  />

              </div>

              <div className="oficina-field clientes-col-2">
                <label htmlFor="endereco">Endereço</label>
                <input
                  id="endereco"
                  type="text"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  readOnly={isVisualizacao}
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="numero">Número</label>
                <input
                  id="numero"
                  type="text"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  maxLength={6}
                  readOnly={isVisualizacao}
                />
              </div>
            </div>

            <div className="oficina-form-grid clientes-grid clientes-grid-3">
              <div className="oficina-field">
                <label htmlFor="bairro">Bairro</label>
                <input
                  id="bairro"
                  type="text"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleChange}
                  readOnly={isVisualizacao}
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="cidade">Cidade</label>
                <input
                  id="cidade"
                  type="text"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  readOnly={isVisualizacao}
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="uf">UF</label>
                <input
                  id="uf"
                  type="text"
                  name="uf"
                  value={formData.uf}
                  onChange={handleChange}
                  maxLength={2}
                  readOnly={isVisualizacao}
                />
              </div>
            </div>

            <div className="oficina-form-grid clientes-grid">
              <div className="oficina-field">
                <label htmlFor="complemento">Complemento</label>
                <input
                  id="complemento"
                  type="text"
                  name="complemento"
                  placeholder="Apartamento, bloco, referência..."
                  value={formData.complemento}
                  onChange={handleChange}
                  readOnly={isVisualizacao}
                />
              </div>
            </div>
          </section>

          <section className="oficina-panel" aria-labelledby="clientes-veiculos-title">
            <div className="clientes-veiculos-header">
              <h2 id="clientes-veiculos-title" className="oficina-section-heading">
                <TbCar aria-hidden="true" />
                Veículos do cliente
                <span className="oficina-badge">{veiculosVisiveis.length}</span>
              </h2>

              {!isVisualizacao && (
                <button
                  type="button"
                  className="oficina-btn"
                  onClick={abrirModalNovoVeiculo}
                >
                  <FiPlus aria-hidden="true" />Adicionar veículo
                </button>
              )}
            </div>

              {veiculosVisiveis.length === 0 ? (
                <div className="oficina-empty-state">
                  <TbCar aria-hidden="true" />
                  <h3>Nenhum veículo cadastrado</h3>
                  <p>{isVisualizacao ? 'Este cliente ainda não possui veículos cadastrados.' : 'Clique em Adicionar veículo para incluir.'}</p>
                </div>
              ) : (
                <div className="oficina-table-wrap">
                  <table className="oficina-table clientes-veiculos-table">
                    <thead><tr>
                      <th scope="col">Placa</th><th scope="col">Chassi</th>
                      <th scope="col">Fabricante / Modelo</th><th scope="col">Motor</th>
                      <th scope="col">Câmbio</th><th scope="col">Km</th>
                      <th scope="col">Ano Fab.</th><th scope="col">Ano Modelo</th>
                      <th scope="col">Cor</th><th scope="col">Ar-cond.</th><th scope="col">Ações</th>
                    </tr></thead>
                    <tbody>
                      {veiculos.map((veiculo, index) => {
                        if (veiculo._remover) return null;

                        return (
                          <tr key={veiculo.id || index}>
                            <td data-label="Placa"><span className="clientes-placa">{veiculo.placa || '-'}</span></td>
                            <td data-label="Chassi">{veiculo.chassi || '-'}</td>
                            <td data-label="Fabricante / Modelo">
                              {veiculo.fabricante || '-'} / {veiculo.modelo || '-'}
                            </td>
                            <td data-label="Motor">{veiculo.motor || '-'}</td>
                            <td data-label="Câmbio">{veiculo.Cambio || veiculo.cambio || '-'}</td>
                            <td data-label="Km">{veiculo.km || '-'}</td>
                            <td data-label="Ano Fab.">{veiculo.ano_fabricacao || '-'}</td>
                            <td data-label="Ano Modelo">{veiculo.ano_modelo || '-'}</td>
                            <td data-label="Cor">{veiculo.cor || '-'}</td>
                            <td data-label="Ar-cond.">
                              {veiculo.ar === null
                                ? '-'
                                : veiculo.ar
                                ? 'Sim'
                                : 'Não'}
                            </td>

                            <td data-label="Ações"><div className="oficina-row-actions">
                              <button
                                type="button"
                                className="oficina-btn"
                                aria-label={`${isVisualizacao ? 'Ver' : 'Editar'} veículo ${veiculo.placa}`}
                                onClick={() => editarVeiculo(index)}
                              >
                                {isVisualizacao ? <FiEye aria-hidden="true" /> : <FiEdit2 aria-hidden="true" />}
                                {isVisualizacao ? 'Ver' : 'Editar'}
                              </button>

                              {!isVisualizacao && (
                                <button
                                  type="button"
                                  className="oficina-btn oficina-btn-danger"
                                  aria-label={`Remover veículo ${veiculo.placa}`}
                                  onClick={() => removerVeiculo(index)}
                                >
                                  <FiTrash2 aria-hidden="true" />Remover
                                </button>
                              )}
                            </div></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
          </section>

          <div className="oficina-form-actions clientes-form-actions">
            <button
              type="button"
              className="oficina-btn"
              onClick={limparFormulario}
            >
              {isVisualizacao ? <FiArrowLeft aria-hidden="true" /> : <FiX aria-hidden="true" />}
              {isVisualizacao ? 'Voltar' : 'Cancelar'}
            </button>

            {isVisualizacao ? (
              <>
                <button
                  type="button"
                  className="oficina-btn oficina-btn-primary"
                  onClick={() =>
                    navigate(
                      `/operador/clientes/cadastro?id=${clienteEmEdicaoId || idBusca}`
                    )
                  }
                >
                  <FiEdit2 aria-hidden="true" />Editar
                </button>

                {clienteEmEdicaoId && podeExcluirCliente && !loadingCliente && (
                  <button
                    type="button"
                    className="oficina-btn oficina-btn-danger"
                    onClick={handleExcluirCliente}
                  >
                    <FiTrash2 aria-hidden="true" />Excluir
                  </button>
                )}
              </>
            ) : (
              <button type="submit" className="oficina-btn oficina-btn-primary">
                <FiSave aria-hidden="true" />
                {clienteEmEdicaoId ? 'Salvar alterações' : 'Cadastrar cliente'}
              </button>
            )}
          </div>

        </form>
      </main>

      {modalOpen && (
        <ModalOficina onClose={fecharModalVeiculo} labelledBy="clientes-modal-title" className="clientes-veiculo-modal">
          <div className="clientes-modal-header">
            <h2 id="clientes-modal-title" className="oficina-section-heading">
              <TbCar aria-hidden="true" />
              {isVisualizacao ? 'Dados do veículo' : editandoIndex !== null ? 'Editar veículo' : 'Adicionar veículo'}
            </h2>
            <button type="button" className="oficina-btn clientes-modal-close" onClick={fecharModalVeiculo} aria-label="Fechar dados do veículo"><FiX aria-hidden="true" /></button>
          </div>

            {mensagem && <p className="clientes-feedback" role="status">{mensagem}</p>}
            <div className="oficina-form-grid clientes-modal-grid">
              <div className="oficina-field">
                <label htmlFor="placa">Placa</label>
                <input
                  id="placa"
                  name="placa"
                  placeholder="ABC1D23"
                  value={novoVeiculo.placa}
                  onChange={handleVeiculoChange}
                  maxLength={7}
                  readOnly={isVisualizacao}
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="chassi">Chassi</label>
                <input
                  id="chassi"
                  name="chassi"
                  value={novoVeiculo.chassi || ''}
                  onChange={handleVeiculoChange}
                  maxLength={17}
                  readOnly={isVisualizacao}
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fabricante">Fabricante</label>
                <input
                  id="fabricante"
                  name="fabricante"
                  value={novoVeiculo.fabricante || ''}
                  onChange={handleVeiculoChange}
                  readOnly={isVisualizacao}
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="modelo">Modelo</label>
                <input
                  id="modelo"
                  name="modelo"
                  value={novoVeiculo.modelo || ''}
                  onChange={handleVeiculoChange}
                  readOnly={isVisualizacao}
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="ano_fabricacao">Ano fabricação</label>
                <input
                  id="ano_fabricacao"
                  name="ano_fabricacao"
                  value={novoVeiculo.ano_fabricacao || ''}
                  onChange={handleVeiculoChange}
                  maxLength={4}
                  readOnly={isVisualizacao}
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="ano_modelo">Ano modelo</label>
                <input
                  id="ano_modelo"
                  name="ano_modelo"
                  value={novoVeiculo.ano_modelo || ''}
                  onChange={handleVeiculoChange}
                  maxLength={4}
                  readOnly={isVisualizacao}
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="motor">Motor</label>
                <input
                  id="motor"
                  name="motor"
                  placeholder="Ex.: 1.0"
                  value={novoVeiculo.motor || ''}
                  onChange={handleVeiculoChange}
                  readOnly={isVisualizacao}
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="Cambio">Câmbio</label>
                <select
                  id="Cambio"
                  name="Cambio"
                  value={novoVeiculo.Cambio || ''}
                  onChange={handleVeiculoChange}
                  disabled={isVisualizacao}
                >
                  <option value="">Selecione o câmbio</option>
                  {opcoesCambio.map((opcao) => (
                    <option key={opcao} value={opcao}>
                      {opcao}
                    </option>
                  ))}
                </select>
              </div>

              <div className="oficina-field">
                <label htmlFor="km">Quilometragem</label>
                <input
                  id="km"
                  name="km"
                  value={novoVeiculo.km || ''}
                  onChange={handleVeiculoChange}
                  readOnly={isVisualizacao}
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="cor">Cor</label>
                <input
                  id="cor"
                  name="cor"
                  value={novoVeiculo.cor || ''}
                  onChange={handleVeiculoChange}
                  readOnly={isVisualizacao}
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="ar">Ar-condicionado</label>
                <select
                  id="ar"
                  name="ar"
                  value={novoVeiculo.ar}
                  onChange={handleVeiculoChange}
                  disabled={isVisualizacao}
                >
                  <option value="">Não informado</option>
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </div>
            </div>

            <div className="oficina-form-actions clientes-modal-actions">
              <button
                type="button"
                className="oficina-btn"
                onClick={fecharModalVeiculo}
              >
                {isVisualizacao ? 'Fechar' : 'Cancelar'}
              </button>

              {!isVisualizacao && (
                <button
                  type="button"
                  className="oficina-btn oficina-btn-primary"
                  onClick={adicionarVeiculo}
                >
                  <FiSave aria-hidden="true" />{editandoIndex !== null ? 'Atualizar' : 'Salvar'}
                </button>
              )}
            </div>
        </ModalOficina>
      )}
    </Layout>
  );
}

export default CadastroCliente;
