import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/Layout';
import '../../styles/operadorStyles/layout.css';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const idBusca = searchParams.get('id');
  const nomeBusca = searchParams.get('nome');
  const isVisualizacao = searchParams.get('visualizar') === '1';
  const clienteRecebido = location.state?.cliente || null;

  const [formData, setFormData] = useState(formClienteCadastro);
  const [clienteEmEdicaoId, setClienteEmEdicaoId] = useState(null);
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
    <Layout>
      <main className="cadastro-content">
        <div className="cadastro-header">
          <h1>
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

        {isVisualizacao && (
          <div className="view-mode-banner">
            Modo visualização: para alterar dados, clique em "Editar".
          </div>
        )}

        {loadingCliente && (
          <p className="form-message info">Carregando dados do cliente...</p>
        )}

        {mensagem && <p className="toast-message">{mensagem}</p>}

        <form className="cadastro-form" onSubmit={handleSubmit}>
          <section className="form-section">
            <h2>
              <img
                src="/icons/cadastrar-cliente.svg"
                alt="Ícone dados do cliente"
                className="section-icon"
              />
              Dados do cliente
            </h2>

            <div className="form-grid two-columns">
              <div className="field-group">
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

              <div className="field-group">
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

            <div className="form-grid three-columns">
              <div className="field-group">
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

              <div className="field-group">
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

              <div className="field-group">
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

          <section className="form-section">
            <h2>
              <img
                src="/icons/endereco.svg"
                alt="Ícone endereço"
                className="section-icon"
              />
              Endereço
            </h2>

            <div className="form-grid address-grid">
              <div className="field-group">
                <label htmlFor="cep">CEP</label>

                <div className="input-with-icon">
                  <input
                    id="cep"
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleChange}
                    maxLength={9}
                    readOnly={isVisualizacao}
                  />

                  <img
                    src="/icons/busca.svg"
                    alt="Ícone busca"
                    className="search-icon"
                  />
                </div>
              </div>

              <div className="field-group field-span-2">
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

              <div className="field-group">
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

            <div className="form-grid three-columns">
              <div className="field-group">
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

              <div className="field-group">
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

              <div className="field-group">
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

            <div className="form-grid one-column">
              <div className="field-group">
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

          <section className="form-section">
            <div className="veiculos-header-flex">
              <h2>
                <img
                  src="/icons/veiculo.svg"
                  alt="Ícone veículos"
                  className="section-icon"
                />
                Veículos do cliente
              </h2>

              {!isVisualizacao && (
                <button
                  type="button"
                  className="add-veiculo-btn"
                  onClick={abrirModalNovoVeiculo}
                >
                  + Adicionar veículo
                </button>
              )}
            </div>

            <div className="veiculos-box">
              <div className="veiculos-table-header">
                <span>Placa</span>
                <span>Chassi</span>
                <span>Fabricante / Modelo</span>
                <span>Motor</span>
                <span>Câmbio</span>
                <span>Km</span>
                <span>Ano Fab.</span>
                <span>Ano Modelo</span>
                <span>Cor</span>
                <span>Ar-cond.</span>
                <span>Ações</span>
              </div>

              {veiculosVisiveis.length === 0 ? (
                <div className="veiculos-empty">
                  <div className="empty-icon">
                    <img
                      src="/icons/veiculo-vazio.svg"
                      alt="Nenhum veículo"
                      className="empty-icon-image"
                    />
                  </div>

                  <p>Nenhum veículo cadastrado</p>
                  <small>Clique em "Adicionar veículo" para incluir.</small>
                </div>
              ) : (
                veiculos.map((veiculo, index) => {
                  if (veiculo._remover) return null;

                  return (
                    <div className="veiculo-row" key={veiculo.id || index}>
                      <span>{veiculo.placa || '-'}</span>
                      <span>{veiculo.chassi || '-'}</span>
                      <span>
                        {veiculo.fabricante || '-'} / {veiculo.modelo || '-'}
                      </span>
                      <span>{veiculo.motor || '-'}</span>
                      <span>{veiculo.Cambio || veiculo.cambio || '-'}</span>
                      <span>{veiculo.km || '-'}</span>
                      <span>{veiculo.ano_fabricacao || '-'}</span>
                      <span>{veiculo.ano_modelo || '-'}</span>
                      <span>{veiculo.cor || '-'}</span>
                      <span>
                        {veiculo.ar === null
                          ? '-'
                          : veiculo.ar
                          ? 'Sim'
                          : 'Não'}
                      </span>

                      <div className="veiculo-acoes">
                        <button
                          type="button"
                          className="btn-editar-veiculo"
                          onClick={() => editarVeiculo(index)}
                        >
                          {isVisualizacao ? 'Ver' : 'Editar'}
                        </button>

                        {!isVisualizacao && (
                          <button
                            type="button"
                            className="btn-remover-veiculo"
                            onClick={() => removerVeiculo(index)}
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={limparFormulario}
            >
              {isVisualizacao ? 'Voltar' : 'Cancelar'}
            </button>

            {isVisualizacao ? (
              <>
                <button
                  type="button"
                  className="btn-edit-cliente"
                  onClick={() =>
                    navigate(
                      `/operador/clientes/cadastro?id=${clienteEmEdicaoId || idBusca}`
                    )
                  }
                >
                  Editar
                </button>

                <button
                  type="button"
                  className="btn-delete-cliente"
                  onClick={handleExcluirCliente}
                >
                  Excluir
                </button>
              </>
            ) : (
              <button type="submit" className="btn-primary">
                {clienteEmEdicaoId ? 'Salvar alterações' : 'Cadastrar cliente'}
              </button>
            )}
          </div>

          {mensagem && <p className="form-message">{mensagem}</p>}
        </form>
      </main>

      {modalOpen && (
        <div className="modal-overlay" onClick={fecharModalVeiculo}>
          <div className="modal-veiculo" onClick={(e) => e.stopPropagation()}>
            <h2>
              {editandoIndex !== null ? 'Editar veículo' : 'Adicionar veículo'}
            </h2>

            <div className="modal-grid">
              <div className="field-group">
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

              <div className="field-group">
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

              <div className="field-group">
                <label htmlFor="fabricante">Fabricante</label>
                <input
                  id="fabricante"
                  name="fabricante"
                  value={novoVeiculo.fabricante || ''}
                  onChange={handleVeiculoChange}
                  readOnly={isVisualizacao}
                />
              </div>

              <div className="field-group">
                <label htmlFor="modelo">Modelo</label>
                <input
                  id="modelo"
                  name="modelo"
                  value={novoVeiculo.modelo || ''}
                  onChange={handleVeiculoChange}
                  readOnly={isVisualizacao}
                />
              </div>

              <div className="field-group">
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

              <div className="field-group">
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

              <div className="field-group">
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

              <div className="field-group">
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

              <div className="field-group">
                <label htmlFor="km">Quilometragem</label>
                <input
                  id="km"
                  name="km"
                  value={novoVeiculo.km || ''}
                  onChange={handleVeiculoChange}
                  readOnly={isVisualizacao}
                />
              </div>

              <div className="field-group">
                <label htmlFor="cor">Cor</label>
                <input
                  id="cor"
                  name="cor"
                  value={novoVeiculo.cor || ''}
                  onChange={handleVeiculoChange}
                  readOnly={isVisualizacao}
                />
              </div>

              <div className="field-group">
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

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={fecharModalVeiculo}
              >
                {isVisualizacao ? 'Fechar' : 'Cancelar'}
              </button>

              {!isVisualizacao && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={adicionarVeiculo}
                >
                  {editandoIndex !== null ? 'Atualizar' : 'Salvar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default CadastroCliente;
