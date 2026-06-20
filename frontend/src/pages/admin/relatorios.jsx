import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/adminStyles/relatorios.css';


/**
 * Tela responsável pela exibição de relatórios gerenciais,
 * rankings de peças, serviços, veículos e marcas mais recorrentes
 * nas ordens de serviço cadastradas no sistema.
 *
 * @component
 * @function Relatorios
 * @returns {JSX.Element}
 */
function Relatorios() {
  const [ordensServico, setOrdensServico] = useState([]);
  const [carregando, setCarregando] = useState(false);

  // Carrega as ordens de servico usadas para montar os rankings.
  useEffect(() => {
    carregarRelatorios();
  }, []);

  // Busca a lista completa de ordens na API.
  async function carregarRelatorios() {
    try {
      setCarregando(true);

      const response = await api.get('/ordens-servico');

      setOrdensServico(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);

      toast.error(
        error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          'Erro ao carregar relatórios.'
      );
    } finally {
      setCarregando(false);
    }
  }
/**
 * Incrementa a quantidade de ocorrências de uma chave dentro de um ranking.
 *
 * @param {Object} ranking - Objeto que armazena as contagens.
 * @param {string} chave - Chave que terá sua quantidade incrementada.
 * @returns {void}
 */
  function incrementarRanking(ranking, chave) {
    if (!chave) return;

    const chaveTratada = String(chave).trim();

    if (!chaveTratada) return;

    ranking[chaveTratada] = (ranking[chaveTratada] || 0) + 1;
  }


/**
 * Converte um objeto de ranking em uma lista ordenada por quantidade.
 *
 * @param {Object} ranking - Objeto contendo os dados do ranking.
 * @returns {Array<Object>} Lista ordenada com nome e quantidade.
 */
  function transformarRankingEmLista(ranking) {
    return Object.entries(ranking)
      .map(([nome, quantidade]) => ({
        nome,
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }


/**
 * Dados processados para exibição dos relatórios e rankings da oficina.
 *
 * @type {{
 *   pecas: Array<Object>,
 *   servicos: Array<Object>,
 *   veiculos: Array<Object>,
 *   marcas: Array<Object>
 * }}
 */
  const relatorios = useMemo(() => {
    const pecas = {};
    const servicos = {};
    const veiculos = {};
    const marcas = {};

    ordensServico.forEach((ordem) => {
      const veiculo = ordem.veiculo || {};

      const nomeVeiculo = `${veiculo.fabricante || ''} ${
        veiculo.modelo || ''
      }`.trim();

      incrementarRanking(veiculos, nomeVeiculo || veiculo.placa);
      incrementarRanking(marcas, veiculo.fabricante);

      ordem.diagnosticos?.forEach((diagnostico) => {
        diagnostico.servicos?.forEach((servico) => {
          incrementarRanking(
            servicos,
            servico.nomeServico || servico.descricao || servico.nome
          );

          servico.pecas?.forEach((peca) => {
            incrementarRanking(
              pecas,
              peca.nomePeca || peca.descricao || peca.nome
            );
          });
        });
      });

      ordem.servicos?.forEach((servico) => {
        incrementarRanking(
          servicos,
          servico.nomeServico || servico.descricao || servico.nome
        );
      });

      ordem.pecas?.forEach((peca) => {
        incrementarRanking(pecas, peca.nomePeca || peca.descricao || peca.nome);
      });
    });

    return {
      pecas: transformarRankingEmLista(pecas),
      servicos: transformarRankingEmLista(servicos),
      veiculos: transformarRankingEmLista(veiculos),
      marcas: transformarRankingEmLista(marcas),
    };
  }, [ordensServico]);


/**
 * Renderiza uma tabela de ranking.
 *
 * @param {string} titulo - Título do relatório.
 * @param {string} subtitulo - Descrição resumida do relatório.
 * @param {Array<Object>} dados - Dados que serão exibidos.
 * @param {string} colunaNome - Nome da coluna principal.
 * @returns {JSX.Element}
 */
  function renderTabela(titulo, subtitulo, dados, colunaNome) {
    return (
      <article className="relatorio-card">
        <div className="relatorio-card-header">
          <h2>{titulo}</h2>
          <span>{subtitulo}</span>
        </div>

        {dados.length === 0 ? (
          <div className="relatorio-empty">
            Nenhum dado encontrado.
          </div>
        ) : (
          <table className="relatorio-table">
            <thead>
              <tr>
                <th>{colunaNome}</th>
                <th>Qtd.</th>
              </tr>
            </thead>

            <tbody>
              {dados.map((item) => (
                <tr key={item.nome}>
                  <td>{item.nome}</td>
                  <td>{item.quantidade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    );
  }

/**
 * Renderiza um ranking visual em formato de barras.
 *
 * @param {string} titulo - Título do ranking.
 * @param {string} subtitulo - Descrição resumida do ranking.
 * @param {Array<Object>} dados - Dados utilizados para gerar o ranking.
 * @returns {JSX.Element}
 */
  function renderRanking(titulo, subtitulo, dados) {
    const maiorValor = dados[0]?.quantidade || 1;

    return (
      <article className="relatorio-card">
        <div className="relatorio-card-header">
          <h2>{titulo}</h2>
          <span>{subtitulo}</span>
        </div>

        {dados.length === 0 ? (
          <div className="relatorio-empty">
            Nenhum dado encontrado.
          </div>
        ) : (
          <div className="relatorio-ranking">
            {dados.slice(0, 3).map((item, index) => (
              <div className="relatorio-ranking-item" key={item.nome}>
                <div className="relatorio-ranking-bar-area">
                  <div
                    className="relatorio-ranking-bar"
                    style={{
                      height: `${Math.max(
                        38,
                        (item.quantidade / maiorValor) * 100
                      )}%`,
                    }}
                  />
                </div>

                <strong>{item.nome}</strong>
                <span>{index + 1}º</span>
              </div>
            ))}
          </div>
        )}
      </article>
    );
  }

  return (
    <Layout>
      <main className="relatorios-page">
        <section className="relatorios-header">
          <div>
            <h1>Relatórios</h1>
            <p>
              Consulte os principais indicadores operacionais da oficina.
            </p>

            {carregando && <small>Carregando relatórios...</small>}
          </div>

          <button
            type="button"
            className="relatorios-refresh"
            onClick={carregarRelatorios}
            disabled={carregando}
          >
            Atualizar
          </button>
        </section>

        <section className="relatorios-panel">
          <div className="relatorios-grid">
            {renderTabela(
              'Peças mais utilizadas',
              'Ranking de peças aplicadas nas ordens de serviço.',
              relatorios.pecas,
              'Peça'
            )}

            {renderTabela(
              'Serviços mais realizados',
              'Ranking de serviços executados nas ordens de serviço.',
              relatorios.servicos,
              'Serviço'
            )}

            {renderRanking(
              'Ranking de veículos mais atendidos',
              'Modelos com maior número de atendimentos.',
              relatorios.veiculos
            )}

            {renderRanking(
              'Ranking de marcas mais recorrentes',
              'Marcas com maior presença nas ordens de serviço.',
              relatorios.marcas
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
}

export default Relatorios;