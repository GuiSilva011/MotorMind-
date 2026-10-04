import { cloneElement } from 'react';
import { FiArrowLeft, FiChevronDown, FiFileText, FiPlus, FiSave, FiSearch, FiTrash2, FiUser } from 'react-icons/fi';
import { calcularTotalPeca, calcularTotalServico } from '../utils/ordemServicoCalculos';

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

  function camposItem(tipo, conteudo) {
    return podeEditar ? <div className="os-item-editor">{conteudo}</div>
      : <details className="os-item-details">
        <summary><FiChevronDown aria-hidden="true" />Ver dados e valores {tipo}</summary>
        {conteudo}
      </details>;
  }

  function renderPeca({ peca, codigo, diagnosticoId, servicoId }) {
    const vinculadaDiagnostico = diagnosticoId !== undefined;
    const vinculadaServico = servicoId !== undefined;
    const origem = vinculadaDiagnostico ? 'diagnostico' : vinculadaServico ? 'servico-sem-diagnostico' : 'avulsa';
    const atualizar = (nome, valor) => vinculadaDiagnostico
      ? acoes.atualizarPecaDiagnostico(diagnosticoId, servicoId, peca.id, nome, valor)
      : vinculadaServico ? acoes.atualizarPecaSemDiagnostico(servicoId, peca.id, nome, valor)
        : acoes.atualizarPecaAvulsa(peca.id, nome, valor);
    const fornecedor = valor => vinculadaDiagnostico
      ? acoes.aplicarFornecedorPecaDiagnostico(diagnosticoId, servicoId, peca.id, valor)
      : vinculadaServico ? acoes.aplicarFornecedorPecaSemDiagnostico(servicoId, peca.id, valor)
        : acoes.aplicarFornecedorPecaAvulsa(peca.id, valor);
    const remover = () => vinculadaDiagnostico
      ? acoes.removerPecaDiagnostico(diagnosticoId, servicoId, peca.id)
      : vinculadaServico ? acoes.removerPecaSemDiagnostico(servicoId, peca.id)
        : acoes.removerPecaAvulsa(peca.id);
    const abrir = tipo => acoes.abrirModalCatalogo({ tipo, diagnosticoId, servicoId, pecaId: peca.id, origem });
    const id = `os-peca-${peca.id}`;

    const campos = <div className="os-form-grid os-grid-piece">
      <fieldset className="os-field os-col-full os-source-field">
        <legend>Escolha a peça</legend>
        <div className="os-piece-source-actions">
          <button type="button" className="os-select-modal-btn" onClick={() => abrir('peca')} disabled={!podeEditar}>
            <FiSearch aria-hidden="true" />{peca.pecaCatalogoId ? `Catálogo: ${peca.descricao}` : 'Selecionar do catálogo'}
          </button>
          <button type="button" className={`os-select-modal-btn ${peca.estoquePecaId ? 'os-stock-selected' : ''}`}
            onClick={() => abrir('estoque')} disabled={!podeEditar}>
            <FiSearch aria-hidden="true" />{peca.estoquePecaId ? `Estoque: ${peca.descricao}` : 'Pegar do estoque'}
          </button>
        </div>
        {peca.estoquePecaId && <small className="os-stock-note">A baixa será confirmada ao salvar a OS.</small>}
      </fieldset>
      {campo('Descrição da peça', `${id}-descricao`, <input value={peca.descricao} disabled={!podeEditar}
        onChange={event => atualizar('descricao', event.target.value)} placeholder="Nome ou descrição da peça" />, 'os-col-2')}
      {campo('Fornecedor', `${id}-fornecedor`, <select value={peca.fornecedorId}
        disabled={!podeEditar || Boolean(peca.estoquePecaId)} onChange={event => fornecedor(event.target.value)}>
        <option value="">{peca.estoquePecaId ? 'Estoque interno' : 'Selecione'}</option>
        {catalogos.fornecedores.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}
      </select>)}
      {campo('Quantidade', `${id}-quantidade`, <input type="number" min="1" step="1" value={peca.quantidade}
        disabled={!podeEditar} onChange={event => atualizar('quantidade', event.target.value)} />)}
      {campo('Custo unitário (R$)', `${id}-custo`, <input type="number" step="0.01" value={peca.custoUnitario}
        disabled={!podeEditar} onChange={event => atualizar('custoUnitario', event.target.value)} placeholder="0,00" />)}
      {campo('Desconto (R$)', `${id}-desconto`, <input type="number" step="0.01" value={peca.desconto}
        disabled={!podeEditar} onChange={event => atualizar('desconto', event.target.value)} placeholder="0,00" />)}
      {campo('Total da peça', `${id}-total`, <input readOnly value={formatarMoeda(calcularTotalPeca(peca))} />)}
    </div>;

    return <article className="os-piece-row" key={peca.id} aria-label={`Peça ${codigo}`}>
      <div className="os-item-heading">
        <span className="os-item-code">{codigo}</span>
        <div className="os-item-name">
          <strong>{peca.descricao || 'Nova peça'}</strong>
          <div className="os-item-meta">
            <span className="os-origin">{peca.estoquePecaId ? 'Estoque' : peca.pecaCatalogoId ? 'Catálogo' : 'Origem não definida'}</span>
            <span>Quantidade: {peca.quantidade || 0}</span>
          </div>
        </div>
        <strong className="os-item-amount">{formatarMoeda(calcularTotalPeca(peca))}</strong>
        {podeEditar && <button type="button" className="os-icon-btn" onClick={remover}
          aria-label={`Remover peça ${codigo}`} title="Remover peça"><FiTrash2 aria-hidden="true" /></button>}
      </div>
      {camposItem('da peça', campos)}
    </article>;
  }

  function renderServico({ servico, codigo, diagnosticoId }) {
    const vinculado = diagnosticoId !== undefined;
    const atualizar = (nome, valor) => vinculado
      ? acoes.atualizarServicoDiagnostico(diagnosticoId, servico.id, nome, valor)
      : acoes.atualizarServicoSemDiagnostico(servico.id, nome, valor);
    const remover = () => vinculado ? acoes.removerServicoDiagnostico(diagnosticoId, servico.id)
      : acoes.removerServicoSemDiagnostico(servico.id);
    const id = `os-servico-${servico.id}`;
    const responsaveis = catalogos.tecnicos.map(tecnico => tecnico.usuario?.Nome || '');

    const campos = <div className="os-form-grid os-grid-service">
      {campo('Escolha o serviço', `${id}-catalogo`, <button type="button" className="os-select-modal-btn" disabled={!podeEditar}
        onClick={() => acoes.abrirModalCatalogo({ tipo: 'servico', diagnosticoId, servicoId: servico.id,
          origem: vinculado ? 'diagnostico' : 'sem-diagnostico' })}>
        <FiSearch aria-hidden="true" />{servico.servicoCatalogoId ? `Trocar serviço: ${servico.descricao}` : 'Selecionar serviço cadastrado'}
      </button>, 'os-col-2')}
      {campo('Descrição do serviço', `${id}-descricao`, <input value={servico.descricao} disabled={!podeEditar}
        onChange={event => atualizar('descricao', event.target.value)} placeholder="Nome ou descrição do serviço" />, 'os-col-2')}
      {campo('Responsável', `${id}-responsavel`, <select value={servico.responsavel} disabled={!podeEditar}
        onChange={event => atualizar('responsavel', event.target.value)}>
        <option value="">Selecione um técnico</option>
        {servico.responsavel && !responsaveis.includes(servico.responsavel) && <option value={servico.responsavel}>{servico.responsavel}</option>}
        {catalogos.tecnicos.map(tecnico => <option key={tecnico.id} value={tecnico.usuario?.Nome || ''}>
          {tecnico.usuario?.Nome || 'Técnico sem nome'}
        </option>)}
      </select>)}
      {campo('Tipo', `${id}-tipo`, <input value={servico.tipo} disabled={!podeEditar}
        onChange={event => atualizar('tipo', event.target.value)} placeholder="Mão de obra, troca…" />)}
      {campo('Preço (R$)', `${id}-preco`, <input type="number" step="0.01" value={servico.precoVenda} disabled={!podeEditar}
        onChange={event => atualizar('precoVenda', event.target.value)} placeholder="0,00" />)}
      {campo('Desconto (R$)', `${id}-desconto`, <input type="number" step="0.01" value={servico.desconto} disabled={!podeEditar}
        onChange={event => atualizar('desconto', event.target.value)} placeholder="0,00" />)}
    </div>;

    return <article className="os-service-row" key={servico.id} aria-label={`Serviço ${codigo}`}>
      <div className="os-item-heading">
        <span className="os-item-code">{codigo}</span>
        <div className="os-item-name">
          <strong>{servico.descricao || 'Novo serviço'}</strong>
          <span className="os-item-meta">{[servico.responsavel, servico.tipo].filter(Boolean).join(' · ') || 'Responsável e tipo não definidos'}</span>
        </div>
        <strong className="os-item-amount">{formatarMoeda(calcularTotalServico(servico))}</strong>
        {podeEditar && <button type="button" className="os-icon-btn" onClick={remover}
          aria-label={`Remover serviço ${codigo}`} title="Remover serviço"><FiTrash2 aria-hidden="true" /></button>}
      </div>
      {camposItem('do serviço', campos)}
      {(podeEditar || servico.pecas.length > 0) && <div className="os-piece-area">
        <h4>Peças deste serviço</h4>
        {!servico.pecas.length && <p className="os-inner-empty">Use Adicionar peça para incluir uma peça neste serviço.</p>}
        {servico.pecas.map((peca, index) => renderPeca({ peca, codigo: `${codigo}.${index + 1}`, diagnosticoId, servicoId: servico.id }))}
        {podeEditar && <button type="button" className="os-small-btn os-outline os-add-item" aria-label={`Adicionar peça ao serviço ${codigo}`} onClick={() => vinculado
          ? acoes.adicionarPecaDiagnostico(diagnosticoId, servico.id) : acoes.adicionarPecaSemDiagnostico(servico.id)}>
          <FiPlus aria-hidden="true" />Adicionar peça
        </button>}
      </div>}
    </article>;
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

        <section className="os-service-panel oficina-panel" aria-labelledby="os-itens-title">
          <div className="os-panel-title oficina-panel-title"><h2 id="os-itens-title">Diagnósticos, serviços e peças</h2>
            <span>Adicione um diagnóstico, os serviços dentro dele e as peças de cada serviço.</span></div>
          {!podeEditar && !ordem.diagnosticos.length && !ordem.servicosSemDiagnostico.length && !ordem.pecasAvulsas.length &&
            <div className="os-empty">Nenhum diagnóstico, serviço ou peça adicionado.</div>}
          {(podeEditar || ordem.diagnosticos.length > 0) && <section className="os-item-section" aria-labelledby="os-diagnosticos-title">
            <h3 id="os-diagnosticos-title">Diagnósticos</h3>
            {!ordem.diagnosticos.length && <p className="os-inner-empty">Comece adicionando um diagnóstico para agrupar seus serviços e peças.</p>}
            {ordem.diagnosticos.map((diagnostico, index) => {
              const codigo = `D.${String(index + 1).padStart(2, '0')}`;
              return <article className="os-diagnostic-group" key={diagnostico.id} aria-label={`Diagnóstico ${codigo}`}>
                <div className="os-diagnostic-header">
                  <span className="os-item-code">{codigo}</span><strong className="os-grow">Diagnóstico</strong>
                  {podeEditar && <button type="button" className="os-icon-btn" aria-label={`Remover diagnóstico ${codigo}`}
                    title="Remover diagnóstico" onClick={() => acoes.removerDiagnostico(diagnostico.id)}><FiTrash2 aria-hidden="true" /></button>}
                </div>
                <div className="os-diagnostic-selection">
                  {campo('Descrição do diagnóstico', `os-diagnostico-${diagnostico.id}`, <input value={diagnostico.descricao} disabled={!podeEditar}
                    onChange={event => acoes.atualizarDiagnostico(diagnostico.id, 'descricao', event.target.value)} placeholder="Digite o diagnóstico ou selecione um cadastrado" />, 'os-grow')}
                  {podeEditar && <button type="button" className="os-select-modal-btn" aria-label={`Selecionar diagnóstico cadastrado para ${codigo}`}
                    onClick={() => acoes.abrirModalCatalogo({ tipo: 'diagnostico', diagnosticoId: diagnostico.id })}>
                    <FiSearch aria-hidden="true" />{diagnostico.diagnosticoCatalogoId ? 'Trocar diagnóstico cadastrado' : 'Selecionar diagnóstico cadastrado'}
                  </button>}
                </div>
                <div className="os-diagnostic-services">
                  <h4>Serviços deste diagnóstico</h4>
                  {diagnostico.servicos.map((servico, servicoIndex) => renderServico({ servico, codigo: `${codigo}.${servicoIndex + 1}`, diagnosticoId: diagnostico.id }))}
                  {!diagnostico.servicos.length && <p className="os-inner-empty">{podeEditar
                    ? 'Use Adicionar serviço para incluir um serviço neste diagnóstico.' : 'Nenhum serviço vinculado a este diagnóstico.'}</p>}
                  {podeEditar && <button type="button" className="os-small-btn os-outline os-add-item" aria-label={`Adicionar serviço ao diagnóstico ${codigo}`}
                    onClick={() => acoes.adicionarServicoAoDiagnostico(diagnostico.id)}>
                    <FiPlus aria-hidden="true" />Adicionar serviço</button>}
                </div>
              </article>;
            })}
            {podeEditar && <button type="button" className="os-small-btn os-outline os-add-item" onClick={acoes.adicionarDiagnostico}>
              <FiPlus aria-hidden="true" />Adicionar diagnóstico</button>}
          </section>}
          {(podeEditar || ordem.servicosSemDiagnostico.length > 0) && <section className="os-item-section os-free-items" aria-labelledby="os-servicos-livres-title">
            <h3 id="os-servicos-livres-title">Serviços sem diagnóstico</h3>
            {podeEditar && <p className="os-help">Use esta área para serviços que não pertencem a um diagnóstico.</p>}
            {ordem.servicosSemDiagnostico.map((servico, index) =>
              renderServico({ servico, codigo: `S.${String(index + 1).padStart(2, '0')}` }))}
            {podeEditar && <button type="button" className="os-small-btn os-outline os-add-item" onClick={acoes.adicionarServicoSemDiagnostico}>
              <FiPlus aria-hidden="true" />Adicionar serviço sem diagnóstico</button>}
          </section>}
          {(podeEditar || ordem.pecasAvulsas.length > 0) && <section className="os-item-section os-free-items os-loose-parts" aria-labelledby="os-pecas-avulsas-title">
            <h3 id="os-pecas-avulsas-title">Peças avulsas</h3>
            {podeEditar && <p className="os-help">Use esta área para peças que não pertencem a um serviço.</p>}
            {ordem.pecasAvulsas.map((peca, index) => renderPeca({ peca, codigo: `P.${String(index + 1).padStart(2, '0')}` }))}
            {podeEditar && <button type="button" className="os-small-btn os-outline os-add-item" onClick={acoes.adicionarPecaAvulsa}>
              <FiPlus aria-hidden="true" />Adicionar peça avulsa</button>}
          </section>}
        </section>
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
          {salvarBotao('os-small-btn os-primary os-save-summary')}
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
