import { useId, useState } from 'react';
import { FiBarChart2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { dadosGrafico, formatarValorRelatorio } from '../utils/relatoriosGerenciais';

const CORES = Array.from({ length: 6 }, (_, indice) => `var(--relatorio-cor-${indice + 1})`);
const TIPOS = { barras: 'Barras horizontais', colunas: 'Colunas', linha: 'Linha', rosca: 'Rosca', tabela: 'Tabela' };

function Paginacao({ atual, total, onChange }) {
  if (total <= 1) return null;
  return <nav className="relatorio-paginacao" aria-label="Páginas da tabela">
    <span>Página {atual} de {total}</span>
    <button type="button" className="oficina-btn" disabled={atual === 1} onClick={() => onChange(atual - 1)} aria-label="Página anterior">
      <FiChevronLeft aria-hidden="true" />
    </button>
    <button type="button" className="oficina-btn" disabled={atual === total} onClick={() => onChange(atual + 1)} aria-label="Próxima página">
      <FiChevronRight aria-hidden="true" />
    </button>
  </nav>;
}

export function TabelaGraficoRelatorio({ dados, formato, coluna, unidade, percentual = false }) {
  const [pagina, setPagina] = useState(null);
  const totalPaginas = Math.max(1, Math.ceil(dados.length / 10));
  const atual = pagina?.dados === dados ? Math.min(pagina.numero, totalPaginas) : 1;
  const total = dados.reduce((soma, item) => soma + item.valor, 0);
  return <>
    <div className="oficina-table-wrap">
      <table className="oficina-table relatorio-tabela">
        <thead><tr><th scope="col">{coluna}</th><th scope="col">{unidade}</th>{percentual && <th scope="col">Participação</th>}</tr></thead>
        <tbody>{dados.slice((atual - 1) * 10, atual * 10).map(item => <tr key={item.chave}>
          <td data-label={coluna}>{item.nome}</td>
          <td data-label={unidade}>{formatarValorRelatorio(item.valor, formato)}</td>
          {percentual && <td data-label="Participação">{(total ? item.valor / total * 100 : 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</td>}
        </tr>)}</tbody>
        <tfoot><tr><th scope="row">Total</th><td data-label={unidade}>{formatarValorRelatorio(total, formato)}</td>
          {percentual && <td data-label="Participação">{total ? '100%' : '0%'}</td>}
        </tr></tfoot>
      </table>
    </div>
    <Paginacao atual={atual} total={totalPaginas} onChange={numero => setPagina({ dados, numero })} />
  </>;
}

function Barras({ dados, formato }) {
  const maximo = Math.max(...dados.map(item => item.valor), 1);
  return <ol className="relatorio-barras">
    {dados.map((item, indice) => <li key={item.chave}>
      <div className="relatorio-barra-label"><span>{item.nome}</span><strong>{formatarValorRelatorio(item.valor, formato)}</strong></div>
      <div className="relatorio-barra-fundo" aria-hidden="true">
        <div style={{ width: `${item.valor / maximo * 100}%`, background: CORES[indice % CORES.length] }} />
      </div>
    </li>)}
  </ol>;
}

function Rosca({ dados, formato, titulo }) {
  const id = useId();
  const positivos = dados.filter(item => item.valor > 0);
  const total = positivos.reduce((soma, item) => soma + item.valor, 0);
  const circunferencia = 2 * Math.PI * 80;
  return <div className="relatorio-rosca">
    <svg viewBox="0 0 240 240" role="img" aria-labelledby={id}>
      <title id={id}>{`${titulo}: ${positivos.map(item => `${item.nome}, ${formatarValorRelatorio(item.valor, formato)}`).join('; ')}`}</title>
      <circle cx="120" cy="120" r="80" fill="none" stroke="var(--ui-border)" strokeWidth="28" />
      {positivos.map((item, indice) => {
        const tamanho = item.valor / total * circunferencia;
        const deslocamento = positivos.slice(0, indice).reduce((soma, anterior) => soma + anterior.valor / total * circunferencia, 0);
        return <circle key={item.chave} cx="120" cy="120" r="80" fill="none" stroke={CORES[indice % CORES.length]}
          strokeWidth="28" strokeDasharray={`${tamanho} ${circunferencia - tamanho}`} strokeDashoffset={-deslocamento}
          transform="rotate(-90 120 120)"><title>{`${item.nome}: ${formatarValorRelatorio(item.valor, formato)}`}</title></circle>;
      })}
      <text x="120" y="115" textAnchor="middle" className="relatorio-rosca-total">{formatarValorRelatorio(total, formato, true)}</text>
      <text x="120" y="140" textAnchor="middle" className="relatorio-eixo-texto">Total</text>
    </svg>
    <ul className="relatorio-legenda">{positivos.map((item, indice) => <li key={item.chave}>
      <span className="relatorio-legenda-cor" style={{ background: CORES[indice % CORES.length] }} aria-hidden="true" />
      <span>{item.nome}<small>{formatarValorRelatorio(item.valor, formato)} · {(item.valor / total * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</small></span>
    </li>)}</ul>
  </div>;
}

function GraficoEixos({ dados, formato, tipo, titulo }) {
  const id = useId();
  const [selecionado, setSelecionado] = useState(null);
  const maiorValor = Math.max(...dados.map(item => item.valor), 1);
  const maximo = formato === 'numero' ? Math.max(Math.ceil(maiorValor / 4) * 4, 4) : maiorValor;
  const largura = 720, esquerda = 88, direita = 16, topo = 20, base = 220;
  const area = largura - esquerda - direita;
  const espaco = area / dados.length;
  const x = indice => esquerda + espaco * (indice + 0.5);
  const y = valor => base - valor / maximo * (base - topo);
  const intervaloRotulo = Math.max(1, Math.ceil(dados.length / 8));
  const ativo = selecionado?.dados === dados ? dados[selecionado.indice] : null;
  return <>
    <div className="relatorio-chart-scroll">
      <svg className="relatorio-eixos" viewBox="0 0 720 275" role="img" aria-labelledby={id}>
        <title id={id}>{`${titulo}. ${dados.length} pontos. A opção Tabela apresenta todos os valores.`}</title>
        {[0, 1, 2, 3, 4].map(indice => {
          const valor = maximo * indice / 4;
          return <g key={indice}>
            <line x1={esquerda} x2={largura - direita} y1={y(valor)} y2={y(valor)} className="relatorio-grade" />
            <text x={esquerda - 10} y={y(valor) + 4} textAnchor="end" className="relatorio-eixo-texto">{formatarValorRelatorio(valor, formato, true)}</text>
          </g>;
        })}
        {tipo === 'linha' && <path d={dados.map((item, indice) => `${indice ? 'L' : 'M'} ${x(indice)} ${y(item.valor)}`).join(' ')}
          fill="none" stroke={CORES[0]} strokeWidth="2.5" />}
        {dados.map((item, indice) => <g key={item.chave} tabIndex="0" role="img"
          aria-label={`${item.nome}: ${formatarValorRelatorio(item.valor, formato)}`}
          onFocus={() => setSelecionado({ dados, indice })} onMouseEnter={() => setSelecionado({ dados, indice })}
          onBlur={() => setSelecionado(null)} onMouseLeave={() => setSelecionado(null)}>
          <title>{`${item.nome}: ${formatarValorRelatorio(item.valor, formato)}`}</title>
          {tipo === 'colunas' ? <>
            <rect x={x(indice) - Math.min(espaco * 0.65, 44) / 2} y={y(item.valor)}
              width={Math.min(espaco * 0.65, 44)} height={base - y(item.valor)} rx="3" fill={CORES[0]} />
            <rect x={x(indice) - espaco / 2} y={topo} width={espaco} height={base - topo} fill="transparent" />
          </> : <>
            <circle cx={x(indice)} cy={y(item.valor)} r="3.5" fill={CORES[0]} />
            <circle cx={x(indice)} cy={y(item.valor)} r="12" fill="transparent" />
          </>}
          {(indice % intervaloRotulo === 0 || indice === dados.length - 1) && <text x={x(indice)} y="245" textAnchor="middle" className="relatorio-eixo-texto">
            {item.nome.length > 14 ? item.nome.slice(0, 12) + '…' : item.nome}
          </text>}
        </g>)}
      </svg>
    </div>
    <p className="relatorio-chart-detalhe" role="status">
      {ativo ? <><strong>{ativo.nome}</strong> · {formatarValorRelatorio(ativo.valor, formato)}</> : 'Passe o cursor ou use Tab nos pontos para ver o valor. A tabela mostra os dados completos.'}
    </p>
  </>;
}

export function GraficoRelatorio({ dados, tipo, titulo, formato = 'numero', coluna = 'Categoria', unidade = 'Quantidade', percentual = false }) {
  if (!dados.length || (tipo === 'rosca' && !dados.some(item => item.valor > 0))) {
    return <div className="oficina-empty-state"><FiBarChart2 aria-hidden="true" /><p>Não há dados para esta análise nos filtros selecionados.</p></div>;
  }
  if (tipo === 'tabela') return <TabelaGraficoRelatorio dados={dados} formato={formato} coluna={coluna} unidade={unidade} percentual={percentual} />;
  if (tipo === 'barras') return <Barras dados={dados} formato={formato} />;
  if (tipo === 'rosca') return <Rosca dados={dados} formato={formato} titulo={titulo} />;
  return <GraficoEixos dados={dados} formato={formato} tipo={tipo} titulo={titulo} />;
}

export default function PainelGraficoRelatorio({ titulo, descricao, dados, controles, tipoInicial = 'barras',
  tipos = ['barras', 'colunas', 'rosca', 'tabela'], formato = 'numero', coluna, unidade, percentual = true,
  limitar = false, className = '', carregando = false }) {
  const [tipo, setTipo] = useState(tipoInicial);
  const id = useId();
  const exibidos = limitar ? dadosGrafico(dados, tipo) : dados;
  return <article className={`oficina-panel relatorio-painel ${className}`.trim()} aria-labelledby={`${id}-titulo`} aria-busy={carregando}>
    <div className="relatorio-painel-header">
      <div className="oficina-panel-title"><h2 id={`${id}-titulo`}>{titulo}</h2><span>{descricao}</span></div>
      <div className="relatorio-painel-controles">
        {controles}
        <div className="oficina-field">
          <label htmlFor={`${id}-tipo`}>Visualização</label>
          <select id={`${id}-tipo`} value={tipo} onChange={event => setTipo(event.target.value)}>
            {tipos.map(valor => <option key={valor} value={valor}>{TIPOS[valor]}</option>)}
          </select>
        </div>
      </div>
    </div>
    {limitar && dados.length > 10 && <p className="relatorio-nota">Gráficos: 10 primeiros{tipo === 'rosca' ? ' e demais agrupados em Outros' : ''}. Tabela: todos os {dados.length} registros.</p>}
    {carregando && !dados.length ? <div className="oficina-empty-state"><FiBarChart2 aria-hidden="true" /><p>Carregando análise...</p></div>
      : <GraficoRelatorio dados={exibidos} tipo={tipo} titulo={titulo} formato={formato} coluna={coluna} unidade={unidade} percentual={percentual} />}
  </article>;
}

export { Paginacao as PaginacaoRelatorio };
