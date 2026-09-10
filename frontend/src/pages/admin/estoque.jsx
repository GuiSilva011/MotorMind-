import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/operadorStyles/layout.css';
import '../../styles/adminStyles/estoque.css';

const tipos = { ENTRADA: 'Entrada', SAIDA: 'Saída', SAIDA_OS: 'Saída pela OS', DEVOLUCAO: 'Devolução', DEVOLUCAO_OS: 'Devolução pela OS', AJUSTE_ENTRADA: 'Ajuste de entrada', AJUSTE_SAIDA: 'Ajuste de saída', SAIDA_REQUISICAO: 'Saída por requisição' };
const tiposManuais = ['ENTRADA', 'SAIDA', 'DEVOLUCAO', 'AJUSTE_ENTRADA', 'AJUSTE_SAIDA'];
const inicial = () => ({ nome: '', marca: '', aplicacao: '', unidade: 'UN', localizacao: '', quantidadeAtual: '0', quantidadeMinima: '0' });
const erroApi = error => error.response?.data?.erro || 'Não foi possível conectar ao servidor.';
const numero = valor => Number(valor).toLocaleString('pt-BR');

function Estoque() {
  const usuario = JSON.parse(localStorage.getItem('motormind_usuario') || 'null');
  const podeGerenciar = ['ADMIN', 'OWNER'].includes(usuario?.Role);
  const somenteLeitura = usuario?.Role === 'OPERADOR';
  const [pecas, setPecas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('ativos');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState('');
  const [historico, setHistorico] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const dialog = useRef(null);
  const travaSalvar = useRef(false);
  const sequenciaLista = useRef(0);

  const carregar = useCallback(async () => {
    const sequencia = ++sequenciaLista.current;
    setCarregando(true); setErro('');
    try {
      const { data } = await api.get('/estoque');
      if (sequencia === sequenciaLista.current) setPecas(data);
    } catch (error) {
      if (sequencia === sequenciaLista.current) setErro(erroApi(error));
    } finally {
      if (sequencia === sequenciaLista.current) setCarregando(false);
    }
  }, []);
  useEffect(() => { carregar(); return () => { sequenciaLista.current += 1; }; }, [carregar]);
  useEffect(() => { if (modal && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [modal]);
  useEffect(() => {
    if (modal?.tipo !== 'historico') return;
    const controller = new AbortController();
    setCarregandoHistorico(true); setErroModal(''); setHistorico(null);
    api.get(`/estoque/${modal.peca.id}/movimentacoes`, { params: { pagina }, signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setHistorico(data); })
      .catch(error => { if (!controller.signal.aborted) setErroModal(erroApi(error)); })
      .finally(() => { if (!controller.signal.aborted) setCarregandoHistorico(false); });
    return () => controller.abort();
  }, [modal, pagina]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return pecas.filter(peca => {
      if (filtro === 'ativos' && !peca.ativo) return false;
      if (filtro === 'inativos' && peca.ativo) return false;
      if (filtro === 'baixo' && (!peca.ativo || peca.quantidadeAtual >= peca.quantidadeMinima)) return false;
      return [peca.codigo, peca.nome, peca.marca, peca.aplicacao, peca.localizacao].some(valor => (valor || '').toLocaleLowerCase('pt-BR').includes(termo));
    });
  }, [pecas, busca, filtro]);
  const ativos = pecas.filter(peca => peca.ativo);
  const baixos = ativos.filter(peca => peca.quantidadeAtual < peca.quantidadeMinima);

  function abrir(tipo, peca = null) {
    setErroModal(''); setPagina(1); setHistorico(null);
    if (tipo === 'criar') setForm(inicial());
    if (tipo === 'editar') setForm({ nome: peca.nome, marca: peca.marca || '', aplicacao: peca.aplicacao || '', unidade: peca.unidade, localizacao: peca.localizacao || '', quantidadeMinima: peca.quantidadeMinima });
    if (tipo === 'movimentar') setForm({ tipo: 'ENTRADA', quantidade: '', observacao: '' });
    setModal({ tipo, peca });
  }
  function fechar() {
    if (travaSalvar.current) return;
    dialog.current?.close(); setModal(null);
  }
  async function salvar(event) {
    event.preventDefault();
    if (travaSalvar.current) return;
    travaSalvar.current = true; setSalvando(true); setErroModal('');
    try {
      if (modal.tipo === 'criar') await api.post('/estoque', form);
      if (modal.tipo === 'editar') await api.put(`/estoque/${modal.peca.id}`, form);
      if (modal.tipo === 'movimentar') await api.post(`/estoque/${modal.peca.id}/movimentacoes`, form);
      if (modal.tipo === 'ativo') await api.patch(`/estoque/${modal.peca.id}/ativo`, { ativo: !modal.peca.ativo });
      dialog.current?.close(); setModal(null);
      toast.success('Estoque atualizado.');
      window.dispatchEvent(new Event('estoque-atualizado'));
      await carregar();
    } catch (error) { setErroModal(erroApi(error)); }
    finally { travaSalvar.current = false; setSalvando(false); }
  }
  function campo(nome, rotulo, options = {}) {
    return <label className="est-field" key={nome}><span>{rotulo}</span>
      <input name={nome} value={form[nome] ?? ''} {...options} onChange={event => setForm(atual => ({ ...atual, [nome]: event.target.value }))} /></label>;
  }
  const titulos = { criar: 'Cadastrar peça no estoque', editar: 'Editar peça', movimentar: 'Registrar movimentação', historico: 'Histórico de movimentações', ativo: modal?.peca?.ativo ? 'Inativar peça' : 'Reativar peça' };
  const cadastro = ['criar', 'editar'].includes(modal?.tipo);

  return <Layout><main className="estoque-page">
    <header className="est-header"><div><h1>Estoque</h1><p>{somenteLeitura ? 'Consulte as peças disponíveis e seus saldos.' : 'Peças armazenadas na oficina. Independente do catálogo das OS.'}</p></div>
      {podeGerenciar && <button className="est-primary" onClick={() => abrir('criar')}>+ Cadastrar peça</button>}</header>
    <div className="est-resumo" aria-label="Resumo do estoque">
      <div><span>Peças ativas</span><strong>{carregando || erro ? '—' : numero(ativos.length)}</strong></div>
      <div className="est-resumo-alerta"><span>Abaixo do mínimo</span><strong>{carregando || erro ? '—' : numero(baixos.length)}</strong></div>
      <div><span>Sem saldo</span><strong>{carregando || erro ? '—' : numero(ativos.filter(p => p.quantidadeAtual === 0).length)}</strong></div>
    </div>
    <section className="est-card" aria-label="Peças do estoque">
      <div className="est-toolbar">
        <label className="est-field est-search"><span>Buscar peça</span><input type="search" value={busca} onChange={event => setBusca(event.target.value)} placeholder="Código, nome, marca, aplicação ou localização" /></label>
        <label className="est-field"><span>Exibir</span><select value={filtro} onChange={event => setFiltro(event.target.value)}>
          <option value="ativos">Ativas</option><option value="baixo">Abaixo do mínimo</option>{podeGerenciar && <><option value="inativos">Inativas</option><option value="todos">Todas</option></>}
        </select></label><button onClick={carregar} disabled={carregando}>Atualizar</button>
      </div>
      {erro ? <p className="est-error" role="alert">{erro} Use Atualizar para tentar novamente.</p> : carregando ? <p className="est-empty" role="status">Carregando estoque…</p>
        : !visiveis.length ? <p className="est-empty">{pecas.length ? 'Nenhuma peça corresponde à busca ou ao filtro.' : 'Nenhuma peça cadastrada no estoque.'}</p>
        : <div className="est-table-wrap"><table><thead><tr><th>Peça</th><th>Aplicação / local</th><th>Saldo</th><th>Mínimo</th><th>Situação</th>{podeGerenciar && <th>Ações</th>}</tr></thead>
          <tbody>{visiveis.map(peca => <tr key={peca.id}>
            <td><strong>{peca.nome}</strong><small>{peca.codigo}{peca.marca ? ` · ${peca.marca}` : ''}</small></td>
            <td>{peca.aplicacao || '—'}<small>{peca.localizacao || 'Local não informado'}</small></td>
            <td className="est-number">{numero(peca.quantidadeAtual)}<small>{peca.unidade}</small></td><td>{numero(peca.quantidadeMinima)}</td>
            <td><span className={`est-badge ${!peca.ativo ? 'est-inativo' : peca.quantidadeAtual < peca.quantidadeMinima ? 'est-baixo' : 'est-ok'}`}>{!peca.ativo ? 'Inativa' : peca.quantidadeAtual < peca.quantidadeMinima ? 'Estoque baixo' : 'Regular'}</span></td>
            {podeGerenciar && <td><div className="est-actions">{peca.ativo && <><button onClick={() => abrir('movimentar', peca)}>Movimentar</button><button onClick={() => abrir('editar', peca)}>Editar</button></>}
              <button onClick={() => abrir('historico', peca)}>Histórico</button><button onClick={() => abrir('ativo', peca)}>{peca.ativo ? 'Inativar' : 'Reativar'}</button></div></td>}
          </tr>)}</tbody></table></div>}
    </section>
    {somenteLeitura && <p className="est-note">Seu perfil possui acesso somente para consultar os itens disponíveis. Cadastros, histórico e movimentações são restritos ao administrador.</p>}
    {modal && <dialog ref={dialog} className={`est-dialog ${modal.tipo === 'historico' ? 'est-dialog-wide' : ''}`} aria-labelledby="est-dialog-title" onCancel={event => { event.preventDefault(); fechar(); }}>
      <form onSubmit={salvar}>
        <div className="est-dialog-header"><h2 id="est-dialog-title">{titulos[modal.tipo]}</h2><button type="button" onClick={fechar} disabled={salvando} aria-label="Fechar">×</button></div>
        {modal.peca && <p className="est-note">{modal.peca.codigo} · {modal.peca.nome}</p>}
        {erroModal && <p className="est-error" role="alert">{erroModal}</p>}
        <fieldset disabled={salvando}>
          {cadastro && <div className="est-form-grid">
            <label className="est-field"><span>Código</span><input value={modal.tipo === 'criar' ? 'Gerado automaticamente ao salvar' : modal.peca.codigo} readOnly /></label>{campo('nome', 'Nome *', { required: true, maxLength: 100 })}
            {campo('marca', 'Marca', { maxLength: 60 })}{campo('aplicacao', 'Aplicação', { maxLength: 150 })}
            <label className="est-field"><span>Unidade *</span><select required value={form.unidade} onChange={event => setForm(atual => ({ ...atual, unidade: event.target.value }))}>
              <option value="UN">Unidade (UN)</option><option value="PAR">Par (PAR)</option><option value="L">Litro (L)</option>
            </select></label>{campo('localizacao', 'Localização', { maxLength: 80 })}
            {modal.tipo === 'criar' && campo('quantidadeAtual', 'Quantidade inicial *', { required: true, type: 'number', min: 0, max: 2147483647, step: 1 })}
            {campo('quantidadeMinima', 'Quantidade mínima *', { required: true, type: 'number', min: 0, max: 2147483647, step: 1 })}
          </div>}
          {cadastro && <p className="est-note">O código é automático e não pode ser alterado. As quantidades são inteiras. O alerta é ativado quando o saldo fica menor que o mínimo. Para alterar o saldo após o cadastro, use Movimentar.</p>}
          {modal.tipo === 'movimentar' && <>
            <p className="est-current">Saldo atual: <strong>{numero(modal.peca.quantidadeAtual)} {modal.peca.unidade}</strong></p>
            <div className="est-form-grid"><label className="est-field"><span>Tipo *</span><select value={form.tipo} onChange={event => setForm(atual => ({ ...atual, tipo: event.target.value }))}>
              {tiposManuais.map(tipo => <option key={tipo} value={tipo}>{tipos[tipo]}</option>)}
            </select></label>{campo('quantidade', 'Quantidade a movimentar *', { type: 'number', required: true, min: 1, max: 2147483647, step: 1 })}</div>
            <label className="est-field"><span>Motivo *</span><textarea required maxLength={255} rows={3} value={form.observacao} onChange={event => setForm(atual => ({ ...atual, observacao: event.target.value }))} /></label>
            <p className="est-note">Informe a quantidade que entra ou sai, não o saldo final. Ajustes também ficam registrados no histórico.</p>
          </>}
          {modal.tipo === 'ativo' && <p className="est-current">{modal.peca.ativo ? 'A peça ficará inativa, sem apagar seu histórico. O saldo precisa estar zerado e não pode haver requisições pendentes.' : 'A peça voltará a ficar disponível para movimentações. O estoque mínimo será verificado novamente.'}</p>}
        </fieldset>
        {modal.tipo === 'historico' && <>
          {carregandoHistorico ? <p role="status" className="est-empty">Carregando histórico…</p> : historico && <>
            {!historico.itens.length ? <p className="est-empty">Ainda não há movimentações.</p> : <div className="est-table-wrap"><table><thead><tr><th>Data</th><th>Tipo</th><th>Quantidade</th><th>Antes → depois</th><th>Usuário / motivo</th></tr></thead>
              <tbody>{historico.itens.map(item => <tr key={item.id}><td>{new Date(item.createdAt).toLocaleString('pt-BR')}</td><td>{tipos[item.tipo] || item.tipo}</td><td>{numero(item.quantidade)}</td><td>{numero(item.quantidadeAnterior)} → {numero(item.quantidadePosterior)}</td><td>{item.usuario?.Nome || 'Usuário não disponível'}<small>{item.observacao || '—'}</small></td></tr>)}</tbody></table></div>}
            <div className="est-pagination"><button type="button" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</button><span>Página {historico.pagina} de {historico.paginas}</span><button type="button" disabled={pagina >= historico.paginas} onClick={() => setPagina(pagina + 1)}>Próxima</button></div>
          </>}
          {erroModal && <button type="button" onClick={() => setModal(atual => ({ ...atual }))}>Tentar novamente</button>}
        </>}
        <footer className="est-dialog-footer"><button type="button" onClick={fechar} disabled={salvando}>{modal.tipo === 'historico' ? 'Fechar' : 'Cancelar'}</button>{modal.tipo !== 'historico' && <button type="submit" className="est-primary" disabled={salvando}>{salvando ? 'Salvando…' : 'Confirmar'}</button>}</footer>
      </form>
    </dialog>}
  </main></Layout>;
}
export default Estoque;
