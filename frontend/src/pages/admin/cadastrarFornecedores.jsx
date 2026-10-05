import { useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import SeletorTema from '../../components/SeletorTema';
import useTemaOficina from '../../hooks/useTemaOficina';
import { Link } from 'react-router-dom';
import { FiList, FiMapPin, FiRotateCcw, FiSave, FiTruck } from 'react-icons/fi';
import '../../styles/adminStyles/administracao.css';
import api from '../../services/api';

/**
 * Representa os dados preenchidos no formulário de fornecedor.
 *
 * @typedef {Object} FornecedorFormData
 * @property {string} codigo - Código interno gerado para o fornecedor.
 * @property {string} nome - Nome ou razão social do fornecedor.
 * @property {string} cnpj - CNPJ formatado do fornecedor.
 * @property {string} email - Endereço de e-mail do fornecedor.
 * @property {string} telefone - Número de telefone fixo.
 * @property {string} celular - Número de celular ou WhatsApp.
 * @property {string} inscricao - Inscrição estadual do fornecedor.
 * @property {string} cep - CEP do endereço.
 * @property {string} endereco - Logradouro do fornecedor.
 * @property {string} numero - Número do endereço.
 * @property {string} uf - Sigla da unidade federativa.
 * @property {string} bairro - Bairro do endereço.
 * @property {string} cidade - Cidade do endereço.
 * @property {string} complemento - Complemento do endereço.
 * @property {boolean} fornecePecas - Indica se o fornecedor comercializa peças.
 * @property {boolean} forneceServicos - Indica se o fornecedor presta serviços.
 * @property {string} observacoes - Observações adicionais.
 */

/**
 * Estado inicial utilizado no formulário de cadastro de fornecedor.
 *
 * @type {FornecedorFormData}
 */
const fornecedorInicial = {
  codigo: '',
  nome: '',
  cnpj: '',
  email: '',
  telefone: '',
  celular: '',
  inscricao: '',
  cep: '',
  endereco: '',
  numero: '',
  uf: '',
  bairro: '',
  cidade: '',
  complemento: '',
  fornecePecas: true,
  forneceServicos: false,
  observacoes: '',
};

/**
 * Gera um código identificador para um fornecedor.
 *
 * O código contém o prefixo `FOR`, o ano atual e um número aleatório
 * de quatro dígitos.
 *
 * @function gerarCodigoFornecedor
 * @returns {string} Código no formato `FOR-AAAA-NNNN`.
 */
function gerarCodigoFornecedor() {
  const data = new Date();
  const ano = data.getFullYear();
  const numero = Math.floor(1000 + Math.random() * 9000);

  return `FOR-${ano}-${numero}`;
}

/**
 * Formata um valor como CNPJ.
 *
 * Remove caracteres não numéricos, limita o valor a 14 dígitos e
 * aplica a máscara `00.000.000/0000-00`.
 *
 * @function formatarCnpj
 * @param {string} valor - Valor informado no campo de CNPJ.
 * @returns {string} CNPJ formatado.
 */
function formatarCnpj(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/**
 * Formata um valor como telefone fixo.
 *
 * @function formatarTelefone
 * @param {string} valor - Valor informado no campo de telefone.
 * @returns {string} Telefone formatado no padrão `(00) 0000-0000`.
 */
function formatarTelefone(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 10)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/**
 * Formata um valor como número de celular.
 *
 * @function formatarCelular
 * @param {string} valor - Valor informado no campo de celular.
 * @returns {string} Celular formatado no padrão `(00) 00000-0000`.
 */
function formatarCelular(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Formata um valor como CEP.
 *
 * @function formatarCep
 * @param {string} valor - Valor informado no campo de CEP.
 * @returns {string} CEP formatado no padrão `00000-000`.
 */
function formatarCep(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Normaliza a sigla de uma unidade federativa.
 *
 * Remove caracteres que não sejam letras, limita o valor a dois
 * caracteres e converte o texto para letras maiúsculas.
 *
 * @function formatarUf
 * @param {string} valor - Valor informado no campo de UF.
 * @returns {string} Sigla da UF normalizada.
 */
function formatarUf(valor) {
  return valor
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Exibe e controla a tela de cadastro de fornecedores do MotorMind.
 *
 * O componente gerencia os dados do formulário, aplica máscaras nos campos,
 * valida as informações obrigatórias e envia o cadastro para a API.
 *
 * @component
 * @function CadastrarFornecedor
 * @returns {JSX.Element} Tela de cadastro de fornecedor.
 */
function CadastrarFornecedor() {
  const [tema, setTema] = useTemaOficina();
  const [fornecedor, setFornecedor] = useState({
    ...fornecedorInicial,
    codigo: gerarCodigoFornecedor(),
  });

  const [carregando, setCarregando] = useState(false);

  /**
   * Atualiza um campo específico do estado do formulário.
   *
   * @function atualizarCampo
   * @param {string} campo - Nome do campo que será atualizado.
   * @param {string|boolean} valor - Novo valor do campo.
   * @returns {void}
   */
  function atualizarCampo(campo, valor) {
    setFornecedor((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  /**
   * Limpa o formulário e gera um novo código para o próximo fornecedor.
   *
   * @function limparFormulario
   * @returns {void}
   */
  function limparFormulario() {
    setFornecedor({
      ...fornecedorInicial,
      codigo: gerarCodigoFornecedor(),
    });
  }

  /**
   * Valida os campos obrigatórios antes do envio do formulário.
   *
   * Verifica o nome, o CNPJ, a existência de pelo menos um contato e
   * a seleção de ao menos um tipo de fornecimento.
   *
   * @function validarFormulario
   * @returns {boolean} `true` quando os dados são válidos; caso contrário, `false`.
   */
  function validarFormulario() {
    if (!fornecedor.nome.trim()) {
      toast.warning('Informe o nome do fornecedor.');
      return false;
    }

    if (!fornecedor.cnpj.trim()) {
      toast.warning('Informe o CNPJ do fornecedor.');
      return false;
    }

    if (!fornecedor.telefone.trim() && !fornecedor.celular.trim()) {
      toast.warning(
        'Informe pelo menos um contato: telefone (fixo) ou celular (WhatsApp).'
      );
      return false;
    }

    if (!fornecedor.fornecePecas && !fornecedor.forneceServicos) {
      toast.warning('Selecione se o fornecedor fornece peças ou serviços.');
      return false;
    }

    return true;
  }

  /**
   * Envia os dados do fornecedor para a API.
   *
   * Impede o envio padrão do formulário, valida os dados, normaliza os
   * campos e realiza uma requisição `POST` para `/fornecedores`.
   *
   * @async
   * @function cadastrarFornecedor
   * @param {Object} event - Evento de envio do formulário.
   * @param {Function} event.preventDefault - Impede o comportamento padrão do formulário.
   * @returns {Promise<void>}
   */
  async function cadastrarFornecedor(event) {
    event.preventDefault();

    try {
      if (!validarFormulario()) return;

      setCarregando(true);

      await api.post('/fornecedores', {
        codigo: fornecedor.codigo.trim(),
        nome: fornecedor.nome.trim(),
        cnpj: fornecedor.cnpj.trim(),
        email: fornecedor.email.trim(),
        telefone: fornecedor.telefone.trim() || null,
        celular: fornecedor.celular.trim() || null,
        inscricao: fornecedor.inscricao.trim(),

        cep: fornecedor.cep.trim(),
        endereco: fornecedor.endereco.trim(),
        numero: fornecedor.numero.trim(),
        uf: fornecedor.uf.trim().toUpperCase(),
        bairro: fornecedor.bairro.trim(),
        cidade: fornecedor.cidade.trim(),
        complemento: fornecedor.complemento.trim(),

        fornecePecas: fornecedor.fornecePecas,
        forneceServicos: fornecedor.forneceServicos,
        observacoes: fornecedor.observacoes.trim(),
      });

      toast.success('Fornecedor cadastrado com sucesso!');
      limparFormulario();
    } catch (error) {
      console.error('Erro ao cadastrar fornecedor:', error);

      toast.error(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao cadastrar fornecedor.'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Layout className="oficina-theme admin-workspace" theme={tema}
      topbarActions={<SeletorTema tema={tema} onChange={setTema} />}>
      <main className="oficina-page" aria-labelledby="fornecedores-titulo">
        <header className="oficina-page-header">
          <div>
            <h1 id="fornecedores-titulo">Cadastro de Fornecedores</h1>
            <p>Cadastre fornecedores de peças e serviços usados na oficina.</p>
          </div>
          <Link className="oficina-btn" to="/admin/fornecedores">
            <FiList aria-hidden="true" /> Visualizar fornecedores
          </Link>
        </header>

        <form
          className="oficina-panel"
          onSubmit={cadastrarFornecedor}
        >
          <section className="admin-form-section">
            <div className="oficina-panel-title">
              <h2 className="oficina-section-heading"><FiTruck aria-hidden="true" /> Dados do fornecedor</h2>
              <span>Informações principais para identificação.</span>
            </div>

            <div className="oficina-form-grid admin-form-grid">
              <div className="oficina-field">
                <label htmlFor="fornecedores-cadastro-codigo">Código</label>
                <input id="fornecedores-cadastro-codigo" value={fornecedor.codigo} disabled />
              </div>

              <div className="oficina-field admin-col-2">
                <label htmlFor="fornecedores-cadastro-nome">Nome / Razão social</label>
                <input id="fornecedores-cadastro-nome"
                  value={fornecedor.nome}
                  onChange={(event) =>
                    atualizarCampo('nome', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fornecedores-cadastro-cnpj">CNPJ</label>
                <input id="fornecedores-cadastro-cnpj"
                  value={fornecedor.cnpj}
                  onChange={(event) =>
                    atualizarCampo('cnpj', formatarCnpj(event.target.value))
                  }
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fornecedores-cadastro-inscricao">Inscrição estadual</label>
                <input id="fornecedores-cadastro-inscricao"
                  value={fornecedor.inscricao}
                  onChange={(event) =>
                    atualizarCampo('inscricao', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fornecedores-cadastro-email">Email</label>
                <input id="fornecedores-cadastro-email"
                  type="email"
                  value={fornecedor.email}
                  onChange={(event) =>
                    atualizarCampo('email', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fornecedores-cadastro-telefone">Telefone (fixo)</label>
                <input id="fornecedores-cadastro-telefone"
                  value={fornecedor.telefone}
                  onChange={(event) =>
                    atualizarCampo(
                      'telefone',
                      formatarTelefone(event.target.value)
                    )
                  }
                  placeholder="(00) 0000-0000"
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fornecedores-cadastro-celular">Celular (WhatsApp)</label>
                <input id="fornecedores-cadastro-celular"
                  value={fornecedor.celular}
                  onChange={(event) =>
                    atualizarCampo(
                      'celular',
                      formatarCelular(event.target.value)
                    )
                  }
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </section>

          <section className="admin-form-section">
            <div className="oficina-panel-title">
              <h2 className="oficina-section-heading"><FiMapPin aria-hidden="true" /> Endereço</h2>
              <span>Dados de localização do fornecedor.</span>
            </div>

            <div className="oficina-form-grid admin-form-grid">
              <div className="oficina-field">
                <label htmlFor="fornecedores-cadastro-cep">CEP</label>
                <input id="fornecedores-cadastro-cep"
                  value={fornecedor.cep}
                  onChange={(event) =>
                    atualizarCampo('cep', formatarCep(event.target.value))
                  }
                />
              </div>

              <div className="oficina-field admin-col-2">
                <label htmlFor="fornecedores-cadastro-endereco">Endereço</label>
                <input id="fornecedores-cadastro-endereco"
                  value={fornecedor.endereco}
                  onChange={(event) =>
                    atualizarCampo('endereco', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fornecedores-cadastro-numero">Número</label>
                <input id="fornecedores-cadastro-numero"
                  value={fornecedor.numero}
                  onChange={(event) =>
                    atualizarCampo('numero', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fornecedores-cadastro-uf">UF</label>
                <input id="fornecedores-cadastro-uf"
                  value={fornecedor.uf}
                  onChange={(event) =>
                    atualizarCampo('uf', formatarUf(event.target.value))
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fornecedores-cadastro-bairro">Bairro</label>
                <input id="fornecedores-cadastro-bairro"
                  value={fornecedor.bairro}
                  onChange={(event) =>
                    atualizarCampo('bairro', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field">
                <label htmlFor="fornecedores-cadastro-cidade">Cidade</label>
                <input id="fornecedores-cadastro-cidade"
                  value={fornecedor.cidade}
                  onChange={(event) =>
                    atualizarCampo('cidade', event.target.value)
                  }
                />
              </div>

              <div className="oficina-field admin-col-2">
                <label htmlFor="fornecedores-cadastro-complemento">Complemento</label>
                <input id="fornecedores-cadastro-complemento"
                  value={fornecedor.complemento}
                  onChange={(event) =>
                    atualizarCampo('complemento', event.target.value)
                  }
                />
              </div>
            </div>
          </section>

          <section className="admin-form-section">
            <div className="oficina-panel-title">
              <h2 className="oficina-section-heading"><FiTruck aria-hidden="true" /> Tipo de fornecimento</h2>
              <span>Indique o que este fornecedor oferece.</span>
            </div>

            <div className="admin-options">
              <label>
                <input
                  type="checkbox"
                  checked={fornecedor.fornecePecas}
                  onChange={(event) =>
                    atualizarCampo('fornecePecas', event.target.checked)
                  }
                />
                <span>Fornece peças</span>
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={fornecedor.forneceServicos}
                  onChange={(event) =>
                    atualizarCampo('forneceServicos', event.target.checked)
                  }
                />
                <span>Fornece serviços</span>
              </label>
            </div>

            <div className="oficina-field oficina-col-full">
              <label htmlFor="fornecedores-cadastro-observacoes">Observações</label>
              <textarea id="fornecedores-cadastro-observacoes"
                value={fornecedor.observacoes}
                onChange={(event) =>
                  atualizarCampo('observacoes', event.target.value)
                }
              />
            </div>
          </section>

          <div className="oficina-form-actions">
            <button
              type="button"
              className="oficina-btn"
              onClick={limparFormulario}
              disabled={carregando}
            >
              <FiRotateCcw aria-hidden="true" /> Limpar
            </button>

            <button
              type="submit"
              className="oficina-btn oficina-btn-primary"
              disabled={carregando}
            >
              <FiSave aria-hidden="true" /> {carregando ? 'Cadastrando...' : 'Cadastrar fornecedor'}
            </button>
          </div>
        </form>
      </main>
    </Layout>
  );
}

export default CadastrarFornecedor;