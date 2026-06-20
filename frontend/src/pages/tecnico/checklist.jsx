import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/tecnicoStyles/checklist.css';


/**
 * Lista de itens verificados durante a inspeção de entrada do veículo.
 *
 * @constant {string[]}
 */
const itensEntrada = [
  'Veículo tem documento',
  'Teste alternador',
  'Chave de rodas',
  'Luzes de advertência do painel',
  'Etiqueta de óleo',
  'Palhetas dianteiras',
  'Líquido de arrefecimento',
  'Vazamento de óleo do motor',
  'Esforço/altura pedal da embreagem',
  'Inspeção visual das correias do motor',

  'Barulho anormal do motor',
  'Step',
  'Triângulo',
  'Teste do motor de partida',
  'Ar-condicionado',
  'Esguicho do limpador D/T',
  'Palheta traseira',
  'Reservatório para frio',
  'Vazamento de água',
  'Macaco',

  'Teste de bateria',
  'Revisão das luzes',
  'Ar quente/ventilação interior',
  'Altura do freio de mão',
  'Condições dos pneus',
  'Nível de óleo do motor',
  'Vazamento da direção hidráulica',
  'Embreagem trepida/patina',
];

/**
 * Lista de itens verificados durante a etapa de diagnóstico.
 *
 * @constant {string[]}
 */
const itensDiagnostico = [
  'Alinhamento',
  'Fluido de freio',
  'Lonas traseiras',
  'Velas de ignição',
  'Filtro de ar do motor',
  'Kit amortecedores',
  'Molas da suspensão',
  'Axiais',
  'Sistema de escapamento',
  'Balanceamento',

  'Disco/pastilhas dianteiras',
  'Sapatas/tambores traseiros',
  'Cabos de ignição',
  'Coxins do motor',
  'Amortecedores dianteiros',
  'Buchas de suspensão',
  'Terminais de direção',
  'Coifas câmbio',
  'Cambagem/caster',
  'Disco/pastilhas traseiras',

  'Cilindros das rodas traseiras',
  'Bobinas de ignição',
  'Coxins câmbio',
  'Amortecedores traseiros',
  'Bandejas da suspensão',
  'Pivôs da direção',
  'Rolamentos das rodas',
];

/**
 * Estado inicial das fotos do veículo.
 *
 * @constant {Object}
 */
const fotosIniciais = {
  frente: null,
  traseira: null,
  esquerda: null,
  direita: null,
};

/**
 * Cria um objeto de controle para os itens da checklist.
 *
 * Cada item recebe inicialmente o valor null, indicando que ainda
 * não foi preenchido.
 *
 * @param {string[]} lista - Lista de itens da checklist.
 * @returns {Object} Objeto contendo os itens e seus valores iniciais.
 */
function criarEstadoItens(lista) {
  return lista.reduce((acc, item) => {
    acc[item] = null;
    return acc;
  }, {});
}

/**
 * Converte os itens da checklist para o formato enviado ao backend.
 *
 * @param {Object} itens - Objeto contendo o nome e o valor de cada item.
 * @returns {Array<Object>} Lista de itens preparada para envio.
 */
function converterItensParaEnvio(itens) {
  return Object.entries(itens).map(([nome, valor]) => ({
    nome,
    valor,
  }));
}

/**
 * Tela responsável pelo preenchimento da checklist técnica do veículo,
 * incluindo inspeção de entrada, diagnóstico, observações e fotos.
 *
 * @component
 * @function Checklist
 * @returns {JSX.Element} Tela de preenchimento da checklist.
 */
