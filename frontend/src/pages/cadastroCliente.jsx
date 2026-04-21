import { useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import '../styles/cadastroClientes.css';

const formClienteCadastro = {
  nome: '',
  cpf: '',
  email: '',
  dataNascimento: '',
  rg: '',
  cep: '',
  endereco: '',
  bairro: '',
  cidade: '',
  uf: '',
  numero: '',
  celular: ''
};

const veiculoInicial = {
  placa: '',
  chassi: '',
  modelo: '',
  ano: '',
  anoModelo: '',
  cor: ''
};

function CadastroCliente() {
  const [formData, setFormData] = useState(formClienteCadastro);
  const [mensagem, setMensagem] = useState('');
  const [veiculos, setVeiculos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [novoVeiculo, setNovoVeiculo] = useState(veiculoInicial);

  function onlyNumbers(value) {
    return value.replace(/\D/g, '');
  }

  function handleVeiculoChange(event) {
    const { name, value } = event.target;

    setNovoVeiculo((prevState) => ({
      ...prevState,
      [name]: value
    }));
  }

  function adicionarVeiculo() {
    if (!novoVeiculo.placa || !novoVeiculo.modelo || !novoVeiculo.chassi) {
      setMensagem('Preencha pelo menos placa, chassi e modelo do veículo.');
      return;
    }

    setVeiculos((prevState) => [...prevState, novoVeiculo]);
    setNovoVeiculo(veiculoInicial);
    setModalOpen(false);
    setMensagem('');
  }

  function removerVeiculo(index) {
    setVeiculos((prevState) => prevState.filter((_, i) => i !== index));
  }

  function maskCPF(value) {
    const numbers = onlyNumbers(value).slice(0, 11);

    return numbers
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

  function maskRG(value) {
    const numbers = onlyNumbers(value).slice(0, 9);

    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
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
      rg: maskRG,
      celular: maskPhone,
      cep: maskCEP,
      uf: maskUF,
      numero: maskNumero
    };

    return maskMap[name] ? maskMap[name](value) : value;
  }

  function handleChange(event) {
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
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const payload = {
        ...formData,
        cpf: formData.cpf.replace(/\D/g, ''),
        rg: formData.rg.replace(/\D/g, ''),
        celular: formData.celular.replace(/\D/g, ''),
        cep: formData.cep.replace(/\D/g, ''),
        dataNascimento: formData.dataNascimento || null,
        veiculos
  };
      

      await api.post('/clientes', payload);
      setMensagem('Cliente cadastrado com sucesso!');
      setFormData(formClienteCadastro);
      setVeiculos([]);
      setNovoVeiculo(veiculoInicial);
    } catch (error) {
      console.error(error);
      setMensagem('Erro ao cadastrar cliente.');
    }
  }

  return (
    <Layout>
      <main className="cadastro-content">
        <div className="cadastro-header">
          <h1>Cadastro de Clientes</h1>
          <p>Preencha os dados do cliente</p>
        </div>

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
                />
              </div>

              <div className="field-group">
                <label htmlFor="rg">RG</label>
                <input
                  id="rg"
                  type="text"
                  name="rg"
                  placeholder="00.000.000-0"
                  value={formData.rg}
                  onChange={handleChange}
                  maxLength={12}
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
                />
              </div>
            </div>

            <div className="form-grid one-column">
              <div className="field-group">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="exemplo@email.com"
                  value={formData.email}
                  onChange={handleChange}
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

              <button
                type="button"
                className="add-veiculo-btn"
                onClick={() => setModalOpen(true)}
              >
                + Adicionar veículo
              </button>
            </div>

            <div className="veiculos-box">
              <div className="veiculos-table-header">
                <span>Placa</span>
                <span>Chassi</span>
                <span>Marca / Modelo</span>
                <span>Ano</span>
                <span>Ano Modelo</span>
                <span>Cor</span>
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
                    <span>{veiculo.placa}</span>
                    <span>{veiculo.chassi}</span>
                    <span>{veiculo.modelo}</span>
                    <span>{veiculo.ano}</span>
                    <span>{veiculo.anoModelo}</span>
                    <span>{veiculo.cor}</span>

                    <button
                      type="button"
                      className="btn-remover-veiculo"
                      onClick={() => removerVeiculo(index)}
                    >
                      Remover
                    </button>
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
              Cancelar
            </button>

            <button type="submit" className="btn-primary">
              Cadastrar cliente
            </button>
          </div>

          {mensagem && <p className="form-message">{mensagem}</p>}
        </form>
      </main>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-veiculo">
            <h2>Adicionar veículo</h2>

            <div className="modal-grid">
              <input
                name="placa"
                placeholder="Placa"
                value={novoVeiculo.placa}
                onChange={handleVeiculoChange}
              />
              <input
                name="chassi"
                placeholder="Chassi"
                value={novoVeiculo.chassi}
                onChange={handleVeiculoChange}
              />
              <input
                name="modelo"
                placeholder="Modelo"
                value={novoVeiculo.modelo}
                onChange={handleVeiculoChange}
              />
              <input
                name="ano"
                placeholder="Ano"
                value={novoVeiculo.ano}
                onChange={handleVeiculoChange}
              />
              <input
                name="anoModelo"
                placeholder="Ano Modelo"
                value={novoVeiculo.anoModelo}
                onChange={handleVeiculoChange}
              />
              <input
                name="cor"
                placeholder="Cor"
                value={novoVeiculo.cor}
                onChange={handleVeiculoChange}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={adicionarVeiculo}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default CadastroCliente;