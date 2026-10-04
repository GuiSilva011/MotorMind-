import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronRight, FiMessageSquare, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import useConsultaTickets from '../hooks/useConsultaTickets';
import '../styles/tickets.css';

export default function NotificacoesTickets({ aberto, onToggle, onClose }) {
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
      setVersao(v => v + 1); onClose();
      navigate(item.notificacao.requisicaoPecaId ? `/tickets/${item.notificacao.requisicaoPecaId}`
        : usuario.Role === 'TECNICO' && item.notificacao.ordemServicoId ? `/tecnico/ordens-servico/${item.notificacao.ordemServicoId}` : '/tickets');
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
  return <div className="ticket-notificacoes">
    <button id="topbar-tickets" className="estoque-bell topbar-notification-btn" type="button"
      title="Notificações de solicitações"
      aria-label={`Notificações de solicitações: ${consulta.erro ? 'falha na atualização' : consulta.carregando ? 'carregando' : `${consulta.dados?.naoLidas || 0} não lidas`}`}
      aria-expanded={aberto} aria-controls="avisos-tickets" onClick={onToggle}>
      <FiMessageSquare aria-hidden="true" /><span className="topbar-notification-label">Solicitações</span>
      <strong>{consulta.erro ? '!' : consulta.carregando ? '…' : consulta.dados?.naoLidas || 0}</strong>
    </button>
    {aberto && <section id="avisos-tickets" className="estoque-alertas" aria-labelledby="avisos-tickets-titulo">
      <div className="topbar-panel-header">
        <div><h2 id="avisos-tickets-titulo">Solicitações e mensagens</h2><p>Acompanhe os avisos da oficina</p></div>
        <button type="button" className="topbar-panel-close" aria-label="Fechar notificações de solicitações"
          onClick={() => onClose(true)}><FiX aria-hidden="true" /></button>
      </div>
      {consulta.dados?.naoLidas > 0 && <button type="button" className="topbar-panel-link" disabled={marcando} onClick={marcarTodas}>Marcar todas como lidas</button>}
      {consulta.erro && <p role="alert">{consulta.erro}</p>}
      {consulta.carregando ? <p className="topbar-panel-empty" role="status">Carregando…</p> : !consulta.dados?.itens.length ? <p className="topbar-panel-empty">Nenhuma notificação.</p> : <ul>{consulta.dados.itens.map(item => <li key={item.id} className={item.lidaEm ? '' : 'nao-lida'}>
        <button type="button" className="topbar-notification-item" disabled={marcando} onClick={() => abrir(item)}>{item.notificacao.titulo}</button><span>{item.notificacao.mensagem}</span><small>{new Date(item.createdAt).toLocaleString('pt-BR')}{!item.lidaEm && ' · Não lida'}</small>
      </li>)}</ul>}
      <div className="topbar-panel-footer">
        <button type="button" onClick={() => { onClose(); navigate('/tickets'); }}>Ver solicitações<FiChevronRight aria-hidden="true" /></button>
      </div>
    </section>}
  </div>;
}
