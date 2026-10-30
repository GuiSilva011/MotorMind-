import { useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronDown, FiChevronRight, FiFileText, FiPlus, FiSave, FiSearch, FiTrash2 } from 'react-icons/fi';
import { calcularTotalPeca, calcularTotalServico } from '../utils/ordemServicoCalculos';

function campo(label, id, controle, className = '') {
  return <div className={`os-field ${className}`.trim()}>
    <label htmlFor={id}>{label}</label>{controle}
  </div>;
}

function totalServico(servico) {
  return calcularTotalServico(servico) + servico.pecas.reduce((total, peca) => total + calcularTotalPeca(peca), 0);
}

function totalDiagnostico(diagnostico) {
  return diagnostico.servicos.reduce((total, servico) => total + totalServico(servico), 0);
}

function criarNos(ordem) {
  const nos = [];
  ordem.diagnosticos.forEach((diagnostico, diagnosticoIndex) => {
    const codigoDiagnostico = `D.${String(diagnosticoIndex + 1).padStart(2, '0')}`;
    const noDiagnostico = {
      key: `diagnostico:${diagnostico.id}`, tipo: 'diagnostico', id: diagnostico.id,
      codigo: codigoDiagnostico, item: diagnostico, subtotal: totalDiagnostico(diagnostico),
    };
    nos.push(noDiagnostico);
    diagnostico.servicos.forEach((servico, servicoIndex) => {
      const codigoServico = `${codigoDiagnostico}.${servicoIndex + 1}`;
      const noServico = {
        key: `servico:${servico.id}`, tipo: 'servico', id: servico.id,
        diagnosticoId: diagnostico.id, parentKey: noDiagnostico.key,
        codigo: codigoServico, item: servico, subtotal: totalServico(servico),
      };
      nos.push(noServico);
      servico.pecas.forEach((peca, pecaIndex) => nos.push({
        key: `peca:${peca.id}`, tipo: 'peca', id: peca.id,
        diagnosticoId: diagnostico.id, servicoId: servico.id, parentKey: noServico.key,
        codigo: `${codigoServico}.${pecaIndex + 1}`, item: peca,
        subtotal: calcularTotalPeca(peca),
      }));
    });
  });
  ordem.servicosSemDiagnostico.forEach((servico, servicoIndex) => {
    const codigoServico = `S.${String(servicoIndex + 1).padStart(2, '0')}`;
    const noServico = {
      key: `servico:${servico.id}`, tipo: 'servico', id: servico.id,
      codigo: codigoServico, item: servico, subtotal: totalServico(servico), avulso: true,
    };
    nos.push(noServico);
    servico.pecas.forEach((peca, pecaIndex) => nos.push({
      key: `peca:${peca.id}`, tipo: 'peca', id: peca.id, servicoId: servico.id,
      parentKey: noServico.key, codigo: `${codigoServico}.${pecaIndex + 1}`,
      item: peca, subtotal: calcularTotalPeca(peca),
    }));
  });
  ordem.pecasAvulsas.forEach((peca, pecaIndex) => nos.push({
    key: `peca:${peca.id}`, tipo: 'peca', id: peca.id,
    codigo: `P.${String(pecaIndex + 1).padStart(2, '0')}`,
    item: peca, subtotal: calcularTotalPeca(peca), avulso: true,
  }));
  return nos;
}

