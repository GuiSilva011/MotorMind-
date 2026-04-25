import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import '../styles/cadastroClientes.css';

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
  celular: ''
};

const veiculoInicial = {
  placa: '',
  chassi: '',
  modelo: '',
  fabricante: '',
  ano_modelo: '',
  ano_fabricacao: '',
  motor: '',
  km: '',
  cor: '',
  ar: ''
};

function formatDateInput(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function formatBooleanToSelect(value) {
  if (value === null || value === undefined || value === '') return '';
  return value ? 'true' : 'false';
}

function CadastroCliente() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nomeBusca = searchParams.get('nome');
  const isVisualizacao = searchParams.get('visualizar') === '1';

  const [formData, setFormData] = useState(formClienteCadastro);
  const [clienteEmEdicaoId, setClienteEmEdicaoId] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [veiculos, setVeiculos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [novoVeiculo, setNovoVeiculo] = useState(veiculoInicial);
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [loadingCliente, setLoadingCliente] = useState(false);

  function onlyNumbers(value) {
    return value.replace(/\D/g, '');
  }

  function capitalizeWords(value) {
    return value.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  }

  function maskPlaca(value) {
    return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7);
  }

  function maskAno(value) {
    return value.replace(/\D/g, '').slice(0, 4);
  }

  function maskChassi(value) {
    return value.replace(/\s/g, '').toUpperCase().slice(0, 17);
  }

  function formatVeiculoField(name, value) {
    const map = {
      placa: maskPlaca,
      chassi: maskChassi,
      ano_modelo: maskAno,
      ano_fabricacao: maskAno,
      modelo: capitalizeWords,
      fabricante: capitalizeWords,
      motor: (v) => v.toUpperCase(),
      cor: capitalizeWords
    };

    return map[name] ? map[name](value) : value;
  }

  function handleVeiculoChange(event) {
    if (isVisualizacao) return;

    const { name, value } = event.target;

    setNovoVeiculo((prevState) => ({
      ...prevState,
      [name]: formatVeiculoField(name, value)
    }));
  }

  function abrirModalNovoVeiculo() {
    if (isVisualizacao) return;

    setNovoVeiculo(veiculoInicial);
    setEditandoIndex(null);
    setModalOpen(true);
    setMensagem('');
  }

  function fecharModalVeiculo() {
    setModalOpen(false);
    setNovoVeiculo(veiculoInicial);
    setEditandoIndex(null);
  }

  function editarVeiculo(index) {
    const veiculoSelecionado = veiculos[index];

    setNovoVeiculo({
      ...veiculoSelecionado,
      ar: formatBooleanToSelect(veiculoSelecionado.ar)
    });
    setEditandoIndex(index);
    setModalOpen(true);
    setMensagem('');
  }

  useEffect(() => {
    async function carregarClienteEmEdicao() {
      if (!nomeBusca) {
        setClienteEmEdicaoId(null);
        return;
      }

      setLoadingCliente(true);
      setMensagem('');

      try {
        const { data } = await api.get('/clientes/buscar-por-nome', {
          params: { nome: nomeBusca }
        });

        setClienteEmEdicaoId(data.id);

        setFormData({
          nome: data.nome || '',
          cpf: data.cpf ? maskCPF(String(data.cpf)) : '',
          email: data.email || '',
          dataNascimento: formatDateInput(data.dataNascimento),
          cep: data.cep ? maskCEP(String(data.cep)) : '',
          endereco: data.endereco || '',
          bairro: data.bairro || '',
          cidade: data.cidade || '',
          uf: data.uf || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          celular: data.celular ? maskPhone(String(data.celular)) : ''
        });

        setVeiculos(
          (data.veiculos || []).map((veiculo) => ({
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
            ar: veiculo.ar
          }))
        );
      } catch (error) {
        console.error(error);
        setClienteEmEdicaoId(null);
        setMensagem('Não foi possível carregar os dados do cliente para edição.');
      } finally {
        setLoadingCliente(false);
      }
    }

    carregarClienteEmEdicao();
  }, [nomeBusca]);

  function adicionarVeiculo() {
    if (isVisualizacao) return;

    if (!novoVeiculo.placa) {
      setMensagem('Preencha pelo menos a placa do veículo.');
      return;
    }

    const veiculoFormatado = {
      ...novoVeiculo,
      chassi: novoVeiculo.chassi || null,
      modelo: novoVeiculo.modelo || null,
      fabricante: novoVeiculo.fabricante || null,
      ano_modelo: novoVeiculo.ano_modelo || null,
      ano_fabricacao: novoVeiculo.ano_fabricacao || null,
      motor: novoVeiculo.motor || null,
      km: novoVeiculo.km || null,
      cor: novoVeiculo.cor || null,
      ar:
        novoVeiculo.ar === ''
          ? null
          : novoVeiculo.ar === 'true'
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

  function removerVeiculo(index) {
    if (isVisualizacao) return;

    setVeiculos((prevState) => prevState.filter((_, i) => i !== index));
  }

  function maskCPF(value) {
    const numbers = onlyNumbers(value).slice(0, 11);

    return numbers
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

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

  function maskCEP(value) {
    const numbers = onlyNumbers(value).slice(0, 8);
    return numbers.replace(/^(\d{5})(\d)/, '$1-$2');
  }

  function maskUF(value) {
    return value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
  }

  function maskNumero(value) {
    return onlyNumbers(value).slice(0, 6);
  }

  function applyMask(name, value) {
    const maskMap = {
      cpf: maskCPF,
      celular: maskPhone,
      cep: maskCEP,
      uf: maskUF,
      numero: maskNumero
    };

    return maskMap[name] ? maskMap[name](value) : value;
  }

  function handleChange(event) {
    if (isVisualizacao) return;

    const { name, value } = event.target;

    setFormData((prevState) => ({
      ...prevState,
      [name]: applyMask(name, value)
    }));
  }

  function limparFormulario() {
    setFormData(formClienteCadastro);
    setVeiculos([]);
    setNovoVeiculo(veiculoInicial);
    setMensagem('');
    setModalOpen(false);
    setEditandoIndex(null);

    if (isVisualizacao) {
      navigate('/clientes/consultar', { replace: true });
      return;
    }

    if (nomeBusca) {
      navigate('/clientes/cadastro', { replace: true });
    }
  }

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
      navigate('/clientes/consultar', {
        replace: true,
        state: {
          refresh: true,
          toast: {
            type: 'success',
            text: 'Cliente excluído com sucesso.'
          }
        }
      });
    } catch (error) {
      console.error(error);
      setMensagem('Erro ao excluir cliente.');
    }
  }

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
        veiculos
      };

      if (clienteEmEdicaoId) {
        await api.put(`/clientes/${clienteEmEdicaoId}`, payload);
        navigate('/clientes/consultar', {
          replace: true,
          state: {
            refresh: true,
            toast: {
              type: 'success',
              text: 'Cliente atualizado com sucesso.'
            }
          }
        });
        return;
      }

      await api.post('/clientes', payload);
      setMensagem('Cliente cadastrado com sucesso!');
      limparFormulario();
    } catch (error) {
      console.error(error);
      setMensagem(
        clienteEmEdicaoId
          ? 'Erro ao atualizar cliente.'
          : 'Erro ao cadastrar cliente.'
      );
    }
  }

  return (
    <Layout>
      <main className="cadastro-content">
        <div className="cadastro-header">
          <h1>{isVisualizacao ? 'Visualizar Cliente' : nomeBusca ? 'Editar Cliente' : 'Cadastro de Clientes'}</h1>
          <p>
            {isVisualizacao
              ? 'Confira os dados do cliente e dos veículos cadastrados.'
              : nomeBusca
                ? 'Atualize os dados do cliente e dos veículos cadastrados.'
                : 'Preencha os dados do cliente'}
          </p>
        </div>

        {isVisualizacao && (
          <div className="view-mode-banner">
            Modo visualizacao: para alterar dados, clique em "Editar".
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
                  placeholder="000.000.000-00"
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
                  placeholder="(00) 00000-0000"
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
                  placeholder="exemplo@email.com"
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
                    placeholder="00000-000"
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
                  placeholder="Rua / Avenida"
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
                  placeholder="123"
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
                  placeholder="Bairro"
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
                  placeholder="Cidade"
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
                  placeholder="UF"
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
                <span>Km</span>
                <span>Ano Fab.</span>
                <span>Ano Modelo</span>
                <span>Cor</span>
                <span>Ar-cond.</span>
                <span>Ações</span>
              </div>

              {veiculos.length === 0 ? (
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
                veiculos.map((veiculo, index) => (
                  <div className="veiculo-row" key={index}>
                    <span>{veiculo.placa || '-'}</span>
                    <span>{veiculo.chassi || '-'}</span>
                    <span>
                      {veiculo.fabricante || '-'} / {veiculo.modelo || '-'}
                    </span>
                    <span>{veiculo.motor || '-'}</span>
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
                ))
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
                      `/clientes/cadastro?nome=${encodeURIComponent(
                        nomeBusca || ''
                      )}`
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
                {nomeBusca ? 'Salvar alterações' : 'Cadastrar cliente'}
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
                  placeholder="Chassi"
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
                  placeholder="Ex.: Fiat"
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
                  placeholder="Ex.: Uno"
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
                  placeholder="2020"
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
                  placeholder="2021"
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
                <label htmlFor="km">Quilometragem</label>
                <input
                  id="km"
                  name="km"
                  placeholder="Ex.: 120000"
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
                  placeholder="Ex.: Prata"
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