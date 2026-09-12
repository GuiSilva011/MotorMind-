import "../styles/tecnicoStyles/ordemServico.css";

function Pecas({ itens = [] }) {
  if (!itens.length)
    return <p className="os-tecnica-vazio">Nenhuma peça salva neste grupo.</p>;
  return (
    <div className="os-tecnica-tabela">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Peça</th>
            <th>Quantidade</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((peca) => (
            <tr key={peca.id}>
              <td>{peca.codigoPeca || "—"}</td>
              <td>{peca.nomePeca}</td>
              <td>{peca.quantidade}</td>
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
      <section className="os-tecnica-grupo">
        <h2>Diagnósticos</h2>
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
      <section className="os-tecnica-grupo">
        <h2>Serviços sem diagnóstico</h2>
        <Servicos itens={ordem.servicos} />
      </section>
      <section className="os-tecnica-grupo">
        <h2>Peças avulsas</h2>
        <Pecas itens={ordem.pecas} />
      </section>
    </div>
  );
}
