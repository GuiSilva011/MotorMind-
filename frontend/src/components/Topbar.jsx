import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import api from '../services/api';
import '../styles/estoqueAlertas.css';
import NotificacoesTickets from './NotificacoesTickets';

function Topbar() {
  const usuario = JSON.parse(localStorage.getItem('motormind_usuario') || 'null');
  const permitido = ['ADMIN', 'OPERADOR', 'OWNER'].includes(usuario?.Role);
  const [alertas, setAlertas] = useState([]);
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);

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

  return <div className="estoque-topbar" onKeyDown={event => { if (event.key === 'Escape') setAberto(false); }}>
    <NotificacoesTickets />
    {permitido && <>
    <button type="button" className="estoque-bell" aria-expanded={aberto} aria-controls="estoque-alertas" onClick={() => setAberto(!aberto)}>
      <FiBell aria-hidden="true" /><span>Alertas de estoque</span><strong>{erro ? '!' : carregando ? '…' : alertas.length}</strong>
    </button>
    {aberto && <section id="estoque-alertas" className="estoque-alertas" aria-label="Alertas de estoque">
      <h2>Estoque baixo</h2>
      {erro ? <p role="alert">Não foi possível atualizar os alertas. Uma nova tentativa será feita automaticamente.</p>
        : carregando ? <p role="status">Carregando alertas…</p>
        : !alertas.length ? <p>Nenhum alerta ativo.</p>
        : <><p>O aviso permanece até o saldo atingir o mínimo.</p><ul>{alertas.map(alerta => <li key={alerta.id}>
          <Link to="/estoque" onClick={() => setAberto(false)}>{alerta.estoquePeca.codigo} · {alerta.estoquePeca.nome}</Link>
          <span>Saldo: {alerta.estoquePeca.quantidadeAtual} {alerta.estoquePeca.unidade} · Mínimo: {alerta.estoquePeca.quantidadeMinima}</span>
        </li>)}</ul></>}
      <Link to="/estoque" onClick={() => setAberto(false)}>Consultar estoque</Link>
    </section>}
    </>}
  </div>;
}

export default Topbar;
