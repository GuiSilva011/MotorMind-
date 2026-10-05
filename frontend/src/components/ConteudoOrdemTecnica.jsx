import { FiClipboard, FiPackage, FiTool } from 'react-icons/fi';
import "../styles/tecnicoStyles/conteudoOrdem.css";

function Pecas({ itens = [] }) {
  if (!itens.length)
    return <p className="os-tecnica-vazio">Nenhuma peça salva neste grupo.</p>;
  return (
    <div className="oficina-table-wrap">
      <table className="oficina-table">
        <thead>
          <tr>
            <th scope="col">Código</th>
            <th scope="col">Peça</th>
            <th scope="col">Quantidade</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((peca) => (
            <tr key={peca.id}>
              <td data-label="Código">{peca.codigoPeca || "—"}</td>
              <td data-label="Peça">{peca.nomePeca}</td>
              <td data-label="Quantidade">{peca.quantidade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Servicos({ itens = [] }) {
  if (!itens.length)
    return (
      <p className="os-tecnica-vazio">Nenhum serviço salvo neste grupo.</p>
    );
  return itens.map((servico) => (
    <article className="os-tecnica-servico" key={servico.id}>
      <h4>
        {servico.codigoHierarquia && `${servico.codigoHierarquia} · `}
        {servico.nomeServico}
      </h4>
      {servico.descricao && <p>{servico.descricao}</p>}
      {servico.responsavel && <p>Responsável: {servico.responsavel}</p>}
      {servico.tipo && <p>Tipo: {servico.tipo}</p>}
      <h5>Peças deste serviço</h5>
      <Pecas itens={servico.pecas} />
    </article>
  ));
}

export default function ConteudoOrdemTecnica({ ordem }) {
  return (
    <div className="os-tecnica-conteudo">
      <section className="oficina-panel os-tecnica-grupo">
        <h2 className="oficina-section-heading"><FiClipboard aria-hidden="true" /> Diagnósticos</h2>
        {!ordem.diagnosticos?.length && (
          <p className="os-tecnica-vazio">Nenhum diagnóstico salvo nesta OS.</p>
        )}
        {ordem.diagnosticos?.map((diagnostico) => (
          <article className="os-tecnica-diagnostico" key={diagnostico.id}>
            <h3>
              {diagnostico.codigoHierarquia &&
                `${diagnostico.codigoHierarquia} · `}
              {diagnostico.nomeDiagnostico}
            </h3>
            {diagnostico.descricao && <p>{diagnostico.descricao}</p>}
            {diagnostico.observacoes && <p>{diagnostico.observacoes}</p>}
            <h4>Serviços deste diagnóstico</h4>
            <Servicos itens={diagnostico.servicos} />
            <h4>Peças diretamente ligadas ao diagnóstico</h4>
            <Pecas itens={diagnostico.pecas} />
          </article>
        ))}
      </section>
      <section className="oficina-panel os-tecnica-grupo">
        <h2 className="oficina-section-heading"><FiTool aria-hidden="true" /> Serviços sem diagnóstico</h2>
        <Servicos itens={ordem.servicos} />
      </section>
      <section className="oficina-panel os-tecnica-grupo">
        <h2 className="oficina-section-heading"><FiPackage aria-hidden="true" /> Peças avulsas</h2>
        <Pecas itens={ordem.pecas} />
      </section>
    </div>
  );
}