export default function OrdemServicoItens({ ordem, modoTela, catalogos, totais, salvando, carregando,
  formatarMoeda, acoes }) {
  const podeEditar = modoTela === 'nova' || modoTela === 'edicao';
  const [selecionado, setSelecionado] = useState(null);
  const [recolhidos, setRecolhidos] = useState(() => new Set());
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const editorRef = useRef(null);
  const focarEditor = useRef(false);
  const nos = useMemo(() => criarNos(ordem), [ordem]);
  const porChave = useMemo(() => new Map(nos.map(no => [no.key, no])), [nos]);
  const itemAtivo = porChave.get(selecionado) || null;
  const diagnosticos = ordem.diagnosticos;
  const servicos = [
    ...diagnosticos.flatMap((diagnostico, diagnosticoIndex) => diagnostico.servicos.map((servico, servicoIndex) => ({
      ...servico, diagnosticoId: diagnostico.id,
      diagnosticoNome: diagnostico.descricao || 'Diagnóstico sem descrição',
      codigo: `D.${String(diagnosticoIndex + 1).padStart(2, '0')}.${servicoIndex + 1}`,
    }))),
    ...ordem.servicosSemDiagnostico.map((servico, index) => ({
      ...servico, codigo: `S.${String(index + 1).padStart(2, '0')}`, avulso: true,
    })),
  ];

  useEffect(() => {
    if (selecionado && porChave.has(selecionado)) return;
    const inicial = nos.find(no => no.tipo === 'servico' && no.item.pecas.length > 0) || nos[0];
    setSelecionado(inicial?.key || null);
  }, [nos, porChave, selecionado]);

  useEffect(() => {
    if (!menuAberto) return undefined;
    function fecharFora(event) {
      if (!menuRef.current?.contains(event.target)) setMenuAberto(false);
    }
    function fecharEscape(event) {
      if (event.key === 'Escape') {
        setMenuAberto(false);
        menuTriggerRef.current?.focus();
        return;
      }
      if (!menuRef.current?.contains(event.target)) return;
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      const itens = [...menuRef.current.querySelectorAll('[role="menuitem"]')];
      if (!itens.length) return;
      event.preventDefault();
      const atual = itens.indexOf(document.activeElement);
      const indice = event.key === 'Home' ? 0 : event.key === 'End' ? itens.length - 1
        : event.key === 'ArrowDown' ? (atual + 1) % itens.length
          : (atual <= 0 ? itens.length - 1 : atual - 1);
      itens[indice].focus();
    }
    document.addEventListener('pointerdown', fecharFora);
    document.addEventListener('keydown', fecharEscape);
    return () => {
      document.removeEventListener('pointerdown', fecharFora);
      document.removeEventListener('keydown', fecharEscape);
    };
  }, [menuAberto]);

  useEffect(() => {
    if (!focarEditor.current || !selecionado) return;
    focarEditor.current = false;
    const frame = window.requestAnimationFrame(() => {
      editorRef.current?.querySelector('.os-editor-form input:not(:disabled), .os-editor-form select:not(:disabled), .os-editor-form button:not(:disabled)')?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selecionado]);

  function selecionar(no, foco = false) {
    if (no.diagnosticoId) {
      setRecolhidos(prev => {
        if (!prev.has(no.diagnosticoId)) return prev;
        const proximo = new Set(prev);
        proximo.delete(no.diagnosticoId);
        return proximo;
      });
    }
    focarEditor.current = foco;
    setSelecionado(no.key);
  }

  function selecionarNovo(tipo, item) {
    if (!item) return;
    const prefixo = tipo === 'diagnostico' ? 'diagnostico' : tipo === 'peca' ? 'peca' : 'servico';
    selecionar({ key: `${prefixo}:${item.id}` }, true);
  }

  function recolherDiagnostico(id) {
    setRecolhidos(prev => {
      const proximo = new Set(prev);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  function expandirDiagnostico(id) {
    if (!id) return;
    setRecolhidos(prev => {
      if (!prev.has(id)) return prev;
      const proximo = new Set(prev);
      proximo.delete(id);
      return proximo;
    });
  }

  function adicionarDiagnostico() {
    setMenuAberto(false);
    selecionarNovo('diagnostico', acoes.adicionarDiagnostico());
  }

  function adicionarServicoAvulso() {
    setMenuAberto(false);
    selecionarNovo('servico', acoes.adicionarServicoSemDiagnostico());
  }

  function adicionarPecaAvulsa() {
    setMenuAberto(false);
    selecionarNovo('peca', acoes.adicionarPecaAvulsa());
  }

  function adicionarServico(diagnosticoId) {
    selecionarNovo('servico', acoes.adicionarServicoAoDiagnostico(diagnosticoId));
  }

  function adicionarPeca(no) {
    const peca = no.diagnosticoId
      ? acoes.adicionarPecaDiagnostico(no.diagnosticoId, no.id)
      : acoes.adicionarPecaSemDiagnostico(no.id);
    selecionarNovo('peca', peca);
  }

  function remover(no) {
    if (!podeEditar || !window.confirm(`Deseja excluir ${rotuloTipo(no)} "${titulo(no)}"?`)) return;
    const irmaos = no.tipo === 'diagnostico'
      ? nos.filter(item => item.tipo === 'diagnostico')
      : no.tipo === 'servico'
        ? nos.filter(item => item.tipo === 'servico' && item.diagnosticoId === no.diagnosticoId)
        : nos.filter(item => item.tipo === 'peca' && item.parentKey === no.parentKey && item.avulso);
    const indice = irmaos.findIndex(item => item.key === no.key);
    const pai = no.parentKey ? porChave.get(no.parentKey) : null;
    const proximo = pai || irmaos[indice + 1] || irmaos[indice - 1] || nos.find(item => item.key !== no.key);
    if (no.tipo === 'diagnostico') acoes.removerDiagnostico(no.id);
    else if (no.tipo === 'servico') {
      if (no.diagnosticoId) acoes.removerServicoDiagnostico(no.diagnosticoId, no.id);
      else acoes.removerServicoSemDiagnostico(no.id);
    } else if (no.diagnosticoId) acoes.removerPecaDiagnostico(no.diagnosticoId, no.servicoId, no.id);
    else if (no.servicoId) acoes.removerPecaSemDiagnostico(no.servicoId, no.id);
    else acoes.removerPecaAvulsa(no.id);
    setSelecionado(proximo?.key || null);
  }

  function titulo(no) {
    if (no.tipo === 'diagnostico') return no.item.descricao || 'Novo diagnóstico';
    if (no.tipo === 'servico') return no.item.descricao || 'Novo serviço';
    return no.item.descricao || 'Nova peça';
  }

  function rotuloTipo(no) {
    if (no.tipo === 'diagnostico') return 'o diagnóstico';
    if (no.tipo === 'servico') return no.diagnosticoId ? 'o serviço' : 'o serviço avulso';
    return no.diagnosticoId || no.servicoId ? 'a peça' : 'a peça avulsa';
  }

  function botoesAdicionarClasse() {
    return <span className="os-tree-legend" role="group" aria-label="Legenda da estrutura">
      <span><i className="os-tree-marker os-marker-diagnostico" />Diagnóstico</span>
      <span><i className="os-tree-marker os-marker-servico" />Serviço</span>
      <span><i className="os-tree-marker os-marker-peca" />Peça</span>
    </span>;
  }

  function botaoItem(no, conteudo, classe = '') {
    return <button type="button" key={no.key}
      className={`os-tree-item os-tree-${no.tipo} ${selecionado === no.key ? 'is-selected' : ''} ${classe}`.trim()}
      aria-pressed={selecionado === no.key} onClick={() => selecionar(no)}>
      {conteudo}
    </button>;
  }

  function removerSelecionado() {
    if (itemAtivo) remover(itemAtivo);
  }

  function editorCabecalho(no) {
    return <div className="os-editor-toolbar">
      <div className="os-editor-actions">
        {no.tipo === 'servico' && !no.diagnosticoId && podeEditar && diagnosticos.length > 0 &&
          <label className="os-move-control">
            <span>Mover para um diagnóstico</span>
            <select value="" aria-label="Mover serviço para um diagnóstico" onChange={event => {
              if (event.target.value) {
                expandirDiagnostico(event.target.value);
                acoes.moverServicoParaDiagnostico(no.id, event.target.value);
              }
            }}>
              <option value="">Selecionar…</option>
              {diagnosticos.map((diagnostico, index) => <option key={diagnostico.id} value={diagnostico.id}>
                {`D.${String(index + 1).padStart(2, '0')} · ${diagnostico.descricao || 'Diagnóstico sem descrição'}`}
              </option>)}
            </select>
          </label>}
        {no.tipo === 'peca' && no.avulso && podeEditar && servicos.length > 0 &&
          <label className="os-move-control">
            <span>Mover para um serviço</span>
            <select value="" aria-label="Mover peça avulsa para um serviço" onChange={event => {
              const destino = servicos.find(servico => `${servico.diagnosticoId || ''}:${servico.id}` === event.target.value);
              if (destino) {
                expandirDiagnostico(destino.diagnosticoId);
                acoes.moverPecaAvulsaParaServico(no.id, destino.diagnosticoId || null, destino.id);
              }
            }}>
              <option value="">Selecionar…</option>
              {servicos.map(servico => <option key={servico.id} value={`${servico.diagnosticoId || ''}:${servico.id}`}>
                {servico.diagnosticoNome ? `${servico.codigo} · ${servico.diagnosticoNome} · ` : `${servico.codigo} · `}
                {servico.descricao || 'Serviço sem descrição'}
              </option>)}
            </select>
          </label>}
        {podeEditar && <button type="button" className="os-editor-delete" onClick={removerSelecionado}>
          <FiTrash2 aria-hidden="true" />Excluir {no.tipo === 'diagnostico' ? 'diagnóstico' : no.tipo === 'servico' ? 'serviço' : 'peça'}
        </button>}
      </div>
    </div>;
  }

  function diagnosticoEditor(no) {
    const diagnostico = no.item;
    const id = `os-diagnostico-${diagnostico.id}`;
    return <>
      <div className="os-editor-item-title">
        <h3 aria-label={`Diagnóstico: ${titulo(no)}`}><span className="os-type-marker os-marker-diagnostico" aria-hidden="true" />{titulo(no)}</h3>
      </div>
      <div className="os-editor-form">
        <div className="os-form-grid">
          {campo('Descrição do diagnóstico', id, <input id={id} value={diagnostico.descricao} disabled={!podeEditar}
            onChange={event => acoes.atualizarDiagnostico(diagnostico.id, 'descricao', event.target.value)}
            placeholder="Digite o diagnóstico" />, 'os-col-full')}
          {podeEditar && <div className="os-field os-col-full">
            <span className="os-field-caption">Diagnóstico cadastrado</span>
            <button type="button" className="os-select-modal-btn" onClick={() => acoes.abrirModalCatalogo({ tipo: 'diagnostico', diagnosticoId: diagnostico.id })}>
              <FiSearch aria-hidden="true" />{diagnostico.diagnosticoCatalogoId ? 'Trocar diagnóstico cadastrado' : 'Selecionar diagnóstico cadastrado'}
            </button>
          </div>}
        </div>
        <div className="os-editor-related">
          <div className="os-editor-section-title"><h4>Serviços deste diagnóstico</h4>
            <span>{diagnostico.servicos.length}</span></div>
          {diagnostico.servicos.map((servico, index) => {
            const servicoNo = porChave.get(`servico:${servico.id}`);
            return <button type="button" key={servico.id} className="os-related-item"
              aria-pressed={selecionado === servicoNo?.key} onClick={() => servicoNo && selecionar(servicoNo)}>
              <span className="os-related-marker os-marker-servico" />
              <span className="os-related-code">{no.codigo}.{index + 1}</span>
              <strong>{servico.descricao || 'Novo serviço'}</strong>
              <small>{servico.tipo || 'Tipo não definido'} · {servico.responsavel || 'sem técnico'}</small>
              <b>{formatarMoeda(totalServico(servico))}</b>
            </button>;
          })}
          {!diagnostico.servicos.length && <div className="os-editor-empty">Nenhum serviço neste diagnóstico.</div>}
          {podeEditar && <button type="button" className="os-add-related" onClick={() => adicionarServico(diagnostico.id)}>
            <FiPlus aria-hidden="true" />Adicionar serviço
          </button>}
        </div>
      </div>
      {rodapeSubtotal('Subtotal do diagnóstico', no.subtotal)}
    </>;
  }

  function servicoEditor(no) {
    const servico = no.item;
    const id = `os-servico-${servico.id}`;
    const atualizar = (campoNome, valor) => no.diagnosticoId
      ? acoes.atualizarServicoDiagnostico(no.diagnosticoId, servico.id, campoNome, valor)
      : acoes.atualizarServicoSemDiagnostico(servico.id, campoNome, valor);
    const responsaveis = catalogos.tecnicos.map(tecnico => tecnico.usuario?.Nome || '');
    return <>
      <div className="os-editor-item-title">
        <h3 aria-label={`${no.diagnosticoId ? 'Serviço' : 'Serviço avulso'}: ${titulo(no)}`}>
          <span className="os-type-marker os-marker-servico" aria-hidden="true" />{titulo(no)}
        </h3>
      </div>
      <div className="os-editor-form">
        <div className="os-form-grid os-editor-service-grid">
          <div className="os-field os-col-full">
            <span className="os-field-caption">Serviço cadastrado</span>
            <button type="button" className="os-select-modal-btn" disabled={!podeEditar}
              onClick={() => acoes.abrirModalCatalogo({ tipo: 'servico', diagnosticoId: no.diagnosticoId,
                servicoId: servico.id, origem: no.diagnosticoId ? 'diagnostico' : 'sem-diagnostico' })}>
              <FiSearch aria-hidden="true" />{servico.servicoCatalogoId ? `Trocar serviço: ${servico.descricao}` : 'Selecionar serviço cadastrado'}
            </button>
          </div>
          {campo('Descrição do serviço', `${id}-descricao`, <input id={`${id}-descricao`} value={servico.descricao} disabled={!podeEditar}
            onChange={event => atualizar('descricao', event.target.value)} placeholder="Nome ou descrição do serviço" />, 'os-col-full')}
          {campo('Tipo', `${id}-tipo`, <input id={`${id}-tipo`} value={servico.tipo} disabled={!podeEditar}
            onChange={event => atualizar('tipo', event.target.value)} placeholder="Mão de obra, troca…" />)}
          {campo('Responsável', `${id}-responsavel`, <select id={`${id}-responsavel`} value={servico.responsavel} disabled={!podeEditar}
            onChange={event => atualizar('responsavel', event.target.value)}>
            <option value="">Selecione um técnico</option>
            {servico.responsavel && !responsaveis.includes(servico.responsavel) && <option value={servico.responsavel}>{servico.responsavel}</option>}
            {catalogos.tecnicos.map(tecnico => <option key={tecnico.id} value={tecnico.usuario?.Nome || ''}>{tecnico.usuario?.Nome || 'Técnico sem nome'}</option>)}
          </select>)}
          {campo('Preço (R$)', `${id}-preco`, <input id={`${id}-preco`} type="number" step="0.01" value={servico.precoVenda} disabled={!podeEditar}
            onChange={event => atualizar('precoVenda', event.target.value)} placeholder="0,00" />)}
          {campo('Desconto (R$)', `${id}-desconto`, <input id={`${id}-desconto`} type="number" step="0.01" value={servico.desconto} disabled={!podeEditar}
            onChange={event => atualizar('desconto', event.target.value)} placeholder="0,00" />)}
        </div>
        <div className="os-editor-related">
          <div className="os-editor-section-title"><h4>Peças deste serviço</h4><span>{servico.pecas.length}</span></div>
          {servico.pecas.map(peca => {
            const pecaNo = porChave.get(`peca:${peca.id}`);
            return <button type="button" key={peca.id} className="os-related-item os-related-piece"
              aria-pressed={selecionado === pecaNo?.key} onClick={() => pecaNo && selecionar(pecaNo)}>
              <span className="os-related-marker os-marker-peca" />
              <strong>{peca.descricao || 'Nova peça'}</strong>
              <small>{peca.quantidade || 0} × {formatarMoeda(peca.custoUnitario || 0)}</small>
              <b>{formatarMoeda(calcularTotalPeca(peca))}</b>
            </button>;
          })}
          {!servico.pecas.length && <div className="os-editor-empty">Nenhuma peça neste serviço.</div>}
          {podeEditar && <button type="button" className="os-add-related" onClick={() => adicionarPeca(no)}>
            <FiPlus aria-hidden="true" />Adicionar peça
          </button>}
        </div>
      </div>
      {rodapeSubtotal('Subtotal do serviço', no.subtotal)}
    </>;
  }

  function pecaEditor(no) {
    const peca = no.item;
    const id = `os-peca-${peca.id}`;
    const vinculadaDiagnostico = Boolean(no.diagnosticoId);
    const vinculadaServico = Boolean(no.servicoId);
    const origem = vinculadaDiagnostico ? 'diagnostico' : vinculadaServico ? 'servico-sem-diagnostico' : 'avulsa';
    const atualizar = (nome, valor) => vinculadaDiagnostico
      ? acoes.atualizarPecaDiagnostico(no.diagnosticoId, no.servicoId, peca.id, nome, valor)
      : vinculadaServico ? acoes.atualizarPecaSemDiagnostico(no.servicoId, peca.id, nome, valor)
        : acoes.atualizarPecaAvulsa(peca.id, nome, valor);
    const fornecedor = valor => vinculadaDiagnostico
      ? acoes.aplicarFornecedorPecaDiagnostico(no.diagnosticoId, no.servicoId, peca.id, valor)
      : vinculadaServico ? acoes.aplicarFornecedorPecaSemDiagnostico(no.servicoId, peca.id, valor)
        : acoes.aplicarFornecedorPecaAvulsa(peca.id, valor);
    const abrir = tipo => acoes.abrirModalCatalogo({ tipo, diagnosticoId: no.diagnosticoId,
      servicoId: no.servicoId, pecaId: peca.id, origem });
    return <>
      <div className="os-editor-item-title">
        <h3 aria-label={`${no.avulso ? 'Peça avulsa' : 'Peça'}: ${titulo(no)}`}>
          <span className="os-type-marker os-marker-peca" aria-hidden="true" />{titulo(no)}
        </h3>
      </div>
      <div className="os-editor-form">
        <div className="os-form-grid os-editor-piece-grid">
          <fieldset className="os-field os-col-full os-source-field">
            <legend>Escolha a peça</legend>
            <div className="os-piece-source-actions">
              <button type="button" className="os-select-modal-btn" disabled={!podeEditar} onClick={() => abrir('peca')}>
                <FiSearch aria-hidden="true" />{peca.pecaCatalogoId ? `Catálogo: ${peca.descricao}` : 'Selecionar do catálogo'}
              </button>
              <button type="button" className={`os-select-modal-btn ${peca.estoquePecaId ? 'os-stock-selected' : ''}`}
                disabled={!podeEditar} onClick={() => abrir('estoque')}>
                <FiSearch aria-hidden="true" />{peca.estoquePecaId ? `Estoque: ${peca.descricao}` : 'Pegar do estoque'}
              </button>
            </div>
            {peca.estoquePecaId && <small className="os-stock-note">A baixa será confirmada ao salvar a OS.</small>}
          </fieldset>
          {campo('Descrição da peça', `${id}-descricao`, <input id={`${id}-descricao`} value={peca.descricao} disabled={!podeEditar}
            onChange={event => atualizar('descricao', event.target.value)} placeholder="Nome ou descrição da peça" />, 'os-col-full')}
          {campo('Quantidade', `${id}-quantidade`, <input id={`${id}-quantidade`} type="number" min="1" step="1" value={peca.quantidade}
            disabled={!podeEditar} onChange={event => atualizar('quantidade', event.target.value)} />)}
          {campo('Preço unitário (R$)', `${id}-custo`, <input id={`${id}-custo`} type="number" step="0.01" value={peca.custoUnitario}
            disabled={!podeEditar} onChange={event => atualizar('custoUnitario', event.target.value)} placeholder="0,00" />)}
          {campo('Desconto (R$)', `${id}-desconto`, <input id={`${id}-desconto`} type="number" step="0.01" value={peca.desconto}
            disabled={!podeEditar} onChange={event => atualizar('desconto', event.target.value)} placeholder="0,00" />)}
          {campo('Fornecedor', `${id}-fornecedor`, <select id={`${id}-fornecedor`} value={peca.fornecedorId}
            disabled={!podeEditar || Boolean(peca.estoquePecaId)} onChange={event => fornecedor(event.target.value)}>
            <option value="">{peca.estoquePecaId ? 'Estoque interno' : 'Selecione'}</option>
            {catalogos.fornecedores.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}
          </select>)}
        </div>
      </div>
      {rodapeSubtotal('Subtotal da peça', no.subtotal)}
    </>;
  }

  function rodapeSubtotal(rotulo, valor) {
    return <footer className="os-editor-subtotal"><span>{rotulo}</span><strong>{formatarMoeda(valor)}</strong></footer>;
  }

  function editor(no) {
    return <>
      {editorCabecalho(no)}
      {no.tipo === 'diagnostico' ? diagnosticoEditor(no)
        : no.tipo === 'servico' ? servicoEditor(no) : pecaEditor(no)}
    </>;
  }

  return <section className="os-items-workspace" aria-labelledby="os-itens-title">
    <header className="os-items-heading">
      <div><h2 id="os-itens-title">Itens da OS</h2><p>Organize diagnósticos, serviços e peças do atendimento.</p></div>
      <div className="os-items-total"><span>Total da OS</span><strong>{formatarMoeda(totais.totalGeral)}</strong></div>
      {podeEditar
        ? <button type="button" className="os-small-btn os-primary" onClick={acoes.salvarOrdemServico} disabled={salvando || carregando}>
            <FiSave aria-hidden="true" />{salvando ? 'Salvando…' : 'Salvar OS'}
          </button>
        : <button type="button" className="os-small-btn os-primary" onClick={acoes.editarOrdemAtual}>Editar OS</button>}
    </header>
    <div className="os-items-columns">
      <nav className="os-items-structure" aria-label="Estrutura de itens da ordem de serviço">
        <div className="os-tree-heading"><h3>Estrutura</h3>
          {podeEditar && <div className="os-add-menu-wrap" ref={menuRef}>
            <button type="button" className="os-small-btn os-primary os-tree-add-button" aria-haspopup="menu"
              aria-controls="os-itens-add-menu" aria-expanded={menuAberto} ref={menuTriggerRef}
              onClick={() => setMenuAberto(open => !open)}><FiPlus aria-hidden="true" />Adicionar</button>
            {menuAberto && <div className="os-add-menu" id="os-itens-add-menu" role="menu">
              <button type="button" role="menuitem" onClick={adicionarDiagnostico}>Diagnóstico <small>Agrupa serviços e peças</small></button>
              <button type="button" role="menuitem" onClick={adicionarServicoAvulso}>Serviço avulso <small>Sem diagnóstico</small></button>
              <button type="button" role="menuitem" onClick={adicionarPecaAvulsa}>Peça avulsa <small>Sem serviço</small></button>
            </div>}
          </div>}
        </div>
        {botoesAdicionarClasse()}
        <div className="os-tree-list">
          {ordem.diagnosticos.map((diagnostico, diagnosticoIndex) => {
            const codigo = `D.${String(diagnosticoIndex + 1).padStart(2, '0')}`;
            const no = porChave.get(`diagnostico:${diagnostico.id}`);
            const recolhido = recolhidos.has(diagnostico.id);
            return <div className="os-tree-branch" key={diagnostico.id}>
              <div className="os-tree-diagnostic-line">
                <button type="button" className="os-tree-chevron" aria-label={`${recolhido ? 'Expandir' : 'Recolher'} ${codigo}`}
                  aria-expanded={!recolhido} onClick={() => recolherDiagnostico(diagnostico.id)}>
                  {recolhido ? <FiChevronRight aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />}
                </button>
                {botaoItem(no, <><span className="os-tree-marker os-marker-diagnostico" />
                  <span className="os-tree-code">{codigo}</span><strong>{diagnostico.descricao || 'Novo diagnóstico'}</strong>
                  <span className="os-tree-amount">{formatarMoeda(no.subtotal)}</span></>)}
              </div>
              {!recolhido && <div className="os-tree-children">
                {diagnostico.servicos.map((servico, servicoIndex) => {
                  const servicoNo = porChave.get(`servico:${servico.id}`);
                  return <div className="os-tree-service-branch" key={servico.id}>
                    {botaoItem(servicoNo, <><span className="os-tree-marker os-marker-servico" />
                      <span className="os-tree-item-content"><strong>{servico.descricao || 'Novo serviço'}</strong>
                        <small>{servico.tipo || 'Tipo não definido'} · <em className={!servico.responsavel ? 'os-no-technician' : ''}>{servico.responsavel || 'sem técnico'}</em></small></span>
                      <span className="os-tree-amount">{formatarMoeda(servicoNo.subtotal)}</span></>)}
                    {servico.pecas.map(peca => {
                      const pecaNo = porChave.get(`peca:${peca.id}`);
                      return botaoItem(pecaNo, <><span className="os-tree-marker os-marker-peca" />
                        <span className="os-tree-item-content"><strong>{Number(peca.quantidade || 0)}× {peca.descricao || 'Nova peça'}</strong></span>
                        <span className="os-tree-amount">{formatarMoeda(pecaNo.subtotal)}</span></>, 'os-tree-piece');
                    })}
                  </div>;
                })}
                {podeEditar && <button type="button" className="os-tree-inline-add" onClick={() => adicionarServico(diagnostico.id)}>
                  <FiPlus aria-hidden="true" />Serviço neste diagnóstico
                </button>}
              </div>}
            </div>;
          })}
          {podeEditar && <button type="button" className="os-tree-new-diagnosis" onClick={adicionarDiagnostico}>
            <FiPlus aria-hidden="true" />Novo diagnóstico
          </button>}
          {(ordem.servicosSemDiagnostico.length > 0 || ordem.pecasAvulsas.length > 0 || podeEditar) &&
            <section className="os-tree-loose" id="os-itens-avulsos" aria-labelledby="os-itens-avulsos-title">
              <div className="os-tree-loose-heading"><h4 id="os-itens-avulsos-title">Itens avulsos</h4>
                <strong>{formatarMoeda(ordem.servicosSemDiagnostico.reduce((sum, item) => sum + totalServico(item), 0) + ordem.pecasAvulsas.reduce((sum, item) => sum + calcularTotalPeca(item), 0))}</strong>
              </div>
              {ordem.servicosSemDiagnostico.map((servico, index) => {
                const servicoNo = porChave.get(`servico:${servico.id}`);
                return <div className="os-tree-service-branch" key={servico.id}>
                  {botaoItem(servicoNo, <><span className="os-tree-marker os-marker-servico" />
                    <span className="os-tree-item-content"><strong>{servico.descricao || 'Novo serviço avulso'}</strong>
                      <small>{servico.tipo || 'Tipo não definido'} · <em className={!servico.responsavel ? 'os-no-technician' : ''}>{servico.responsavel || 'sem técnico'}</em></small></span>
                    <span className="os-tree-amount">{formatarMoeda(servicoNo.subtotal)}</span></>)}
                  {servico.pecas.map(peca => {
                    const pecaNo = porChave.get(`peca:${peca.id}`);
                    return botaoItem(pecaNo, <><span className="os-tree-marker os-marker-peca" />
                      <span className="os-tree-item-content"><strong>{Number(peca.quantidade || 0)}× {peca.descricao || 'Nova peça'}</strong></span>
                      <span className="os-tree-amount">{formatarMoeda(pecaNo.subtotal)}</span></>, 'os-tree-piece');
                  })}
                </div>;
              })}
              {ordem.pecasAvulsas.map(peca => {
                const pecaNo = porChave.get(`peca:${peca.id}`);
                return botaoItem(pecaNo, <><span className="os-tree-marker os-marker-peca" />
                  <span className="os-tree-item-content"><strong>{peca.descricao || 'Nova peça avulsa'}</strong><small>Peça sem serviço · {peca.quantidade || 0} un.</small></span>
                  <span className="os-tree-amount">{formatarMoeda(pecaNo.subtotal)}</span></>, 'os-tree-piece os-tree-loose-piece');
              })}
            </section>}
        </div>
      </nav>
      <section className="os-items-editor" aria-label="Editor do item selecionado" ref={editorRef}>
        <h3 className="os-editor-heading">Editor do item selecionado</h3>
        {itemAtivo ? <div className="os-editor-content">{editor(itemAtivo)}</div>
          : <div className="os-editor-empty os-editor-empty-main">
            <FiFileText aria-hidden="true" /><strong>Nenhum item na ordem</strong>
            <span>{podeEditar ? 'Use Adicionar para incluir um diagnóstico, serviço ou peça.' : 'Esta OS não possui itens.'}</span>
          </div>}
      </section>
    </div>
  </section>;
}
