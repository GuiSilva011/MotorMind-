import { useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/adminStyles/cadastrarFuncionarios.css';

/**
 * Dados iniciais utilizados no formulário de cadastro de funcionários.
 *
 * @constant
 * @type {FuncionarioFormData}
 */
const funcionarioInicial = {
  Nome: '',
  Cpf: '',
  Rg: '',
  DataNascimento: '',
  Email: '',
  Celular: '',
  Cep: '',
  Endereco: '',
  Numero: '',
  Uf: '',
  Bairro: '',
  Cidade: '',
  Complemento: '',
  DataAdmissao: '',
  Senha: '',
  Role: 'OPERADOR',
};

/**
 * Representa os dados manipulados no formulário de funcionário.
 *
 * @typedef {Object} FuncionarioFormData
 * @property {string} Nome - Nome completo do funcionário.
 * @property {string} Cpf - CPF do funcionário.
 * @property {string} Rg - RG do funcionário.
 * @property {string} DataNascimento - Data de nascimento do funcionário.
 * @property {string} Email - Email usado para contato e login.
 * @property {string} Celular - Número de celular do funcionário.
 * @property {string} Cep - CEP do endereço.
 * @property {string} Endereco - Endereço do funcionário.
 * @property {string} Numero - Número do endereço.
 * @property {string} Uf - Unidade federativa do endereço.
 * @property {string} Bairro - Bairro do endereço.
 * @property {string} Cidade - Cidade do endereço.
 * @property {string} Complemento - Complemento do endereço.
 * @property {string} DataAdmissao - Data de admissão do funcionário.
 * @property {string} Senha - Senha de acesso ao sistema.
 * @property {string} Role - Perfil de acesso do funcionário.
 */

/**
 * Formata o CPF informado pelo usuário no padrão 000.000.000-00.
 *
 * @function formatarCpf
 * @param {string} valor - Valor digitado no campo de CPF.
 * @returns {string} CPF formatado.
 */
function formatarCpf(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Formata o RG informado pelo usuário no padrão 00.000.000-0.
 *
 * @function formatarRg
 * @param {string} valor - Valor digitado no campo de RG.
 * @returns {string} RG formatado.
 */
function formatarRg(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 9)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1})$/, '$1-$2');
}

/**
 * Formata o número de celular no padrão (00) 00000-0000.
 *
 * @function formatarCelular
 * @param {string} valor - Valor digitado no campo de celular.
 * @returns {string} Celular formatado.
 */
