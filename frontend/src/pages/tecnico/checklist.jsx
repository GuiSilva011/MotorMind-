import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/tecnicoStyles/checklist.css';

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

const fotosIniciais = {
  frente: null,
  traseira: null,
  esquerda: null,
  direita: null,
};

function Checklist() {
  const navigate = useNavigate();
  const location = useLocation();

  const veiculoSelecionado = location.state?.veiculo || null;

  const [entrada, setEntrada] = useState([]);
  const [diagnostico, setDiagnostico] = useState([]);
  const [observacoesEntrada, setObservacoesEntrada] = useState('');
  const [observacoesDiagnostico, setObservacoesDiagnostico] = useState('');
  const [fotos, setFotos] = useState(fotosIniciais);

  function montarNomeVeiculo() {
    if (!veiculoSelecionado) return 'Nenhum veículo selecionado';

    const fabricante = veiculoSelecionado.fabricante || '';
    const modelo = veiculoSelecionado.modelo || '';

    return `${fabricante} ${modelo}`.trim() || 'Veículo sem descrição';
  }

  function alternarItem(tipo, item) {
    if (tipo === 'entrada') {
      setEntrada((prev) =>
        prev.includes(item)
          ? prev.filter((valor) => valor !== item)
          : [...prev, item]
      );

      return;
    }

    setDiagnostico((prev) =>
      prev.includes(item)
        ? prev.filter((valor) => valor !== item)
        : [...prev, item]
    );
  }

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

  function removerFoto(campo) {
    setFotos((prev) => ({
      ...prev,
      [campo]: null,
    }));
  }

  async function salvarChecklist() {
  try {
    if (!veiculoSelecionado?.id) {
      toast.warning('Selecione um veículo antes de salvar a checklist.');
      return;
    }

    const formData = new FormData();

    formData.append('veiculoId', String(veiculoSelecionado.id));
    formData.append('itensEntrada', JSON.stringify(entrada));
    formData.append('itensDiagnostico', JSON.stringify(diagnostico));
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

  function cancelarChecklist() {
    setEntrada([]);
    setDiagnostico([]);
    setObservacoesEntrada('');
    setObservacoesDiagnostico('');
    setFotos(fotosIniciais);
  }

  function renderItens(lista, tipo) {
    const selecionados = tipo === 'entrada' ? entrada : diagnostico;

    return lista.map((item) => (
      <label
        className={
          selecionados.includes(item)
            ? 'checklist-item checklist-item-checked'
            : 'checklist-item'
        }
        key={item}
      >
        <input
          type="checkbox"
          checked={selecionados.includes(item)}
          onChange={() => alternarItem(tipo, item)}
        />
        <span>{item}</span>
      </label>
    ));
  }

  function renderFoto(campo, titulo) {
    const foto = fotos[campo];

    return (
      <div className="checklist-photo-card">
        <div className="checklist-photo-preview">
          {foto ? (
            <img src={foto.preview} alt={titulo} />
          ) : (
            <div className="checklist-photo-empty">
              <strong>{titulo}</strong>
              <span>Nenhuma foto inserida</span>
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

          <div className="tecnico-page-actions">
            <button
              type="button"
              className="tecnico-voltar-painel"
              onClick={() => navigate('/tecnico/painel')}
            >
              Voltar ao painel
            </button>
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
                  <h2>Inspeção mecânica na entrada</h2>
                  <p>Execute esta etapa na presença do cliente.</p>
                </div>

                <span>{entrada.length}/{itensEntrada.length}</span>
              </div>

              <div className="checklist-items-grid">
                {renderItens(itensEntrada, 'entrada')}
              </div>

              <div className="checklist-observacoes">
                <label>Observações da entrada</label>
                <textarea
                  value={observacoesEntrada}
                  onChange={(event) =>
                    setObservacoesEntrada(event.target.value)
                  }
                  placeholder="Digite observações da inspeção de entrada..."
                />
              </div>
            </section>

            <section className="checklist-section">
              <div className="checklist-section-header">
                <div>
                  <h2>Inspeção mecânica na fase de diagnóstico</h2>
                  <p>Marque os itens avaliados durante o diagnóstico técnico.</p>
                </div>

                <span>{diagnostico.length}/{itensDiagnostico.length}</span>
              </div>

              <div className="checklist-items-grid">
                {renderItens(itensDiagnostico, 'diagnostico')}
              </div>

              <div className="checklist-observacoes">
                <label>Observações do diagnóstico</label>
                <textarea
                  value={observacoesDiagnostico}
                  onChange={(event) =>
                    setObservacoesDiagnostico(event.target.value)
                  }
                  placeholder="Digite observações da fase de diagnóstico..."
                />
              </div>
            </section>
          </div>

          <aside className="checklist-photos">
            <div className="checklist-photos-header">
              <h2>Fotos do veículo</h2>
              <p>Registre o estado visual do veículo.</p>
            </div>

            <div className="checklist-photo-list">
              {renderFoto('frente', 'Foto frontal')}
              {renderFoto('traseira', 'Foto traseira')}
              {renderFoto('esquerda', 'Lateral esquerda')}
              {renderFoto('direita', 'Lateral direita')}
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
            Salvar checklist
          </button>
        </section>
      </main>
    </Layout>
  );
}

export default Checklist;