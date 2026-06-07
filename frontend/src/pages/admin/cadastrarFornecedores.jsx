import { useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/adminStyles/cadastrarFornecedores.css';

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

function gerarCodigoFornecedor() {
  const data = new Date();
  const ano = data.getFullYear();
  const numero = Math.floor(1000 + Math.random() * 9000);

  return `FOR-${ano}-${numero}`;
}

// As funcoes abaixo aplicam mascaras nos campos do formulario.
function formatarCnpj(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatarTelefone(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 10)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatarCelular(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function formatarCep(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function formatarUf(valor) {
  return valor
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 2)
    .toUpperCase();
}

function CadastrarFornecedor() {
  const [fornecedor, setFornecedor] = useState({
    ...fornecedorInicial,
    codigo: gerarCodigoFornecedor(),
  });

  const [carregando, setCarregando] = useState(false);

  // Atualiza um campo do formulario de fornecedor.
  function atualizarCampo(campo, valor) {
    setFornecedor((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  // Limpa o formulario e gera um novo codigo.
  function limparFormulario() {
    setFornecedor({
      ...fornecedorInicial,
      codigo: gerarCodigoFornecedor(),
    });
  }

  // Valida os campos obrigatorios antes do envio.
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

  // Envia o cadastro do fornecedor para a API.
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
    <Layout>
      <main className="cadastro-fornecedor-page">
        <section className="cadastro-fornecedor-header">
          <div>
            <h1>Cadastro de Fornecedores</h1>
            <p>Cadastre fornecedores de peças e serviços usados na oficina.</p>
          </div>
        </section>

        <form
          className="cadastro-fornecedor-card"
          onSubmit={cadastrarFornecedor}
        >
          <section className="cadastro-fornecedor-section">
            <div className="cadastro-fornecedor-section-title">
              <h2>Dados do fornecedor</h2>
              <span>Informações principais para identificação.</span>
            </div>

            <div className="cadastro-fornecedor-grid">
              <div className="cadastro-fornecedor-field">
                <label>Código</label>
                <input value={fornecedor.codigo} disabled />
              </div>

              <div className="cadastro-fornecedor-field field-large">
                <label>Nome / Razão social</label>
                <input
                  value={fornecedor.nome}
                  onChange={(event) =>
                    atualizarCampo('nome', event.target.value)
                  }
                 
                />
              </div>

              <div className="cadastro-fornecedor-field">
                <label>CNPJ</label>
                <input
                  value={fornecedor.cnpj}
                  onChange={(event) =>
                    atualizarCampo('cnpj', formatarCnpj(event.target.value))
                  }
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div className="cadastro-fornecedor-field">
                <label>Inscrição estadual</label>
                <input
                  value={fornecedor.inscricao}
                  onChange={(event) =>
                    atualizarCampo('inscricao', event.target.value)
                  }
                 
                />
              </div>

              <div className="cadastro-fornecedor-field">
                <label>Email</label>
                <input
                  type="email"
                  value={fornecedor.email}
                  onChange={(event) =>
                    atualizarCampo('email', event.target.value)
                  }
                 
                />
              </div>

              <div className="cadastro-fornecedor-field">
                <label>Telefone (fixo)</label>
                <input
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

              <div className="cadastro-fornecedor-field">
                <label>Celular (WhatsApp)</label>
                <input
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

          <section className="cadastro-fornecedor-section">
            <div className="cadastro-fornecedor-section-title">
              <h2>Endereço</h2>
              <span>Dados de localização do fornecedor.</span>
            </div>

            <div className="cadastro-fornecedor-grid">
              <div className="cadastro-fornecedor-field">
                <label>CEP</label>
                <input
                  value={fornecedor.cep}
                  onChange={(event) =>
                    atualizarCampo('cep', formatarCep(event.target.value))
                  }
                
                />
              </div>

              <div className="cadastro-fornecedor-field field-large">
                <label>Endereço</label>
                <input
                  value={fornecedor.endereco}
                  onChange={(event) =>
                    atualizarCampo('endereco', event.target.value)
                  }
               
                />
              </div>

              <div className="cadastro-fornecedor-field">
                <label>Número</label>
                <input
                  value={fornecedor.numero}
                  onChange={(event) =>
                    atualizarCampo('numero', event.target.value)
                  }
               
                />
              </div>

              <div className="cadastro-fornecedor-field">
                <label>UF</label>
                <input
                  value={fornecedor.uf}
                  onChange={(event) =>
                    atualizarCampo('uf', formatarUf(event.target.value))
                  }
              
                />
              </div>

              <div className="cadastro-fornecedor-field">
                <label>Bairro</label>
                <input
                  value={fornecedor.bairro}
                  onChange={(event) =>
                    atualizarCampo('bairro', event.target.value)
                  }
           
                />
              </div>

              <div className="cadastro-fornecedor-field">
                <label>Cidade</label>
                <input
                  value={fornecedor.cidade}
                  onChange={(event) =>
                    atualizarCampo('cidade', event.target.value)
                  }
             
                />
              </div>

              <div className="cadastro-fornecedor-field field-large">
                <label>Complemento</label>
                <input
                  value={fornecedor.complemento}
                  onChange={(event) =>
                    atualizarCampo('complemento', event.target.value)
                  }
              
                />
              </div>
            </div>
          </section>

          <section className="cadastro-fornecedor-section">
            <div className="cadastro-fornecedor-section-title">
              <h2>Tipo de fornecimento</h2>
              <span>Indique o que este fornecedor oferece.</span>
            </div>

            <div className="cadastro-fornecedor-options">
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

            <div className="cadastro-fornecedor-field field-full">
              <label>Observações</label>
              <textarea
                value={fornecedor.observacoes}
                onChange={(event) =>
                  atualizarCampo('observacoes', event.target.value)
                }
               
              />
            </div>
          </section>

          <div className="cadastro-fornecedor-actions">
            <button
              type="button"
              className="cadastro-fornecedor-btn cadastro-fornecedor-btn-red"
              onClick={limparFormulario}
              disabled={carregando}
            >
              Limpar
            </button>

            <button
              type="submit"
              className="cadastro-fornecedor-btn cadastro-fornecedor-btn-dark"
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

export default CadastrarFornecedor;