function formatarCelular(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Formata o CEP informado pelo usuário no padrão 00000-000.
 *
 * @function formatarCep
 * @param {string} valor - Valor digitado no campo de CEP.
 * @returns {string} CEP formatado.
 */
function formatarCep(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Formata a UF, mantendo apenas letras e convertendo para maiúsculas.
 *
 * @function formatarUf
 * @param {string} valor - Valor digitado no campo de UF.
 * @returns {string} UF formatada com até dois caracteres.
 */
function formatarUf(valor) {
  return valor
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Exibe e controla a tela de cadastro de funcionários do MotorMind.
 *
 * O componente gerencia os dados pessoais, endereço e informações de acesso
 * do funcionário, aplica máscaras nos campos, valida os dados obrigatórios
 * e envia o cadastro para a API.
 *
 * @component
 * @function CadastrarFuncionarios
 * @returns {JSX.Element} Tela de cadastro de funcionários.
 */
function CadastrarFuncionarios() {
  const [funcionario, setFuncionario] = useState(funcionarioInicial);
  const [carregando, setCarregando] = useState(false);

  /**
   * Atualiza um campo específico do formulário de funcionário.
   *
   * @function atualizarCampo
   * @param {string} campo - Nome do campo que será atualizado.
   * @param {string} valor - Novo valor do campo.
   * @returns {void}
   */
  function atualizarCampo(campo, valor) {
    setFuncionario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  /**
   * Limpa o formulário e restaura os valores iniciais.
   *
   * @function limparFormulario
   * @returns {void}
   */
  function limparFormulario() {
    setFuncionario(funcionarioInicial);
  }

  /**
   * Valida os campos obrigatórios antes de enviar o cadastro.
   *
   * @function validarFormulario
   * @returns {boolean} Retorna true quando o formulário está válido.
   */
  function validarFormulario() {
    if (!funcionario.Nome.trim()) {
      toast.warning('Informe o nome do funcionário.');
      return false;
    }

    if (!funcionario.Email.trim()) {
      toast.warning('Informe o email do funcionário.');
      return false;
    }

    if (!funcionario.Senha.trim()) {
      toast.warning('Informe a senha de acesso.');
      return false;
    }

    if (!funcionario.Role) {
      toast.warning('Selecione o perfil de acesso.');
      return false;
    }

    return true;
  }

  /**
   * Envia os dados do funcionário para a API e cadastra seu acesso ao sistema.
   *
   * @async
   * @function cadastrarFuncionario
   * @param {Object} event - Evento de envio do formulário.
   * @returns {Promise<void>}
   */
  async function cadastrarFuncionario(event) {
    event.preventDefault();

    try {
      if (!validarFormulario()) return;

      setCarregando(true);

      await api.post('/funcionarios', {
        Nome: funcionario.Nome.trim(),
        Email: funcionario.Email.trim(),
        Senha: funcionario.Senha.trim(),
        Role: funcionario.Role,

        Cpf: funcionario.Cpf.trim() || null,
        Rg: funcionario.Rg.trim(),
        DataNascimento: funcionario.DataNascimento || null,
        Celular: funcionario.Celular.trim(),

        Cep: funcionario.Cep.trim(),
        Endereco: funcionario.Endereco.trim(),
        Numero: funcionario.Numero.trim(),
        Uf: funcionario.Uf.trim().toUpperCase(),
        Bairro: funcionario.Bairro.trim(),
        Cidade: funcionario.Cidade.trim(),
        Complemento: funcionario.Complemento.trim(),

        DataAdmissao: funcionario.DataAdmissao || null,
      });

      toast.success('Funcionário cadastrado com sucesso!');
      limparFormulario();
    } catch (error) {
      console.error('Erro ao cadastrar funcionário:', error);

      toast.error(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao cadastrar funcionário.'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Layout>
      <main className="cadastro-funcionario-page">
        <section className="cadastro-funcionario-header">
          <div>
            <h1>Cadastro de Funcionários</h1>
            <p>
              Cadastre os dados pessoais, endereço e acesso do funcionário.
            </p>
          </div>
        </section>

        <form
          className="cadastro-funcionario-card"
          onSubmit={cadastrarFuncionario}
        >
          <section className="cadastro-funcionario-section">
            <div className="cadastro-funcionario-section-title">
              <h2>Dados pessoais</h2>
              <span>Informações principais do funcionário.</span>
            </div>

            <div className="cadastro-funcionario-grid">
              <div className="cadastro-funcionario-field field-full">
                <label>Nome completo</label>
                <input
                  value={funcionario.Nome}
                  onChange={(event) =>
                    atualizarCampo('Nome', event.target.value)
                  }
                  
                />
              </div>

              <div className="cadastro-funcionario-field">
                <label>CPF</label>
                <input
                  value={funcionario.Cpf}
                  onChange={(event) =>
                    atualizarCampo('Cpf', formatarCpf(event.target.value))
                  }
                
                />
              </div>

              <div className="cadastro-funcionario-field">
                <label>RG</label>
                <input
                  value={funcionario.Rg}
                  onChange={(event) =>
                    atualizarCampo('Rg', formatarRg(event.target.value))
                  }
                
                />
              </div>

              <div className="cadastro-funcionario-field">
                <label>Data de nascimento</label>
                <input
                  type="date"
                  value={funcionario.DataNascimento}
                  onChange={(event) =>
                    atualizarCampo('DataNascimento', event.target.value)
                  }
                />
              </div>

              <div className="cadastro-funcionario-field">
                <label>Celular</label>
                <input
                  value={funcionario.Celular}
                  onChange={(event) =>
                    atualizarCampo(
                      'Celular',
                      formatarCelular(event.target.value)
                    )
                  }
             
                />
              </div>

              <div className="cadastro-funcionario-field">
                <label>Data de admissão</label>
                <input
                  type="date"
                  value={funcionario.DataAdmissao}
                  onChange={(event) =>
                    atualizarCampo('DataAdmissao', event.target.value)
                  }
                />
              </div>
            </div>
          </section>

          <section className="cadastro-funcionario-section">
            <div className="cadastro-funcionario-section-title">
              <h2>Endereço</h2>
              <span>Dados de localização do funcionário.</span>
            </div>

            <div className="cadastro-funcionario-grid">
              <div className="cadastro-funcionario-field">
                <label>CEP</label>
                <input
                  value={funcionario.Cep}
                  onChange={(event) =>
                    atualizarCampo('Cep', formatarCep(event.target.value))
                  }
                  
                />
              </div>

              <div className="cadastro-funcionario-field field-large">
                <label>Endereço</label>
                <input
                  value={funcionario.Endereco}
                  onChange={(event) =>
                    atualizarCampo('Endereco', event.target.value)
                  }
                 
                />
              </div>

              <div className="cadastro-funcionario-field">
                <label>Número</label>
                <input
                  value={funcionario.Numero}
                  onChange={(event) =>
                    atualizarCampo('Numero', event.target.value)
                  }
               
                />
              </div>

              <div className="cadastro-funcionario-field">
                <label>UF</label>
                <input
                  value={funcionario.Uf}
                  onChange={(event) =>
                    atualizarCampo('Uf', formatarUf(event.target.value))
                  }
                 
                />
              </div>

              <div className="cadastro-funcionario-field">
                <label>Bairro</label>
                <input
                  value={funcionario.Bairro}
                  onChange={(event) =>
                    atualizarCampo('Bairro', event.target.value)
                  }
               
                />
              </div>

              <div className="cadastro-funcionario-field">
                <label>Cidade</label>
                <input
                  value={funcionario.Cidade}
                  onChange={(event) =>
                    atualizarCampo('Cidade', event.target.value)
                  }
                  
                />
              </div>

              <div className="cadastro-funcionario-field field-large">
                <label>Complemento</label>
                <input
                  value={funcionario.Complemento}
                  onChange={(event) =>
                    atualizarCampo('Complemento', event.target.value)
                  }
                 
                />
              </div>
            </div>
          </section>

          <section className="cadastro-funcionario-section">
            <div className="cadastro-funcionario-section-title">
              <h2>Acesso ao sistema</h2>
              <span>Dados usados para login do funcionário.</span>
            </div>

            <div className="cadastro-funcionario-grid">
              <div className="cadastro-funcionario-field">
                <label>Email</label>
                <input
                  type="email"
                  value={funcionario.Email}
                  onChange={(event) =>
                    atualizarCampo('Email', event.target.value)
                  }
                 
                />
              </div>

              <div className="cadastro-funcionario-field">
                <label>Senha</label>
                <input
                  type="password"
                  value={funcionario.Senha}
                  onChange={(event) =>
                    atualizarCampo('Senha', event.target.value)
                  }
              
                />
              </div>

              <div className="cadastro-funcionario-field field-full">
                <label>Perfil de acesso</label>
                <select
                  value={funcionario.Role}
                  onChange={(event) =>
                    atualizarCampo('Role', event.target.value)
                  }
                >
                  <option value="OPERADOR">Operador</option>
                  <option value="TECNICO">Técnico</option>
                </select>
              </div>
            </div>
          </section>

          <div className="cadastro-funcionario-actions">
            <button
              type="button"
              className="cadastro-funcionario-btn cadastro-funcionario-btn-red"
              onClick={limparFormulario}
              disabled={carregando}
            >
              Limpar
            </button>

            <button
              type="submit"
              className="cadastro-funcionario-btn cadastro-funcionario-btn-dark"
              disabled={carregando}
            >
              {carregando ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </main>
    </Layout>
  );
}

export default CadastrarFuncionarios;