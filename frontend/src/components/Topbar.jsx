import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiBell, FiChevronRight, FiX } from 'react-icons/fi';
import api from '../services/api';
import '../styles/estoqueAlertas.css';
import NotificacoesTickets from './NotificacoesTickets';

function Topbar({ actions }) {
  const { pathname } = useLocation();
  const topbarRef = useRef(null);
  const usuario = JSON.parse(localStorage.getItem('motormind_usuario') || 'null');
  const permitido = ['ADMIN', 'OPERADOR', 'OWNER'].includes(usuario?.Role);
  const [alertas, setAlertas] = useState([]);
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [painel, setPainel] = useState(null);
  const painelAberto = painel?.pathname === pathname ? painel.tipo : null;
  if (painel && painel.pathname !== pathname) setPainel(null);

  useEffect(() => {
    if (!painelAberto) return;
    function fecharAoClicarFora(event) {
      if (!topbarRef.current?.contains(event.target)) setPainel(null);
    }
    document.addEventListener('pointerdown', fecharAoClicarFora);
    return () => document.removeEventListener('pointerdown', fecharAoClicarFora);
  }, [painelAberto]);

  function alternarPainel(tipo) {
    setPainel(painelAberto === tipo ? null : { pathname, tipo });
  }

  function fecharPainel(devolverFoco = false) {
    const triggerId = painelAberto === 'estoque' ? 'topbar-estoque' : 'topbar-tickets';
    setPainel(null);
    if (devolverFoco) topbarRef.current?.querySelector(`#${triggerId}`)?.focus();
  }

  useEffect(() => {
    if (!permitido) return;
    const controller = new AbortController();
    let sequencia = 0;
    async function atualizar() {
      const atual = ++sequencia;
      try {
        const { data } = await api.get('/estoque/alertas', { signal: controller.signal });
        if (!controller.signal.aborted && atual === sequencia) { setAlertas(data); setErro(false); }
      } catch {
        if (!controller.signal.aborted && atual === sequencia) setErro(true);
      } finally {
        if (!controller.signal.aborted && atual === sequencia) setCarregando(false);
      }
    }
    atualizar();
    const intervalo = window.setInterval(atualizar, 60000);
    window.addEventListener('estoque-atualizado', atualizar);
    window.addEventListener('focus', atualizar);
    return () => {
      controller.abort(); window.clearInterval(intervalo);
      window.removeEventListener('estoque-atualizado', atualizar);
      window.removeEventListener('focus', atualizar);
    };
  }, [permitido]);

  return <header ref={topbarRef} className="estoque-topbar" onKeyDown={event => {
    if (event.key === 'Escape' && painelAberto) fecharPainel(true);
  }}>
    <div className="topbar-content">
      <div className="topbar-actions">
        {actions && <div className="topbar-preferences">{actions}</div>}
        <div className="topbar-notifications" role="group" aria-label="Avisos da oficina">
          <NotificacoesTickets aberto={painelAberto === 'tickets'}
            onToggle={() => alternarPainel('tickets')} onClose={fecharPainel} />
          {permitido && <>
            <button id="topbar-estoque" type="button" className="estoque-bell topbar-notification-btn"
              title="Alertas de estoque"
              aria-label={`Alertas de estoque: ${erro ? 'falha na atualização' : carregando ? 'carregando' : `${alertas.length} ativos`}`}
              aria-expanded={painelAberto === 'estoque'} aria-controls="estoque-alertas"
              onClick={() => alternarPainel('estoque')}>
              <FiBell aria-hidden="true" /><span className="topbar-notification-label">Estoque</span>
              <strong>{erro ? '!' : carregando ? '…' : alertas.length}</strong>
            </button>
            {painelAberto === 'estoque' && <section id="estoque-alertas" className="estoque-alertas"
              aria-labelledby="estoque-alertas-titulo">
              <div className="topbar-panel-header">
                <div><h2 id="estoque-alertas-titulo">Alertas de estoque</h2><p>Peças abaixo do mínimo</p></div>
                <button type="button" className="topbar-panel-close" aria-label="Fechar alertas de estoque"
                  onClick={() => fecharPainel(true)}><FiX aria-hidden="true" /></button>
              </div>
              {erro ? <p role="alert">Não foi possível atualizar os alertas. Uma nova tentativa será feita automaticamente.</p>
                : carregando ? <p className="topbar-panel-empty" role="status">Carregando alertas…</p>
                : !alertas.length ? <p className="topbar-panel-empty">Nenhum alerta ativo.</p>
                : <><p>O aviso permanece até o saldo atingir o mínimo.</p><ul>{alertas.map(alerta => <li key={alerta.id}>
                  <Link to="/estoque" onClick={() => fecharPainel()}>{alerta.estoquePeca.codigo} · {alerta.estoquePeca.nome}</Link>
                  <span>Saldo: {alerta.estoquePeca.quantidadeAtual} {alerta.estoquePeca.unidade} · Mínimo: {alerta.estoquePeca.quantidadeMinima}</span>
                </li>)}</ul></>}
              <div className="topbar-panel-footer">
                <Link to="/estoque" onClick={() => fecharPainel()}>Consultar estoque<FiChevronRight aria-hidden="true" /></Link>
              </div>
            </section>}
          </>}
        </div>
      </div>
    </div>
  </header>;
}

export default Topbar;
