import { cloneElement } from 'react';
import OrdemServicoItens from './OrdemServicoItens';
import { FiArrowLeft, FiChevronDown, FiFileText, FiPlus, FiSave, FiSearch, FiUser } from 'react-icons/fi';

const STATUS_OS = { ABERTA: 'Aberta', EM_ANDAMENTO: 'Em andamento', AGUARDANDO_PECA: 'Aguardando peça',
  FINALIZADA: 'Finalizada', FECHADA: 'Fechada', CANCELADA: 'Cancelada' };

function campo(label, id, controle, className = '') {
  return <div className={`os-field ${className}`.trim()}>
    <label htmlFor={id}>{label}</label>{cloneElement(controle, { id })}
  </div>;
}

/** Apresentação da OS. Todas as alterações são delegadas aos fluxos já existentes. */
export default function OrdemServicoTela({ ordem, modoTela, catalogos, busca, resultadosBusca,
  buscandoVeiculo, clienteNaoEncontrado, carregando, salvando, totais, podeCotar, acoes, formatarMoeda, children }) {
  const podeEditar = modoTela === 'nova' || modoTela === 'edicao';
  const estaVisualizando = modoTela === 'visualizacao';

  function salvarBotao(className = 'os-small-btn os-primary') {
    return <button type="button" className={className} onClick={acoes.salvarOrdemServico}
      disabled={!podeEditar || salvando || carregando}>
      <FiSave aria-hidden="true" />{salvando ? 'Salvando…' : 'Salvar OS'}
    </button>;
  }

  return <main className="os-page oficina-page" aria-labelledby="os-page-title">
    <header className="os-top oficina-page-header">
      <div>
        <div className="os-heading-line"><h1 id="os-page-title">Ordem de serviço</h1>
          {ordem.codigo && <span className="os-order-code">{ordem.codigo}</span>}
        </div>
        <p>{modoTela === 'nova' ? 'Novo atendimento' : estaVisualizando ? 'Consulta da ordem de serviço' : 'Edição da ordem de serviço'}</p>
        {carregando && <small role="status">Carregando dados da OS…</small>}
      </div>
      <div className="os-top-actions">
        {modoTela !== 'nova' && <button type="button" className="os-small-btn os-outline" onClick={acoes.novaOrdemServico}>
          <FiPlus aria-hidden="true" />Nova OS</button>}
        <button type="button" className="os-small-btn os-outline" onClick={acoes.abrirModalBuscarOS}>
          <FiSearch aria-hidden="true" />Buscar OS</button>
        {estaVisualizando ? <button type="button" className="os-small-btn os-primary" onClick={acoes.editarOrdemAtual}>Editar OS</button> : salvarBotao()}
      </div>
    </header>

    <div className="os-layout-grid">
      <div className="os-main-column">
        <section className="os-panel oficina-panel" aria-labelledby="os-atendimento-title">
          <div className="os-panel-title oficina-panel-title"><h2 id="os-atendimento-title">Cliente e veículo</h2>
            <span>Busque por nome do cliente ou placa do veículo.</span></div>
          <div className="os-field">
            <label htmlFor="os-busca-cliente">Buscar cliente ou placa</label>
            <div className="os-search-line">
              <input id="os-busca-cliente" value={busca} disabled={!podeEditar}
                onChange={event => acoes.setBusca(event.target.value)} onKeyDown={event => {
                  if (event.key === 'Enter' && !buscandoVeiculo && podeEditar) acoes.buscarClienteOuVeiculo();
                }} placeholder="Digite o nome do cliente ou placa" />
              <button type="button" className="os-small-btn os-outline" onClick={acoes.buscarClienteOuVeiculo}
                disabled={buscandoVeiculo || !podeEditar}>{buscandoVeiculo ? 'Buscando…' : 'Buscar'}</button>
            </div>
          </div>
          {resultadosBusca.length > 0 && podeEditar && <div className="os-search-results" aria-label="Veículos encontrados">
            {resultadosBusca.map(veiculo => <button type="button" key={veiculo.id} className="os-search-result-item"
              onClick={() => acoes.selecionarVeiculo(veiculo)}>
              <strong>{veiculo.cliente?.nome || 'Cliente sem nome'}</strong>
              <span>{veiculo.placa || 'Placa não informada'} · {veiculo.fabricante || ''} {veiculo.modelo || ''} · {acoes.montarAnoVeiculo(veiculo) || 'Ano não informado'} · Câmbio: {veiculo.cambio || 'Não informado'}</span>
            </button>)}
          </div>}
          {clienteNaoEncontrado && podeEditar && <div className="os-not-found" role="status">
            <span>Nenhum cliente ou veículo encontrado.</span>
            <button type="button" className="os-small-btn os-outline" onClick={acoes.cadastrarCliente}>Cadastrar novo cliente</button>
          </div>}
          {ordem.veiculo.id ? <>
            <div className="os-customer-summary">
              <FiUser aria-hidden="true" /><div><small>Cliente selecionado</small><strong>{ordem.cliente.nome || 'Nome não informado'}</strong></div>
              <span className="os-plate">{ordem.veiculo.placa || 'Placa não informada'}</span>
            </div>
            <div className="os-vehicle-summary">
              <strong>{[ordem.veiculo.marca, ordem.veiculo.modelo].filter(Boolean).join(' ') || 'Veículo selecionado'}</strong>
              <dl>{[['ano', 'Ano'], ['motor', 'Motor'], ['cambio', 'Câmbio'], ['cor', 'Cor'], ['km', 'Quilometragem']].map(([nome, label]) =>
                <div key={nome}><dt>{label}</dt><dd>{ordem.veiculo[nome] !== '' && ordem.veiculo[nome] != null ? ordem.veiculo[nome] : 'Não informado'}</dd></div>)}</dl>
            </div>
            <details className="os-vehicle-details">
              <summary><FiChevronDown aria-hidden="true" />Ver dados completos do veículo</summary>
              <div className="os-form-grid os-grid-4">
                {campo('Nome do cliente', 'os-cliente-nome', <input value={ordem.cliente.nome} readOnly />, 'os-col-full')}
                {Object.entries({ placa: 'Placa', marca: 'Marca', modelo: 'Modelo', ano: 'Ano', motor: 'Motor', cambio: 'Câmbio', cor: 'Cor', km: 'KM', chassi: 'Chassi' }).map(([nome, label]) =>
                  <div key={nome}>{campo(label, `os-veiculo-${nome}`, <input value={ordem.veiculo[nome]} readOnly />)}</div>)}
                <label className="os-check"><input type="checkbox" checked={ordem.veiculo.possuiAr} readOnly />Possui ar-condicionado</label>
              </div>
            </details>
          </> : <div className="os-empty os-customer-empty"><FiUser aria-hidden="true" />
            <strong>Nenhum cliente ou veículo selecionado</strong><span>Use a busca acima para selecionar o veículo deste atendimento.</span></div>}
          {campo('Observações da OS', 'os-observacoes', <textarea rows="3" value={ordem.observacoes} disabled={!podeEditar}
            onChange={event => acoes.atualizarCampoOrdem('observacoes', event.target.value)} placeholder="Observações gerais da ordem de serviço" />, 'os-observations')}
        </section>

        <OrdemServicoItens ordem={ordem} modoTela={modoTela} catalogos={catalogos}
          totais={totais} salvando={salvando} carregando={carregando}
          formatarMoeda={formatarMoeda} acoes={acoes} />
        <div className="os-document-actions">
          <button type="button" className="os-small-btn os-outline" onClick={acoes.voltarPagina}><FiArrowLeft aria-hidden="true" />Voltar</button>
        </div>
      </div>

      <aside className="os-side-column" aria-label="Gestão e financeiro da ordem de serviço">
        <section className="os-panel oficina-panel os-management" aria-labelledby="os-gestao-title">
          <h2 id="os-gestao-title">Gestão da OS</h2>
          {campo('Código da OS', 'os-codigo', <input value={ordem.codigo} readOnly placeholder="Automático" />)}
          <span className="os-status" data-status={ordem.status}>{STATUS_OS[ordem.status] || ordem.status}</span>
          {campo('Status da OS', 'os-status', <select value={ordem.status || 'ABERTA'} disabled={!podeEditar}
            onChange={event => acoes.atualizarCampoOrdem('status', event.target.value)}>
            {Object.entries(STATUS_OS).map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
          </select>)}
          {campo('Mecânico responsável', 'os-tecnico', <select value={ordem.tecnicoId || ''} disabled={!podeEditar}
            aria-describedby="os-tecnico-ajuda" onChange={event => acoes.atualizarCampoOrdem('tecnicoId', event.target.value)}>
            <option value="">Sem atribuição</option>
            {ordem.tecnicoId && !(catalogos.tecnicosOS || []).some(tecnico => tecnico.id === Number(ordem.tecnicoId)) &&
              <option value={ordem.tecnicoId}>{ordem.tecnicoNome || 'Mecânico vinculado'} (fora da equipe)</option>}
            {(catalogos.tecnicosOS || []).map(tecnico => <option key={tecnico.id} value={tecnico.id}>{tecnico.Nome}</option>)}
          </select>)}
          <p id="os-tecnico-ajuda" className="os-help">O vínculo com o mecânico só é confirmado ao salvar a OS.</p>
          {ordem.id && <button type="button" className="os-small-btn os-outline" onClick={acoes.abrirTickets}>Tickets desta OS</button>}
        </section>
        <section className="os-panel oficina-panel os-summary-card" aria-labelledby="os-resumo-title">
          <h2 id="os-resumo-title">Resumo financeiro</h2>
          <dl aria-live="polite" aria-atomic="true">
            <div><dt>Serviços</dt><dd>{formatarMoeda(totais.brutoServicos)}</dd></div>
            <div><dt>Peças</dt><dd>{formatarMoeda(totais.brutoPecas)}</dd></div>
            <div><dt>Descontos</dt><dd>{formatarMoeda(totais.totalDescontos)}</dd></div>
            <div className="os-summary-total"><dt>Total da OS</dt><dd>{formatarMoeda(totais.totalGeral)}</dd></div>
          </dl>
          {estaVisualizando && <p className="os-help">Use Editar OS para alterar esta ordem.</p>}
        </section>
        <section className="os-panel oficina-panel os-actions-card" aria-labelledby="os-documentos-title">
          <h2 id="os-documentos-title">Documentos e cotação</h2>
          <div className="os-document-actions">
            <button type="button" className="os-small-btn os-outline" onClick={acoes.imprimirOrdemServico} disabled={!ordem.veiculo.id}>
              <FiFileText aria-hidden="true" />Imprimir OS</button>
            <button type="button" className="os-small-btn os-outline" onClick={acoes.abrirCotacao} disabled={!podeCotar}>Enviar cotação para fornecedor</button>
          </div>
        </section>
      </aside>
    </div>
    {children}
  </main>;
}
