import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import useConsultaTickets from '../hooks/useConsultaTickets';
import '../styles/tickets.css';

export default function NotificacoesTickets() {
  const [aberto, setAberto] = useState(false);
  const [versao, setVersao] = useState(0);
  const [marcando, setMarcando] = useState(false);
  const usuario = JSON.parse(localStorage.getItem('motormind_usuario') || 'null');
  const permitido = ['TECNICO', 'OPERADOR', 'ADMIN', 'OWNER'].includes(usuario?.Role);
  const consulta = useConsultaTickets(permitido ? '/tickets/notificacoes' : null, 15000, versao);
  const navigate = useNavigate();
  async function abrir(item) {
    setMarcando(true);
    try {
      await api.patch(`/tickets/notificacoes/${item.id}/lida`);
      setVersao(v => v + 1); setAberto(false);
      navigate(item.notificacao.requisicaoPecaId ? `/tickets/${item.notificacao.requisicaoPecaId}` : '/tickets');
    } catch { toast.error('Não foi possível marcar a notificação como lida.'); }
    finally { setMarcando(false); }
  }
  async function marcarTodas() {
    setMarcando(true);
    try { await api.patch('/tickets/notificacoes/lidas'); setVersao(v => v + 1); }
    catch { toast.error('Não foi possível marcar as notificações como lidas.'); }
    finally { setMarcando(false); }
  }
  if (!permitido) return null;
  return <div className="ticket-notificacoes" onKeyDown={e => { if (e.key === 'Escape') setAberto(false); }}>
    <button className="estoque-bell" type="button" aria-expanded={aberto} aria-controls="avisos-tickets" onClick={() => setAberto(a => !a)}><FiMessageSquare aria-hidden="true" /><span>Solicitações</span><strong>{consulta.erro ? '!' : consulta.carregando ? '…' : consulta.dados?.naoLidas || 0}</strong></button>
    {aberto && <section id="avisos-tickets" className="estoque-alertas" aria-label="Notificações de solicitações">
      <h2>Tickets e mensagens</h2>
      {consulta.dados?.naoLidas > 0 && <button type="button" className="estoque-bell" disabled={marcando} onClick={marcarTodas}>Marcar todas como lidas</button>}
      {consulta.erro && <p role="alert">{consulta.erro}</p>}
      {consulta.carregando ? <p>Carregando…</p> : !consulta.dados?.itens.length ? <p>Nenhuma notificação.</p> : <ul>{consulta.dados.itens.map(item => <li key={item.id} className={item.lidaEm ? '' : 'nao-lida'}>
        <button type="button" className="estoque-bell" disabled={marcando} onClick={() => abrir(item)}>{item.notificacao.titulo}</button><span>{item.notificacao.mensagem}</span><small>{new Date(item.createdAt).toLocaleString('pt-BR')}{!item.lidaEm && ' · Não lida'}</small>
      </li>)}</ul>}
      <button type="button" className="estoque-bell" onClick={() => { setAberto(false); navigate('/tickets'); }}>Ver solicitações</button>
    </section>}
  </div>;
}