function Checklist() {
  const navigate = useNavigate();
  const location = useLocation();

  const veiculoSelecionado = location.state?.veiculo || null;

  const [entrada, setEntrada] = useState(() => criarEstadoItens(itensEntrada));
  const [diagnostico, setDiagnostico] = useState(() =>
    criarEstadoItens(itensDiagnostico)
  );

  const [observacoesEntrada, setObservacoesEntrada] = useState('');
  const [observacoesDiagnostico, setObservacoesDiagnostico] = useState('');
  const [fotos, setFotos] = useState(fotosIniciais);

/**
 * Totais de itens preenchidos nas etapas de entrada e diagnóstico.
 *
 * @type {{
 *   entradaPreenchidos: number,
 *   diagnosticoPreenchidos: number
 * }}
 */
  const totais = useMemo(() => {
    const entradaPreenchidos = Object.values(entrada).filter(
      (valor) => valor !== null
    ).length;

    const diagnosticoPreenchidos = Object.values(diagnostico).filter(
      (valor) => valor !== null
    ).length;

    return {
      entradaPreenchidos,
      diagnosticoPreenchidos,
    };
  }, [entrada, diagnostico]);

/**
 * Monta o nome completo do veículo selecionado.
 *
 * @returns {string} Nome do veículo ou mensagem indicando ausência de seleção.
 */
  function montarNomeVeiculo() {
    if (!veiculoSelecionado) return 'Nenhum veículo selecionado';

    const fabricante = veiculoSelecionado.fabricante || '';
    const modelo = veiculoSelecionado.modelo || '';

    return `${fabricante} ${modelo}`.trim() || 'Veículo sem descrição';
  }

/**
 * Retorna o próximo valor do ciclo de preenchimento de um item.
 *
 * O ciclo utilizado é: null, true, false e novamente null.
 *
 * @param {boolean|null} valorAtual - Valor atual do item.
 * @returns {boolean|null} Próximo valor do ciclo.
 */
  function obterProximoValor(valorAtual) {
    if (valorAtual === null) return true;
    if (valorAtual === true) return false;
    return null;
  }

/**
 * Alterna o valor de um item da inspeção de entrada ou do diagnóstico.
 *
 * @param {string} tipo - Tipo da checklist: entrada ou diagnóstico.
 * @param {string} item - Nome do item que será alterado.
 * @returns {void}
 */
  function alternarItem(tipo, item) {
    if (tipo === 'entrada') {
      setEntrada((prev) => ({
        ...prev,
        [item]: obterProximoValor(prev[item]),
      }));

      return;
    }

    setDiagnostico((prev) => ({
      ...prev,
      [item]: obterProximoValor(prev[item]),
    }));
  }

/**
 * Registra uma imagem selecionada e cria sua URL temporária de visualização.
 *
 * @param {string} campo - Campo da foto que será atualizado.
 * @param {File} arquivo - Arquivo de imagem selecionado.
 * @returns {void}
 */
  function alterarFoto(campo, arquivo) {
    if (!arquivo) return;

    const preview = URL.createObjectURL(arquivo);

    setFotos((prev) => ({
      ...prev,
      [campo]: {
        arquivo,
        preview,
      },
    }));
  }

/**
 * Remove uma foto selecionada do estado da checklist.
 *
 * @param {string} campo - Campo da foto que será removido.
 * @returns {void}
 */
  function removerFoto(campo) {
    setFotos((prev) => ({
      ...prev,
      [campo]: null,
    }));
  }

/**
 * Monta o formulário multipart e envia a checklist para a API.
 *
 * @async
 * @returns {Promise<void>}
 */
  async function salvarChecklist() {
    try {
      if (!veiculoSelecionado?.id) {
        toast.warning('Selecione um veículo antes de salvar a checklist.');
        return;
      }

      const formData = new FormData();

      formData.append('veiculoId', String(veiculoSelecionado.id));
      formData.append(
        'itensEntrada',
        JSON.stringify(converterItensParaEnvio(entrada))
      );
      formData.append(
        'itensDiagnostico',
        JSON.stringify(converterItensParaEnvio(diagnostico))
      );
      formData.append('observacoesEntrada', observacoesEntrada || '');
      formData.append('observacoesDiagnostico', observacoesDiagnostico || '');

      if (fotos.frente?.arquivo) {
        formData.append('fotoFrente', fotos.frente.arquivo);
      }

      if (fotos.traseira?.arquivo) {
        formData.append('fotoTraseira', fotos.traseira.arquivo);
      }

      if (fotos.esquerda?.arquivo) {
        formData.append('fotoEsquerda', fotos.esquerda.arquivo);
      }

      if (fotos.direita?.arquivo) {
        formData.append('fotoDireita', fotos.direita.arquivo);
      }

      await api.post('/checklists', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Checklist salva com sucesso!');

      navigate('/tecnico/checklists', {
        state: {
          veiculo: veiculoSelecionado,
        },
      });
    } catch (error) {
      console.error('Erro ao salvar checklist:', error);

      toast.error(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao salvar checklist.'
      );
    }
  }

/**
 * Cancela o preenchimento da checklist, limpa os dados temporários
 * e retorna para a tela de checklists.
 *
 * @returns {void}
 */
  function cancelarChecklist() {
    const confirmar = window.confirm(
      'Deseja cancelar esta checklist? As informações preenchidas serão perdidas.'
    );

    if (!confirmar) return;

    Object.values(fotos).forEach((foto) => {
      if (foto?.preview) {
        URL.revokeObjectURL(foto.preview);
      }
    });

    setEntrada(criarEstadoItens(itensEntrada));
    setDiagnostico(criarEstadoItens(itensDiagnostico));
    setObservacoesEntrada('');
    setObservacoesDiagnostico('');
    setFotos({
      frente: null,
      traseira: null,
      esquerda: null,
      direita: null,
    });

    navigate('/tecnico/checklists', {
      state: {
        veiculo: veiculoSelecionado,
      },
    });
  }

/**
 * Retorna a classe CSS correspondente ao valor de um item.
 *
 * @param {boolean|null} valor - Valor atual do item.
 * @returns {string} Classe CSS usada na apresentação do item.
 */
  function obterClasseValor(valor) {
    if (valor === true) return 'checklist-status-ok';
    if (valor === false) return 'checklist-status-no';
    return '';
  }

/**
 * Converte o valor de um item em um símbolo visual.
 *
 * @param {boolean|null} valor - Valor atual do item.
 * @returns {string} Símbolo de confirmação, reprovação ou string vazia.
 */
  function obterTextoValor(valor) {
    if (valor === true) return '✓';
    if (valor === false) return 'X';
    return '';
  }

/**
 * Renderiza os itens da checklist como botões alternáveis.
 *
 * @param {string[]} lista - Lista de itens que será renderizada.
 * @param {string} tipo - Tipo da checklist: entrada ou diagnóstico.
 * @returns {JSX.Element[]} Lista de elementos da checklist.
 */
  function renderItens(lista, tipo) {
    const itens = tipo === 'entrada' ? entrada : diagnostico;

    return lista.map((item) => {
      const valor = itens[item];

      return (
        <button
          type="button"
          className={`checklist-item ${obterClasseValor(valor)}`}
          key={item}
          onClick={() => alternarItem(tipo, item)}
          title="Clique para alternar entre ✓, X e vazio"
        >
          <span className="checklist-status-box">
            {obterTextoValor(valor)}
          </span>

          <span className="checklist-item-text">{item}</span>
        </button>
      );
    });
  }

/**
 * Renderiza o campo de foto com visualização da imagem ou estado vazio.
 *
 * @param {string} campo - Identificador do campo da foto.
 * @param {string} titulo - Texto alternativo da imagem.
 * @param {string} subtitulo - Texto exibido quando não houver foto.
 * @returns {JSX.Element} Campo de seleção e visualização da foto.
 */
  function renderFoto(campo, titulo, subtitulo) {
    const foto = fotos[campo];

    return (
      <div className="checklist-photo-card">
        <div className="checklist-photo-preview">
          {foto ? (
            <img src={foto.preview} alt={titulo} />
          ) : (
            <div className="checklist-photo-empty">
              <strong>{subtitulo}</strong>
            </div>
          )}
        </div>

        <div className="checklist-photo-actions">
          <label className="checklist-photo-btn">
            Inserir foto
            <input
              type="file"
              accept="image/*"
              onChange={(event) => alterarFoto(campo, event.target.files[0])}
            />
          </label>

          {foto && (
            <button
              type="button"
              className="checklist-photo-remove"
              onClick={() => removerFoto(campo)}
            >
              Remover
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <main className="checklist-page">
        <section className="checklist-top">
          <div>
            <h1>Checklist</h1>
            <p>
              Registre a inspeção mecânica do veículo na entrada e na fase de
              diagnóstico.
            </p>
          </div>
        </section>

        <section className="checklist-vehicle-card">
          <div className="checklist-vehicle-main">
            <span>Veículo selecionado</span>
            <strong>{montarNomeVeiculo()}</strong>
          </div>

          <div className="checklist-vehicle-info">
            <span>Placa</span>
            <strong>{veiculoSelecionado?.placa || '-'}</strong>
          </div>

          <div className="checklist-vehicle-info">
            <span>Cliente</span>
            <strong>{veiculoSelecionado?.cliente?.nome || '-'}</strong>
          </div>

          <button type="button" onClick={() => navigate('/tecnico/painel')}>
            Trocar veículo
          </button>
        </section>

        <section className="checklist-layout">
          <div className="checklist-content">
            <section className="checklist-section">
              <div className="checklist-section-header">
                <div>
                  <h2>
                    Inspeção mecânica na ENTRADA{' '}
                    <span>(execute na presença do cliente)</span>
                  </h2>
                </div>

                <strong>
                  {totais.entradaPreenchidos}/{itensEntrada.length}
                </strong>
              </div>

              <div className="checklist-grid-with-notes">
                <div className="checklist-items-grid checklist-entrada-grid">
                  {renderItens(itensEntrada, 'entrada')}
                </div>

                <div className="checklist-observacoes checklist-observacoes-table">
                  <label>Observações:</label>
                  <textarea
                    value={observacoesEntrada}
                    onChange={(event) =>
                      setObservacoesEntrada(event.target.value)
                    }
                  />
                </div>
              </div>
            </section>

            <section className="checklist-section">
              <div className="checklist-section-header">
                <div>
                  <h2>Inspeção mecânica na fase de DIAGNÓSTICO</h2>
                </div>

                <strong>
                  {totais.diagnosticoPreenchidos}/{itensDiagnostico.length}
                </strong>
              </div>

              <div className="checklist-grid-with-notes">
                <div className="checklist-items-grid checklist-diagnostico-grid">
                  {renderItens(itensDiagnostico, 'diagnostico')}
                </div>

                <div className="checklist-observacoes checklist-observacoes-table">
                  <label>Observações:</label>
                  <textarea
                    value={observacoesDiagnostico}
                    onChange={(event) =>
                      setObservacoesDiagnostico(event.target.value)
                    }
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className="checklist-photos">
            <div className="checklist-photos-header">
              <h2>Fotos do veículo</h2>
              <p>Registre o estado visual do veículo.</p>
            </div>

            <div className="checklist-photo-list">
              {renderFoto('frente', 'Foto frontal', 'Frente')}
              {renderFoto('traseira', 'Foto traseira', 'Traseira')}
              {renderFoto('esquerda', 'Lateral esquerda', 'L. Esquerdo')}
              {renderFoto('direita', 'Lateral direita', 'L. Direito')}
            </div>
          </aside>
        </section>

        <section className="checklist-actions">
          <button
            type="button"
            className="checklist-btn checklist-btn-red"
            onClick={cancelarChecklist}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="checklist-btn checklist-btn-dark"
            onClick={salvarChecklist}
          >
            Salvar
          </button>
        </section>
      </main>
    </Layout>
  );
}

export default Checklist;