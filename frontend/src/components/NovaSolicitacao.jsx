import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import '../styles/tickets.css';

const erroApi = error => error.response?.data?.erro || 'Não foi possível abrir a solicitação. Verifique sua conexão.';

export default function NovaSolicitacao({ ordem, fechar, criada }) {
  const dialog = useRef(null);
  const trava = useRef(false);
  const [itens, setItens] = useState([{ nomePeca: '', quantidadeSolicitada: 1 }]);
  const [observacao, setObservacao] = useState('');
  const [chaveAbertura] = useState(() => crypto.randomUUID());
  const [enviando, setEnviando] = useState(false);
  useEffect(() => { dialog.current?.showModal(); }, []);
  function editar(index, campo, valor) { setItens(lista => lista.map((item, i) => i === index ? { ...item, [campo]: valor } : item)); }
  async function enviar(event) {
    event.preventDefault();
    if (trava.current) return;
    trava.current = true; setEnviando(true);
    try {
      const { data } = await api.post('/tickets', { ordemServicoId: ordem.id, itens, observacao, chaveAbertura });
      toast.success(`Solicitação ${data.codigo} aberta.`); criada(data.id);
    } catch (error) { toast.error(erroApi(error)); }
    finally { trava.current = false; setEnviando(false); }
  }
  return <dialog ref={dialog} className="ticket-dialog" aria-labelledby="nova-solicitacao" onCancel={event => { event.preventDefault(); if (!enviando) fechar(); }}>
    <form onSubmit={enviar}>
      <h2 id="nova-solicitacao">Solicitar peças · OS {ordem.codigo}</h2>
      <p>{ordem.veiculo.placa} · {ordem.veiculo.modelo}</p>
      <fieldset disabled={enviando}>
        <legend>Peças necessárias</legend>
        {itens.map((item, index) => <div className="ticket-item-form" key={index}>
          <label>Peça {index + 1}<input autoFocus={index === 0} required maxLength={120} value={item.nomePeca} onChange={e => editar(index, 'nomePeca', e.target.value)} placeholder="Nome, aplicação ou especificação" /></label>
          <label>Quantidade<input type="number" required min="1" max="100000" step="1" value={item.quantidadeSolicitada} onChange={e => editar(index, 'quantidadeSolicitada', e.target.value)} /></label>
          <button type="button" disabled={itens.length === 1} aria-label={`Remover peça ${index + 1}`} onClick={() => setItens(lista => lista.filter((_, i) => i !== index))}>Remover</button>
        </div>)}
        <button type="button" disabled={itens.length >= 20} onClick={() => setItens(lista => [...lista, { nomePeca: '', quantidadeSolicitada: 1 }])}>+ Adicionar peça</button>
        <label>Observação da solicitação<textarea maxLength={1000} value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Informações que precisam ficar no histórico permanente" /></label>
      </fieldset>
      <p className="ticket-aviso">O pedido e seu histórico são permanentes. Fotos e mensagens poderão ser enviadas pelo chat após um operador assumir.</p>
      <div className="ticket-acoes"><button type="button" onClick={fechar} disabled={enviando}>Voltar</button><button className="ticket-primario" disabled={enviando}>{enviando ? 'Abrindo…' : 'Abrir solicitação'}</button></div>
    </form>
  </dialog>;
}
